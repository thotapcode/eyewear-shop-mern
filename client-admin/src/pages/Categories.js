import React, { useCallback, useEffect, useState } from 'react';
import { PencilSimple, Trash, SquaresFour } from '@phosphor-icons/react';
import api from '../api';
import { useUI } from '../components/UI';

export default function Categories() {
  const { toast, confirm } = useUI();
  const [categories, setCategories] = useState(null);
  const [selected, setSelected] = useState(null); // danh mục đang sửa
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const res = await api.get('/categories');
    setCategories(Array.isArray(res.data) ? res.data : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const reset = () => { setSelected(null); setName(''); setError(''); };

  const handleSave = async (e) => {
    e.preventDefault();
    const value = name.trim();
    if (!value) return setError('Vui lòng nhập tên danh mục');
    try {
      const res = selected ? await api.put(`/categories/${selected._id}`, { name: value }) : await api.post('/categories', { name: value });
      if (res.data.success === false) return toast(res.data.message, 'error');
      toast(selected ? 'Đã cập nhật danh mục' : 'Đã thêm danh mục');
      reset();
      load();
    } catch {
      toast('Không lưu được, vui lòng thử lại', 'error');
    }
  };

  const handleDelete = async (c) => {
    const ok = await confirm({ title: 'Xóa danh mục?', message: `Danh mục "${c.name}" sẽ bị xóa. Chỉ xóa được khi danh mục không còn sản phẩm.` });
    if (!ok) return;
    try {
      const res = await api.delete(`/categories/${c._id}`);
      if (res.data.success === false) return toast(res.data.message, 'error');
      toast('Đã xóa danh mục');
      if (selected && selected._id === c._id) reset();
      load();
    } catch {
      toast('Không xóa được, vui lòng thử lại', 'error');
    }
  };

  const handleEdit = (c) => { setSelected(c); setName(c.name); setError(''); };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Danh mục</h1>
          <p className="muted">{categories ? `${categories.length} danh mục` : 'Đang tải'}</p>
        </div>
      </div>

      <form className="card form-card" onSubmit={handleSave} noValidate>
        <h2>{selected ? 'Sửa danh mục' : 'Thêm danh mục'}</h2>
        <div className="field" style={{ maxWidth: 420 }}>
          <label htmlFor="cname">Tên danh mục</label>
          <input id="cname" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Kính cận" aria-invalid={error ? 'true' : undefined} aria-describedby={error ? 'cname-err' : undefined} />
          {error && <p id="cname-err" className="err" role="alert">{error}</p>}
        </div>
        <div className="form-actions">
          <button className="btn btn-primary" type="submit">{selected ? 'Cập nhật' : 'Thêm danh mục'}</button>
          {selected && <button className="btn btn-ghost" type="button" onClick={reset}>Hủy</button>}
        </div>
      </form>

      <div className="card table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th style={{ width: 64 }}>STT</th><th>Tên danh mục</th><th className="num" style={{ width: 120 }}>Thao tác</th></tr>
            </thead>
            <tbody>
              {categories === null && [0, 1, 2].map((i) => (
                <tr key={i}><td colSpan="3"><div className="skeleton" style={{ height: 20 }} /></td></tr>
              ))}
              {categories && categories.map((c, i) => (
                <tr key={c._id}>
                  <td className="mono muted">{i + 1}</td>
                  <td><strong style={{ fontWeight: 600 }}>{c.name}</strong></td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn" onClick={() => handleEdit(c)} aria-label={`Sửa ${c.name}`} title="Sửa"><PencilSimple size={18} /></button>
                      <button className="icon-btn danger" onClick={() => handleDelete(c)} aria-label={`Xóa ${c.name}`} title="Xóa"><Trash size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {categories && categories.length === 0 && (
          <div className="empty">
            <SquaresFour size={40} />
            <strong>Chưa có danh mục nào</strong>
            <span>Thêm danh mục đầu tiên ở biểu mẫu phía trên, sau đó mới thêm được sản phẩm.</span>
          </div>
        )}
      </div>
    </div>
  );
}
