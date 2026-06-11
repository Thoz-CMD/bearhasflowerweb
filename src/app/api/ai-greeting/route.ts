import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { recipient, occasion, tone } = await req.json();

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
    }

    const prompt = `คุณเป็นผู้เชี่ยวชาญเขียนการ์ดอวยพรภาษาไทยสำหรับร้านดอกไม้พรีเมียมชื่อ "Bear has flower"

ช่วยเขียนข้อความอวยพรบนการ์ดดอกไม้ภาษาไทย จำนวน 3 แบบ ที่มีเอกลักษณ์แตกต่างกัน

ข้อมูลจากลูกค้า:
- มอบดอกไม้ให้: ${recipient}
- โอกาส: ${occasion}
- โทนที่ต้องการ: ${tone}

กฎการเขียน:
1. ข้อความแต่ละแบบต้องสั้น กระชับ อ่านง่าย ความยาวไม่เกิน 3-4 ประโยค
2. เหมาะสำหรับพิมพ์ลงบนการ์ดขนาดเล็กที่แนบไปกับช่อดอกไม้
3. ห้ามใช้ภาษาอังกฤษในข้อความอวยพร (ยกเว้นชื่อเฉพาะ)
4. ต้องให้ความรู้สึกอบอุ่น จริงใจ และสมกับโอกาสนั้นๆ
5. แต่ละแบบต้องมีสไตล์แตกต่างกันชัดเจน (เช่น แบบที่ 1 โรแมนติก แบบที่ 2 ซาบซึ้ง แบบที่ 3 น่ารักเป็นกันเอง)

ตอบกลับเป็น JSON array ในรูปแบบนี้เท่านั้น ห้ามมีข้อความอื่นเพิ่มเติม:
[
  { "style": "ชื่อสไตล์", "text": "ข้อความอวยพร" },
  { "style": "ชื่อสไตล์", "text": "ข้อความอวยพร" },
  { "style": "ชื่อสไตล์", "text": "ข้อความอวยพร" }
]`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 1024,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      console.error('Gemini API error:', response.status, JSON.stringify(err));
      return NextResponse.json(
        { error: `Gemini API error ${response.status}: ${err?.error?.message || JSON.stringify(err)}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Extract JSON from the response (strip markdown code blocks if present)
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Invalid response format from AI' }, { status: 500 });
    }

    let suggestions;
    try {
      suggestions = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('JSON Parse Error. Raw text was:', rawText);
      return NextResponse.json({ error: 'AI returned invalid JSON format' }, { status: 500 });
    }
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('AI Greeting Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
