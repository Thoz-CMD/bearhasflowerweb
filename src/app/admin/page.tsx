'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, db, storage } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, deleteDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { checkIsAdmin } from '@/lib/admin';

const ROSE_COLORS_MAP: Record<string, string> = {
  red: 'แดง', pink: 'ชมพู', blue: 'น้ำเงิน', white: 'ขาว', sky: 'ฟ้า', purple: 'ม่วง'
};
const ROSE_LAYERS_MAP: Record<string, string> = {
  ramy_white: 'รามี่ขาว', pearl_net_white: 'ตาข่ายมุกขาว', sa_paper_white: 'กระดาษสาขาว',
  ramy_black: 'รามี่ดำ', pearl_net_black: 'ตาข่ายมุกดำ', sa_paper_black: 'กระดาษสาดำ'
};
const ROSE_PAPERS_MAP: Record<string, string> = {
  white_solid: 'ขาวทึบ', white_clear: 'ขาวใส', white_gold: 'ขาวขอบทอง',
  black_solid: 'ดำทึบ', black_gold: 'ดำขอบทอง', pink: 'ชมพู'
};
const ROSE_SHAPES_MAP: Record<string, string> = {
  triangle: 'สามเหลี่ยม', rectangle: 'สี่เหลี่ยม', open_front: 'เปิดหน้า'
};
const ROSE_DECORATIONS_MAP: Record<string, string> = {
  ribbon: 'โบว์คาดช่อ', butterfly: 'ผีเสื้อ', blank_card: 'การ์ดเปล่า',
  stick: 'ก้านเสียบ', fairy_light: 'ไฟประดับ', crown: 'มงกุฎ'
};
// Categories are stored for reporting, but not shown in the UI.


const getRoseColorHex = (colorId: string) => {
  const colors: Record<string, string> = {
    red: '#E53935',
    pink: '#F48FB1',
    blue: '#1976D2',
    white: '#F9F9F9',
    sky: '#81D4FA',
    purple: '#CE93D8'
  };
  return colors[colorId] || '#F48FB1';
};

const BasketIcon = ({ colors = [], size = 46 }: { colors: string[], size?: number }) => {
  const c1 = colors[0] || '#F48FB1';
  const c2 = colors[1] || c1;
  const c3 = colors[2] || (colors.length > 1 ? colors[0] : c1);

  return (
    <svg height={size} width={size} viewBox="0 0 512 512" style={{ filter: `drop-shadow(0px 4px 6px ${c1}40)` }}>
      {/* Basket Handle and Base */}
      <path style={{ fill: '#834E00' }} d="M401.171,150.142C401.171,67.354,333.818,0,251.031,0S100.889,67.354,100.889,150.142v74.557 c0,0.044,0.007,0.086,0.007,0.131c0.002,0.23,0.023,0.461,0.035,0.691c0.017,0.344,0.032,0.689,0.07,1.026 c0.006,0.045,0.003,0.089,0.009,0.134l33.31,271.053c1,8.146,7.919,14.266,16.126,14.266h201.168c8.207,0,15.125-6.12,16.126-14.266 l33.309-271.053c0.006-0.045,0.004-0.089,0.009-0.134c0.038-0.338,0.054-0.682,0.07-1.026c0.011-0.231,0.033-0.461,0.035-0.691 c0-0.044,0.007-0.086,0.007-0.131v-74.557H401.171z M133.384,150.142c0-64.871,52.777-117.647,117.647-117.647 s117.647,52.776,117.647,117.647v58.31H133.384V150.142z" />
      <path style={{ fill: '#DF871E' }} d="M100.93,225.521c0.002,0.044,0.007,0.087,0.009,0.131h300.182c0.002-0.044,0.007-0.086,0.009-0.131 c0.011-0.231,0.034-0.461,0.035-0.691c0-0.045,0.007-0.086,0.007-0.131v-74.557C401.171,67.354,333.819,0,251.031,0 c-82.788,0-150.142,67.354-150.142,150.142v74.557c0,0.044,0.007,0.086,0.007,0.131C100.897,225.06,100.919,225.29,100.93,225.521z M133.384,150.142c0-64.871,52.777-117.647,117.647-117.647c64.871,0,117.647,52.776,117.647,117.647v58.31H133.384V150.142z" />
      <path style={{ fill: '#A66300' }} d="M250.817,208.451H133.384v-58.31c0-64.799,52.662-117.528,117.434-117.644V0.002 c-82.692,0.116-149.93,67.422-149.93,150.14v74.557c0,0.044,0.007,0.086,0.007,0.131c0.002,0.23,0.023,0.46,0.035,0.691 c0.018,0.344,0.032,0.689,0.07,1.026c0.006,0.045,0.003,0.089,0.009,0.134l33.31,271.053c1,8.146,7.919,14.266,16.126,14.266 h100.371V208.451H250.817z" />
      <path style={{ fill: '#EDA637' }} d="M100.93,225.521c0.002,0.044,0.007,0.087,0.009,0.131h149.878v-17.199H133.384v-58.31 c0-64.799,52.662-117.528,117.434-117.644V0.002c-82.692,0.116-149.93,67.422-149.93,150.14v74.557c0,0.044,0.007,0.086,0.007,0.131 C100.897,225.06,100.919,225.29,100.93,225.521z" />
      <g>
        <polygon style={{ fill: '#834E00' }} points="382.876,374.577 119.185,374.577 123.302,408.075 378.759,408.075" />
        <polygon style={{ fill: '#834E00' }} points="374.922,439.293 127.139,439.293 131.256,472.791 370.807,472.791" />
      </g>
      <g>
        <polygon style={{ fill: '#704300' }} points="251.031,374.577 251.031,408.075 378.759,408.075 382.876,374.577" />
        <polygon style={{ fill: '#704300' }} points="251.031,439.293 251.031,472.791 370.807,472.791 374.922,439.293" />
      </g>

      {/* Flower 1 - Left */}
      <g opacity="0.9">
        <path fill={c1} d="M302.957,167.299h-42.325l-3.043-54.663c-0.773-13.897,10.287-25.59,24.206-25.59l0,0 c13.917,0,24.978,11.693,24.204,25.589L302.957,167.299z" />
        <path fill={c1} d="M268.194,154.882l19.428,37.602l-47.168,27.794c-11.991,7.066-27.456,2.607-33.844-9.758l0,0 c-6.388-12.365-1.078-27.558,11.624-33.25L268.194,154.882z" />
        <path fill={c1} d="M295.396,154.882l-19.428,37.602l47.168,27.794c11.991,7.066,27.456,2.607,33.844-9.758l0,0 c-6.388-12.365,1.077-27.558-11.624-33.25L295.396,154.882z" />
      </g>
      <g opacity="0.7">
        <path fill={c1} d="M295.396,188.467l-19.428-37.602l47.168-27.794c11.991-7.066,27.456-2.607,33.844,9.758l0,0 c-6.388,12.365,1.077,27.558-11.624,33.25L295.396,188.467z" />
        <path fill={c1} d="M268.194,188.467l19.428-37.602l-47.168-27.794c-11.991-7.066-27.456-2.607-33.844,9.758l0,0 c-6.388,12.365-1.078,27.558,11.624,33.25L268.194,188.467z" />
        <path fill={c1} d="M260.632,176.05h42.325l3.043,54.663c0.774,13.896-10.286,25.589-24.204,25.589l0,0 c-13.918,0-24.978-11.693-24.204-25.589L260.632,176.05z" />
      </g>
      <circle style={{ fill: '#FACE17' }} cx="282.521" cy="170.716" r="35" />

      {/* Flower 2 - Middle */}
      <g opacity="0.8">
        <path fill={c2} d="M180.174,200.726h-42.325l-3.043-54.663c-0.774-13.896,10.286-25.589,24.204-25.589l0,0 c13.918,0,24.978,11.693,24.204,25.589L180.174,200.726z" />
        <path fill={c2} d="M145.411,188.308l19.428,37.602l-47.168,27.794c-11.991,7.066-27.456,2.607-33.844-9.758l0,0 c-6.388-12.365-1.078-27.558,11.624-33.25L145.411,188.308z" />
        <path fill={c2} d="M172.613,188.308l-19.428,37.602l47.168,27.794c11.991,7.066,27.456,2.607,33.844-9.758l0,0 c-6.388-12.365,1.078-27.558-11.624-33.25L172.613,188.308z" />
      </g>
      <g opacity="0.6">
        <path fill={c2} d="M172.613,221.893l-19.428-37.602l47.168-27.794c11.991-7.066,27.456-2.607,33.844,9.758l0,0 c-6.388,12.365,1.078,27.558-11.624,33.25L172.613,221.893z" />
        <path fill={c2} d="M145.411,221.893l19.428-37.602l-47.168-27.794c-11.991-7.066-27.456-2.607-33.844,9.758l0,0 c-6.388,12.365,1.078,27.558,11.624,33.25L145.411,221.893z" />
        <path fill={c2} d="M137.85,209.477h42.325l3.043,54.663c0.774,13.896-10.286,25.589-24.204,25.589l0,0 c-13.918,0-24.978-11.693-24.204-25.589L137.85,209.477z" />
      </g>
      <circle style={{ fill: '#FACE17' }} cx="159.74" cy="204.147" r="35" />

      {/* Flower 3 - Right */}
      <g opacity="0.95">
        <path fill={c3} d="M374.151,245.227h-42.325l-3.043-54.663c-0.774-13.896,10.286-25.589,24.204-25.589l0,0 c13.918,0,24.978,11.693,24.204,25.589L374.151,245.227z" />
        <path fill={c3} d="M339.388,232.81l19.428,37.602l-47.168,27.794c-11.991,7.066-27.456,2.607-33.844-9.758l0,0 c-6.388-12.365-1.078-27.558,11.624-33.25L339.388,232.81z" />
        <path fill={c3} d="M366.589,232.81l-19.428,37.602l47.168,27.794c11.991,7.066,27.456,2.607,33.844-9.758l0,0 c-6.388-12.365,1.078-27.558-11.624-33.25L366.589,232.81z" />
      </g>
      <g opacity="0.75">
        <path fill={c3} d="M366.589,266.395l-19.428-37.602l47.168-27.794c11.991-7.066,27.456-2.607,33.844,9.758l0,0 c-6.388,12.365,1.078,27.558-11.624,33.25L366.589,266.395z" />
        <path fill={c3} d="M339.388,266.395l19.428-37.602l-47.168-27.794c-11.991-7.066-27.456-2.607-33.844,9.758l0,0 c-6.388,12.365,1.078,27.558,11.624,33.25L339.388,266.395z" />
        <path fill={c3} d="M331.826,253.978h42.325l3.043,54.663c0.774,13.896-10.286,25.589-24.204,25.589l0,0 c-13.918,0-24.978-11.693-24.204-25.589L331.826,253.978z" />
      </g>
      <circle style={{ fill: '#FACE17' }} cx="353.715" cy="248.643" r="35" />
    </svg>
  );
};

function AdminPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [isAdminUser, setIsAdminUser] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // all, pending_verification, preparing, shipping, completed, cancelled
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [finishedImageFiles, setFinishedImageFiles] = useState<Record<string, File>>({});
  const [finishedImagePreviews, setFinishedImagePreviews] = useState<Record<string, string>>({});
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [adminViewMode, setAdminViewMode] = useState<'manager' | 'florist' | 'finance' | 'create-order'>('manager');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [registeredUsersCount, setRegisteredUsersCount] = useState(0);
  const [previousMonthRegisteredUsersCount, setPreviousMonthRegisteredUsersCount] = useState(0);

  let registeredUsersGrowthPct = 0;
  if (previousMonthRegisteredUsersCount > 0) {
    registeredUsersGrowthPct = ((registeredUsersCount - previousMonthRegisteredUsersCount) / previousMonthRegisteredUsersCount) * 100;
  } else if (registeredUsersCount > 0) {
    registeredUsersGrowthPct = 0;
  }
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().substring(0, 10));
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
  const [expenseItems, setExpenseItems] = useState<Array<{
    id: string;
    title: string;
    amount: string;
    date: string;
    type: 'expense' | 'income';
  }>>(() => [
    {
      id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
      title: '',
      amount: '',
      date: new Date().toISOString().substring(0, 10),
      type: 'expense'
    }
  ]);
  const [receiptPreviews, setReceiptPreviews] = useState<string[]>([]);
  const [receiptDataUrls, setReceiptDataUrls] = useState<string[]>([]);
  const [isParsingReceipt, setIsParsingReceipt] = useState(false);
  const [receiptParseError, setReceiptParseError] = useState<string | null>(null);
  const [receiptFileNames, setReceiptFileNames] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  // Custom Order Creation states
  const [coRoseQty, setCoRoseQty] = useState<number>(1);
  const [coRoseColors, setCoRoseColors] = useState<string[]>(['red']);
  const [coSecondaryLayer, setCoSecondaryLayer] = useState<string>('ramy_white');
  const [coPaper, setCoPaper] = useState<string>('white_solid');
  const [coShape, setCoShape] = useState<string>('triangle');
  const [coDecorations, setCoDecorations] = useState<string[]>([]);
  const [coCoverImage, setCoCoverImage] = useState<string>(''); // Base64 cover image
  const [coPrice, setCoPrice] = useState<string>('');
  const [coCustomerName, setCoCustomerName] = useState<string>('');
  const [coCustomerPhone, setCoCustomerPhone] = useState<string>('');
  const [coCustomerAddress, setCoCustomerAddress] = useState<string>('');
  const [coDeliveryDate, setCoDeliveryDate] = useState<string>('');
  const [coDeliveryTime, setCoDeliveryTime] = useState<string>('');
  const [coAdditionalNote, setCoAdditionalNote] = useState<string>('');
  const [coIsSubmitting, setCoIsSubmitting] = useState<boolean>(false);

  const syncAdminViewMode = (nextMode: 'manager' | 'florist' | 'finance') => {
    setAdminViewMode(nextMode);

    const params = new URLSearchParams(searchParams.toString());
    if (nextMode === 'manager') {
      params.delete('view');
    } else {
      params.set('view', nextMode);
    }

    const queryString = params.toString();
    router.replace(queryString ? `/admin?${queryString}` : '/admin');
  };

  const getCalculatedPrice = () => {
    const qtyPriceObj = [
      { qty: 1, price: 79 },
      { qty: 3, price: 159 },
      { qty: 5, price: 189 },
      { qty: 7, price: 259 },
      { qty: 10, price: 299 },
      { qty: 12, price: 329 },
      { qty: 14, price: 359 },
      { qty: 20, price: 529 },
      { qty: 30, price: 739 },
      { qty: 40, price: 899 },
      { qty: 50, price: 1000 },
    ].find(p => p.qty === coRoseQty) || { price: 79 };

    let decorPriceSum = 0;
    const decorPrices: Record<string, number> = {
      ribbon: 15,
      butterfly: 0,
      blank_card: 0,
      stick: 5,
      fairy_light: 15,
      crown: 15
    };
    coDecorations.forEach(dec => {
      decorPriceSum += decorPrices[dec] || 0;
    });

    return qtyPriceObj.price + decorPriceSum;
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coCustomerName.trim()) {
      await (window as any).showBeautifulAlert('กรุณากรอกชื่อผู้รับด้วยค่ะ', 'error', 'ข้อมูลไม่ครบถ้วน');
      return;
    }
    setCoIsSubmitting(true);
    try {
      const finalPrice = coPrice ? parseFloat(coPrice) : getCalculatedPrice();
      const orderData = {
        items: [
          {
            name: `ช่อกุหลาบกลิตเตอร์ (สั่งทำพิเศษ)`,
            price: finalPrice,
            qty: 1,
            details: `จำนวนกุหลาบ ${coRoseQty} ดอก, สี: ${coRoseColors.map(c => ROSE_COLORS_MAP[c] || c).join(', ')}`,
            type: 'glitter_rose',
            config: {
              selectedQty: coRoseQty,
              selectedColors: coRoseColors,
              selectedLayers: [coSecondaryLayer],
              selectedPaper: coPaper,
              selectedShape: coShape,
              selectedDecorations: coDecorations,
              customerName: coCustomerName.trim(),
              customerPhone: coCustomerPhone.trim(),
              customerAddress: coCustomerAddress.trim(),
              deliveryDate: coDeliveryDate,
              deliveryTime: coDeliveryTime,
              additionalNote: coAdditionalNote.trim(),
              coverImage: coCoverImage || ''
            }
          }
        ],
        total: finalPrice,
        depositPaid: finalPrice,
        status: 'preparing', // Automatically send to Florist queue!
        createdAt: serverTimestamp ? serverTimestamp() : new Date().toISOString(),
        userId: 'admin_manual',
      };

      await addDoc(collection(db, 'orders'), orderData);
      await (window as any).showBeautifulAlert('สร้างออเดอร์ใหม่และส่งเข้าคิวช่างสำเร็จเรียบร้อยแล้วค่ะ!', 'success', 'สร้างออเดอร์สำเร็จ');

      // Reset fields
      setCoRoseQty(1);
      setCoRoseColors(['red']);
      setCoSecondaryLayer('ramy_white');
      setCoPaper('white_solid');
      setCoShape('triangle');
      setCoDecorations([]);
      setCoCoverImage('');
      setCoPrice('');
      setCoCustomerName('');
      setCoCustomerPhone('');
      setCoCustomerAddress('');
      setCoDeliveryDate('');
      setCoDeliveryTime('');
      setCoAdditionalNote('');

      // Switch view mode to florist
      syncAdminViewMode('florist');
    } catch (err) {
      console.error('Failed to create manual order:', err);
      await (window as any).showBeautifulAlert('เกิดข้อผิดพลาดในการสร้างออเดอร์', 'error', 'เกิดข้อผิดพลาด');
    } finally {
      setCoIsSubmitting(false);
    }
  };

  // Sort preparing florist orders so those scheduled to deliver earliest are at the top
  const preparingOrdersSorted = React.useMemo(() => {
    const getOrderDeliveryDate = (order: any) => {
      let earliestDate: string | null = null;
      if (order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          if (item.config && item.config.deliveryDate) {
            const d = item.config.deliveryDate.trim();
            if (d) {
              if (!earliestDate || d < earliestDate) {
                earliestDate = d;
              }
            }
          }
        }
      }
      return earliestDate;
    };

    return [...orders]
      .filter(o => o.status === 'preparing')
      .sort((a, b) => {
        const dateA = getOrderDeliveryDate(a);
        const dateB = getOrderDeliveryDate(b);

        if (dateA && dateB) {
          return dateA.localeCompare(dateB);
        }
        if (dateA) return -1;
        if (dateB) return 1;

        const timeA = a.createdAt?.seconds
          ? a.createdAt.seconds * 1000
          : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.createdAt?.seconds
          ? b.createdAt.seconds * 1000
          : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
      });
  }, [orders]);

  // Dynamically extract all months that have financial records (orders or expenses)
  const availableMonths = React.useMemo(() => {
    const monthsSet = new Set<string>();

    // Add current month in case there are no records yet
    const today = new Date();
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    monthsSet.add(currentMonthKey);

    // Extract from orders
    orders.forEach(o => {
      let dateStr = '';
      if (o.createdAt?.toDate) {
        dateStr = o.createdAt.toDate().toISOString();
      } else if (o.createdAt?.seconds) {
        dateStr = new Date(o.createdAt.seconds * 1000).toISOString();
      } else if (o.createdAt) {
        dateStr = new Date(o.createdAt).toISOString();
      }
      if (dateStr) {
        monthsSet.add(dateStr.substring(0, 7)); // YYYY-MM
      }
    });

    // Extract from expenses
    expenses.forEach(e => {
      if (e.date) {
        monthsSet.add(e.date.substring(0, 7)); // YYYY-MM
      }
    });

    return Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
  }, [orders, expenses]);

  const formatMonthThai = (yearMonthStr: string) => {
    if (!yearMonthStr) return '';
    const [year, month] = yearMonthStr.split('-');
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const monthIdx = parseInt(month, 10) - 1;
    const beYear = parseInt(year, 10) + 543;
    return `${thaiMonths[monthIdx]} ${beYear}`;
  };

  const getPreviousYearMonth = (yearMonthStr: string) => {
    if (!yearMonthStr) return '';
    const [yearStr, monthStr] = yearMonthStr.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    if (Number.isNaN(year) || Number.isNaN(month)) return '';
    const previousDate = new Date(year, month - 2, 1);
    return `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, '0')}`;
  };

  useEffect(() => {
    const view = searchParams.get('view');
    if (view === 'florist' || view === 'finance') {
      setAdminViewMode(view);
      return;
    }
    setAdminViewMode('manager');
  }, [searchParams]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).showBeautifulAlert = function (message: string, type: string = 'info', title: string = 'แจ้งเตือน') {
        return new Promise((resolve) => {
          const existing = document.getElementById('beautiful-alert-overlay');
          if (existing) existing.remove();

          const overlay = document.createElement('div');
          overlay.id = 'beautiful-alert-overlay';
          overlay.className = 'beautiful-alert-overlay';

          let icon = '🌸';
          if (type === 'success') icon = '✅';
          if (type === 'error') icon = '❌';
          if (type === 'warning') icon = '⚠️';

          overlay.innerHTML = `
            <div class="beautiful-alert-modal">
              <div class="beautiful-alert-icon ${type}">${icon}</div>
              <h3 class="beautiful-alert-title">${title}</h3>
              <p class="beautiful-alert-message">${message}</p>
              <div class="beautiful-alert-buttons">
                <button class="beautiful-alert-btn confirm-btn">ตกลง</button>
              </div>
            </div>
          `;

          document.body.appendChild(overlay);
          document.body.style.overflow = 'hidden';

          setTimeout(() => overlay.classList.add('active'), 10);

          const closeAlert = () => {
            overlay.classList.remove('active');
            overlay.classList.add('closing');
            document.body.style.overflow = '';
            setTimeout(() => {
              overlay.remove();
              resolve(true);
            }, 300);
          };

          overlay.querySelector('.confirm-btn')?.addEventListener('click', closeAlert);
          overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeAlert();
          });
        });
      };

      (window as any).showBeautifulConfirm = function (message: string, title: string = 'ยืนยัน') {
        return new Promise((resolve) => {
          const existing = document.getElementById('beautiful-alert-overlay');
          if (existing) existing.remove();

          const overlay = document.createElement('div');
          overlay.id = 'beautiful-alert-overlay';
          overlay.className = 'beautiful-alert-overlay';

          overlay.innerHTML = `
            <div class="beautiful-alert-modal">
              <div class="beautiful-alert-icon warning">❓</div>
              <h3 class="beautiful-alert-title">${title}</h3>
              <p class="beautiful-alert-message">${message}</p>
              <div class="beautiful-alert-buttons confirm-layout">
                <button class="beautiful-alert-btn cancel-btn">ยกเลิก</button>
                <button class="beautiful-alert-btn confirm-btn">ตกลง</button>
              </div>
            </div>
          `;

          document.body.appendChild(overlay);
          document.body.style.overflow = 'hidden';

          setTimeout(() => overlay.classList.add('active'), 10);

          const closeConfirm = (confirmed: boolean) => {
            overlay.classList.remove('active');
            overlay.classList.add('closing');
            document.body.style.overflow = '';
            setTimeout(() => {
              overlay.remove();
              resolve(confirmed);
            }, 300);
          };

          overlay.querySelector('.confirm-btn')?.addEventListener('click', () => closeConfirm(true));
          overlay.querySelector('.cancel-btn')?.addEventListener('click', () => closeConfirm(false));
          overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeConfirm(false);
          });
        });
      };
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Verify admin privilege
        const hasAdmin = await checkIsAdmin(currentUser.uid, currentUser.displayName, currentUser.email);
        setIsAdminUser(hasAdmin);
      } else {
        setUser(null);
        setIsAdminUser(false);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Fetch orders in real-time if user is verified as admin
  useEffect(() => {
    if (isAdminUser !== true) return;

    const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const fetched: any[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      setOrders(fetched);
    }, (err) => {
      console.error("Error fetching live orders:", err);
    });

    return () => unsubscribeOrders();
  }, [isAdminUser]);

  useEffect(() => {
    if (registeredUsersCount > 0 && previousMonthRegisteredUsersCount === 0) {
      setPreviousMonthRegisteredUsersCount(registeredUsersCount);
    }
  }, [registeredUsersCount, previousMonthRegisteredUsersCount]);

  // Fetch registered users and active presence in real-time
  useEffect(() => {
    if (isAdminUser !== true) return;
    let calcInterval: any = null;

    let disposed = false;
    let countInterval: any = null;

    const loadAuthUserCount = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/admin/auth-user-count', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error(`auth-user-count ${res.status}`);
        const data = (await res.json()) as { count?: number };
        if (!disposed) setRegisteredUsersCount(Number(data.count || 0));

      } catch (err) {
        console.error('Error fetching auth user count:', err);
      }
    };

    loadAuthUserCount();
    countInterval = setInterval(loadAuthUserCount, 60000);

    // 2. Listen to active sessions presence and auto-cleanup old ones
    const unsubscribePresence = onSnapshot(collection(db, 'presence'), (snapshot) => {
      const fetched: any[] = [];
      const now = Date.now();

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const lastSeenTime = data.lastSeen ? new Date(data.lastSeen).getTime() : 0;

        // Auto-cleanup: If a session is older than 5 minutes (tab closed/crashed), delete it from database to save space
        if (now - lastSeenTime > 5 * 60 * 1000) {
          deleteDoc(doc(db, 'presence', docSnap.id)).catch(e => console.warn("Presence cleanup error:", e));
        } else {
          fetched.push(data);
        }
      });

      if (calcInterval) clearInterval(calcInterval);

      // Filter active users where lastSeen is within the last 90 seconds (1.5 minutes)
      const updateActiveCount = () => {
        const threshold = new Date(Date.now() - 90000).toISOString();
        const active = fetched.filter(p => p.lastSeen && p.lastSeen >= threshold).length;
        setActiveUsersCount(active > 0 ? active : 1); // Display at least 1 (the current admin)
      };

      updateActiveCount();

      // Recalculate local list every 15 seconds to naturally age out users who closed their tab
      calcInterval = setInterval(updateActiveCount, 15000);
    }, (err) => {
      console.error("Error fetching active presence:", err);
    });

    return () => {
      unsubscribePresence();
      disposed = true;
      if (countInterval) clearInterval(countInterval);
      if (calcInterval) clearInterval(calcInterval);
    };
  }, [isAdminUser, user]);

  // Fetch expenses in real-time if user is verified as admin
  useEffect(() => {
    if (isAdminUser !== true) return;

    const expensesQuery = query(collection(db, 'expenses'), orderBy('date', 'desc'));
    const unsubscribeExpenses = onSnapshot(expensesQuery, (snapshot) => {
      const fetched: any[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      setExpenses(fetched);
    }, (err) => {
      console.error("Error fetching live expenses:", err);
    });

    return () => unsubscribeExpenses();
  }, [isAdminUser]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = expenseItems.filter((item) => item.title.trim() && item.amount);
    if (validItems.length === 0) {
      await (window as any).showBeautifulAlert('กรุณากรอกข้อมูลรายจ่ายให้ครบถ้วนค่ะ', 'warning', 'ข้อมูลไม่ครบถ้วน');
      return;
    }

    setIsSubmittingExpense(true);
    try {
      await Promise.all(validItems.map((item) => addDoc(collection(db, 'expenses'), {
        title: item.title.trim(),
        amount: parseFloat(item.amount),
        category: 'other',
        date: item.date,
        type: item.type || 'expense',
        createdAt: serverTimestamp ? serverTimestamp() : new Date().toISOString(),
        recordedBy: user?.phoneNumber || user?.email || 'Admin'
      })));
      const firstDate = validItems[0]?.date;
      if (firstDate) setSelectedMonth(firstDate.substring(0, 7));
      setExpenseTitle('');
      setExpenseAmount('');
      setExpenseItems([
        {
          id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
          title: '',
          amount: '',
          date: new Date().toISOString().substring(0, 10),
          type: 'expense'
        }
      ]);
      await (window as any).showBeautifulAlert('บันทึกรายการสำเร็จเรียบร้อยแล้วค่ะ!', 'success', 'บันทึกสำเร็จ');
    } catch (err) {
      console.error("Failed to add expense:", err);
      await (window as any).showBeautifulAlert('เกิดข้อผิดพลาดในการบันทึกรายการ', 'error', 'เกิดข้อผิดพลาด');
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      resolve(result);
    };
    reader.onerror = () => reject(new Error(`ไม่สามารถอ่านไฟล์ ${file.name} ได้`));
    reader.readAsDataURL(file);
  });

  const handleReceiptFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (files.some((file) => !file.type.startsWith('image/'))) {
      (window as any).showBeautifulAlert('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้นค่ะ', 'warning', 'ไฟล์ไม่ถูกต้อง');
      e.target.value = '';
      return;
    }

    try {
      const results = await Promise.all(files.map((file) => readFileAsDataUrl(file)));
      setReceiptPreviews((prev) => [...prev, ...results]);
      setReceiptDataUrls((prev) => [...prev, ...results]);
      setReceiptFileNames((prev) => [...prev, ...files.map((file) => file.name)]);
      setReceiptParseError(null);
    } catch (err: any) {
      const message = err?.message || 'ไม่สามารถอ่านไฟล์รูปภาพได้';
      setReceiptParseError(message);
      await (window as any).showBeautifulAlert(message, 'error', 'เกิดข้อผิดพลาด');
    } finally {
      e.target.value = '';
    }
  };

  const handleParseReceipt = async () => {
    if (receiptDataUrls.length === 0) {
      await (window as any).showBeautifulAlert('กรุณาเลือกรูปใบเสร็จอย่างน้อย 1 รูปก่อนค่ะ', 'warning', 'ยังไม่มีรูป');
      return;
    }

    setIsParsingReceipt(true);
    setReceiptParseError(null);
    try {
      const res = await fetch('/api/expense-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageDataList: receiptDataUrls
        })
      });

      const data = await res.json();
      if (!res.ok) {
        const detailText = typeof data?.detail === 'string' ? data.detail : '';
        const trimmedDetail = detailText.length > 500 ? detailText.slice(0, 500) + '...' : detailText;
        const message = trimmedDetail
          ? `Gemini API error: ${trimmedDetail}`
          : (data?.error || 'ไม่สามารถอ่านใบเสร็จได้ในขณะนี้');
        throw new Error(message);
      }

      if (Array.isArray(data?.items) && data.items.length > 0) {
        const normalizedItems = data.items.map((item: any) => ({
          id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
          title: String(item?.title || '').trim(),
          amount: item?.amount !== undefined && item?.amount !== null ? String(item.amount) : '',
          date: String(item?.date || expenseDate)
        }));
        setExpenseItems(normalizedItems);
      } else {
        if (data?.title) setExpenseTitle(String(data.title));
        if (data?.amount !== undefined && data?.amount !== null) {
          setExpenseAmount(String(data.amount));
        }
        if (data?.date) setExpenseDate(String(data.date));
        setExpenseItems([
          {
            id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
            title: String(data?.title || ''),
            amount: data?.amount !== undefined && data?.amount !== null ? String(data.amount) : '',
            date: String(data?.date || expenseDate),
            type: 'expense'
          }
        ]);
      }

      await (window as any).showBeautifulAlert(`อ่านใบเสร็จสำเร็จ ${receiptDataUrls.length} รูป และกรอกฟอร์มให้อัตโนมัติแล้วค่ะ`, 'success', 'สำเร็จ');
    } catch (err: any) {
      const message = err?.message || 'อ่านใบเสร็จไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
      setReceiptParseError(message);
      await (window as any).showBeautifulAlert(message, 'error', 'เกิดข้อผิดพลาด');
    } finally {
      setIsParsingReceipt(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    const ok = await (window as any).showBeautifulConfirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการรายจ่ายนี้?', 'ยืนยันการลบรายการ');
    if (!ok) return;
    try {
      await deleteDoc(doc(db, 'expenses', id));
      await (window as any).showBeautifulAlert('ลบรายการรายจ่ายสำเร็จเรียบร้อย!', 'success', 'ลบรายการสำเร็จ');
    } catch (err) {
      console.error("Failed to delete expense:", err);
      await (window as any).showBeautifulAlert('เกิดข้อผิดพลาดในการลบรายการ', 'error', 'เกิดข้อผิดพลาด');
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setIsUploadingImage(true);
      let finishedImageUrl = null;

      if (newStatus === 'shipping' && finishedImageFiles[orderId]) {
        try {
          const file = finishedImageFiles[orderId];

          // Convert file to base64
          const base64File = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
          });

          // Upload via API route to bypass CORS
          const res = await fetch('/api/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              base64File,
              path: `finished_arrangements/${orderId}_${Date.now()}`
            })
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Upload failed');

          finishedImageUrl = data.url;
        } catch (uploadErr) {
          console.error('Failed to upload image:', uploadErr);
          await (window as any).showBeautifulAlert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ โปรดลองใหม่อีกครั้ง', 'error', 'อัปโหลดล้มเหลว');
          setIsUploadingImage(false);
          return;
        }
      }

      const orderRef = doc(db, 'orders', orderId);
      const updateData: any = { status: newStatus };
      if (finishedImageUrl) {
        updateData.finishedImageUrl = finishedImageUrl;
      }
      await updateDoc(orderRef, updateData);

      // Always send notification for status changes if user is not guest
      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        const orderData = orderSnap.data();
        const userId = orderData.userId || 'guest';
        const primaryItem = orderData.items?.[0];
        const itemName = primaryItem?.name || 'ช่อดอกไม้';
        // For custom-designed orders (with config), check if they have coverImage
        const isCustomOrder = !!primaryItem?.config;
        // Get product image: use coverImage first, then image, or fallback based on type
        // For custom orders, only use image if coverImage is explicitly set (not default ribbon)
        const isDefaultRibbonImage = primaryItem?.coverImage?.includes('ริบบิ้นแดง.jpg');
        const itemImage = (!isDefaultRibbonImage && primaryItem?.coverImage) || 
          primaryItem?.image || 
          (primaryItem?.type === 'glitter_rose' ? '/images/Glitter Rose/ริบบิ้นแดง.jpg' : '') ||
          '';
        
        // Additional info for notification display logic
        const isPreset = primaryItem?.isPreset === true;
        const itemId = primaryItem?.id || '';
        const isCustomId = itemId && itemId.startsWith('custom_');

        if (userId !== 'guest') {
          let title = 'อัปเดตสถานะออเดอร์';
          let message = `ออเดอร์ "${itemName}" อัปเดตสถานะใหม่`;

          if (newStatus === 'preparing') {
            title = 'เริ่มจัดดอกไม้แล้ว';
            message = `ออเดอร์ "${itemName}" กำลังถูกจัดเตรียมค่ะ`;
          } else if (newStatus === 'shipping') {
            title = 'จัดดอกไม้เสร็จเรียบร้อย';
            message = `กรุณาชำระเงินส่วนที่เหลือเพื่อจัดส่ง "${itemName}" ค่ะ`;
          } else if (newStatus === 'delivering') {
            title = 'กำลังจัดส่ง';
            message = `ออเดอร์ "${itemName}" กำลังเดินทางไปหาคุณค่ะ`;
          } else if (newStatus === 'completed') {
            title = 'จัดส่งสำเร็จ';
            message = `ส่งมอบ "${itemName}" เรียบร้อย ขอบคุณที่ใช้บริการค่ะ`;
          } else if (newStatus === 'cancelled') {
            title = 'ออเดอร์ถูกยกเลิก';
            message = `ออเดอร์ "${itemName}" ถูกยกเลิก ติดต่อแอดมินเพื่อสอบถามเพิ่มค่ะ`;
          }

          // Only send for meaningful updates
          if (['preparing', 'shipping', 'delivering', 'completed', 'cancelled'].includes(newStatus)) {
            await addDoc(collection(db, 'notifications'), {
              userId,
              orderId,
              title,
              message,
              imageUrl: itemImage,
              type: 'status_update',
              status: 'unread',
              createdAt: serverTimestamp(),
              config: isCustomOrder ? primaryItem?.config : null,
              itemType: primaryItem?.type || null,
              isPreset: isPreset,
              itemId: itemId,
            });
          }
        }
      }

      await (window as any).showBeautifulAlert('อัปเดตสถานะออเดอร์เรียบร้อยแล้ว!', 'success', 'อัปเดตสถานะสำเร็จ');
    } catch (err) {
      console.error('Failed to update status:', err);
      await (window as any).showBeautifulAlert('เกิดข้อผิดพลาดในการอัปเดตสถานะ', 'error', 'เกิดข้อผิดพลาด');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_verification':
        return { label: 'รอตรวจสอบยอดเงินมัดจำ', color: '#e67e22', bg: '#fdf6ee' };
      case 'pending_final_verification':
        return { label: 'รอตรวจสอบยอดเงิน (ส่วนที่เหลือ)', color: '#e67e22', bg: '#fdf6ee' };
      case 'preparing':
        return { label: 'กำลังจัดเตรียมช่อดอกไม้', color: '#db8a9e', bg: '#fdf5f6' };
      case 'shipping':
        return { label: 'จัดดอกไม้เสร็จแล้ว', color: '#3498db', bg: '#ebf5fb' };
      case 'delivering':
        return { label: 'กำลังจัดส่ง', color: '#9b59b6', bg: '#f5eef8' };
      case 'completed':
        return { label: 'จัดส่งสำเร็จ', color: '#2ecc71', bg: '#eafaf1' };
      case 'cancelled':
        return { label: 'ยกเลิกออเดอร์', color: '#95a5a6', bg: '#f2f4f4' };
      default:
        return { label: status, color: '#333', bg: '#f5f5f5' };
    }
  };

  const resolveOrderDate = (createdAt: any) => {
    if (!createdAt) return null;
    if (createdAt.toDate) {
      return createdAt.toDate();
    }
    if (createdAt.seconds) {
      return new Date(createdAt.seconds * 1000);
    }
    return new Date(createdAt);
  };

  const formatOrderDate = (createdAt: any) => {
    const d = resolveOrderDate(createdAt);
    if (!d) return '-';
    return d.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOrderCustomerDisplayName = (order: any) => {
    const customItem = order?.items?.find((item: any) => item?.config);
    return (
      customItem?.config?.customerName ||
      order?.customerName ||
      order?.displayName ||
      order?.name ||
      order?.userName ||
      order?.shippingName ||
      `#${order?.id?.substring?.(0, 8)?.toUpperCase?.() || 'ไม่ระบุ'}`
    );
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <style>{`
          .admin-loading {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fffafb;
            font-family: 'Noto Sans Thai', sans-serif;
            color: #db8a9e;
            font-size: 1.2rem;
          }
        `}</style>
        กำลังโหลดข้อมูลหลังบ้าน...
      </div>
    );
  }

  if (isAdminUser === false) {
    return (
      <div className="denied-container">
        <style>{`
          .denied-container {
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #fffafb;
            font-family: 'Noto Sans Thai', sans-serif;
            text-align: center;
            padding: 20px;
          }
          .denied-card {
            background: #fff;
            padding: 40px;
            border-radius: 24px;
            box-shadow: 0 10px 30px rgba(219, 138, 158, 0.1);
            max-width: 400px;
          }
          .denied-icon {
            font-size: 3rem;
            margin-bottom: 20px;
          }
          h2 {
            color: #5c4738;
            margin-bottom: 10px;
          }
          p {
            color: #a08a8e;
            font-size: 0.95rem;
            margin-bottom: 25px;
          }
          .back-btn {
            background: #db8a9e;
            color: #fff;
            border: none;
            padding: 12px 24px;
            border-radius: 12px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s;
          }
          .back-btn:hover {
            background: #c27588;
            transform: translateY(-2px);
          }
        `}</style>
        <div className="denied-card">
          <div className="denied-icon">🔒</div>
          <h2>ไม่ได้รับอนุญาตให้เข้าถึง</h2>
          <p>ขออภัย หน้าเว็บส่วนนี้จำกัดการเข้าถึงเฉพาะผู้ดูแลระบบที่มีสิทธิ์เท่านั้น</p>
          <button className="back-btn" onClick={() => window.location.href = '/'}>
            กลับไปหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  // Filter logic
  const normalizedRecipientSearch = recipientSearch.trim().toLowerCase();
  const filteredOrders = orders.filter(o => {
    const matchesStatus = activeFilter === 'all' || o.status === activeFilter;
    if (!matchesStatus) return false;
    if (!normalizedRecipientSearch) return true;
    const customerDisplayName = getOrderCustomerDisplayName(o).toLowerCase();
    const orderId = String(o?.id || '').toLowerCase();
    const itemIdMatch = (o?.items || []).some((item: any) => {
      const idValue = String(item?.id || '').toLowerCase();
      const productIdValue = String(item?.productId || item?.product_id || '').toLowerCase();
      const skuValue = String(item?.sku || '').toLowerCase();
      return idValue.includes(normalizedRecipientSearch)
        || productIdValue.includes(normalizedRecipientSearch)
        || skuValue.includes(normalizedRecipientSearch);
    });
    return customerDisplayName.includes(normalizedRecipientSearch)
      || orderId.includes(normalizedRecipientSearch)
      || itemIdMatch;
  });

  // Statistics calculations
  const totalSales = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((acc, o) => acc + (o.total || 0), 0) +
    expenses
    .filter(e => e.type === 'income')
    .reduce((acc, e) => acc + (e.amount || 0), 0);
  const pendingCount = orders.filter(o => o.status === 'pending_verification').length;
  const preparingCount = orders.filter(o => o.status === 'preparing').length;
  const completedCount = orders.filter(o => o.status === 'completed').length;
  const toPercent = (count: number) => Math.min(100, Math.max(0, Math.round((count / safeOrderCount) * 100)));

  const getSalesForMonth = (orders: any[], year: number, month: number) => {
    return orders
      .filter(o => o.status !== 'cancelled')
      .filter(o => {
        const orderDate = resolveOrderDate(o.createdAt);
        return orderDate && orderDate.getFullYear() === year && orderDate.getMonth() === month;
      })
      .reduce((acc, o) => acc + (o.total || 0), 0);
  };

  const getSalesForYearMonth = (orders: any[], yearMonth: string) => {
    const orderSales = orders
      .filter(o => o.status !== 'cancelled')
      .filter(o => {
        const orderDate = resolveOrderDate(o.createdAt);
        return orderDate && `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}` === yearMonth;
      })
      .reduce((acc, o) => acc + (o.total || 0), 0);
    const incomeSales = expenses
      .filter(e => e.type === 'income')
      .filter(e => e.date && e.date.substring(0, 7) === yearMonth)
      .reduce((acc, e) => acc + (e.amount || 0), 0);
    return orderSales + incomeSales;
  };

  const getExpensesForYearMonth = (items: any[], yearMonth: string) => {
    return items
      .filter((item) => item.type === 'expense')
      .filter((item) => item.date && item.date.substring(0, 7) === yearMonth)
      .reduce((acc, item) => acc + (item.amount || 0), 0);
  };

  const getGrowthMetrics = (currentValue: number, previousValue: number) => {
    const rawPct = previousValue === 0
      ? (currentValue > 0 ? 100 : 0)
      : ((currentValue - previousValue) / previousValue) * 100;
    const absolutePct = Math.abs(rawPct);
    const displayPct = Number(absolutePct.toFixed(2));
    return {
      rawPct,
      displayPct,
      formattedPct: displayPct.toLocaleString('th-TH', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
      progressPct: Math.min(100, Math.max(0, Math.round(absolutePct))),
      ringLabelPct: Math.round(displayPct),
      ringPrefix: rawPct > 0 ? '+' : rawPct < 0 ? '-' : '',
      detailPrefix: rawPct > 0 ? '↗' : rawPct < 0 ? '↘' : '•',
      detailLabel: rawPct > 0 ? 'เพิ่มขึ้น' : rawPct < 0 ? 'ลดลง' : 'คงที่',
    };
  };

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const currentMonthSales = getSalesForMonth(orders, currentYear, currentMonth);
  const previousMonthSales = getSalesForMonth(orders, previousYear, previousMonth);

  const salesGrowthPct = previousMonthSales === 0
    ? (currentMonthSales > 0 ? 100 : 0)
    : ((currentMonthSales - previousMonthSales) / previousMonthSales) * 100;

  const totalExpenses = expenses
    .filter(e => e.type === 'expense')
    .reduce((acc, e) => acc + (e.amount || 0), 0);
  const netProfit = totalSales - totalExpenses;
  const safeOrderCount = Math.max(orders.length, 1);
  const todayLabel = new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());
  const notificationCount = pendingCount;
  const notificationLabel = notificationCount > 99 ? '99+' : String(notificationCount);
  const viewTitleMap = {
    manager: 'Dashboard',
    florist: 'ช่างจัดดอกไม้',
    finance: 'รายรับ-รายจ่าย',
    'create-order': 'สร้างออเดอร์',
  } as const;
  const viewSubtitleMap = {
    manager: 'ภาพรวมการจัดการร้านดอกไม้',
    florist: 'ติดตามคิวงานและความพร้อมในการจัดช่อ',
    finance: 'ตรวจสอบรายการรายรับและรายจ่ายของร้าน',
    'create-order': 'สร้างออเดอร์พิเศษจากหลังบ้าน',
  } as const;
  const overviewCards = [
    {
      key: 'sales',
      label: 'ยอดขายทั้งหมด',
      value: `${totalSales.toLocaleString()} ฿`,
      detail: `${orders.length} รายการทั้งหมด`,
      accent: '#ff5f87',
      cardClass: 'metric-sales',
      progressPct: Math.round(Math.abs(salesGrowthPct)),
      ringLabelPct: Math.round(Math.abs(salesGrowthPct)),
      ringPrefix: '+',
      detailPrefix: '↗',
    },
    {
      key: 'pending',
      label: 'รอตรวจสอบเงิน',
      value: `${pendingCount} รายการ`,
      detail: `${Math.round((pendingCount / safeOrderCount) * 100)}% จากทั้งหมด`,
      accent: '#f59f3a',
      cardClass: 'metric-pending',
      progressPct: toPercent(pendingCount),
      ringLabelPct: toPercent(pendingCount),
      ringPrefix: '+',
      detailPrefix: '↗',
    },
    {
      key: 'preparing',
      label: 'กำลังจัดเตรียม',
      value: `${preparingCount} รายการ`,
      detail: `${Math.round((preparingCount / safeOrderCount) * 100)}% จากทั้งหมด`,
      accent: '#ef4e7b',
      cardClass: 'metric-preparing',
      progressPct: toPercent(preparingCount),
      ringLabelPct: toPercent(preparingCount),
      ringPrefix: '+',
      detailPrefix: '↗',
    },
    {
      key: 'completed',
      label: 'ส่งสำเร็จแล้ว',
      value: `${completedCount} รายการ`,
      detail: `${Math.round((completedCount / safeOrderCount) * 100)}% จากทั้งหมด`,
      accent: '#35c770',
      cardClass: 'metric-completed',
      progressPct: toPercent(completedCount),
      ringLabelPct: toPercent(completedCount),
      ringPrefix: '+',
      detailPrefix: '↗',
    },
    {
      key: 'active-users',
      label: 'ผู้ใช้งานขณะนี้ (Live)',
      value: `${activeUsersCount} คน`,
      detail: activeUsersCount > 0 ? 'กำลังใช้งานอยู่ตอนนี้' : 'ยังไม่มีผู้ใช้งานที่ออนไลน์',
      accent: '#5a8dff',
      cardClass: 'metric-live',
      progressPct: registeredUsersCount > 0 ? Math.round((activeUsersCount / registeredUsersCount) * 100) : 0,
      ringLabelPct: registeredUsersCount > 0 ? Math.round((activeUsersCount / registeredUsersCount) * 100) : 0,
      ringPrefix: '',
      detailPrefix: '•',
    },
    {
      key: 'registered-users',
      label: 'ผู้สมัครใช้งานทั้งหมด',
      value: `${registeredUsersCount} คน`,
      detail: 'จำนวนบัญชีที่ลงทะเบียนไว้',
      accent: '#9b62ff',
      cardClass: 'metric-users',
      progressPct: Math.round(Math.abs(registeredUsersGrowthPct)),
      ringLabelPct: Math.round(Math.abs(registeredUsersGrowthPct)),
      ringPrefix: '+',
      detailPrefix: '•',
    },
  ];

  // Filter orders and expenses based on the selected month for the Finance View
  const monthlyOrders = orders.filter(o => {
    let orderMonth = '';
    if (o.createdAt?.toDate) {
      orderMonth = o.createdAt.toDate().toISOString().substring(0, 7);
    } else if (o.createdAt?.seconds) {
      orderMonth = new Date(o.createdAt.seconds * 1000).toISOString().substring(0, 7);
    } else if (o.createdAt) {
      orderMonth = new Date(o.createdAt).toISOString().substring(0, 7);
    }
    return orderMonth === selectedMonth;
  });

  const monthlyExpenses = expenses.filter(e => {
    return e.date && e.date.substring(0, 7) === selectedMonth;
  });

  // Calculate monthly stats
  const monthlySales = monthlyOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((acc, o) => acc + (o.total || 0), 0) +
    monthlyExpenses
    .filter(e => e.type === 'income')
    .reduce((acc, e) => acc + (e.amount || 0), 0);

  const monthlyExpensesTotal = monthlyExpenses
    .filter(e => e.type === 'expense')
    .reduce((acc, e) => acc + (e.amount || 0), 0);
  const monthlyNetProfit = monthlySales - monthlyExpensesTotal;
  const previousMonthFinance = getPreviousYearMonth(selectedMonth);
  const previousMonthSalesFinance = previousMonthFinance
    ? getSalesForYearMonth(orders, previousMonthFinance)
    : 0;
  const previousMonthExpensesFinance = previousMonthFinance
    ? getExpensesForYearMonth(expenses, previousMonthFinance)
    : 0;
  const previousMonthNetProfitFinance = previousMonthSalesFinance - previousMonthExpensesFinance;
  const salesFinanceGrowth = getGrowthMetrics(monthlySales, previousMonthSalesFinance);
  const expensesFinanceGrowth = getGrowthMetrics(monthlyExpensesTotal, previousMonthExpensesFinance);
  const netProfitFinanceGrowth = getGrowthMetrics(monthlyNetProfit, previousMonthNetProfitFinance);
  const previousMonthLabelFinance = previousMonthFinance ? formatMonthThai(previousMonthFinance) : 'เดือนที่แล้ว';
  const financeCards = [
    {
      key: 'finance-sales',
      label: 'รายรับประจำเดือน',
      value: `${monthlySales.toLocaleString()} ฿`,
      detail: `${salesFinanceGrowth.detailLabel} ${salesFinanceGrowth.formattedPct}% จาก${previousMonthLabelFinance}`,
      accent: '#ff5f87',
      cardClass: 'metric-sales',
      progressPct: salesFinanceGrowth.progressPct,
      ringLabelPct: salesFinanceGrowth.ringLabelPct,
      ringPrefix: salesFinanceGrowth.ringPrefix,
      detailPrefix: salesFinanceGrowth.detailPrefix,
    },
    {
      key: 'finance-expenses',
      label: 'รายจ่ายจัดซื้อประจำเดือน',
      value: `${monthlyExpensesTotal.toLocaleString()} ฿`,
      detail: `${expensesFinanceGrowth.detailLabel} ${expensesFinanceGrowth.formattedPct}% จาก${previousMonthLabelFinance}`,
      accent: '#f59f3a',
      cardClass: 'metric-pending',
      progressPct: expensesFinanceGrowth.progressPct,
      ringLabelPct: expensesFinanceGrowth.ringLabelPct,
      ringPrefix: expensesFinanceGrowth.ringPrefix,
      detailPrefix: expensesFinanceGrowth.detailPrefix,
    },
    {
      key: 'finance-net-profit',
      label: 'กำไรสุทธิประจำเดือน',
      value: `${monthlyNetProfit.toLocaleString()} ฿`,
      detail: `${netProfitFinanceGrowth.detailLabel} ${netProfitFinanceGrowth.formattedPct}% จาก${previousMonthLabelFinance}`,
      accent: monthlyNetProfit >= 0 ? '#35c770' : '#e74c3c',
      cardClass: monthlyNetProfit >= 0 ? 'metric-completed' : 'metric-preparing',
      progressPct: netProfitFinanceGrowth.progressPct,
      ringLabelPct: netProfitFinanceGrowth.ringLabelPct,
      ringPrefix: netProfitFinanceGrowth.ringPrefix,
      detailPrefix: netProfitFinanceGrowth.detailPrefix,
      valueColor: monthlyNetProfit >= 0 ? '#27ae60' : '#e74c3c',
    },
  ];

  // Ledger Items for the selected month
  const monthlyLedgerItems = [
    ...monthlyOrders.filter(o => o.status !== 'cancelled').map(o => {
      let orderDate = '';
      const customerDisplayName = getOrderCustomerDisplayName(o);
      try {
        if (o.createdAt?.toDate) {
          orderDate = o.createdAt.toDate().toISOString().substring(0, 10);
        } else if (o.createdAt?.seconds) {
          orderDate = new Date(o.createdAt.seconds * 1000).toISOString().substring(0, 10);
        } else if (o.createdAt) {
          orderDate = new Date(o.createdAt).toISOString().substring(0, 10);
        }
      } catch (err) {
        orderDate = new Date().toISOString().substring(0, 10);
      }
      return {
        id: o.id,
        title: `รายรับสินค้า (ออเดอร์ ${customerDisplayName})`,
        amount: o.total || 0,
        type: 'revenue',
        category: 'sales',
        date: orderDate
      };
    }),
    ...monthlyExpenses.map(e => ({
      id: e.id,
      title: e.title,
      amount: e.amount || 0,
      type: e.type || 'expense',
      category: e.category,
      date: e.date
    }))
  ].sort((a, b) => new Date(b.date + 'T23:59:59').getTime() - new Date(a.date + 'T23:59:59').getTime());


  return (
    <div className="admin-dashboard">
      <style>{`
          .admin-dashboard {
            background: rgba(255, 252, 253, 0.9);
            font-family: 'Noto Sans Thai', sans-serif;
            color: #5c4738;
            padding: 24px;
            overflow-x: hidden;
            width: 100%;
            box-sizing: border-box;
            border-radius: 28px;
            box-shadow: 0 24px 60px rgba(80, 50, 57, 0.08);
            border: 1px solid rgba(219, 138, 158, 0.1);
          }

        .dashboard-container {
          max-width: 1320px;
          margin: 0 auto;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 18px;
          margin-bottom: 28px;
        }

        .dashboard-title-block {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        @media (max-width: 767px) {
          .dashboard-title-block {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
          }
          .dashboard-title {
            order: 1;
          }
          .dashboard-chip {
            order: 2;
          }
          .dashboard-subtitle {
            order: 3;
            width: 100%;
          }
        }

        .dashboard-chip {
          display: inline-flex;
          align-items: center;
          width: fit-content;
          padding: 8px 14px;
          border-radius: 999px;
          background: #fff1f5;
          color: #ea678f;
          font-size: 0.8rem;
          font-weight: 700;
        }

        .dashboard-title {
          font-size: clamp(1.75rem, 3vw, 2.25rem);
          line-height: 1.1;
          color: #2d2227;
          margin: 0;
        }

        .dashboard-subtitle {
          color: #8f7d83;
          font-size: 0.98rem;
          margin: 0;
        }

        .dashboard-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-icon-btn,
        .header-date-chip {
          height: 48px;
          border-radius: 16px;
          border: 1px solid rgba(219, 138, 158, 0.12);
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 14px 30px rgba(80, 50, 57, 0.05);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #7c6870;
        }

        .header-icon-btn {
          width: 48px;
          position: relative;
        }

        .header-icon-badge {
          position: absolute;
          top: 6px;
          right: 6px;
          min-width: 15px;
          height: 15px;
          padding: 0 4px;
          border-radius: 999px;
          background: #ff5d89;
          color: #fff;
          font-size: 0.62rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          box-shadow: 0 0 0 3px rgba(255, 93, 137, 0.12);
        }

        .header-date-chip {
          gap: 8px;
          padding: 0 16px;
          font-weight: 700;
          color: #5d4a52;
        }



        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
          margin-bottom: 30px;
        }

        .stat-card {
          border-radius: 20px;
          padding: 18px 18px;
          box-shadow: 0 16px 34px rgba(80, 50, 57, 0.06);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          border: 1px solid rgba(219, 138, 158, 0.12);
          transition: all 0.25s ease;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 24px 48px rgba(80, 50, 57, 0.08);
        }

        .metric-sales {
          background: #fff;
        }

        .metric-pending {
          background: #fff;
        }

        .metric-preparing {
          background: #fff;
        }

        .metric-completed {
          background: #fff;
        }

        .metric-live {
          background: #fff;
        }

        .metric-users {
          background: #fff;
        }

        .stat-info {
          display: flex;
          flex-direction: column;
          gap: 7px;
          min-width: 0;
        }

        .stat-label {
          color: #8e7b82;
          font-size: 0.9rem;
          font-weight: 650;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 850;
          color: #35272d;
          line-height: 1.05;
        }

        .stat-detail {
          font-size: 0.88rem;
          font-weight: 750;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .live-dot {
          position: relative;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #2ecc71;
          box-shadow: 0 0 8px #2ecc71;
          animation: livePulse 1.8s infinite;
        }

        .stat-ring {
          --size: 80px;
          --thickness: 7px;
          --p: 0;
          --accent: #db8a9e;
          width: var(--size);
          height: var(--size);
          border-radius: 999px;
          background: conic-gradient(var(--accent) calc(var(--p) * 1%), rgba(80, 50, 57, 0.08) 0);
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .stat-ring::before {
          content: '';
          position: absolute;
          inset: var(--thickness);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.96);
        }
        .stat-ring-label {
          position: relative;
          font-size: 0.85rem;
          font-weight: 850;
          color: var(--accent);
          letter-spacing: 0.01em;
        }

        @keyframes livePulse {
          0% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.7); }
          70% { transform: scale(1.35); opacity: 0.5; box-shadow: 0 0 0 6px rgba(46, 204, 113, 0); }
          100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(46, 204, 113, 0); }
        }

        /* Tabs Filter */
        .tabs-filter {
          display: flex;
          gap: 10px;
          margin-bottom: 22px;
          overflow-x: auto;
          padding-bottom: 5px;
          scrollbar-width: none;
        }

        .tabs-filter::-webkit-scrollbar {
          display: none;
        }

        .tab-btn {
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid rgba(219, 138, 158, 0.1);
          color: #856d75;
          padding: 11px 18px;
          border-radius: 999px;
          cursor: pointer;
          font-size: 0.88rem;
          font-weight: 600;
          white-space: nowrap;
          transition: all 0.2s;
        }

        .tab-btn.active {
          background: linear-gradient(135deg, #f47aa2 0%, #ea678f 100%);
          color: #fff;
          border-color: transparent;
          box-shadow: 0 10px 22px rgba(234, 103, 143, 0.26);
        }

        /* Live Orders Section */
        .orders-section {
          background: rgba(255, 255, 255, 0.94);
          border-radius: 26px;
          padding: 24px;
          box-shadow: 0 18px 42px rgba(80, 50, 57, 0.05);
          border: 1px solid rgba(219, 138, 158, 0.1);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 20px;
          border-bottom: 1px solid #f6e8ec;
          padding-bottom: 18px;
        }

        .section-header h2 {
          font-size: 1.35rem;
          font-weight: 700;
          margin: 0;
          color: #2d2227;
        }

        .section-subtitle {
          font-size: 0.88rem;
          color: #97838a;
          margin: 6px 0 0;
        }

        .orders-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .orders-search {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fff;
          border: 1px solid rgba(219, 138, 158, 0.16);
          border-radius: 999px;
          padding: 8px 12px;
          min-width: 240px;
          box-shadow: 0 8px 18px rgba(80, 50, 57, 0.04);
        }

        .orders-search svg {
          color: #d46f92;
          flex-shrink: 0;
        }

        .orders-search-input {
          border: none;
          outline: none;
          font-size: 0.88rem;
          color: #5c4738;
          width: 100%;
          background: transparent;
        }

        .orders-search-input::placeholder {
          color: #b69aa3;
        }

        .order-count-badge {
          color: #ea678f;
          border-radius: 999px;
          font-size: 0.82rem;
          font-weight: 700;
        }

        @media (max-width: 767px) {
          .order-count-badge {
            margin-left: auto;
          }
        }

        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .order-row {
          border: 1px solid #f5e6ea;
          border-radius: 20px;
          padding: 18px;
          transition: all 0.2s;
          cursor: pointer;
          background: #fff;
        }

        .order-row:hover {
          border-color: #f1c4d1;
          box-shadow: 0 16px 30px rgba(80, 50, 57, 0.05);
        }

        .order-summary-row {
          display: grid;
          grid-template-columns: minmax(210px, 2fr) minmax(140px, 1.1fr) minmax(150px, 1fr) minmax(170px, 1fr) 24px;
          align-items: center;
          gap: 14px;
        }

        .order-main-info {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }

        .order-avatar {
          width: 58px;
          height: 58px;
          border-radius: 18px;
          background: linear-gradient(135deg, #fff5f8 0%, #fff0f4 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          flex-shrink: 0;
        }

        .order-meta,
        .order-middle-meta,
        .order-delivery-meta,
        .order-right-meta,
        .order-mobile-meta,
        .order-extra-bar {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .order-id,
        .order-customer,
        .order-delivery-date {
          font-weight: 700;
          font-size: 0.94rem;
          color: #36272e;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .order-date,
        .order-phone,
        .order-delivery-time {
          font-size: 0.8rem;
          color: #a08a8e;
        }

        .order-right-meta {
          align-items: flex-end;
        }

        .order-price {
          font-weight: 800;
          font-size: 1.18rem;
          color: #ea678f;
        }

        .status-badge {
          padding: 7px 12px;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 700;
          width: fit-content;
        }

        .order-expand-indicator {
          color: #b79aa2;
          transition: transform 0.2s ease;
        }

        .order-expand-indicator.open {
          transform: rotate(180deg);
        }

        .order-mobile-meta {
          display: none;
        }

        .order-extra-bar {
          display: none;
        }

        /* Expand Area */
        .order-details-drawer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease-out;
        }

        .order-details-drawer.open {
          max-height: 1200px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px dashed #f5e6e8;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(260px, 0.8fr);
          gap: 14px;
        }

        @media (max-width: 1024px) {
          .detail-grid {
            grid-template-columns: minmax(0, 1fr) minmax(240px, 0.92fr) !important;
            gap: 12px !important;
          }
        }

        .detail-card {
          background: linear-gradient(180deg, #fffefe 0%, #fff9fb 100%);
          border: 1px solid #f8e7ed;
          border-radius: 14px;
          padding: 14px;
          box-shadow: 0 8px 18px rgba(80, 50, 57, 0.03);
        }

        .detail-card h4 {
          font-size: 0.82rem;
          font-weight: 700;
          color: #c8738f;
          margin: 0;
          border-bottom: none;
          padding-bottom: 0;
        }

        .detail-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
          padding-bottom: 8px;
          border-bottom: 1px solid #f8e9ee;
        }

        .detail-card-chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 4px 8px;
          border-radius: 999px;
          background: #fff1f5;
          color: #dc6e93;
          font-size: 0.7rem;
          font-weight: 700;
          white-space: nowrap;
        }

        .detail-item-list,
        .detail-kv-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 0.82rem;
          color: #7a6352;
        }

        .detail-kv-row {
          display: grid;
          grid-template-columns: 92px minmax(0, 1fr);
          gap: 10px;
          align-items: start;
        }

        .detail-kv-label {
          color: #aa8b95;
          font-size: 0.76rem;
          font-weight: 700;
          line-height: 1.45;
        }

        .detail-kv-value {
          color: #5c4738;
          font-size: 0.82rem;
          font-weight: 600;
          line-height: 1.48;
          word-break: break-word;
        }

        .detail-note-box {
          margin-top: 10px;
          padding: 10px 12px;
          border-radius: 12px;
          background: #fff4f7;
          border: 1px solid #f9dce6;
        }

        .detail-note-label {
          display: block;
          margin-bottom: 4px;
          color: #d26f92;
          font-size: 0.72rem;
          font-weight: 700;
        }

        .detail-note-text {
          color: #7c6169;
          font-size: 0.78rem;
          line-height: 1.5;
          word-break: break-word;
        }

        .detail-empty-text {
          color: #9a848b;
          font-size: 0.8rem;
          line-height: 1.5;
        }

        .control-panel {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .detail-status-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
        }

        .detail-status-meta {
          color: #8d747d;
          font-size: 0.76rem;
          font-weight: 600;
          line-height: 1.4;
        }

        .status-note {
          padding: 10px 12px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 700;
          text-align: center;
          line-height: 1.45;
        }

        .status-note.success {
          color: #2ecc71;
          background: #eefbf4;
          border: 1px solid #d2f3df;
        }

        .status-note.danger {
          color: #e74c3c;
          background: #fdf0ee;
          border: 1px solid #f6d9d3;
        }

        .status-select-btn {
          border: none;
          color: #fff;
          padding: 9px 12px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 700;
          font-size: 0.8rem;
          line-height: 1.45;
          transition: all 0.2s;
          text-align: center;
        }

        .status-select-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        /* Empty State */
        .empty-orders {
          text-align: center;
          padding: 50px 20px;
          color: #a08a8e;
        }
        
        .empty-orders-icon {
          font-size: 2.5rem;
          margin-bottom: 15px;
        }

        @media (max-width: 768px) {
          .admin-dashboard {
            padding: 16px !important;
            border-radius: 22px !important;
          }
          .orders-section {
            padding: 16px !important;
            border-radius: 20px !important;
          }
          .orders-list {
            gap: 12px !important;
            padding-bottom: 96px;
          }
          .order-row {
            padding: 14px !important;
            border-radius: 18px !important;
            scroll-margin-bottom: 160px;
          }
          .dashboard-header {
            flex-direction: column !important;
            align-items: stretch !important;
            margin-bottom: 22px !important;
          }
          .dashboard-header-actions {
            justify-content: space-between !important;
          }
          .stats-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
            margin-bottom: 20px !important;
          }
          .stat-card {
            padding: 14px 12px !important;
            gap: 12px !important;
            border-radius: 16px !important;
          }
          .stat-label {
            font-size: 0.74rem !important;
            color: #a08a8e !important;
            line-height: 1.25 !important;
          }
          .stat-value {
            font-size: 1.15rem !important;
            font-weight: 820 !important;
            line-height: 1.25 !important;
          }
          .stat-detail {
            font-size: 0.76rem !important;
          }
          .stat-ring {
            --size: 54px;
            --thickness: 6px;
          }
          .stat-ring-label {
            font-size: 0.76rem;
          }
          .detail-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .section-header {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .orders-header-actions {
            width: 100%;
            justify-content: flex-start !important;
          }
          .orders-search {
            width: 100%;
            min-width: 0;
          }
          .order-summary-row {
            display: flex !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .order-main-info {
            align-items: flex-start !important;
          }
          .order-avatar {
            width: 50px !important;
            height: 50px !important;
            border-radius: 16px !important;
          }
          .order-id,
          .order-customer,
          .order-delivery-date {
            white-space: normal !important;
            overflow: visible !important;
            text-overflow: unset !important;
            line-height: 1.35 !important;
          }
          .order-middle-meta,
          .order-delivery-meta {
            display: none !important;
          }
          .order-right-meta {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
            gap: 10px !important;
            padding-top: 10px;
            border-top: 1px dashed #f4e3e8;
          }
          .order-price {
            font-size: 1.05rem !important;
          }
          .order-expand-indicator {
            display: none !important;
          }
          .order-mobile-meta,
          .order-extra-bar {
            display: flex !important;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px dashed #f4e3e8;
            color: #927c84;
            font-size: 0.82rem;
          }
          .order-mobile-meta span,
          .order-extra-bar span {
            white-space: normal !important;
            word-break: break-word;
            line-height: 1.45;
          }
          .order-extra-bar {
            flex-direction: column !important;
            gap: 6px !important;
          }
          .order-details-drawer.open {
            max-height: 3200px !important;
            margin-top: 12px !important;
            padding-top: 12px !important;
          }
          .detail-card {
            padding: 12px !important;
            border-radius: 14px !important;
          }
          .detail-card h4 {
            font-size: 0.8rem !important;
            line-height: 1.4 !important;
          }
          .detail-card-header {
            display: none !important;
          }
          .detail-item-list,
          .detail-kv-list {
            font-size: 0.8rem !important;
            gap: 8px !important;
            word-break: break-word;
          }
          .detail-kv-row {
            grid-template-columns: 82px minmax(0, 1fr) !important;
            gap: 8px !important;
          }
          .detail-kv-label {
            font-size: 0.72rem !important;
          }
          .detail-kv-value,
          .detail-empty-text {
            font-size: 0.78rem !important;
          }
          .detail-note-box {
            padding: 9px 10px !important;
          }
          .status-select-btn {
            width: 100%;
            min-height: 48px;
            padding: 11px 12px !important;
            font-size: 0.78rem !important;
            line-height: 1.45 !important;
            white-space: normal;
          }
        }

        @media (max-width: 480px) {
          /* Keep stats in 2 columns and prevent overflow */
          .stats-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
          }
          .stat-card {
            padding: 12px 10px !important;
            gap: 8px !important;
            border-radius: 14px !important;
          }
          .stat-label {
            font-size: 0.68rem !important;
          }
          .stat-value {
            font-size: 0.9rem !important;
          }
          .stat-ring {
            --size: 50px;
            --thickness: 6px;
          }
          .stat-ring-label {
            font-size: 0.72rem;
          }
          .stats-grid {
            grid-template-columns: 1fr !important;
          }
          .header-date-chip,
          .header-icon-btn {
            height: 44px !important;
          }
          .orders-section {
            padding: 14px !important;
          }
          .orders-search {
            padding: 7px 10px;
          }
          .order-main-info {
            gap: 10px !important;
          }
          .order-avatar {
            width: 46px !important;
            height: 46px !important;
          }
          .order-id {
            font-size: 0.92rem !important;
          }
          .order-date,
          .order-phone,
          .order-delivery-time,
          .order-mobile-meta,
          .order-extra-bar,
          .detail-item-list {
            font-size: 0.78rem !important;
          }
          .order-right-meta {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
            gap: 10px !important;
          }
          .order-price {
            font-size: 1rem !important;
          }
          .detail-card {
            padding: 12px !important;
          }
          .detail-status-line {
            flex-direction: column;
            align-items: flex-start;
          }
          .detail-card-chip {
            font-size: 0.66rem !important;
          }
        }

        /* Mode Switcher & Responsive Utilities */
        .desktop-only {
          display: flex !important;
        }
        .mobile-only {
          display: none !important;
        }

        @media (max-width: 1024px) {
          .desktop-only {
            display: none !important;
          }
          .mobile-only {
            display: block !important;
          }
        }

        .mode-switcher-container {
          display: flex;
          background: #fdf5f6;
          margin: 15px 20px;
          border-radius: 50px;
          padding: 4px;
          flex-shrink: 0;
          border: 1px solid rgba(219, 138, 158, 0.1);
        }

        @media (min-width: 1024px) {
          .mode-switcher-container {
            max-width: 1200px;
            margin: 20px auto 30px;
            width: calc(100% - 40px);
          }
        }

        .mode-btn {
          flex: 1;
          border: none;
          background: none;
          padding: 10px;
          border-radius: 50px;
          font-weight: 600;
          font-size: 0.85rem;
          color: #a08a8e;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .mode-btn.active {
          color: #fff;
          background: #db8a9e;
          box-shadow: 0 4px 12px rgba(219, 138, 158, 0.3);
        }

        /* Custom Mobile Dropdown Styling */
        .mode-dropdown-container {
          position: relative;
          margin: 10px 0 20px 0;
          width: 100%;
          z-index: 105;
        }

        .mode-dropdown-trigger {
          width: 100%;
          background: #fff;
          border: 1.5px solid rgba(219, 138, 158, 0.15);
          padding: 12px 18px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(219, 138, 158, 0.03);
          transition: all 0.25s ease;
        }

        .mode-dropdown-trigger:hover, 
        .mode-dropdown-trigger:active {
          border-color: #db8a9e;
          background: #fffcfd;
          box-shadow: 0 6px 18px rgba(219, 138, 158, 0.08);
        }

        .dropdown-trigger-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .dropdown-trigger-icon {
          font-size: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .dropdown-trigger-text {
          font-weight: 700;
          font-size: 0.92rem;
          color: #5c4738;
          font-family: 'Noto Sans Thai', sans-serif;
        }

        .dropdown-trigger-arrow {
          color: #db8a9e;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .dropdown-trigger-arrow.open {
          transform: rotate(180deg);
        }

        /* Dropdown Overlay for clicking outside to close */
        .dropdown-overlay {
          position: fixed;
          inset: 0;
          background: transparent;
          z-index: 108;
        }

        /* Dropdown Menu styling */
        .mode-dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1.5px solid rgba(219, 138, 158, 0.18);
          border-radius: 20px;
          box-shadow: 0 12px 35px rgba(219, 138, 158, 0.12);
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          z-index: 109;
          animation: slideDropdownIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideDropdownIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .dropdown-item {
          width: 100%;
          border: none;
          background: none;
          padding: 12px 16px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .dropdown-item:hover {
          background: #fff5f6;
        }

        .dropdown-item.active {
          background: #db8a9e;
          color: #fff !important;
        }

        .dropdown-item.active .item-text {
          color: #fff !important;
          font-weight: 700;
        }

        .dropdown-item.active .item-icon {
          transform: scale(1.1);
        }

        .item-icon {
          font-size: 1.2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        }

        .item-text {
          font-weight: 600;
          font-size: 0.88rem;
          color: #5c4738;
          font-family: 'Noto Sans Thai', sans-serif;
        }

        .dropdown-divider {
          height: 1.5px;
          background: rgba(219, 138, 158, 0.1);
          margin: 6px 8px;
        }

        /* Florist Board styling */
        .florist-board {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 15px;
        }

        .florist-card {
          background: #fff;
          border-radius: 18px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          box-shadow: 0 8px 22px rgba(80, 50, 57, 0.04);
          border: 1px solid rgba(219, 138, 158, 0.1);
          position: relative;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @media (min-width: 1024px) {
          .florist-card {
            padding: 18px;
            gap: 12px;
          }
        }

        .florist-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(219, 138, 158, 0.08);
          border-color: rgba(219, 138, 158, 0.25);
        }

        .florist-img-container {
          width: 84px;
          height: 84px;
          background: #fdf5f6;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          flex-shrink: 0;
          border: 1px solid rgba(219, 138, 158, 0.1);
        }

        .florist-img-container svg {
          width: 54px !important;
          height: 54px !important;
        }

        @media (min-width: 1024px) {
          .florist-img-container {
            width: 100px !important;
            height: 100px !important;
            border-radius: 20px;
            font-size: 2.3rem;
          }
          .florist-img-container svg {
            width: 64px !important;
            height: 64px !important;
          }
        }

        .florist-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .florist-header {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 2px 0 4px;
          border-bottom: 1px solid #f7e8ed;
        }

        .florist-header-main {
          display: grid;
          grid-template-columns: 84px minmax(0, 1fr);
          gap: 32px;
          align-items: center;
        }

        .florist-topbar2 {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 8px;
        }

        .florist-title-block {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }

        .florist-meta-row {
          display: flex;
          justify-content: flex-end;
        }

        .florist-meta-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          justify-content: flex-end;
        }

        .florist-meta-chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 4px 8px;
          border-radius: 999px;
          background: #fff4f7;
          color: #d46f92;
          font-size: 0.68rem;
          font-weight: 700;
          white-space: nowrap;
          border: 1px solid rgba(219, 138, 158, 0.12);
        }

        .florist-meta-chip.strong {
          background: linear-gradient(135deg, #e05c7a, #ff8a9e);
          color: #fff;
          border-color: transparent;
          box-shadow: 0 6px 12px rgba(224, 92, 122, 0.18);
        }

        .florist-summary-strip {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 10px;
        }

        .florist-summary-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
          padding: 6px 10px;
          border-radius: 12px;
          background: #fffafb;
          border: 1px solid #f6e5ea;
          color: #826a73;
          font-size: 0.74rem;
          font-weight: 600;
        }

        .florist-summary-pill strong {
          color: #5c4738;
          font-weight: 700;
        }

        .florist-item-name {
          font-weight: 700;
          font-size: 0.92rem;
          color: #4f3c44;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          line-height: 1.4;
        }

        .florist-badge {
          font-size: .68rem;
          color: #db8a9e;
          background: #fdf5f6;
          padding: 2px 8px;
          border-radius: 6px;
          font-weight: 600;
        }

        .florist-details-box {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          background: #fffdfd;
          padding: 12px;
          border-radius: 14px;
          margin-top: 10px;
          border: none;
          font-size: 0.8rem;
          color: #5c4738;
          text-align: left;
          width: 100%;
        }

        @media (min-width: 1024px) {
          .florist-details-box {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
            padding: 12px;
            margin-top: 10px;
            font-size: 0.8rem;
          }
        }

        .florist-detail-card {
          background: #fff8fa;
          border: 1px solid #f8e6ec;
          border-radius: 12px;
          padding: 10px;
          min-width: 0;
        }

        .florist-details-box .detail-group-title {
          font-weight: 700;
          color: #c9708d;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
        }

        .florist-details-box .detail-item-list {
          margin: 0;
          padding: 0;
          color: #7a6352;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .florist-details-box .detail-item-list li {
          margin-bottom: 0;
          line-height: 1.45;
          word-break: break-word;
        }

        .florist-bottom-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 0;
          width: 100%;
          padding-top: 10px;
          border-top: 1px dashed #f3e0e6;
        }

        .florist-price-label {
          color: #db8a9e;
          font-weight: 800;
          font-size: 1.02rem;
        }

        @media (min-width: 1024px) {
          .florist-price-label {
            font-size: 1.12rem !important;
          }
        }

        .florist-done-btn {
          border: none;
          background: #db8a9e;
          color: #fff;
          padding: 9px 14px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          box-shadow: 0 6px 14px rgba(219, 138, 158, 0.18);
          line-height: 1.4;
        }

        .florist-done-btn:hover {
          background: #c27588;
          transform: scale(1.04) translateY(-1px);
          box-shadow: 0 6px 16px rgba(219, 138, 158, 0.3);
        }

        .florist-done-btn:active {
          transform: scale(0.98);
        }

        .florist-empty-note {
          color: #9a848b;
          font-size: 0.78rem;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .florist-card {
            gap: 10px !important;
            padding: 12px !important;
          }
          .florist-header-main {
            grid-template-columns: 72px minmax(0, 1fr) !important;
            gap: 16px !important;
          }
          .florist-img-container {
            width: 72px !important;
            height: 72px !important;
            border-radius: 16px !important;
          }
          .florist-img-container svg {
            width: 46px !important;
            height: 46px !important;
          }
          .florist-topbar {
            flex-direction: row !important;
            align-items: flex-start !important;
            justify-content: space-between !important;
            gap: 10px !important;
          }
          .florist-title-block {
            flex: 1;
          }
          .florist-meta-chips {
            justify-content: flex-end !important;
            align-items: flex-start;
            flex-shrink: 0;
          }
          .florist-badge {
            display: none !important;
          }
          .florist-details-box {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
            padding: 10px !important;
          }
          .florist-detail-card {
            padding: 9px !important;
          }
          .florist-bottom-row {
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
          }
          .florist-done-btn {
            width: auto;
          }
          .florist-summary-strip {
            gap: 6px !important;
          }
          .florist-summary-pill.recipient {
            flex-basis: 100%;
          }
          .florist-summary-pill.time,
          .florist-summary-pill.total {
            flex: 1 1 calc(50% - 4px);
          }
        }

        @media (max-width: 480px) {
          .florist-header-main {
            grid-template-columns: 64px minmax(0, 1fr) !important;
            align-items: center !important;
            gap: 12px !important;
          }
          .florist-img-container {
            width: 64px !important;
            height: 64px !important;
          }
          .florist-item-name {
            font-size: 0.86rem !important;
          }
          .florist-summary-strip {
            gap: 6px !important;
          }
          .florist-summary-pill,
          .florist-meta-chip {
            font-size: 0.66rem !important;
          }
          .florist-details-box {
            margin-top: 8px !important;
          }
          .florist-price-label {
            font-size: 0.96rem !important;
          }
          .florist-done-btn {
            padding: 10px 12px !important;
            font-size: 0.76rem !important;
          }
        }

        .color-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          display: inline-block;
          border: 1px solid rgba(0,0,0,0.1);
        }

        /* Finance Section Styling */
        .finance-section {
          animation: fadeIn 0.4s ease-out;
        }

        .finance-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 30px;
          margin-top: 25px;
        }

        @media (min-width: 1024px) {
          .finance-grid {
            grid-template-columns: 380px 1fr;
          }
        }

        /* Profit & Loss summary cards */
        .finance-summary {
          margin-bottom: 30px;
        }

        @media (max-width: 1024px) {
          .finance-summary {
            margin-bottom: 24px !important;
          }
          .fin-card {
            padding: 16px 12px !important;
            gap: 12px !important;
            border-radius: 16px !important;
          }
          .fin-icon-container {
            width: 44px !important;
            height: 44px !important;
            font-size: 1.4rem !important;
            border-radius: 12px !important;
          }
          .fin-value {
            font-size: 1.15rem !important;
          }
          .fin-label {
            font-size: 0.74rem !important;
          }
        }

        /* iPad (Tablet) specific overrides for stats and split cards */
        @media (min-width: 768px) and (max-width: 1024px) {
          /* 1. Main Profit & Loss Summary Cards layout */
          .stats-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 12px !important;
            margin-bottom: 24px !important;
          }
          .stat-card {
            padding: 14px 10px !important;
            gap: 10px !important;
            border-radius: 16px !important;
          }
          .stat-label {
            font-size: 0.76rem !important;
          }
          .stat-value {
            font-size: 1.35rem !important;
          }
          .stat-detail {
            font-size: 0.72rem !important;
            line-height: 1.3 !important;
          }
          .stat-ring {
            --size: 60px !important;
            --thickness: 5px !important;
          }
          .stat-ring-label {
            font-size: 0.74rem !important;
          }

          /* 2. Salary Allocation Cards layout */
          .salary-sharing-card {
            padding: 18px !important;
            border-radius: 20px !important;
          }
          .split-cards-grid {
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 10px !important;
          }
          .split-card {
            padding: 12px 10px !important;
            border-radius: 16px !important;
            gap: 8px !important;
          }
          .card-badge {
            font-size: 0.68rem !important;
            padding: 3px 6px !important;
          }
          .split-label {
            font-size: 0.72rem !important;
          }
          .split-value {
            font-size: 1.1rem !important;
          }
          .profile-body {
            gap: 8px !important;
          }
          .profile-avatar {
            width: 36px !important;
            height: 36px !important;
            font-size: 1.15rem !important;
            border-radius: 10px !important;
          }
          .profile-role {
            font-size: 0.68rem !important;
          }
          .profile-salary {
            font-size: 1.1rem !important;
          }
        }

        .fin-card {
          background: #fff;
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.02);
          border: 1px solid rgba(219, 138, 158, 0.08);
          display: flex;
          align-items: center;
          gap: 20px;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .fin-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 35px rgba(219, 138, 158, 0.08);
        }

        .fin-icon-container {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          flex-shrink: 0;
        }

        .fin-card.revenue .fin-icon-container {
          background: #fdf5f6;
          color: #db8a9e;
        }

        .fin-card.expense .fin-icon-container {
          background: #fdf8f5;
          color: #d35400;
        }

        .fin-card.profit .fin-icon-container {
          background: #eafaf1;
          color: #2ecc71;
        }

        .fin-card.loss .fin-icon-container {
          background: #fdedec;
          color: #e74c3c;
        }

        .fin-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .fin-label {
          font-size: 0.86rem;
          color: #a08a8e;
          font-weight: 500;
        }

        .fin-value {
          font-size: 1.6rem;
          font-weight: 800;
          color: #5c4738;
        }

        .fin-card.profit {
          background: linear-gradient(135deg, #fff 0%, #f4fdf8 100%);
          border-color: rgba(46, 204, 113, 0.2);
          box-shadow: 0 10px 30px rgba(46, 204, 113, 0.06);
        }

        .fin-card.loss {
          background: linear-gradient(135deg, #fff 0%, #fdf5f5 100%);
          border-color: rgba(231, 76, 60, 0.2);
          box-shadow: 0 10px 30px rgba(231, 76, 60, 0.06);
        }

        .monthly-filter-bar {
          background: #fff;
          border-radius: 20px;
          padding: 16px 24px;
          border: 1px solid rgba(219, 138, 158, 0.1);
          box-shadow: 0 4px 15px rgba(219, 138, 158, 0.02);
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 25px;
        }

        @media (min-width: 768px) {
          .monthly-filter-bar {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .month-select-label {
          font-weight: 700;
          font-size: 0.95rem;
          color: #5c4738;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .month-pill-container {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 4px;
          scrollbar-width: thin;
        }

        .month-pill-container::-webkit-scrollbar {
          height: 4px;
        }
        .month-pill-container::-webkit-scrollbar-thumb {
          background-color: #f2e2e5;
          border-radius: 10px;
        }

        .month-pill-btn {
          border: 1.5px solid #f2e2e5;
          background: #fff;
          color: #a08a8e;
          padding: 8px 18px;
          border-radius: 50px;
          font-weight: 700;
          font-size: 0.88rem;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .month-pill-btn:hover {
          border-color: #db8a9e;
          color: #db8a9e;
          background: #fffafb;
          transform: translateY(-1px);
        }

        .month-pill-btn.active {
          border-color: #db8a9e;
          background: #db8a9e;
          color: #fff;
          box-shadow: 0 4px 12px rgba(219, 138, 158, 0.25);
        }

        /* Form styling */
        .finance-form-card {
          background: #fff;
          border-radius: 24px;
          padding: 24px;
          border: 1px solid rgba(219, 138, 158, 0.1);
          box-shadow: 0 10px 30px rgba(0,0,0,0.02);
          height: fit-content;
        }

        .ai-receipt-card {
          background: #fffafb;
          border: 1.5px dashed #f2e2e5;
          border-radius: 18px;
          padding: 16px;
          margin-bottom: 18px;
        }

        .ai-receipt-title {
          font-weight: 700;
          color: #5c4738;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }

        .ai-receipt-subtitle {
          color: #a08a8e;
          font-size: 0.8rem;
          margin: 0 0 12px 0;
        }

        .ai-receipt-input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
        }

        .ai-file-control {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fff;
          border: 1.5px solid #f2e2e5;
          border-radius: 14px;
          padding: 10px 12px;
          position: relative;
          overflow: hidden;
          transition: all 0.2s;
        }

        .ai-file-control:hover {
          border-color: #db8a9e;
          box-shadow: 0 6px 16px rgba(219, 138, 158, 0.08);
          background: #fffafb;
        }

        .ai-file-button {
          background: #fdf0f2;
          color: #db8a9e;
          border-radius: 10px;
          padding: 8px 12px;
          font-weight: 700;
          font-size: 0.82rem;
          white-space: nowrap;
        }

        .ai-file-name {
          color: #7a6352;
          font-size: 0.82rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }

        .ai-file-hint {
          color: #a08a8e;
          font-size: 0.72rem;
        }

        .ai-file-stack {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .ai-receipt-preview {
          width: 100%;
          border-radius: 14px;
          border: 1px solid #f2e2e5;
          margin-top: 12px;
          display: block;
          max-height: 240px;
          object-fit: cover;
        }

        .ai-receipt-actions {
          display: flex;
          gap: 10px;
          margin-top: 12px;
        }

        .ai-receipt-actions .submit-btn {
          width: auto;
          margin-top: 0;
          flex: 1;
        }

        .ghost-btn {
          flex: 1;
          background: #fff;
          color: #db8a9e;
          border: 1.5px solid #f2e2e5;
          padding: 12px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ghost-btn:hover {
          border-color: #db8a9e;
          background: #fff5f7;
        }

        .ai-error-text {
          margin-top: 10px;
          color: #e74c3c;
          font-size: 0.82rem;
          font-weight: 600;
        }

        .form-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: #5c4738;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid #fdf5f6;
          padding-bottom: 12px;
        }

        .form-group {
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .expense-item-card {
          border: 1px solid #f2e2e5;
          border-radius: 16px;
          padding: 14px;
          margin-bottom: 12px;
          background: #fff;
        }

        .expense-item-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .expense-item-subgrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .expense-item-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 10px;
        }

        .add-row-btn {
          background: #fff;
          color: #db8a9e;
          border: 1.5px dashed #f2e2e5;
          padding: 10px 14px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
          margin-top: 8px;
        }

        .add-row-btn:hover {
          border-color: #db8a9e;
          background: #fff5f7;
        }

        .remove-row-btn {
          background: #fdedec;
          color: #e74c3c;
          border: none;
          padding: 6px 12px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.78rem;
          cursor: pointer;
        }

        @media (max-width: 767px) {
          .expense-item-grid,
          .expense-item-subgrid {
            grid-template-columns: 1fr;
          }
        }

        .form-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #7a6352;
        }

        .form-input, .form-select {
          width: 100%;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1.5px solid #f2e2e5;
          font-size: 0.9rem;
          color: #5c4738;
          background: #fff;
          outline: none;
          transition: all 0.2s;
        }

        .form-input:focus, .form-select:focus {
          border-color: #db8a9e;
          box-shadow: 0 0 0 4px rgba(219, 138, 158, 0.1);
          background: #fffdfd;
        }

        /* Custom dropdown styles */
        .custom-select-container {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .custom-select {
          appearance: none !important;
          -webkit-appearance: none !important;
          -moz-appearance: none !important;
          padding-right: 45px !important;
          width: 100%;
          cursor: pointer;
        }

        .custom-select-icon {
          position: absolute;
          right: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .custom-select:focus + .custom-select-icon {
          transform: rotate(180deg);
        }

        /* Custom date picker styles */
        .custom-date-container {
          position: relative;
          display: flex;
          align-items: stretch;
          width: 100%;
          border-radius: 12px;
          border: 1.5px solid #f2e2e5;
          background: #fff;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .custom-date-container:focus-within {
          border-color: #db8a9e;
          box-shadow: 0 0 0 4px rgba(219, 138, 158, 0.1);
        }

        .custom-date-input {
          border: none !important;
          background: transparent !important;
          flex: 1;
          padding: 12px 16px;
          color: #5c4738;
          font-size: 0.9rem;
          outline: none;
          position: relative;
        }

        /* Hide Chromium native indicator icon but keep it clickable over the entire input */
        .custom-date-input::-webkit-calendar-picker-indicator {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: auto;
          height: auto;
          background: transparent;
          color: transparent;
          cursor: pointer;
        }

        .custom-date-icon-box {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          background: #fff5f6;
          border-left: 1.5px solid #f2e2e5;
          pointer-events: none; /* so click passes through to the input */
          transition: all 0.2s ease;
        }

        .custom-date-container:focus-within .custom-date-icon-box {
          border-left-color: #db8a9e;
          background: #ffebeb;
        }

        .submit-btn {
          width: 100%;
          background: #db8a9e;
          color: #fff;
          border: none;
          padding: 14px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 15px rgba(219, 138, 158, 0.2);
          margin-top: 10px;
        }

        .submit-btn:hover {
          background: #c27588;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(219, 138, 158, 0.3);
        }

        .submit-btn:active {
          transform: translateY(1px);
        }

        .submit-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
          box-shadow: none;
        }

        /* Ledger table styling */
        .ledger-card {
          background: #fff;
          border-radius: 24px;
          padding: 24px;
          border: 1px solid rgba(219, 138, 158, 0.1);
          box-shadow: 0 10px 30px rgba(0,0,0,0.02);
        }

        .ledger-table-container {
          overflow-x: auto;
          margin-top: 15px;
        }

        .ledger-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.88rem;
        }

        .ledger-table th {
          background: #fff9fa;
          color: #db8a9e;
          font-weight: 700;
          padding: 14px 16px;
          border-bottom: 1.5px solid #fdf5f6;
        }

        .ledger-table td {
          padding: 14px 16px;
          border-bottom: 1px solid #fdf5f6;
          color: #5c4738;
          vertical-align: middle;
        }

        .ledger-row-item:hover {
          background: #fffcfd;
        }

        .fin-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 10px;
          font-size: 0.76rem;
          font-weight: 700;
          white-space: nowrap;
        }

        .fin-badge.revenue {
          background: #eafaf1;
          color: #2ecc71;
        }

        .fin-badge.income {
          background: #eafaf1;
          color: #2ecc71;
          padding: 4px 13px;
        }

        .fin-badge.expense {
          background: #fdedec;
          color: #e74c3c;
        }

        .amount-text {
          font-weight: 750;
          font-size: 0.95rem;
        }

        .amount-text.revenue {
          color: #2ecc71;
        }

        .amount-text.expense {
          color: #e74c3c;
        }

        .delete-btn-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background: #fdf5f6;
          color: #e74c3c;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .delete-btn-circle:hover {
          background: #fdedec;
          transform: scale(1.08);
        }

        /* Salary & Profit Allocation Card Styles */
        .salary-sharing-card {
          background: #fff;
          border-radius: 24px;
          padding: 24px;
          border: 1px solid rgba(219, 138, 158, 0.1);
          box-shadow: 0 10px 30px rgba(0,0,0,0.02);
          margin-bottom: 30px;
          animation: fadeIn 0.4s ease-out;
        }

        .sharing-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: #5c4738;
          margin: 0 0 6px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sharing-subtitle {
          color: #a08a8e;
          font-size: 0.85rem;
          margin: 0 0 20px 0;
        }

        .sharing-empty-state {
          text-align: center;
          padding: 30px 20px;
          background: #fffcfd;
          border: 1px dashed #f2e2e5;
          border-radius: 16px;
          color: #a08a8e;
        }

        .sharing-empty-state span {
          font-size: 2rem;
          display: block;
          margin-bottom: 10px;
        }

        .sharing-empty-state p {
          margin: 0;
          font-size: 0.88rem;
        }

        /* Allocation Bar Styles */
        .allocation-bar-wrapper {
          margin-bottom: 25px;
        }

        .allocation-bar {
          display: flex;
          height: 36px;
          border-radius: 50px;
          overflow: hidden;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.03);
          background: #fdf5f6;
          border: 1.5px solid #f2e2e5;
        }

        .bar-segment {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 0.82rem;
          font-weight: 700;
          text-shadow: 0 1px 2px rgba(0,0,0,0.15);
          transition: all 0.3s ease;
        }

        .segment-materials {
          background: linear-gradient(135deg, #a0c4ff 0%, #70a1ff 100%);
        }

        .segment-savings {
          background: linear-gradient(135deg, #b8e994 0%, #78e08f 100%);
        }

        .segment-admin1 {
          background: linear-gradient(135deg, #ffb8b8 0%, #ff8a8a 100%);
        }

        .segment-admin2 {
          background: linear-gradient(135deg, #ffd3b6 0%, #ffad90 100%);
        }

        .bar-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-top: 12px;
          justify-content: center;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          color: #7a6352;
        }

        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          display: inline-block;
        }

        .dot-materials { background: #70a1ff; }
        .dot-savings { background: #78e08f; }
        .dot-admin1 { background: #ff8a8a; }
        .dot-admin2 { background: #ffad90; }

        /* Split Cards Grid */
        .split-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 18px;
        }

        .split-card {
          background: #fff;
          border-radius: 20px;
          padding: 18px;
          border: 1px solid rgba(219, 138, 158, 0.08);
          box-shadow: 0 4px 15px rgba(0,0,0,0.01);
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .split-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(219, 138, 158, 0.05);
        }

        .card-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .card-badge {
          font-size: 0.72rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 50px;
        }

        .badge-purchasing {
          background: #eef5ff;
          color: #4a90e2;
        }

        .badge-savings {
          background: #f0fff4;
          color: #2ecc71;
        }

        .badge-admin1 {
          background: #fff0f0;
          color: #ff5e5e;
        }

        .badge-admin2 {
          background: #fff7f2;
          color: #ff9f43;
        }

        .split-label {
          font-size: 0.8rem;
          color: #a08a8e;
          display: block;
          margin-bottom: 2px;
        }

        .split-value {
          font-size: 1.25rem;
          font-weight: 800;
          color: #5c4738;
        }

        /* Profile Cards Styles */
        .profile-body {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .profile-avatar {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #fdf5f6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.35rem;
          border: 1px solid #f2e2e5;
        }

        .profile-info {
          display: flex;
          flex-direction: column;
        }

        .profile-role {
          font-size: 0.76rem;
          color: #a08a8e;
          font-weight: 500;
        }

        .profile-salary {
          font-size: 1.2rem;
          font-weight: 850;
          color: #5c4738;
          margin-top: 1px;
        }

        /* Mobile-first Responsive Adjustments for Finance Panel */
        @media (max-width: 767px) {
          /* 1. Header & Title adjustments */
          .finance-section .dashboard-title {
            text-align: left !important;
          }
          .finance-section .dashboard-subtitle {
            font-size: 0.8rem !important;
            text-align: left !important;
          }
          .finance-section .dashboard-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            text-align: left !important;
            gap: 12px;
          }
          .finance-section .header-date-chip {
            width: auto !important;
            text-align: left !important;
            font-size: 0.82rem !important;
            padding: 6px 12px !important;
          }

          /* 2. Monthly Filter Pills Scrollbar & Sizing */
          .monthly-filter-bar {
            padding: 12px 14px !important;
            border-radius: 16px !important;
            gap: 8px !important;
          }
          .month-select-label {
            font-size: 0.82rem !important;
            justify-content: center;
          }
          .month-pill-btn {
            padding: 6px 14px !important;
            font-size: 0.78rem !important;
          }

          /* 3. Summary P&L Cards Mobile optimization */
          .finance-summary {
            margin-bottom: 20px !important;
          }
          .fin-card {
            padding: 16px !important;
            border-radius: 16px !important;
            gap: 12px !important;
          }
          .fin-icon-container {
            width: 44px !important;
            height: 44px !important;
            font-size: 1.4rem !important;
            border-radius: 12px !important;
          }
          .fin-value {
            font-size: 1.25rem !important;
          }
          .fin-label {
            font-size: 0.78rem !important;
          }

          /* 4. Grids & Form Card padding reductions */
          .finance-grid {
            gap: 20px !important;
          }
          .finance-form-card {
            padding: 16px !important;
            border-radius: 20px !important;
          }
          .form-title {
            font-size: 1rem !important;
            margin-bottom: 14px !important;
            padding-bottom: 8px !important;
          }
          .submit-btn {
            padding: 12px !important;
            font-size: 0.9rem !important;
            border-radius: 12px !important;
          }

          /* 5. Ledger Timeline Card layout on Mobile instead of traditional Table */
          .ledger-card {
            padding: 16px !important;
            border-radius: 20px !important;
          }
          .ledger-card .form-title {
            font-size: 1rem !important;
          }
          
          /* Hide traditional table header */
          .ledger-table thead {
            display: none !important;
          }
          
          /* Convert traditional table elements into flexible block containers */
          .ledger-table, 
          .ledger-table tbody, 
          .ledger-table tr, 
          .ledger-table td {
            display: block !important;
            width: 100% !important;
            box-sizing: border-box;
          }
          
          /* Transform each table row into an elegant modern transaction card */
          .ledger-table tr.ledger-row-item {
            background: #fffcfd !important;
            border: 1.5px solid #fff2f4 !important;
            border-radius: 16px !important;
            margin-bottom: 12px !important;
            padding: 14px 14px 10px 14px !important;
            box-shadow: 0 4px 10px rgba(219, 138, 158, 0.02) !important;
            position: relative !important;
            transition: all 0.2s ease;
          }
          
          .ledger-table tr.ledger-row-item:active {
            transform: scale(0.99);
            border-color: #f7d6de !important;
          }

          .ledger-table td {
            padding: 4px 0 !important;
            border-bottom: none !important;
            background: transparent !important;
          }

          /* Card Date Header */
          .ledger-table td:nth-child(1) {
            font-size: 0.8rem !important;
            color: #a08a8e !important;
            font-weight: 700 !important;
            border-bottom: 1px dashed #fdf5f6 !important;
            padding-bottom: 6px !important;
            margin-bottom: 6px !important;
            display: block !important;
          }

          /* Type Badge inline placement */
          .ledger-table td:nth-child(2) {
            display: inline-flex !important;
            width: auto !important;
            margin-right: 8px !important;
          }

          /* Item Description / Details text block */
          .ledger-table td:nth-child(3) {
            display: block !important;
            font-size: 0.85rem !important;
            color: #5c4738 !important;
            margin: 6px 0 8px 0 !important;
            line-height: 1.4 !important;
          }

          /* Highlighted Bottom Amount */
          .ledger-table td:nth-child(4) {
            display: flex !important;
            justify-content: flex-end !important;
            align-items: center !important;
            font-size: 1.05rem !important;
            font-weight: 800 !important;
            border-top: 1px dashed #fdf5f6 !important;
            padding-top: 8px !important;
            margin-top: 6px !important;
          }

          /* Action Delete button absolutely floated in top-right of Card */
          .ledger-table td:nth-child(5) {
            position: absolute !important;
            top: 12px !important;
            right: 12px !important;
            width: auto !important;
            height: auto !important;
            padding: 0 !important;
            display: block !important;
          }
          
          .ledger-table td:nth-child(6) span {
            font-size: 0.72rem !important;
            color: #c0a9ad !important;
            background: #fdf5f6;
            padding: 3px 8px;
            border-radius: 20px;
          }
          
            .delete-btn-circle {
              width: 28px !important;
              height: 28px !important;
              font-size: 0.75rem !important;
            }

            /* Responsive overrides for Salary Allocation Card on Mobile */
            .salary-sharing-card {
              padding: 16px !important;
              border-radius: 20px !important;
              margin-bottom: 20px !important;
            }
            .sharing-title {
              font-size: 1rem !important;
            }
            .sharing-subtitle {
              font-size: 0.78rem !important;
            }
            .allocation-bar {
              height: 28px !important;
            }
            .bar-segment {
              font-size: 0.74rem !important;
            }
            .bar-legend {
              gap: 10px !important;
            }
            .legend-item {
              font-size: 0.75rem !important;
            }
            .split-cards-grid {
              grid-template-columns: 1fr !important;
              gap: 12px !important;
            }
            .split-card {
              padding: 14px !important;
              border-radius: 16px !important;
            }
            .split-value {
              font-size: 1.15rem !important;
            }
            .profile-salary {
              font-size: 1.1rem !important;
            }
          }
      `}</style>

      <div className="dashboard-container">
        {adminViewMode !== 'finance' && adminViewMode !== 'florist' ? (
          <div className="dashboard-header">
            <div className="dashboard-title-block">
              <span className="dashboard-chip">Admin Overview</span>
              <h1 className="dashboard-title">{viewTitleMap[adminViewMode]}</h1>
              <p className="dashboard-subtitle">{viewSubtitleMap[adminViewMode]}</p>
            </div>

            <div className="dashboard-header-actions">
              <button className="header-icon-btn" type="button" aria-label="Notifications">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
                  <path d="M9 17a3 3 0 0 0 6 0" />
                </svg>
                {notificationCount > 0 ? <span className="header-icon-badge">{notificationLabel}</span> : null}
              </button>

              <div className="header-date-chip">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 2v4" />
                  <path d="M16 2v4" />
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M3 10h18" />
                </svg>
                <span>{todayLabel}</span>
              </div>
            </div>
          </div>
        ) : null}

        {adminViewMode === 'manager' && (
          <>
            <div className="stats-grid">
              {overviewCards.map((card) => (
                <div key={card.key} className={`stat-card ${card.cardClass}`}>
                  <div className="stat-info">
                    <span className="stat-label">
                      {card.label}
                      {card.key === 'active-users' ? <span className="live-dot"></span> : null}
                    </span>
                    <span className="stat-value">{card.value}</span>
                    <span className="stat-detail" style={{ color: card.accent }}>
                      <span>{card.detailPrefix}</span>
                      <span>{card.detail}</span>
                    </span>
                  </div>
                  <div
                    className="stat-ring"
                    style={{ ['--accent' as any]: card.accent, ['--p' as any]: card.progressPct } as React.CSSProperties}
                    aria-hidden="true"
                  >
                    <span className="stat-ring-label">
                      {card.ringPrefix}
                      {card.ringLabelPct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Tabs Filter */}
            <div className="tabs-filter">
              <button className={`tab-btn ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>
                ทั้งหมด ({orders.length})
              </button>
              <button className={`tab-btn ${activeFilter === 'pending_verification' ? 'active' : ''}`} onClick={() => setActiveFilter('pending_verification')}>
                รอตรวจเงิน ({pendingCount})
              </button>
              <button className={`tab-btn ${activeFilter === 'preparing' ? 'active' : ''}`} onClick={() => setActiveFilter('preparing')}>
                กำลังจัดทำ ({preparingCount})
              </button>
              <button className={`tab-btn ${activeFilter === 'shipping' ? 'active' : ''}`} onClick={() => setActiveFilter('shipping')}>
                กำลังจัดส่ง ({orders.filter(o => o.status === 'shipping').length})
              </button>
              <button className={`tab-btn ${activeFilter === 'completed' ? 'active' : ''}`} onClick={() => setActiveFilter('completed')}>
                สำเร็จแล้ว ({completedCount})
              </button>
              <button className={`tab-btn ${activeFilter === 'cancelled' ? 'active' : ''}`} onClick={() => setActiveFilter('cancelled')}>
                ยกเลิก ({orders.filter(o => o.status === 'cancelled').length})
              </button>
            </div>

            {/* Live Orders Box */}
            <div className="orders-section">
              <div className="section-header">
                <div>
                  <h2>คำสั่งซื้อแบบเรียลไทม์</h2>
                  <p className="section-subtitle">คลิกที่รายการเพื่อดูรายละเอียดและอัปเดตสถานะ</p>
                </div>
                <div className="orders-header-actions">
                  <label className="orders-search" aria-label="ค้นหาชื่อผู้รับ">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      className="orders-search-input"
                      type="search"
                      placeholder="ค้นหาด้วยชื่อ หรือ ID"
                      value={recipientSearch}
                      onChange={(e) => setRecipientSearch(e.target.value)}
                    />
                  </label>
                  <span className="order-count-badge">แสดง {filteredOrders.length} รายการ</span>
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="empty-orders">
                  <div className="empty-orders-icon">
                    <img src="/images/Empty State Icon.png" alt="Empty State" style={{ width: '120px', height: 'auto', display: 'block', margin: '0 auto' }} />
                  </div>
                  <p>ไม่มีคำสั่งซื้อที่อยู่ในสถานะนี้</p>
                </div>
              ) : (
                <div className="orders-list">
                  {filteredOrders.map((order) => {
                    const status = getStatusLabel(order.status);
                    const isExpanded = expandedOrder === order.id;
                    const customItem = order.items?.find((i: any) => i.config) || order.items?.[0];
                    const primaryItem = order.items?.[0];
                    const customerName = customItem?.config?.customerName || 'ไม่ระบุ';
                    const customerPhone = customItem?.config?.customerPhone || '-';
                    const deliveryDate = customItem?.config?.deliveryDate || formatOrderDate(order.createdAt);
                    const deliveryTime = customItem?.config?.deliveryTime ? `${customItem.config.deliveryTime} น.` : 'ไม่ระบุเวลา';
                    const customerAddress = customItem?.config?.customerAddress || 'จัดส่งตามที่อยู่ร้าน / หรือระบุทีหลัง';
                    const additionalNote = customItem?.config?.additionalNote?.trim?.() || '';
                    const hasCustomDelivery = order.items?.some((i: any) => i.config);
                    const itemColors = customItem?.config?.selectedColors?.length
                      ? customItem.config.selectedColors.map((id: string) => getRoseColorHex(id))
                      : ['#F48FB1'];
                    // Logic for displaying product images (same as cart page)
                    const isDefaultRibbonImage = customItem?.coverImage && customItem.coverImage.includes('ริบบิ้นแดง.jpg');
                    const isPreset = customItem?.isPreset === true;
                    const isCustomId = customItem?.id && customItem.id.startsWith('custom_');
                    const shouldShowCoverImage = isPreset || (!isCustomId && customItem?.coverImage && !isDefaultRibbonImage);

                    return (
                      <div
                        key={order.id}
                        className="order-row"
                        onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      >
                      <div className="order-summary-row">
                        <div className="order-main-info order-cell-order">
                          <div className="order-avatar">
                            {shouldShowCoverImage ? (
                              <img src={customItem.coverImage} alt={customItem.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                            ) : (
                              <BasketIcon colors={itemColors} size={40} />
                            )}
                          </div>
                          <div className="order-meta">
                            <span className="order-id">{primaryItem?.name || 'คำสั่งซื้อ'}</span>
                            <span className="order-date">#{String(order.id).slice(0, 8).toUpperCase()}</span>
                          </div>
                        </div>

                        <div className="order-middle-meta">
                          <span className="order-customer">{customerName}</span>
                          <span className="order-phone">{customerPhone}</span>
                        </div>

                        <div className="order-delivery-meta">
                          <span className="order-delivery-date">{deliveryDate}</span>
                          <span className="order-delivery-time">{deliveryTime}</span>
                        </div>

                        <div className="order-right-meta">
                          <span className="status-badge" style={{ color: status.color, background: status.bg }}>
                            {status.label}
                          </span>
                          <span className="order-price">{order.total?.toLocaleString() || 0} ฿</span>
                        </div>

                        <div className={`order-expand-indicator ${isExpanded ? 'open' : ''}`}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </div>
                      </div>

                      <div className="order-mobile-meta">
                        <span>สถานะ: {status.label}</span>
                        <span>ยอดรวม {order.total?.toLocaleString() || 0} ฿</span>
                        <span>สร้างเมื่อ {formatOrderDate(order.createdAt)}</span>
                      </div>

                        {/* Expanded details */}
                        <div className={`order-details-drawer ${isExpanded ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
                          <div className="detail-grid">
                            {/* 1. Customer & Delivery Address */}
                            <div className="detail-card">
                              <div className="detail-card-header">
                                <h4>รายละเอียดการจัดส่ง</h4>
                                <span className="detail-card-chip">Delivery</span>
                              </div>
                              {hasCustomDelivery ? (
                                <>
                                  <div className="detail-kv-list">
                                    <div className="detail-kv-row">
                                      <span className="detail-kv-label">ผู้รับ</span>
                                      <span className="detail-kv-value">{customerName}</span>
                                    </div>
                                    <div className="detail-kv-row">
                                      <span className="detail-kv-label">เบอร์โทร</span>
                                      <span className="detail-kv-value">{customerPhone}</span>
                                    </div>
                                    <div className="detail-kv-row">
                                      <span className="detail-kv-label">วันที่ส่ง</span>
                                      <span className="detail-kv-value">{deliveryDate}</span>
                                    </div>
                                    <div className="detail-kv-row">
                                      <span className="detail-kv-label">เวลา</span>
                                      <span className="detail-kv-value">{deliveryTime}</span>
                                    </div>
                                    <div className="detail-kv-row">
                                      <span className="detail-kv-label">ที่อยู่</span>
                                      <span className="detail-kv-value">{customerAddress}</span>
                                    </div>
                                  </div>
                                  {additionalNote ? (
                                    <div className="detail-note-box">
                                      <span className="detail-note-label">โน้ตเพิ่มเติม</span>
                                      <div className="detail-note-text">{additionalNote}</div>
                                    </div>
                                  ) : null}
                                </>
                              ) : (
                                <div className="detail-empty-text">ไม่มีข้อมูลจัดส่งแบบปรับแต่ง กรุณาติดต่อลูกค้าตามประวัติคำสั่งซื้อ</div>
                              )}
                            </div>

                            {/* 2. Status Action Control Panel */}
                            <div className="detail-card">
                              <div className="detail-card-header">
                                <h4>จัดการคำสั่งซื้อ</h4>
                                <span className="status-badge" style={{ color: status.color, background: status.bg }}>
                                  {status.label}
                                </span>
                              </div>
                              <div className="detail-status-line">
                                <span className="detail-status-meta">ชำระแล้ว {order.status === 'delivering' || order.status === 'completed' ? order.total?.toLocaleString() : Math.round((order.total || 0) / 2).toLocaleString()} ฿</span>
                                <span className="detail-status-meta">รหัส #{String(order.id).slice(0, 8).toUpperCase()}</span>
                              </div>
                              <div className="control-panel">
                                {order.status === 'pending_verification' && (
                                  <button
                                    className="status-select-btn"
                                    style={{ background: '#2ecc71' }}
                                    onClick={() => updateOrderStatus(order.id, 'preparing')}
                                  >
                                    ยืนยันยอดเงินสำเร็จ (เริ่มทำช่อดอกไม้)
                                  </button>
                                )}

                                {order.status === 'preparing' && (
                                  <>
                                    <div style={{ marginBottom: '15px', background: '#fdf5f6', padding: '20px 15px', borderRadius: '16px', border: '2px dashed #f8bbd9', textAlign: 'center', transition: 'all 0.3s' }}>
                                      <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>📸</div>
                                      <p style={{ fontSize: '0.95rem', color: '#db8a9e', marginBottom: '12px', fontWeight: 'bold' }}>รูปภาพช่อดอกไม้ที่จัดเสร็จแล้ว</p>

                                      <label style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        background: '#fff',
                                        border: '1px solid #f48fb1',
                                        color: '#db8a9e',
                                        padding: '8px 20px',
                                        borderRadius: '50px',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        fontWeight: '700',
                                        transition: 'all 0.2s ease',
                                        boxShadow: '0 4px 10px rgba(219,138,158,0.15)'
                                      }}>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              setFinishedImageFiles(prev => ({ ...prev, [order.id]: file }));
                                              const previewUrl = URL.createObjectURL(file);
                                              setFinishedImagePreviews(prev => ({ ...prev, [order.id]: previewUrl }));
                                            }
                                          }}
                                          style={{ display: 'none' }}
                                        />
                                        {finishedImageFiles[order.id] ? 'เปลี่ยนรูปภาพใหม่' : 'กดเพื่อเลือกรูปภาพ'}
                                      </label>

                                      {finishedImagePreviews[order.id] && (
                                        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', animation: 'fadeIn 0.3s ease' }}>
                                          <div style={{ position: 'relative', display: 'inline-block' }}>
                                            <img src={finishedImagePreviews[order.id]} alt="Preview" style={{ width: '100%', maxWidth: '160px', borderRadius: '12px', border: '3px solid #fff', boxShadow: '0 6px 15px rgba(0,0,0,0.1)' }} />
                                            <button
                                              title="ลบรูปภาพ"
                                              onClick={(e) => {
                                                e.preventDefault();
                                                const newFiles = { ...finishedImageFiles }; delete newFiles[order.id]; setFinishedImageFiles(newFiles);
                                                const newPreviews = { ...finishedImagePreviews }; delete newPreviews[order.id]; setFinishedImagePreviews(newPreviews);
                                              }}
                                              style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 'bold', boxShadow: '0 4px 8px rgba(255, 77, 79, 0.4)' }}
                                            >
                                              ✕
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <button
                                      className="status-select-btn"
                                      style={{ background: '#3498db', opacity: isUploadingImage ? 0.7 : 1 }}
                                      disabled={isUploadingImage}
                                      onClick={() => updateOrderStatus(order.id, 'shipping')}
                                    >
                                      {isUploadingImage ? 'กำลังอัปโหลดรูปภาพและบันทึก...' : 'ดอกไม้จัดเสร็จแล้ว (ส่งงาน)'}
                                    </button>
                                  </>
                                )}

                                {order.status === 'shipping' && (
                                  <button
                                    className="status-select-btn"
                                    style={{ background: '#27ae60' }}
                                    onClick={() => updateOrderStatus(order.id, 'delivering')}
                                  >
                                    ลูกค้าชำระเงินครบแล้ว (เริ่มนำจัดส่ง)
                                  </button>
                                )}

                                {order.status === 'pending_final_verification' && (
                                  <button
                                    className="status-select-btn"
                                    style={{ background: '#2ecc71' }}
                                    onClick={() => updateOrderStatus(order.id, 'delivering')}
                                  >
                                    ยืนยันยอดเงินส่วนที่เหลือสำเร็จ (เริ่มนำจัดส่ง)
                                  </button>
                                )}

                                {order.status === 'delivering' && (
                                  <button
                                    className="status-select-btn"
                                    style={{ background: '#27ae60' }}
                                    onClick={() => updateOrderStatus(order.id, 'completed')}
                                  >
                                    จัดส่งสำเร็จเรียบร้อย (ปิดออเดอร์)
                                  </button>
                                )}

                                {order.status !== 'completed' && order.status !== 'cancelled' && (
                                  <button
                                    className="status-select-btn"
                                    style={{ background: '#e74c3c' }}
                                    onClick={() => {
                                      (window as any).showBeautifulConfirm('คุณแน่ใจหรือไม่ว่าต้องการยกเลิกคำสั่งซื้อนี้?', 'ยืนยันการยกเลิกคำสั่งซื้อ').then((ok: boolean) => {
                                        if (ok) {
                                          updateOrderStatus(order.id, 'cancelled');
                                        }
                                      });
                                    }}
                                  >
                                    ยกเลิกออเดอร์นี้
                                  </button>
                                )}

                                {order.status === 'completed' && (
                                  <div className="status-note success">
                                    คำสั่งซื้อนี้เสร็จสิ้นอย่างสมบูรณ์แล้ว
                                  </div>
                                )}

                                {order.status === 'cancelled' && (
                                  <>
                                    <div className="status-note danger">
                                      คำสั่งซื้อนี้ถูกยกเลิกแล้ว
                                    </div>
                                    <button
                                      className="status-select-btn"
                                      style={{ background: '#7f8c8d', marginTop: '10px' }}
                                      onClick={async () => {
                                        const ok = await (window as any).showBeautifulConfirm('คุณแน่ใจหรือไม่ว่าต้องการลบออเดอร์นี้ออกจากฐานข้อมูลอย่างถาวร?', 'ยืนยันการลบถาวร');
                                        if (ok) {
                                          try {
                                            await deleteDoc(doc(db, 'orders', order.id));
                                            await (window as any).showBeautifulAlert('ลบข้อมูลออเดอร์ถาวรเรียบร้อยแล้ว!', 'success', 'ลบสำเร็จ');
                                          } catch (err) {
                                            console.error('Failed to delete order:', err);
                                            await (window as any).showBeautifulAlert('เกิดข้อผิดพลาดในการลบข้อมูล', 'error', 'ผิดพลาด');
                                          }
                                        }
                                      }}
                                    >
                                      ลบข้อมูลถาวร (ลบออกจากดาต้าเบส)
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {adminViewMode === 'florist' && (
          /* Florist View Mode */
          <div className="florist-section">
            <div className="dashboard-header">
              <div className="dashboard-title-block">
                <span className="dashboard-chip">Admin Overview</span>
                <h1 className="dashboard-title">{viewTitleMap[adminViewMode]}</h1>
                <p className="dashboard-subtitle">
                  รายการออเดอร์
                </p>
              </div>

              <div className="dashboard-header-actions">
                <div className="header-date-chip">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                  <span>ทั้งหมด: {preparingOrdersSorted.length} คิว</span>
                </div>
              </div>
            </div>

            {preparingOrdersSorted.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '70px 20px', background: '#fff', borderRadius: '24px', border: '1.5px dashed #fdf5f6', color: '#a08a8e', boxShadow: '0 10px 30px rgba(219, 138, 158, 0.02)' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '20px' }}>
                  <img src="/images/Empty State Icon.png" alt="Empty State" style={{ width: '120px', height: 'auto', display: 'block', margin: '0 auto' }} />
                </div>
                <h3 style={{ color: '#5c4738', fontWeight: 600, marginBottom: '8px', fontSize: '1.2rem' }}>ไม่มีออเดอร์ค้างในคิวจัดทำช่อดอกไม้</h3>
                <p style={{ fontSize: '0.92rem', margin: 0 }}>ช่างจัดดอกไม้สามารถพักผ่อน หรือจัดเตรียมวัตถุดิบเพื่อรอคิวถัดไปได้เลยค่ะ!</p>
              </div>
            ) : (
              <div className="florist-board animate-fade">
                {preparingOrdersSorted.map((order) => {
                  return (order.items || []).map((item: any, idx: number) => {
                    const isGlitterRose = item.type === 'glitter_rose' || !!item.config;
                    const cfg = item.config || null;
                    const itemColors = cfg && cfg.selectedColors && cfg.selectedColors.length > 0
                      ? cfg.selectedColors.map((id: string) => getRoseColorHex(id))
                      : ['#db8a9e'];
                    // Logic for displaying product images (same as cart page)
                    const isDefaultRibbonImage = item.coverImage && item.coverImage.includes('ริบบิ้นแดง.jpg');
                    const isPreset = item.isPreset === true;
                    const isCustomId = item.id && item.id.startsWith('custom_');
                    const shouldShowCoverImage = isPreset || (!isCustomId && item.coverImage && !isDefaultRibbonImage);

                    const cardKey = `${order.id}-${idx}`;

                    // Extract translated config properties
                    const colorsTrans = cfg && cfg.selectedColors
                      ? (cfg.selectedColors || []).map((id: string) => ROSE_COLORS_MAP[id] || id).join(', ')
                      : '';
                    const layersTrans = cfg && cfg.selectedLayers
                      ? (cfg.selectedLayers || []).map((id: string) => ROSE_LAYERS_MAP[id] || id).join(', ')
                      : '';
                    const paperTrans = cfg && cfg.selectedPaper
                      ? (ROSE_PAPERS_MAP[cfg.selectedPaper] || cfg.selectedPaper)
                      : '';
                    const shapeTrans = cfg && cfg.selectedShape
                      ? (ROSE_SHAPES_MAP[cfg.selectedShape] || cfg.selectedShape)
                      : '';
                    const decorationsTrans = cfg && cfg.selectedDecorations
                      ? (cfg.selectedDecorations || []).map((id: string) => ROSE_DECORATIONS_MAP[id] || id).join(', ')
                      : '';

                    const deliveryDate = cfg?.deliveryDate || '';
                    const deliveryTime = cfg?.deliveryTime ? `${cfg.deliveryTime} น.` : 'ไม่ระบุเวลา';
                    const customerName = cfg?.customerName || 'ไม่ระบุ';
                    const customerPhone = cfg?.customerPhone || 'ไม่ระบุเบอร์';
                    const customerAddress = cfg?.customerAddress || 'จัดส่งตามที่อยู่ร้าน / หรือระบุทีหลัง';
                    const additionalNote = cfg?.additionalNote?.trim?.() || '';
                    const hasSpecDetails = Boolean(layersTrans || paperTrans || shapeTrans || decorationsTrans || cfg?.customerName || cfg?.deliveryDate || cfg?.additionalNote);

                    return (
                      <div key={cardKey} className="florist-card">
                        <div className="florist-header">
                          <div className="florist-header-main">
                            <div className="florist-img-container">
                              {shouldShowCoverImage ? (
                                <img src={item.coverImage} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                              ) : (
                                <BasketIcon colors={itemColors} />
                              )}
                            </div>

                            <div className="florist-info">
                              <div className="florist-topbar">
                                <div className="florist-title-block">
                                  <div className="florist-meta-row">
                                    <div className="florist-meta-chips">
                                      {deliveryDate ? (
                                        <span className="florist-meta-chip strong">ส่ง {deliveryDate}</span>
                                      ) : null}
                                    </div>
                                  </div>
                                  <div className="florist-item-name">
                                    {item.name}
                                    {isGlitterRose && <span className="florist-badge">Glitter Rose</span>}
                                  </div>
                                </div>
                              </div>

                              <div className="florist-summary-strip">
                                <span className="florist-summary-pill recipient"><strong>ผู้รับ:</strong> {customerName}</span>
                                <span className="florist-summary-pill time"><strong>เวลา:</strong> {deliveryTime}</span>
                                <span className="florist-summary-pill total"><strong>ยอด:</strong> {item.price?.toLocaleString() || 0} ฿</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {cfg && hasSpecDetails ? (
                          <div className="florist-details-box">
                            <div className="florist-detail-card">
                              <div className="detail-group-title">🌹 ช่อดอกกุหลาบ</div>
                              <ul className="detail-item-list">
                                <li>จำนวน: {cfg.selectedQty || 0} ดอก</li>
                                {colorsTrans && <li>สี: {colorsTrans}</li>}
                              </ul>
                            </div>

                            {(layersTrans || paperTrans || shapeTrans) && (
                              <div className="florist-detail-card">
                                <div className="detail-group-title">📜 องค์ประกอบการห่อ</div>
                                <ul className="detail-item-list">
                                  {layersTrans && <li>รองช่อ: {layersTrans}</li>}
                                  {paperTrans && <li>กระดาษห่อ: {paperTrans}</li>}
                                  {shapeTrans && <li>รูปทรง: {shapeTrans}</li>}
                                </ul>
                              </div>
                            )}

                            {decorationsTrans && (
                              <div className="florist-detail-card">
                                <div className="detail-group-title">✨ ของตกแต่งเพิ่มเติม</div>
                                <ul className="detail-item-list">
                                  <li>{decorationsTrans}</li>
                                </ul>
                              </div>
                            )}

                            {(cfg.customerName || cfg.deliveryDate || cfg.additionalNote) && (
                              <div className="florist-detail-card">
                                <div className="detail-group-title">📍 ข้อมูลการจัดส่ง</div>
                                <ul className="detail-item-list">
                                  <li>ผู้รับ: {customerName} ({customerPhone})</li>
                                  <li>ที่อยู่: {customerAddress}</li>
                                  {deliveryDate && <li>ส่ง: {deliveryDate} ({deliveryTime})</li>}
                                  {additionalNote && <li style={{ color: '#db8a9e', fontWeight: 700 }}>โน้ต: "{additionalNote}"</li>}
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="florist-details-box" style={{ gridTemplateColumns: '1fr' }}>
                            <div className="florist-empty-note">
                              สินค้าปกติสำเร็จรูปของร้านค้า ไม่ต้องจัดทำสเปกพิเศษ
                            </div>
                          </div>
                        )}

                        <div className="florist-bottom-row">
                          <div className="florist-price-label">
                            {item.price?.toLocaleString() || 0} ฿
                          </div>

                          <button
                            className="florist-done-btn"
                            onClick={() => updateOrderStatus(order.id, 'shipping')}
                          >
                            จัดทำช่อดอกไม้เสร็จเรียบร้อย
                          </button>
                        </div>
                      </div>
                    );
                  });
                })}
              </div>
            )}
          </div>
        )}

        {adminViewMode === 'finance' && (
          <div className="finance-section">
            <div className="dashboard-header">
              <div className="dashboard-title-block">
                <span className="dashboard-chip">Admin Overview</span>
                <h1 className="dashboard-title">{viewTitleMap[adminViewMode]}</h1>
                <p className="dashboard-subtitle">
                  บันทึกและรายงานงบการเงิน
                </p>
              </div>

              <div className="dashboard-header-actions">
                <div className="header-date-chip">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 2v4" />
                    <path d="M16 2v4" />
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M3 10h18" />
                  </svg>
                  <span>รอบบัญชีเดือน: {formatMonthThai(selectedMonth)}</span>
                </div>
              </div>
            </div>

            {/* Monthly Filter Bar */}
            <div className="monthly-filter-bar">
              <div className="month-select-label">
                <span>เลือกเดือนบัญชีเพื่อดูข้อมูลย้อนหลัง:</span>
              </div>
              <div className="month-pill-container">
                {availableMonths.map(m => (
                  <button
                    key={m}
                    className={`month-pill-btn ${selectedMonth === m ? 'active' : ''}`}
                    onClick={() => setSelectedMonth(m)}
                  >
                    {formatMonthThai(m)}
                  </button>
                ))}
              </div>
            </div>

            {/* Profit & Loss Cards Summary */}
            <div className="stats-grid finance-summary">
              {financeCards.map((card) => (
                <div key={card.key} className={`stat-card ${card.cardClass}`}>
                  <div className="stat-info">
                    <span className="stat-label">{card.label}</span>
                    <span className="stat-value" style={card.valueColor ? { color: card.valueColor } : undefined}>
                      {card.value}
                    </span>
                    <span className="stat-detail" style={{ color: card.accent }}>
                      <span>{card.detailPrefix}</span>
                      <span>{card.detail}</span>
                    </span>
                  </div>
                  <div
                    className="stat-ring"
                    style={{ ['--accent' as any]: card.accent, ['--p' as any]: card.progressPct } as React.CSSProperties}
                    aria-hidden="true"
                  >
                    <span className="stat-ring-label">
                      {card.ringPrefix}
                      {card.ringLabelPct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Salary & Profit Allocation Card */}
            <div className="salary-sharing-card">
              <h3 className="sharing-title">
                <span>💰</span> การจัดสรรรายได้ & ส่วนแบ่งเงินเดือน
              </h3>
              <p className="sharing-subtitle">
                ระบบคำนวณส่วนแบ่งอัตโนมัติจากกำไรสุทธิรอบบัญชี {formatMonthThai(selectedMonth)}
              </p>

              {monthlyNetProfit <= 0 ? (
                <div className="sharing-empty-state">
                  <span>
                    <img src="/images/Empty State Icon.png" alt="Empty State" style={{ width: '120px', height: 'auto', display: 'block', margin: '0 auto' }} />
                  </span>
                  <p>รอบบัญชีเดือนนี้ยังไม่มียอดกำไรสุทธิที่เป็นบวก จึงยังไม่มีการจัดสรรงบประมาณและส่วนแบ่งเงินเดือนค่ะ</p>
                </div>
              ) : (
                <div className="sharing-content-layout">
                  {/* Visual Allocation Bar */}
                  <div className="allocation-bar-wrapper">
                    <div className="allocation-bar">
                      <div className="bar-segment segment-materials" style={{ width: '30%' }}>
                        <span>30%</span>
                      </div>
                      <div className="bar-segment segment-savings" style={{ width: '40%' }}>
                        <span>40%</span>
                      </div>
                      <div className="bar-segment segment-admin1" style={{ width: '15%' }}>
                        <span>15%</span>
                      </div>
                      <div className="bar-segment segment-admin2" style={{ width: '15%' }}>
                        <span>15%</span>
                      </div>
                    </div>

                    {/* Allocation Legend */}
                    <div className="bar-legend">
                      <span className="legend-item"><span className="legend-dot dot-materials"></span> ทุนซื้อของ (30%)</span>
                      <span className="legend-item"><span className="legend-dot dot-savings"></span> เงินเก็บร้าน (40%)</span>
                      <span className="legend-item"><span className="legend-dot dot-admin1"></span> แอดมินคนที่ 1 (15%)</span>
                      <span className="legend-item"><span className="legend-dot dot-admin2"></span> แอดมินคนที่ 2 (15%)</span>
                    </div>
                  </div>

                  {/* Detailed Split Cards */}
                  <div className="split-cards-grid">
                    {/* 1. Purchasing Fund Card */}
                    <div className="split-card fund-card purchasing">
                      <div className="card-header-row">
                        <span className="card-badge badge-purchasing">📦 ทุนหมุนเวียน 30%</span>
                      </div>
                      <div className="card-body">
                        <span className="split-label">หักเก็บสะสมทุนซื้อของ</span>
                        <span className="split-value">{(monthlyNetProfit * 0.30).toLocaleString('th-TH', { maximumFractionDigits: 2 })} ฿</span>
                      </div>
                    </div>

                    {/* 2. Shop Savings Card */}
                    <div className="split-card fund-card savings">
                      <div className="card-header-row">
                        <span className="card-badge badge-savings">🏦 เงินเก็บร้าน 40%</span>
                      </div>
                      <div className="card-body">
                        <span className="split-label">หักเก็บเป็นเงินเก็บสะสมร้าน</span>
                        <span className="split-value">{(monthlyNetProfit * 0.40).toLocaleString('th-TH', { maximumFractionDigits: 2 })} ฿</span>
                      </div>
                    </div>

                    {/* 3. Admin 1 Salary Card */}
                    <div className="split-card profile-card admin1">
                      <div className="card-header-row">
                        <span className="card-badge badge-admin1">👥 แอดมินคนที่ 1 (15%)</span>
                      </div>
                      <div className="profile-body">
                        <div className="profile-avatar">👨‍💻</div>
                        <div className="profile-info">
                          <span className="profile-role">ผู้ดูแลระบบหลัก</span>
                          <span className="profile-salary">{(monthlyNetProfit * 0.15).toLocaleString('th-TH', { maximumFractionDigits: 2 })} ฿</span>
                        </div>
                      </div>
                    </div>

                    {/* 4. Admin 2 Salary Card */}
                    <div className="split-card profile-card admin2">
                      <div className="card-header-row">
                        <span className="card-badge badge-admin2">👥 แอดมินคนที่ 2 (15%)</span>
                      </div>
                      <div className="profile-body">
                        <div className="profile-avatar">👩‍💻</div>
                        <div className="profile-info">
                          <span className="profile-role">ผู้ร่วมดูแลระบบ</span>
                          <span className="profile-salary">{(monthlyNetProfit * 0.15).toLocaleString('th-TH', { maximumFractionDigits: 2 })} ฿</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Workspace Grid */}
            <div className="finance-grid">
              {/* Left Side: Expense Form Card */}
              <div className="finance-form-card">
                <h3 className="form-title">
                  <span style={{ fontSize: '1.2rem' }}>➕</span> บันทึกจัดซื้อ
                </h3>
                <div className="ai-receipt-card">
                  <div className="ai-receipt-title">
                    <span>🤖</span> อ่านใบเสร็จด้วย AI
                  </div>
                  <p className="ai-receipt-subtitle">
                    อัปโหลดรูปใบเสร็จหรือสลิปได้หลายรูป แล้วให้ AI ช่วยกรอกฟอร์มให้อัตโนมัติ
                  </p>
                  <div className="ai-file-control">
                    <span className="ai-file-button">วางรูป</span>
                    <div className="ai-file-stack">
                      <span className="ai-file-name">
                        {receiptFileNames.length > 0 ? `เลือกแล้ว ${receiptFileNames.length} รูป` : 'ยังไม่ได้เลือกไฟล์'}
                      </span>
                    </div>
                    <input
                      type="file"
                      className="ai-receipt-input"
                      accept="image/*"
                      multiple
                      onChange={handleReceiptFileChange}
                    />
                  </div>
                  {receiptFileNames.length > 0 && (
                    <div style={{ marginTop: '0.6rem', fontSize: '0.85rem', color: '#7d5d4f' }}>
                      {receiptFileNames.join(', ')}
                    </div>
                  )}
                  {receiptPreviews.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.7rem' }}>
                      {receiptPreviews.map((preview, index) => (
                        <img
                          key={`${receiptFileNames[index] || 'receipt'}-${index}`}
                          src={preview}
                          alt={`Receipt preview ${index + 1}`}
                          className="ai-receipt-preview"
                          style={{ marginTop: 0 }}
                        />
                      ))}
                    </div>
                  )}
                  <div className="ai-receipt-actions">
                    <button
                      type="button"
                      className="submit-btn"
                      onClick={handleParseReceipt}
                      disabled={isParsingReceipt}
                    >
                      {isParsingReceipt ? 'กำลังอ่านใบเสร็จ...' : 'อ่านใบเสร็จ'}
                    </button>
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => {
                        setReceiptPreviews([]);
                        setReceiptDataUrls([]);
                        setReceiptParseError(null);
                        setReceiptFileNames([]);
                      }}
                      disabled={isParsingReceipt}
                    >
                      ล้างรูป
                    </button>
                  </div>
                  {receiptParseError && (
                    <div className="ai-error-text">{receiptParseError}</div>
                  )}
                </div>
                <form onSubmit={handleAddExpense}>
                  {expenseItems.map((item, idx) => (
                    <div key={item.id} className="expense-item-card">
                      <div className="expense-item-grid">
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <label className="form-label" style={{ marginBottom: 0 }}>คำอธิบายรายการ</label>
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...expenseItems];
                                next[idx] = { ...next[idx], type: item.type === 'expense' ? 'income' : 'expense' };
                                setExpenseItems(next);
                              }}
                              style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: item.type === 'income' ? '#23C560' : '#F14344',
                                color: '#ffffff',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                minWidth: '60px'
                              }}
                            >
                              {item.type === 'income' ? 'รับ' : 'จ่าย'}
                            </button>
                          </div>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="เช่น ซื้อดอกกุหลาบสด 200 ดอก"
                            value={item.title}
                            onChange={(e) => {
                              const next = [...expenseItems];
                              next[idx] = { ...next[idx], title: e.target.value };
                              setExpenseItems(next);
                            }}
                            required
                          />
                        </div>
                      </div>

                      <div className="expense-item-subgrid">
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">จำนวนเงิน</label>
                          <input
                            type="number"
                            className="form-input"
                            placeholder="0.00"
                            min="1"
                            step="any"
                            value={item.amount}
                            onChange={(e) => {
                              const next = [...expenseItems];
                              next[idx] = { ...next[idx], amount: e.target.value };
                              setExpenseItems(next);
                            }}
                            required
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">วันที่ทำรายการ</label>
                          <div className="custom-date-container">
                            <input
                              type="date"
                              className="form-input custom-date-input"
                              value={item.date}
                              onChange={(e) => {
                                const next = [...expenseItems];
                                next[idx] = { ...next[idx], date: e.target.value };
                                setExpenseItems(next);
                              }}
                              required
                            />
                            <div className="custom-date-icon-box">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#db8a9e" strokeWidth="2.5">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="expense-item-actions">
                        <span style={{ color: '#a08a8e', fontSize: '0.78rem' }}>รายการที่ {idx + 1}</span>
                        {expenseItems.length > 1 && (
                          <button
                            type="button"
                            className="remove-row-btn"
                            onClick={() => {
                              const next = expenseItems.filter((row) => row.id !== item.id);
                              setExpenseItems(next.length ? next : expenseItems);
                            }}
                          >
                            ลบรายการนี้
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="add-row-btn"
                    onClick={() => {
                      setExpenseItems((prev) => [
                        ...prev,
                        {
                          id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
                          title: '',
                          amount: '',
                          date: new Date().toISOString().substring(0, 10),
                          type: 'expense'
                        }
                      ]);
                    }}
                  >
                    เพิ่มบรรทัดรายการใหม่
                  </button>

                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={isSubmittingExpense}
                  >
                    {isSubmittingExpense ? 'กำลังบันทึกข้อมูล...' : 'บันทึกข้อมูล'}
                  </button>
                </form>
              </div>

              {/* Right Side: Ledger Table Ledger */}
              <div className="ledger-card">
                <h3 className="form-title">
                  <span style={{ fontSize: '1.2rem' }}>📜</span> สมุดบัญชีรายรับ-รายจ่าย ({formatMonthThai(selectedMonth)})
                </h3>

                {monthlyLedgerItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '50px 20px', color: '#a08a8e' }}>
                    <span style={{ fontSize: '2.5rem' }}>
                      <img src="/images/Empty State Icon.png" alt="Empty State" style={{ width: '120px', height: 'auto', display: 'block', margin: '0 auto' }} />
                    </span>
                    <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>ยังไม่มีรายการทางการเงินในรอบบัญชีเดือนนี้เลยค่ะ</p>
                  </div>
                ) : (
                  <div className="ledger-table-container">
                    <table className="ledger-table">
                      <thead>
                        <tr>
                          <th>วันที่</th>
                          <th>ประเภท</th>
                          <th>รายละเอียดรายการ</th>
                          <th style={{ textAlign: 'right' }}>จำนวนเงิน</th>
                          <th style={{ textAlign: 'center', width: '50px' }}>ลบ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyLedgerItems.map((item) => {
                          return (
                            <tr key={item.id} className="ledger-row-item">
                              <td style={{ fontWeight: 600, color: '#7a6352' }}>
                                {new Date(item.date).toLocaleDateString('th-TH', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </td>
                              <td>
                                <span className={`fin-badge ${item.type}`}>
                                  {item.type === 'revenue' || item.type === 'income' ? '🟢 รายรับ' : '🔴 รายจ่าย'}
                                </span>
                              </td>
                              <td style={{ color: '#5c4738', fontSize: '0.85rem' }}>
                                {item.title}
                              </td>
                              <td className={`amount-text ${item.type}`} style={{ textAlign: 'right' }}>
                                {item.type === 'revenue' || item.type === 'income' ? '+' : '-'}{item.amount.toLocaleString()} ฿
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                {item.type === 'expense' || item.type === 'income' ? (
                                  <button
                                    className="delete-btn-circle"
                                    onClick={() => handleDeleteExpense(item.id)}
                                    title={item.type === 'income' ? 'ลบรายการรายรับนี้' : 'ลบรายการรายจ่ายนี้'}
                                  >
                                    ✕
                                  </button>
                                ) : (
                                  <span style={{ color: '#ccc', fontSize: '0.75rem' }}>ระบบ</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminPageContent />
    </Suspense>
  );
}
