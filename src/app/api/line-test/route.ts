import { NextResponse } from 'next/server';

export async function GET() {
  const LINE_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!LINE_ACCESS_TOKEN) {
    return NextResponse.json({ 
      error: 'LINE_CHANNEL_ACCESS_TOKEN is missing from .env.local',
      token: null 
    }, { status: 500 });
  }

  // Test broadcast with simple text
  const response = await fetch('https://api.line.me/v2/bot/message/broadcast', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      messages: [{ type: 'text', text: '🌸 ทดสอบระบบ LINE Notify จาก Bear has flower!' }]
    })
  });

  const data = await response.json();
  return NextResponse.json({ 
    status: response.status,
    ok: response.ok,
    lineResponse: data,
    tokenPreview: LINE_ACCESS_TOKEN.substring(0, 10) + '...',
  });
}
