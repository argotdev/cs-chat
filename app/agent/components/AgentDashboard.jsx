// app/agent/components/AgentDashboard.js
'use client';

import { useState, useEffect } from 'react';
import {
  Channel,
  ChannelHeader,
  ChannelList,
  Chat,
  MessageInput,
  MessageList,
  Window,
  useChannelStateContext,
} from 'stream-chat-react';
import { StreamChat } from 'stream-chat';

const chatClient = StreamChat.getInstance(process.env.NEXT_PUBLIC_STREAM_KEY);

const customChannelFilter = { 
  type: 'messaging',
  escalated: true,
};

const ChannelPreview = ({ channel, latestMessage, active }) => {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const getUnread = async () => {
      const state = await channel.state();
      setUnread(state.unreadCount);
    };
    getUnread();
  }, [channel]);

  return (
    <div className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${active ? 'bg-blue-50' : ''}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">User {channel.data.name}</span>
            {channel.data.priority === 'high' && (
              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                High Priority
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500 truncate">
            {latestMessage}
          </div>
        </div>
        {unread > 0 && (
          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
            {unread}
          </span>
        )}
      </div>
      <div className="mt-2 text-xs text-gray-400">
        Waiting: {formatWaitTime(channel.data.escalated_at)}
      </div>
    </div>
  );
};

const formatWaitTime = (escalatedAt) => {
  const minutes = Math.floor((Date.now() - new Date(escalatedAt)) / 60000);
  return minutes < 60 
    ? `${minutes}m` 
    : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

const CustomChannelHeader = () => {
  const { channel } = useChannelStateContext();
  const [userWaitTime, setUserWaitTime] = useState('');

  useEffect(() => {
    if (channel.data.escalated_at) {
      const interval = setInterval(() => {
        setUserWaitTime(formatWaitTime(channel.data.escalated_at));
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [channel.data.escalated_at]);

  return (
    <div className="flex justify-between items-center p-4 border-b">
      <div>
        <h2 className="font-medium">Conversation with User {channel.data.name}</h2>
        <p className="text-sm text-gray-500">
          Waiting time: {userWaitTime}
        </p>
      </div>
      <div className="flex gap-2">
        <button 
          className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
          onClick={() => channel.update({ status: 'resolved' })}
        >
          Resolve
        </button>
        <button 
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => channel.update({ priority: 'high' })}
        >
          Set High Priority
        </button>
      </div>
    </div>
  );
};

export default function AgentDashboard() {
  const [agentClient, setAgentClient] = useState(null);

  useEffect(() => {
    async function initializeAgentChat() {
      try {
        const agentId = 'human-agent'; // In production, this should come from authentication
        
        // Get token for agent
        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: agentId }),
        });
        const { token } = await response.json();

        // Connect agent
        await chatClient.connectUser(
          {
            id: agentId,
            name: 'Support Agent',
            role: 'agent',
          },
          token
        );

        setAgentClient(chatClient);
      } catch (error) {
        console.error('Error initializing agent chat:', error);
      }
    }

    initializeAgentChat();

    return () => {
      if (agentClient) {
        agentClient.disconnectUser();
      }
    };
  }, []);

  if (!agentClient) return <div>Loading...</div>;

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-96 bg-white border-r">
        <div className="p-4 bg-gray-800 text-white">
          <h1 className="text-xl font-semibold">Support Dashboard</h1>
          <div className="text-sm mt-2">
            Agent: Support Team
          </div>
        </div>
        <ChannelList
          filters={customChannelFilter}
          sort={{ last_message_at: -1 }}
          Preview={ChannelPreview}
        />
      </div>
      <div className="flex-1">
        <Channel>
          <Window>
            <CustomChannelHeader />
            <MessageList />
            <MessageInput />
          </Window>
        </Channel>
      </div>
    </div>
  );
}