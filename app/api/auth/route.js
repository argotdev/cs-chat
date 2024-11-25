// app/api/auth/route.js
import { StreamChat } from 'stream-chat';
import { NextResponse } from 'next/server';

const serverClient = StreamChat.getInstance(
  process.env.NEXT_PUBLIC_STREAM_KEY,
  process.env.STREAM_SECRET
);

export async function POST(request) {
  const { userId } = await request.json();

  await serverClient.upsertUser({
    id: userId,
    role: 'admin',
  });

  await serverClient.upsertUser({
    id: 'ai-assistant',
    name: 'AI Support',
    role: 'user',
  });
  
  try {
    const token = serverClient.createToken(userId);
    return NextResponse.json({ token });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error generating token' },
      { status: 500 }
    );
  }
}