import React, { useState } from 'react';
import { Eye, EyeSlash } from '@phosphor-icons/react';

// ô nhập có nhãn phía trên, thông báo lỗi và gợi ý phía dưới; type="password" có nút hiện mật khẩu
export default function Field({ id, label, type = 'text', value, onChange, error, help, ...rest }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const describedBy = error ? `${id}-err` : help ? `${id}-help` : undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="control">
        <input
          id={id}
          className="input"
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={onChange}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          style={isPassword ? { paddingRight: 48 } : undefined}
          {...rest}
        />
        {isPassword && (
          <button type="button" className="icon-btn toggle" onClick={() => setShow(!show)} aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
            {show ? <EyeSlash size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
      {error && <p id={`${id}-err`} className="msg error" role="alert">{error}</p>}
      {!error && help && <p id={`${id}-help`} className="help">{help}</p>}
    </div>
  );
}
