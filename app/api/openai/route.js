// app/api/openai/route.js
import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';
import { PineconeSystem } from '../../lib/PineconeSystem';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request) {
  const { message } = await request.json();
  
  try {
    const pinecone = new PineconeSystem(
      process.env.OPENAI_API_KEY,
      process.env.PINECONE_API_KEY,
      process.env.PINECONE_INDEX
    );

    // Query similar content using the message text directly
    const similarContent = await pinecone.querySimilar(message, 3);

    // Construct context from relevant passages
    const context = similarContent
      .map(match => match.metadata.text)
      .join('\n');

    console.log(context);

    // Generate completion with context
    const completion = await openai.chat.completions.create({
      model: "ft:gpt-4o-mini-2024-07-18:argot::AXEhwFH8",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: "You are a helpful customer support assistant. Answer the question as best as possible using the provided context. If the context doesn't contain relevant information, use your knowledge from your training data. Be concise and accurate."
        },
        {
          role: "user",
          content: `Context: ${context}\n\nQuestion: ${message}`
        }
      ]
    });

    const aiResponse = completion.choices[0].message.content;
    
    return NextResponse.json({ 
      response: aiResponse 
    });
  } catch (error) {
    console.error('Error in OpenAI route:', error);
    return NextResponse.json(
      { error: 'Error generating AI response' },
      { status: 500 }
    );
  }
}