// app/api/openai/route.js
import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request) {
  const { message } = await request.json();
  console.log(message);
  const completion = await openai.chat.completions.create({
    model:  "ft:gpt-4o-mini-2024-07-18:argot::AXEhwFH8", // Replace with your model ID
  temperature: 0.7,
    messages: [
      {
        role: "system",
        content: "You are a helpful customer support assistant. Answer the question as best as possible. Try and be as accurate as possible. Be concise and to the point."
      },
      {
        role: "user",
        content: `Question: ${message}`
      }
    ]
  });

  const aiResponse = completion.choices[0].message.content;

return NextResponse.json({ 
  response: aiResponse
});
  try {
    

    
  } catch (error) {
    return NextResponse.json(
      { error: 'Error generating AI response' },
      { status: 500 }
    );
  }
}