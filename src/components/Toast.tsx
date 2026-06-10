'use client';
import { useState, useEffect, useCallback, createContext, useContext } from 'react';

interface ToastContextType {
  showToast: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string, duration = 2500) => {
    if (timeoutId) clearTimeout(timeoutId);
    setMessage(msg);
    setVisible(true);
    const id = setTimeout(() => {
      setVisible(false);
    }, duration);
    setTimeoutId(id);
  }, [timeoutId]);

  useEffect(() => {
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [timeoutId]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: '90px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--deep-brown, rgba(0,0,0,0.85))',
          color: '#fff',
          padding: '10px 22px',
          borderRadius: '50px',
          fontSize: '.82rem',
          fontWeight: 500,
          letterSpacing: '.04em',
          zIndex: 200,
          whiteSpace: 'nowrap',
          boxShadow: '0 6px 20px rgba(0,0,0,.25)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none',
        }}
      >
        {message}
      </div>
    </ToastContext.Provider>
  );
}
