import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';

// trang mở từ liên kết trong email: /active?id=...&token=...
export default function Active() {
  const [params] = useSearchParams();
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.post('/active', { id: params.get('id'), token: params.get('token') })
      .then((res) => setResult(res.data))
      .catch(() => setResult({ success: false, message: 'Không kết nối được tới server' }));
  }, [params]);

  return (
    <div className="card-form">
      <h2>Kích hoạt tài khoản</h2>
      {!result && <p>Đang kích hoạt...</p>}
      {result && <p className={result.success ? 'ok' : 'error'}>{result.message}</p>}
      {result && result.success && <p className="hint"><Link to="/login">Đăng nhập ngay</Link></p>}
    </div>
  );
}
