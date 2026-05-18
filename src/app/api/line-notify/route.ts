import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { orderData } = await req.json();

    const LINE_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

    if (!LINE_ACCESS_TOKEN) {
      return NextResponse.json({ error: 'LINE_CHANNEL_ACCESS_TOKEN is not configured' }, { status: 500 });
    }

    // Format items for Flex Message body
    const itemBoxes = orderData.items.map((item: any) => {
      const detailText = item.details
        ? item.details.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>?/gm, '').trim()
        : '';
      const price = (item.price * (item.qty || 1)).toLocaleString();
      const boxes: any[] = [
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: item.name || '-',
              size: "sm",
              weight: "bold",
              color: "#C2185B",
              flex: 1,
              wrap: true
            },
            {
              type: "text",
              text: `x${item.qty || 1}`,
              size: "sm",
              color: "#AD1457",
              align: "end",
              flex: 0
            }
          ]
        }
      ];
      if (detailText) {
        boxes.push({
          type: "text",
          text: detailText,
          size: "xs",
          color: "#AD7B8E",
          wrap: true,
          margin: "sm"
        });
      }
      boxes.push({
        type: "text",
        text: `฿${price}`,
        size: "sm",
        color: "#E91E8C",
        weight: "bold",
        align: "end",
        margin: "sm"
      });

      return {
        type: "box",
        layout: "vertical",
        margin: "md",
        paddingAll: "12px",
        backgroundColor: "#FFF0F5",
        contents: boxes
      };
    });

    const now = new Date();
    const bangkokTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
    const timeStr = bangkokTime.toLocaleString('th-TH', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "https://bearhasflower.vercel.app/admin";

    const flexMessage = {
      type: "flex",
      altText: `มีออเดอร์ใหม่! ยอด ฿${orderData.total.toLocaleString()}`,
      contents: {
        type: "bubble",
        size: "kilo",
        header: {
          type: "box",
          layout: "vertical",
          backgroundColor: "#E91E8C",
          paddingAll: "20px",
          contents: [
            {
              type: "text",
              text: "มีออเดอร์ใหม่!",
              color: "#FFFFFF",
              size: "xl",
              weight: "bold"
            },
            {
              type: "text",
              text: "Bear has flower",
              color: "#FFD6E7",
              size: "sm",
              margin: "sm"
            }
          ]
        },
        body: {
          type: "box",
          layout: "vertical",
          paddingAll: "16px",
          backgroundColor: "#FFF5F9",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: timeStr,
              size: "xs",
              color: "#AD7B8E"
            },
            {
              type: "separator",
              margin: "md",
              color: "#F8BBD9"
            },
            {
              type: "text",
              text: "รายการสินค้า",
              size: "sm",
              weight: "bold",
              color: "#880E4F",
              margin: "md"
            },
            ...itemBoxes,
            {
              type: "separator",
              margin: "lg",
              color: "#F8BBD9"
            },
            {
              type: "box",
              layout: "horizontal",
              margin: "lg",
              contents: [
                {
                  type: "text",
                  text: "ยอดรวม",
                  size: "sm",
                  weight: "bold",
                  color: "#880E4F",
                  flex: 1
                },
                {
                  type: "text",
                  text: `฿${orderData.total.toLocaleString()}`,
                  size: "md",
                  weight: "bold",
                  color: "#E91E8C",
                  align: "end"
                }
              ]
            },
            {
              type: "box",
              layout: "horizontal",
              margin: "sm",
              paddingAll: "10px",
              backgroundColor: "#FCE4EC",
              contents: [
                {
                  type: "text",
                  text: "มัดจำที่ต้องชำระ",
                  size: "sm",
                  color: "#880E4F",
                  flex: 1
                },
                {
                  type: "text",
                  text: `฿${orderData.depositPaid.toLocaleString()}`,
                  size: "sm",
                  weight: "bold",
                  color: "#C2185B",
                  align: "end"
                }
              ]
            }
          ]
        },
        footer: {
          type: "box",
          layout: "vertical",
          backgroundColor: "#FFF0F5",
          paddingAll: "16px",
          contents: [
            {
              type: "button",
              action: {
                type: "uri",
                label: "ไปหน้าจัดการออเดอร์",
                uri: adminUrl
              },
              style: "primary",
              color: "#E91E8C",
              height: "sm"
            }
          ]
        }
      }
    };

    const response = await fetch('https://api.line.me/v2/bot/message/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ messages: [flexMessage] })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('LINE API Error:', data);
      return NextResponse.json({ error: 'Failed to send LINE message', details: data }, { status: response.status });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Notify Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
