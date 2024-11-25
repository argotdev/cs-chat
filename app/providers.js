// app/providers.js
'use client';

import { StreamChat } from 'stream-chat';
import { Chat } from 'stream-chat-react';

const chatClient = StreamChat.getInstance(process.env.NEXT_PUBLIC_STREAM_KEY);

export function Providers({ children }) {
  return (
    <Chat client={chatClient}>
      {children}
    </Chat>
  );
}