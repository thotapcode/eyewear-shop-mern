import React, { useCallback, useEffect, useState } from 'react';
import api from '../api';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState(null); // danh mục đang sửa
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const res = await api.get('/categories');
    setCategories(Array.isArray(res.data) ? res.data : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const reset = () => { setSelected(null); setName(''); };

  const handleSave = async (e) => {
    e.preventDefault();
    const value = name.trim();
    if (!value) return setMessage('Vui lòng nhập tên danh mục');
    if (selected) await api.put(`/categories/${selected._id}`, { name: value });
    else await api.post('/categories', { name: value });
    setMessage(selected ? 'Đã cập nhật danh mục' : 'Đã thêm danh mục');
    reset();
    load();
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Xóa danh mục "${c.name}"?`)) return;
    await api.delete(`/categories/${c._id}`);
    setMessage('Đã xóa danh mục');
    if (selected && selected._id === c._id) reset();
    load();
  };

  const handleEdit = (c) => { setSelected(c); setName(c.name); setMessage(''); };

  return (
    <div>
      <h2>Quản lý danh mục</h2>
      <form className="form" onSubmit={handleSave}>
        <label>{selected ? 'Sửa tên danh mục' : 'Thêm danh mục mới'}
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Kính cận, Kính râm, Gọng kính" />
        </label>
        <div className="actions">
          <button type="submit">{selected ? 'Cập nhật' : 'Thêm'}</button>
          {selected && <button type="button" className="secondary" onClick={reset}>Hủy</button>}
        </div>
        {message && <p>{message}</p>}
      </form>
      <table>
        <thead>
          <tr><th>#</th><th>Tên danh mục</th><th>Thao tác</th></tr>
        </thead>
        <tbody>
          {categories.map((c, i) => (
            <tr key={c._id}>
              <td>{i + 1}</td>
              <td>{c.name}</td>
              <td className="actions">
                <button onClick={() => handleEdit(c)}>Sửa</button>
                <button className="danger" onClick={() => handleDelete(c)}>Xóa</button>
              </td>
            </tr>
          ))}
          {categories.length === 0 && <tr><td colSpan="3">Chưa có danh mục nào</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
