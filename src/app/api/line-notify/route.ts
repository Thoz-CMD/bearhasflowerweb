import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { orderData, paymentType = 'deposit' } = await req.json();

    const LINE_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

    if (!LINE_ACCESS_TOKEN) {
      return NextResponse.json({ error: 'LINE_CHANNEL_ACCESS_TOKEN is not configured' }, { status: 500 });
    }

    const isDeposit = paymentType === 'deposit';
    const isFinal = paymentType === 'final';

    let amountToPay: number;
    let alertTitle: string;
    let labelToPay: string;
    let headerBgColor: string;
    let headerTextColor: string;

    if (isDeposit) {
      amountToPay = orderData.depositPaid || 0;
      alertTitle = '🌸 ออเดอร์ใหม่! (มัดจำ)';
      labelToPay = 'ยอดมัดจำที่ชำระ (50%)';
      headerBgColor = '#E91E8C';
      headerTextColor = '#FFD6E7';
    } else {
      amountToPay = (orderData.total || 0) - (orderData.depositPaid || 0);
      alertTitle = '💳 แจ้งชำระส่วนที่เหลือ!';
      labelToPay = 'ยอดชำระส่วนที่เหลือ';
      headerBgColor = '#00B900';
      headerTextColor = '#E6F8E6';
    }

    // Extract customer info from config (glitter_rose or velvet_wire custom orders)
    const firstItem = orderData.items?.[0];
    const config = firstItem?.config || {};
    const customerName = config.customerName || orderData.customerName || '';
    const customerPhone = config.customerPhone || orderData.customerPhone || '';
    const customerAddress = config.customerAddress || orderData.customerAddress || '';
    const deliveryDate = config.deliveryDate || orderData.deliveryDate || '';
    const deliveryTime = config.deliveryTime || orderData.deliveryTime || '';

    // Format items for Flex Message body
    const itemBoxes = (orderData.items || []).map((item: any) => {
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

    // Build customer info rows
    const customerInfoContents: any[] = [];

    if (customerName) {
      customerInfoContents.push({
        type: "box",
        layout: "horizontal",
        margin: "sm",
        contents: [
          { type: "text", text: "👤 ชื่อผู้รับ", size: "xs", color: "#880E4F", flex: 2 },
          { type: "text", text: customerName, size: "xs", color: "#5c4738", flex: 3, wrap: true, align: "end" }
        ]
      });
    }

    if (customerPhone) {
      customerInfoContents.push({
        type: "box",
        layout: "horizontal",
        margin: "sm",
        contents: [
          { type: "text", text: "📞 เบอร์โทร", size: "xs", color: "#880E4F", flex: 2 },
          { type: "text", text: customerPhone, size: "xs", color: "#5c4738", flex: 3, align: "end" }
        ]
      });
    }

    if (deliveryDate) {
      const deliveryDisplay = deliveryTime ? `${deliveryDate} เวลา ${deliveryTime} น.` : deliveryDate;
      customerInfoContents.push({
        type: "box",
        layout: "horizontal",
        margin: "sm",
        contents: [
          { type: "text", text: "📅 วันรับสินค้า", size: "xs", color: "#880E4F", flex: 2 },
          { type: "text", text: deliveryDisplay, size: "xs", color: "#5c4738", flex: 3, wrap: true, align: "end" }
        ]
      });
    }

    if (customerAddress) {
      customerInfoContents.push({
        type: "box",
        layout: "horizontal",
        margin: "sm",
        contents: [
          { type: "text", text: "📍 ที่อยู่", size: "xs", color: "#880E4F", flex: 2 },
          { type: "text", text: customerAddress, size: "xs", color: "#5c4738", flex: 3, wrap: true, align: "end" }
        ]
      });
    }

    if (orderData.discountCode) {
      customerInfoContents.push({
        type: "box",
        layout: "horizontal",
        margin: "sm",
        contents: [
          { type: "text", text: "🏷️ โค้ดส่วนลด", size: "xs", color: "#880E4F", flex: 2 },
          { type: "text", text: `${orderData.discountCode} (-฿${(orderData.discountAmount || 0).toLocaleString()})`, size: "xs", color: "#4caf50", flex: 3, align: "end", weight: "bold" }
        ]
      });
    }

    // Order ID box
    const orderIdBox = orderData.id ? [{
      type: "box",
      layout: "horizontal",
      margin: "sm",
      contents: [
        { type: "text", text: "🔖 Order ID", size: "xs", color: "#AD7B8E", flex: 2 },
        { type: "text", text: orderData.id, size: "xs", color: "#AD7B8E", flex: 3, align: "end", wrap: true }
      ]
    }] : [];

    const bodyContents: any[] = [
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
            text: `฿${(orderData.total || 0).toLocaleString()}`,
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
        backgroundColor: isDeposit ? "#FCE4EC" : "#E8F5E9",
        contents: [
          {
            type: "text",
            text: labelToPay,
            size: "sm",
            color: isDeposit ? "#880E4F" : "#2E7D32",
            flex: 1
          },
          {
            type: "text",
            text: `฿${amountToPay.toLocaleString()}`,
            size: "sm",
            weight: "bold",
            color: isDeposit ? "#C2185B" : "#388E3C",
            align: "end"
          }
        ]
      }
    ];

    // Add customer info section if available
    if (customerInfoContents.length > 0) {
      bodyContents.push({
        type: "separator",
        margin: "lg",
        color: "#F8BBD9"
      });
      bodyContents.push({
        type: "text",
        text: "ข้อมูลลูกค้า",
        size: "sm",
        weight: "bold",
        color: "#880E4F",
        margin: "md"
      });
      bodyContents.push({
        type: "box",
        layout: "vertical",
        margin: "sm",
        paddingAll: "12px",
        backgroundColor: "#FFF0F5",
        contents: customerInfoContents
      });
    }

    // Add order ID at the bottom
    if (orderIdBox.length > 0) {
      bodyContents.push(...orderIdBox);
    }

    const flexMessage = {
      type: "flex",
      altText: `${alertTitle} ยอด ฿${(orderData.total || 0).toLocaleString()} ${customerName ? `| ${customerName}` : ''}`,
      contents: {
        type: "bubble",
        size: "kilo",
        header: {
          type: "box",
          layout: "vertical",
          backgroundColor: headerBgColor,
          paddingAll: "20px",
          contents: [
            {
              type: "text",
              text: alertTitle,
              color: "#FFFFFF",
              size: "xl",
              weight: "bold"
            },
            {
              type: "text",
              text: "Bear has flower",
              color: headerTextColor,
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
          contents: bodyContents
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
