import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, WarningCircle } from '@phosphor-icons/react';
import api from '../api';

// trang mở từ liên kết trong email: /active?id=...&token=...
export default function Active() {
  const [params] = useSearchParams();
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.post('/active', { id: params.get('id'), token: params.get('token') })
      .then((res) => setResult(res.data))
      .catch(() => setResult({ success: false, message: 'Không kết nối được tới máy chủ, vui lòng thử lại.' }));
  }, [params]);

  return (
    <div className="wrap">
      <div className="center-card" aria-live="polite">
        {!result && <><div className="skeleton" style={{ width: 56, height: 56, borderRadius: '50%' }} /><p className="muted">Đang kích hoạt tài khoản</p></>}
        {result && result.success && (
          <>
            <CheckCircle size={56} weight="fill" color="var(--ok)" />
            <h1 className="page-title" style={{ fontSize: '1.5rem' }}>Kích hoạt thành công</h1>
            <p className="muted">Tài khoản đã sẵn sàng, bạn có thể đăng nhập.</p>
            <Link to="/login" className="btn btn-primary">Đăng nhập</Link>
          </>
        )}
        {result && !result.success && (
          <>
            <WarningCircle size={56} weight="fill" color="var(--danger)" />
            <h1 className="page-title" style={{ fontSize: '1.5rem' }}>Không kích hoạt được</h1>
            <p className="muted">{result.message}</p>
            <Link to="/" className="btn btn-ghost">Về trang chủ</Link>
          </>
        )}
      </div>
    </div>
  );
}
