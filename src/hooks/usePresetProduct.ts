'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface PresetProduct {
  id: string;
  name?: string;
  price?: number;
  coverImage?: string;
  description?: string;
  readyToShip?: boolean;
  stockQuantity?: number;
  config?: Record<string, any>;
  [key: string]: any;
}

interface UsePresetProductResult {
  presetProduct: PresetProduct | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook สำหรับโหลด preset product จาก Firestore
 * ใช้ร่วมกันระหว่างหน้า velvet_wire และ glitter_rose
 */
export function usePresetProduct(): UsePresetProductResult {
  const [presetProduct, setPresetProduct] = useState<PresetProduct | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const presetId = urlParams.get('preset');

    if (!presetId) return;

    const loadPreset = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const docRef = doc(db, 'products', presetId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPresetProduct({ id: presetId, ...docSnap.data() } as PresetProduct);
        } else {
          setError('ไม่พบแบบสินค้าดังกล่าว');
        }
      } catch (e) {
        console.error('Failed to load preset:', e);
        setError('เกิดข้อผิดพลาดในการโหลดแบบสินค้า');
      } finally {
        setIsLoading(false);
      }
    };

    loadPreset();
  }, []);

  return { presetProduct, isLoading, error };
}
