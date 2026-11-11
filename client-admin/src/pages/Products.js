import React, { useCallback, useEffect, useState } from 'react';
import api from '../api';

const EMPTY = { name: '', price: '', category: '', brand: '', frameType: '', material: '', image: '' };

// đọc file ảnh thành chuỗi base64 (bỏ phần "data:image/...;base64,")
function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [noPages, setNoPages] = useState(1);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  const load = useCallback(async (p) => {
    const res = await api.get(`/products?page=${p}`);
    setProducts(res.data.products || []);
    setNoPages(res.data.noPages || 1);
    // xóa hết ở trang cuối thì lùi về trang trước
    if (res.data.products && res.data.products.length === 0 && p > 1) setPage(p - 1);
  }, []);

  useEffect(() => { load(page); }, [load, page]);
  useEffect(() => {
    api.get('/categories').then((res) => setCategories(Array.isArray(res.data) ? res.data : []));
  }, []);

  const setField = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleImage = async (e) => {
    const file = e.target.files[0];
    if (file) setForm({ ...form, image: await readImage(file) });
  };

  const reset = () => { setForm(EMPTY); setEditingId(null); };

  const handleSave = async (e) => {
    e.preventDefault();
    const price = Number(form.price);
    if (!form.name.trim() || !form.category || !(price >= 0) || form.price === '') {
      return setMessage('Vui lòng nhập tên, giá và chọn danh mục');
    }
    const body = { ...form, name: form.name.trim(), price };
    if (editingId) await api.put(`/products/${editingId}`, body);
    else await api.post('/products', body);
    setMessage(editingId ? 'Đã cập nhật sản phẩm' : 'Đã thêm sản phẩm');
    reset();
    load(page);
  };

  const handleEdit = (p) => {
    setEditingId(p._id);
    setForm({
      name: p.name || '', price: p.price ?? '', category: p.category ? p.category._id : '',
      brand: p.brand || '', frameType: p.frameType || '', material: p.material || '', image: p.image || '',
    });
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Xóa sản phẩm "${p.name}"?`)) return;
    await api.delete(`/products/${p._id}`);
    setMessage('Đã xóa sản phẩm');
    if (editingId === p._id) reset();
    load(page);
  };

  return (
    <div>
      <h2>Quản lý sản phẩm</h2>
      <form className="form" onSubmit={handleSave}>
        <div className="row">
          <label>Tên sản phẩm<input value={form.name} onChange={setField('name')} /></label>
          <label>Giá (USD)<input type="number" min="0" value={form.price} onChange={setField('price')} /></label>
          <label>Danh mục
            <select value={form.category} onChange={setField('category')}>
              <option value="">-- Chọn danh mục --</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </label>
        </div>
        <div className="row">
          <label>Thương hiệu<input value={form.brand} onChange={setField('brand')} placeholder="Ray-Ban, Oakley..." /></label>
          <label>Loại gọng<input value={form.frameType} onChange={setField('frameType')} placeholder="Tròn, vuông, mắt mèo..." /></label>
          <label>Chất liệu<input value={form.material} onChange={setField('material')} placeholder="Titan, nhựa, kim loại..." /></label>
        </div>
        <label>Hình ảnh<input type="file" accept="image/*" onChange={handleImage} /></label>
        {form.image && <img className="thumb" alt="xem trước" src={`data:image/jpeg;base64,${form.image}`} />}
        <div className="actions">
          <button type="submit">{editingId ? 'Cập nhật' : 'Thêm'}</button>
          {editingId && <button type="button" className="secondary" onClick={reset}>Hủy</button>}
        </div>
        {message && <p>{message}</p>}
      </form>

      <table>
        <thead>
          <tr><th>Ảnh</th><th>Tên</th><th>Giá</th><th>Danh mục</th><th>Thương hiệu</th><th>Loại gọng</th><th>Thao tác</th></tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p._id}>
              <td>{p.image && <img className="thumb" alt={p.name} src={`data:image/jpeg;base64,${p.image}`} />}</td>
              <td>{p.name}</td>
              <td>{p.price}</td>
              <td>{p.category ? p.category.name : ''}</td>
              <td>{p.brand}</td>
              <td>{p.frameType}</td>
              <td className="actions">
                <button onClick={() => handleEdit(p)}>Sửa</button>
                <button className="danger" onClick={() => handleDelete(p)}>Xóa</button>
              </td>
            </tr>
          ))}
          {products.length === 0 && <tr><td colSpan="7">Chưa có sản phẩm nào</td></tr>}
        </tbody>
      </table>

      <div className="pager">
        {Array.from({ length: noPages }, (_, i) => i + 1).map((n) => (
          <button key={n} className={n === page ? 'current' : ''} onClick={() => setPage(n)}>{n}</button>
        ))}
      </div>
    </div>
  );
}
