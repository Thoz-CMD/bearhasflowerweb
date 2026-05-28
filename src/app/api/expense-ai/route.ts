import { NextResponse } from 'next/server';

type ReceiptParseResult = {
  title: string;
  amount: number;
  date: string;
  category: string;
};

type ReceiptItem = {
  title: string;
  amount: number;
  date: string;
};

type ReceiptParseOutcome = {
  items: ReceiptItem[];
  single: ReceiptParseResult | null;
};

type LooseObject = Record<string, unknown>;

const ALLOWED_CATEGORIES = [
  'materials',
  'decorations',
  'packaging',
  'marketing',
  'utilities',
  'labor',
  'other',
  'sales'
];

const toNumber = (value: unknown) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value !== 'string') {
    return 0;
  }

  const cleaned = value.replace(/[^0-9.,-]/g, '').replace(/,/g, '').trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeTitle = (value: unknown) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .replace(/\s+/g, ' ')
    .replace(/^[\[\(].*?[\]\)]\s*/g, '')
    .trim();
};

const appendQuantityToTitle = (title: string, quantity: number) => {
  if (!title || quantity <= 1) {
    return title;
  }

  const quantitySuffix = `x${quantity}`;
  const hasQuantitySuffix = new RegExp(`\\b${quantitySuffix}\\b`, 'i').test(title);
  return hasQuantitySuffix ? title : `${title} ${quantitySuffix}`;
};

const normalizeDate = (value: unknown, fallback: string) => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const yearFirst = trimmed.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
  if (yearFirst) {
    return `${yearFirst[1]}-${yearFirst[2].padStart(2, '0')}-${yearFirst[3].padStart(2, '0')}`;
  }

  const dayFirst = trimmed.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (dayFirst) {
    return `${dayFirst[3]}-${dayFirst[2].padStart(2, '0')}-${dayFirst[1].padStart(2, '0')}`;
  }

  return fallback;
};

const normalizeResult = (raw: unknown): ReceiptParseResult => {
  const today = new Date().toISOString().substring(0, 10);
  const data = (raw && typeof raw === 'object' ? raw : {}) as LooseObject;

  const title = normalizeTitle(data.title) || 'รายการจากใบเสร็จ';
  const amountRaw = data.amount ?? data.total ?? data.grand_total;
  const amount = toNumber(amountRaw);
  const date = normalizeDate(data.date, today);
  const categoryRaw = typeof data.category === 'string' ? data.category : 'other';
  const category = ALLOWED_CATEGORIES.includes(categoryRaw) ? categoryRaw : 'other';

  return { title, amount, date, category };
};

const normalizeItems = (rawItems: unknown, fallbackDate: string): ReceiptItem[] => {
  if (!Array.isArray(rawItems)) {
    return [];
  }

  return rawItems
    .map((item) => {
      const data = (item && typeof item === 'object' ? item : {}) as LooseObject;
      const unitPrice = toNumber(data.unitPrice ?? data.unit_price ?? data.price);
      const quantityValue = toNumber(data.quantity ?? data.qty);
      const quantity = quantityValue > 0 ? quantityValue : 1;
      const title = appendQuantityToTitle(normalizeTitle(data.title), quantity);
      const date = normalizeDate(data.date, fallbackDate);
      const explicitAmount = toNumber(data.amount ?? data.total);
      const amount = explicitAmount > 0 ? explicitAmount : unitPrice * quantity;

      return {
        title,
        amount,
        date
      };
    })
    .filter((item) => item.title && item.amount > 0);
};

const parseDataUrl = (imageData: string) => {
  const match = imageData.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    return null;
  }

  return {
    mimeType: match[1],
    data: match[2]
  };
};

const getImageInputs = (body: unknown) => {
  const data = (body && typeof body === 'object' ? body : {}) as LooseObject;
  const imageDataList = Array.isArray(data.imageDataList)
    ? data.imageDataList.filter((item): item is string => typeof item === 'string' && item.startsWith('data:image/'))
    : [];

  if (imageDataList.length > 0) {
    return imageDataList;
  }

  if (typeof data.imageData === 'string' && data.imageData.startsWith('data:image/')) {
    return [data.imageData];
  }

  return [];
};

const extractJsonPayload = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  const withoutFence = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const firstBrace = withoutFence.search(/[\[{]/);
  const lastBrace = Math.max(withoutFence.lastIndexOf('}'), withoutFence.lastIndexOf(']'));
  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    return null;
  }

  try {
    return JSON.parse(withoutFence.slice(firstBrace, lastBrace + 1));
  } catch {
    return null;
  }
};

