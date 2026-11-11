import React, { useCallback, useEffect, useState } from 'react';
import { ImageSquare, MagnifyingGlass, PencilSimple, Plus, Tag, Trash } from '@phosphor-icons/react';
import api from '../api';
import { useUI } from '../components/UI';

const EMPTY = { name: '', price: '', stock: '', category: '', brand: '', frameType: '', material: '', description: '', image: '' };
const MAX_IMAGE = 1.5 * 1024 * 1024; // giới hạn 1,5 MB vì ảnh lưu base64 trong cơ sở dữ liệu miễn phí

// đọc file ảnh thành chuỗi base64 (bỏ phần "data:image/...;base64,")
function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const money = (n) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;

export default function Products() {
  const { toast, confirm } = useUI();
  const [products, setProducts] = useState(null);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [noPages, setNoPages] = useState(1);
  const [query, setQuery] = useState('');
  const [q, setQ] = useState(''); // từ khóa đã áp dụng sau khi người dùng ngừng gõ
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(async (p, keyword) => {
    const res = await api.get(`/products?page=${p}&q=${encodeURIComponent(keyword)}`);
    setProducts(res.data.products || []);
    setNoPages(res.data.noPages || 1);
    // xóa hết ở trang cuối thì lùi về trang trước
    if (res.data.products && res.data.products.length === 0 && p > 1) setPage(p - 1);
  }, []);

  useEffect(() => { load(page, q); }, [load, page, q]);
  useEffect(() => {
    api.get('/categories').then((res) => setCategories(Array.isArray(res.data) ? res.data : []));
  }, []);

  // tìm kiếm sau khi ngừng gõ 350 ms để không gọi máy chủ liên tục
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); setQ(query.trim()); }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const setField = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_IMAGE) return toast('Ảnh quá lớn, vui lòng chọn ảnh dưới 1,5 MB', 'error');
    setForm({ ...form, image: await readImage(file) });
  };

  const reset = () => { setForm(EMPTY); setErrors({}); setEditingId(null); setOpen(false); };

  const validate = () => {
    const err = {};
    if (!form.name.trim()) err.name = 'Vui lòng nhập tên sản phẩm';
    if (form.price === '' || !(Number(form.price) >= 0)) err.price = 'Giá phải là số từ 0 trở lên';
    if (form.stock === '' || !Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) err.stock = 'Tồn kho phải là số nguyên từ 0 trở lên';
    if (!form.category) err.category = 'Vui lòng chọn danh mục';
    return err;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const err = validate();
    setErrors(err);
    if (Object.keys(err).length) return;
    const body = { ...form, name: form.name.trim(), price: Number(form.price), stock: Number(form.stock) };
    try {
      const res = editingId ? await api.put(`/products/${editingId}`, body) : await api.post('/products', body);
      if (res.data.success === false) return toast(res.data.message, 'error');
      toast(editingId ? 'Đã cập nhật sản phẩm' : 'Đã thêm sản phẩm');
      reset();
      load(page, q);
    } catch {
      toast('Không lưu được, vui lòng thử lại', 'error');
    }
  };

  const handleEdit = (p) => {
    setEditingId(p._id);
    setErrors({});
    setForm({
      name: p.name || '', price: p.price ?? '', stock: p.stock ?? 0, category: p.category ? p.category._id : '',
      brand: p.brand || '', frameType: p.frameType || '', material: p.material || '', description: p.description || '', image: p.image || '',
    });
    setOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (p) => {
    const ok = await confirm({ title: 'Xóa sản phẩm?', message: `Sản phẩm "${p.name}" sẽ bị xóa khỏi cửa hàng và không khôi phục được. Các đơn đã đặt vẫn giữ nguyên.` });
    if (!ok) return;
    try {
      await api.delete(`/products/${p._id}`);
      toast('Đã xóa sản phẩm');
      if (editingId === p._id) reset();
      load(page, q);
    } catch {
      toast('Không xóa được, vui lòng thử lại', 'error');
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Sản phẩm</h1>
          <p className="muted">Mỗi trang hiển thị tối đa 8 sản phẩm, mới nhất ở đầu.</p>
        </div>
        {!open && <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={18} weight="bold" /> Thêm sản phẩm</button>}
      </div>

      {open && (
        <form className="card form-card" onSubmit={handleSave} noValidate>
          <h2>{editingId ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h2>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="pname">Tên sản phẩm</label>
              <input id="pname" className="input" value={form.name} onChange={setField('name')} aria-invalid={errors.name ? 'true' : undefined} />
              {errors.name && <p className="err" role="alert">{errors.name}</p>}
            </div>
            <div className="field">
              <label htmlFor="pprice">Giá (USD)</label>
              <input id="pprice" className="input mono" type="number" min="0" step="any" value={form.price} onChange={setField('price')} aria-invalid={errors.price ? 'true' : undefined} />
              {errors.price && <p className="err" role="alert">{errors.price}</p>}
            </div>
            <div className="field">
              <label htmlFor="pstock">Tồn kho</label>
              <input id="pstock" className="input mono" type="number" min="0" step="1" value={form.stock} onChange={setField('stock')} aria-invalid={errors.stock ? 'true' : undefined} />
              {errors.stock && <p className="err" role="alert">{errors.stock}</p>}
            </div>
            <div className="field">
              <label htmlFor="pcat">Danh mục</label>
              <select id="pcat" className="input" value={form.category} onChange={setField('category')} aria-invalid={errors.category ? 'true' : undefined}>
                <option value="">Chọn danh mục</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              {errors.category && <p className="err" role="alert">{errors.category}</p>}
            </div>
            <div className="field">
              <label htmlFor="pbrand">Thương hiệu</label>
              <input id="pbrand" className="input" value={form.brand} onChange={setField('brand')} placeholder="Ray-Ban, Oakley" />
            </div>
            <div className="field">
              <label htmlFor="pframe">Loại gọng</label>
              <input id="pframe" className="input" value={form.frameType} onChange={setField('frameType')} placeholder="Tròn, vuông, mắt mèo" />
            </div>
            <div className="field">
              <label htmlFor="pmat">Chất liệu</label>
              <input id="pmat" className="input" value={form.material} onChange={setField('material')} placeholder="Titan, nhựa, kim loại" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="pdesc">Mô tả</label>
            <textarea id="pdesc" className="input" rows="4" maxLength="2000" value={form.description} onChange={setField('description')} placeholder="Kích thước tròng, trọng lượng, phù hợp khuôn mặt nào..." style={{ height: 'auto', padding: '10px 12px', resize: 'vertical' }} />
          </div>
          <div className="field">
            <label htmlFor="pimg">Hình ảnh</label>
            <label className="drop" htmlFor="pimg">
              {form.image ? <img src={`data:image/jpeg;base64,${form.image}`} alt="Xem trước" /> : <span className="ph"><ImageSquare size={28} /></span>}
              <span><strong>{form.image ? 'Đổi ảnh' : 'Chọn ảnh sản phẩm'}</strong><span className="help">PNG hoặc JPG, dưới 1,5 MB</span></span>
              <input id="pimg" type="file" accept="image/*" onChange={handleImage} />
            </label>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" type="submit">{editingId ? 'Cập nhật' : 'Thêm sản phẩm'}</button>
            <button className="btn btn-ghost" type="button" onClick={reset}>Hủy</button>
          </div>
        </form>
      )}

      <div className="search-bar">
        <MagnifyingGlass size={18} />
        <label className="sr-only" htmlFor="psearch">Tìm sản phẩm</label>
        <input id="psearch" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm theo tên hoặc thương hiệu" />
      </div>

      <div className="card table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Sản phẩm</th><th>Danh mục</th><th>Loại gọng</th><th className="num">Giá</th><th className="num">Kho</th><th className="num" style={{ width: 110 }}>Thao tác</th></tr>
            </thead>
            <tbody>
              {products === null && [0, 1, 2].map((i) => (
                <tr key={i}><td colSpan="6"><div className="skeleton" style={{ height: 52 }} /></td></tr>
              ))}
              {products && products.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div className="cell-main">
                      {p.image ? <img className="thumb" src={`data:image/jpeg;base64,${p.image}`} alt="" /> : <span className="thumb blank"><ImageSquare size={22} /></span>}
                      <div><strong>{p.name}</strong><span className="muted">{p.brand}</span></div>
                    </div>
                  </td>
                  <td>{p.category ? p.category.name : <span className="muted">Chưa có</span>}</td>
                  <td>{p.frameType || <span className="muted">-</span>}</td>
                  <td className="num mono">{money(p.price)}</td>
                  <td className="num mono">{p.stock === 0 ? <span className="status canceled">Hết</span> : p.stock <= 5 ? <span className="status pending">{p.stock}</span> : p.stock}</td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn" onClick={() => handleEdit(p)} aria-label={`Sửa ${p.name}`} title="Sửa"><PencilSimple size={18} /></button>
                      <button className="icon-btn danger" onClick={() => handleDelete(p)} aria-label={`Xóa ${p.name}`} title="Xóa"><Trash size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {products && products.length === 0 && (
          <div className="empty">
            <Tag size={40} />
            <strong>{q ? 'Không có sản phẩm nào khớp' : 'Chưa có sản phẩm nào'}</strong>
            <span>{q ? 'Thử từ khóa ngắn hơn hoặc tên thương hiệu.' : 'Bấm Thêm sản phẩm để tạo sản phẩm đầu tiên.'}</span>
          </div>
        )}
        {noPages > 1 && (
          <div className="pager">
            <span>Trang {page} / {noPages}</span>
            <div className="pager-nums">
              {Array.from({ length: noPages }, (_, i) => i + 1).map((n) => (
                <button key={n} aria-current={n === page ? 'page' : undefined} aria-label={`Trang ${n}`} onClick={() => setPage(n)}>{n}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
