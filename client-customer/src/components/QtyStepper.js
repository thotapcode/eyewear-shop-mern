import React from 'react';
import { Minus, Plus } from '@phosphor-icons/react';
import { MAX_QTY } from '../CartContext';

// bộ tăng giảm số lượng, giới hạn từ 1 đến MAX_QTY
export default function QtyStepper({ value, onChange, label = 'Số lượng', max = MAX_QTY }) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Giảm số lượng"><Minus size={16} weight="bold" /></button>
      <span className="mono" aria-live="polite">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= Math.min(max, MAX_QTY)} aria-label="Tăng số lượng"><Plus size={16} weight="bold" /></button>
    </div>
  );
}