const getGeminiText = (payload: unknown) => {
  const data = (payload && typeof payload === 'object' ? payload : {}) as LooseObject;
  const candidates = Array.isArray(data.candidates) ? data.candidates : [];

  for (const candidate of candidates) {
    const candidateData = (candidate && typeof candidate === 'object' ? candidate : {}) as LooseObject;
    const content = (candidateData.content && typeof candidateData.content === 'object'
      ? candidateData.content
      : {}) as LooseObject;
    const parts = Array.isArray(content.parts) ? content.parts : [];

    for (const part of parts) {
      const partData = (part && typeof part === 'object' ? part : {}) as LooseObject;
      if (typeof partData.text === 'string' && partData.text.trim()) {
        return partData.text;
      }
    }
  }

  return '';
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const buildPrompt = (today: string) => [
  'You extract expense items from receipt screenshots, shopping cart screenshots, order summaries, and payment slip images.',
  'Return only valid JSON. Do not include markdown fences or explanation text.',
  'If the image shows multiple product rows, output:',
  '{"items":[{"title":"string","unitPrice":21,"quantity":2,"amount":42,"date":"YYYY-MM-DD"}]}',
  'If the image shows only one total, output:',
  '{"title":"string","amount":99,"date":"YYYY-MM-DD","category":"other"}',
  'Rules:',
  '- For shopping-cart style screenshots, each visible product row is one expense item.',
  '- Read the product-specific Thai description, not the shop name or promotional prefix.',
  '- Ignore seller names or repeated prefix text like "GoodLucky", "[19 บาทต่อห่อ]" when a more specific product detail line exists.',
  '- Preserve useful product attributes such as size, color, and pack count.',
  '- Examples of good titles: "เกสรสีขาว 2 มม. 300 ชิ้น", "สีเขียวกองทัพอ่อน-100pcs", "สีเหลืองเข้ม-100pcs", "สีเหลืองไข่ตุ๋น".',
  '- Read the price from the right side of each row, for example "฿21.00".',
  '- Read quantity from markers like "x1", "x2".',
  '- `amount` must equal `unitPrice * quantity` for each item, not the page total.',
  '- If a row has unit price 21 and quantity x2, the item amount must be 42.',
  `- If no date is visible, use "${today}".`,
  `- Allowed categories: ${ALLOWED_CATEGORIES.join(', ')}.`
].join('\n');

const requestGemini = async (
  geminiApiKey: string,
  model: string,
  prompt: string,
  parsedImage: { mimeType: string; data: string }
) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: parsedImage.mimeType,
                  data: parsedImage.data
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      })
    }
  );

  const payload = await response.json();
  return { response, payload };
};

const parseSingleImageWithGemini = async (
  imageData: string,
  geminiApiKey: string,
  models: string[],
  prompt: string,
  today: string
): Promise<ReceiptParseOutcome> => {
  const parsedImage = parseDataUrl(imageData);
  if (!parsedImage) {
    throw new Error('รูปภาพไม่ถูกต้องหรือไม่มีข้อมูลรูปภาพ');
  }

  let lastStatus = 500;
  let lastDetail = 'Gemini request failed';

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const { response, payload } = await requestGemini(geminiApiKey, model, prompt, parsedImage);

      if (!response.ok) {
        lastStatus = response.status;
        lastDetail =
          payload?.error?.message ||
          payload?.promptFeedback?.blockReason ||
          'Gemini request failed';

        if (response.status === 503 && attempt === 0) {
          await sleep(800);
          continue;
        }

        if (response.status === 503) {
          break;
        }

        const error = new Error(lastDetail) as Error & { status?: number };
        error.status = response.status;
        throw error;
      }

      const rawText = getGeminiText(payload);
      if (!rawText) {
        lastStatus = 500;
        lastDetail = `Gemini model ${model} ไม่ส่งข้อมูลที่อ่านได้กลับมา`;
        break;
      }

      const parsedResult = extractJsonPayload(rawText);
      if (!parsedResult) {
        lastStatus = 500;
        lastDetail = `Gemini model ${model} ส่งข้อมูลกลับมาในรูปแบบที่ไม่ถูกต้อง`;
        break;
      }

      const parsedObject = parsedResult as LooseObject;
      const normalizedItems = normalizeItems(
        parsedObject.items,
        normalizeDate(parsedObject.date, today)
      );

      if (normalizedItems.length > 0) {
        return { items: normalizedItems, single: null };
      }

      return { items: [], single: normalizeResult(parsedResult) };
    }
  }

  const error = new Error(lastDetail) as Error & { status?: number };
  error.status = lastStatus;
  throw error;
};

export async function POST(req: Request) {
  try {
    const requestBody = await req.json();
    const imageInputs = getImageInputs(requestBody);
    if (imageInputs.length === 0) {
      return NextResponse.json({ error: 'รูปภาพไม่ถูกต้องหรือไม่มีข้อมูลรูปภาพ' }, { status: 400 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
    }

    const today = new Date().toISOString().substring(0, 10);
    const prompt = buildPrompt(today);
    const primaryModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const models = Array.from(new Set([primaryModel, 'gemini-2.5-flash', 'gemini-2.0-flash']));

    const aggregatedItems: ReceiptItem[] = [];
    const singles: ReceiptParseResult[] = [];

    for (const imageData of imageInputs) {
      const outcome = await parseSingleImageWithGemini(imageData, geminiApiKey, models, prompt, today);
      if (outcome.items.length > 0) {
        aggregatedItems.push(...outcome.items);
      } else if (outcome.single) {
        singles.push(outcome.single);
      }
    }

    if (aggregatedItems.length > 0) {
      const singleItems = singles
        .filter((item) => item.title && item.amount > 0)
        .map((item) => ({
          title: item.title,
          amount: item.amount,
          date: item.date
        }));

      return NextResponse.json({ items: [...aggregatedItems, ...singleItems] });
    }

    if (singles.length > 1) {
      return NextResponse.json({
        items: singles
          .filter((item) => item.title && item.amount > 0)
          .map((item) => ({
            title: item.title,
            amount: item.amount,
            date: item.date
          }))
      });
    }

    if (singles[0]) {
      return NextResponse.json(singles[0]);
    }

    return NextResponse.json({ error: 'ไม่พบข้อมูลรายการในรูปภาพที่ส่งมา' }, { status: 500 });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    const errorWithStatus = error as Error & { status?: number };
    console.error('Receipt parse failed:', {
      message: error.message,
      stack: error.stack
    });
    const status = typeof errorWithStatus.status === 'number' ? errorWithStatus.status : 500;
    const detail = status !== 500 ? error.message : undefined;
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอ่านใบเสร็จ', detail },
      { status }
    );
  }
}

export const runtime = 'nodejs';
