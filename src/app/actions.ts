'use server';

import https from 'https';

export async function generateAIGreeting(recipient: string, occasion: string, tone: string) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

  if (!GEMINI_API_KEY) {
    return { error: 'GEMINI_API_KEY is not configured' };
  }

  // Decode base64 parameters
  const decodedRecipient = Buffer.from(recipient, 'base64').toString('utf-8');
  const decodedOccasion = Buffer.from(occasion, 'base64').toString('utf-8');
  const decodedTone = Buffer.from(tone, 'base64').toString('utf-8');

  // Base64 encoded Thai prompt to avoid ByteString conversion in Next.js internals
  const encodedPrompt = Buffer.from('คุณเป็นผู้เชี่ยวชาญเขียนการ์ดอวยพรภาษาไทยสำหรับร้านดอกไม้พรีเมียมชื่อ "Bear has flower"\n\nช่วยเขียนข้อความอวยพรบนการ์ดดอกไม้ภาษาไทย จำนวน 3 แบบ ที่มีเอกลักษณ์แตกต่างกัน\n\nข้อมูลจากลูกค้า:\n- มอบดอกไม้ให้: {recipient}\n- โอกาส: {occasion}\n- โทนที่ต้องการ: {tone}\n\nกฎการเขียน:\n1. ข้อความแต่ละแบบต้องสั้น กระชับ อ่านง่าย ความยาวไม่เกิน 3-4 ประโยค\n2. เหมาะสำหรับพิมพ์ลงบนการ์ดขนาดเล็กที่แนบไปกับช่อดอกไม้\n3. ห้ามใช้ภาษาอังกฤษในข้อความอวยพร (ยกเว้นชื่อเฉพาะ)\n4. ต้องให้ความรู้สึกอบอุ่น จริงใจ และสมกับโอกาสนั้นๆ\n5. แต่ละแบบต้องมีสไตล์แตกต่างกันชัดเจน (เช่น แบบที่ 1 โรแมนติก แบบที่ 2 ซาบซึ้ง แบบที่ 3 น่ารักเป็นกันเอง)\n\nตอบกลับเป็น JSON array ในรูปแบบนี้เท่านั้น ห้ามมีข้อความอื่นเพิ่มเติม:\n[\n  { "style": "ชื่อสไตล์", "text": "ข้อความอวยพร" },\n  { "style": "ชื่อสไตล์", "text": "ข้อความอวยพร" },\n  { "style": "ชื่อสไตล์", "text": "ข้อความอวยพร" }\n]', 'utf-8').toString('base64');

  const promptTemplate = Buffer.from(encodedPrompt, 'base64').toString('utf-8');
  const prompt = promptTemplate
    .replace('{recipient}', decodedRecipient)
    .replace('{occasion}', decodedOccasion)
    .replace('{tone}', decodedTone);

  const requestBody = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
    },
  });

  const url = new URL(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`);
  url.searchParams.append('key', GEMINI_API_KEY);

  try {
    const response = await new Promise<any>((resolve, reject) => {
      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(requestBody, 'utf8'),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve({
              ok: res.statusCode === 200,
              status: res.statusCode,
              json: async () => JSON.parse(data),
            });
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.write(requestBody, 'utf8');
      req.end();
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Gemini API error:', response.status, JSON.stringify(err));
      return { error: `Gemini API error ${response.status}: ${err?.error?.message || JSON.stringify(err)}` };
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return { error: 'Invalid response format from AI' };
    }

    let suggestions;
    try {
      suggestions = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('JSON Parse Error. Raw text was:', rawText);
      return { error: 'AI returned invalid JSON format' };
    }

    // Encode suggestions to base64 to avoid ByteString conversion in Next.js serialization
    const encodedSuggestions = suggestions.map((s: any) => ({
      style: Buffer.from(s.style, 'utf-8').toString('base64'),
      text: Buffer.from(s.text, 'utf-8').toString('base64'),
    }));

    return { suggestions: encodedSuggestions };
  } catch (error) {
    console.error('AI Greeting Error:', error);
    return { error: 'Internal server error' };
  }
}
