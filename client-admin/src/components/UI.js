import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle, WarningCircle } from '@phosphor-icons/react';

const UIContext = createContext(null);
export const useUI = () => useContext(UIContext);

// cung cấp toast (thông báo ngắn) và confirm (hộp xác nhận trả về Promise) cho toàn trang quản trị
export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const idRef = useRef(0);

  const toast = useCallback((message, type = 'ok') => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const confirm = useCallback((options) => new Promise((resolve) => setDialog({ ...options, resolve })), []);
  const close = (result) => { dialog.resolve(result); setDialog(null); };

  return (
    <UIContext.Provider value={{ toast, confirm }}>
      {children}
      <div className="toasts" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              className={`toast ${t.type === 'error' ? 'error' : ''}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {t.type === 'error' ? <WarningCircle size={20} weight="fill" /> : <CheckCircle size={20} weight="fill" />}
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {dialog && <ConfirmDialog key="dialog" dialog={dialog} onClose={close} />}
      </AnimatePresence>
    </UIContext.Provider>
  );
}

function ConfirmDialog({ dialog, onClose }) {
  const cancelRef = useRef(null);

  useEffect(() => {
    cancelRef.current && cancelRef.current.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose(false)}>
      <motion.div
        className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dlg-title" aria-describedby="dlg-desc"
        initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 id="dlg-title">{dialog.title}</h2>
        <p id="dlg-desc" className="muted">{dialog.message}</p>
        <div className="form-actions">
          <button ref={cancelRef} className="btn btn-ghost" onClick={() => onClose(false)}>Hủy</button>
          <button className="btn btn-danger" onClick={() => onClose(true)}>{dialog.confirmLabel || 'Xóa'}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
