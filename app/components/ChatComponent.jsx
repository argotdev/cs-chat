'use client';

import { useState, useEffect } from 'react';
import {
  Channel,
  ChannelHeader,
  MessageList,
  MessageInput,
  Window,
  useChannelStateContext,
} from 'stream-chat-react';
import { StreamChat } from 'stream-chat';

const chatClient = StreamChat.getInstance(process.env.NEXT_PUBLIC_STREAM_KEY);

// Phrases that trigger escalation to human support
const ESCALATION_TRIGGERS = [
  'talk to a human',
  'speak to a person',
  'talk to someone',
  'talk to a person',
  'speak to a human',
  'this hasn\'t helped',
  'this is not helping',
  'need human assistance',
  'human support',
  'real person',
];

// Custom MessageInput component to handle AI responses and escalation
const CustomMessageInput = () => {
  const { channel } = useChannelStateContext();
  const [isEscalated, setIsEscalated] = useState(false);
  const [waitingForHuman, setWaitingForHuman] = useState(false);

  const checkForEscalation = (message) => {
    return ESCALATION_TRIGGERS.some(trigger => 
      message.toLowerCase().includes(trigger.toLowerCase())
    );
  };

  const escalateToHuman = async () => {
    setWaitingForHuman(true);
    
    try {
      // Add human support agent to channel
      await channel.addMembers(['human-agent']);
      
      // Send system message about escalation
      await channel.sendMessage({
        text: "This conversation has been escalated to human support. A support agent will join shortly.",
        user: {
          id: 'system',
          name: 'System',
        },
        type: 'system',
      });

      // Update channel data to mark as escalated
      await channel.update({
        escalated: true,
        escalated_at: new Date().toISOString(),
      });

      setIsEscalated(true);
    } catch (error) {
      console.error('Error escalating to human support:', error);
      await channel.sendMessage({
        text: "I'm sorry, there was an error connecting you with human support. Please try again.",
        user: {
          id: 'system',
          name: 'System',
        },
      });
    } finally {
      setWaitingForHuman(false);
    }
  };

  const handleSubmit = async (message) => {
    try {
      // First send the user's message
      const userMessage = await channel.sendMessage({
        text: message.text,
      });

      // Check if message should trigger escalation
      if (!isEscalated && checkForEscalation(message.text)) {
        await escalateToHuman();
        return;
      }

      // If already escalated, don't send to AI
      if (isEscalated) return;

      // Show typing indicator for AI
      await channel.sendEvent({
        type: 'typing.start',
        user: { id: 'ai-assistant' },
      });

      // Send message to OpenAI
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.text }),
      });
      const data = await response.json();

      // Stop typing indicator
      await channel.sendEvent({
        type: 'typing.stop',
        user: { id: 'ai-assistant' },
      });

      // Send AI response
      await channel.sendMessage({
        text: data.response,
        user: {
          id: 'ai-assistant',
          name: 'AI Support',
        },
      });
    } catch (error) {
      console.error('Error handling message:', error);
      await channel.sendMessage({
        text: "I'm sorry, I encountered an error processing your request.",
        user: {
          id: 'ai-assistant',
          name: 'AI Support',
        },
      });
    }
  };

  return (
    <div className="relative">
      {waitingForHuman && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-100 p-2 text-center text-sm">
          Connecting you with a human support agent...
        </div>
      )}
      <MessageInput 
        overrideSubmitHandler={handleSubmit} 
        disabled={waitingForHuman}
      />
    </div>
  );
};

export default function ChatComponent() {
  const [channel, setChannel] = useState(null);
  const [clientReady, setClientReady] = useState(false);
  const userId = 'user-' + Math.random().toString(36).substring(7);

  useEffect(() => {
    async function initializeChat() {
      try {
        // Get token from our API
        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        const { token } = await response.json();

        // Connect user
        await chatClient.connectUser(
          {
            id: userId,
            name: 'User',
          },
          token
        );

        // Create or join support channel
        const channel = chatClient.channel('messaging', 'support', {
          name: 'Customer Support',
          members: [userId, 'ai-assistant'],
          escalated: false,
        });
        await channel.watch();
        setChannel(channel);

        // Watch for human agent joining
        channel.on('member.added', event => {
          if (event.user.id === 'human-agent') {
            channel.sendMessage({
              text: "Human support agent has joined the conversation.",
              user: {
                id: 'system',
                name: 'System',
              },
              type: 'system',
            });
          }
        });

        setClientReady(true);
      } catch (error) {
        console.error('Error initializing chat:', error);
      }
    }

    initializeChat();

    return () => {
      if (clientReady) {
        chatClient.disconnectUser();
      }
    };
  }, []);

  if (!channel || !clientReady) return <div>Loading...</div>;

  return (
    <div className="h-screen">
      <Channel channel={channel}>
        <Window>
          <ChannelHeader />
          <MessageList />
          <CustomMessageInput />
        </Window>
      </Channel>
    </div>
  );
}