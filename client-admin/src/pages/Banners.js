import React, { useCallback, useEffect, useState } from 'react';
import { Eye, EyeSlash, Image as ImageIcon, PencilSimple, Plus, Trash } from '@phosphor-icons/react';
import api from '../api';
import { useUI } from '../components/UI';

const EMPTY = { title: '', subtitle: '', cta: '', link: '', sortOrder: 0, active: true, image: '' };
const MAX_IMAGE = 2.5 * 1024 * 1024;

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Banners() {
  const { toast, confirm } = useUI();
  const [banners, setBanners] = useState(null);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const res = await api.get('/banners');
    setBanners(Array.isArray(res.data) ? res.data : []);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get('/categories').then((res) => setCategories(Array.isArray(res.data) ? res.data : []));
  }, []);

  const setField = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_IMAGE) return toast('Ảnh quá lớn, vui lòng chọn ảnh dưới 2,5 MB', 'error');
    setForm({ ...form, image: await readImage(file) });
  };

  const reset = () => { setForm(EMPTY); setErrors({}); setEditingId(null); setOpen(false); };

  const handleSave = async (e) => {
    e.preventDefault();
    const err = {};
    if (!form.title.trim()) err.title = 'Vui lòng nhập tiêu đề';
    if (!form.image) err.image = 'Vui lòng chọn ảnh banner';
    if (form.link && !/^(\/(?!\/)|https?:\/\/)/.test(form.link.trim())) err.link = 'Liên kết phải bắt đầu bằng / hoặc http';
    setErrors(err);
    if (Object.keys(err).length) return;
    const body = { ...form, title: form.title.trim(), link: form.link.trim(), sortOrder: Number(form.sortOrder) || 0 };
    try {
      const res = editingId ? await api.put(`/banners/${editingId}`, body) : await api.post('/banners', body);
      if (res.data.success === false) return toast(res.data.message, 'error');
      toast(editingId ? 'Đã cập nhật banner' : 'Đã thêm banner');
      reset();
      load();
    } catch {
      toast('Không lưu được, vui lòng thử lại', 'error');
    }
  };

  const handleEdit = (b) => {
    setEditingId(b._id);
    setErrors({});
    setForm({ title: b.title || '', subtitle: b.subtitle || '', cta: b.cta || '', link: b.link || '', sortOrder: b.sortOrder ?? 0, active: b.active !== false, image: b.image || '' });
    setOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggle = async (b) => {
    try {
      const res = await api.put(`/banners/active/${b._id}`, { active: !b.active });
      if (res.data.success) toast(b.active ? 'Đã ẩn banner' : 'Đã hiện banner');
      else toast(res.data.message, 'error');
      load();
    } catch {
      toast('Không cập nhật được, vui lòng thử lại', 'error');
    }
  };

  const handleDelete = async (b) => {
    const ok = await confirm({ title: 'Xóa banner?', message: `Banner "${b.title}" sẽ bị xóa khỏi trang chủ và không khôi phục được.` });
    if (!ok) return;
    try {
      await api.delete(`/banners/${b._id}`);
      toast('Đã xóa banner');
      if (editingId === b._id) reset();
      load();
    } catch {
      toast('Không xóa được, vui lòng thử lại', 'error');
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Banner</h1>
          <p className="muted">Banner chạy ở đầu trang chủ theo thứ tự số nhỏ trước. Ảnh nên có tỉ lệ ngang khoảng 8:3, ví dụ 1600 x 600.</p>
        </div>
        {!open && <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={18} weight="bold" /> Thêm banner</button>}
      </div>

      {open && (
        <form className="card form-card" onSubmit={handleSave} noValidate>
          <h2>{editingId ? 'Sửa banner' : 'Thêm banner'}</h2>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="btitle">Tiêu đề</label>
              <input id="btitle" className="input" value={form.title} onChange={setField('title')} maxLength="80" aria-invalid={errors.title ? 'true' : undefined} />
              {errors.title && <p className="err" role="alert">{errors.title}</p>}
            </div>
            <div className="field">
              <label htmlFor="bsub">Dòng phụ</label>
              <input id="bsub" className="input" value={form.subtitle} onChange={setField('subtitle')} maxLength="160" />
            </div>
            <div className="field">
              <label htmlFor="bcta">Chữ trên nút</label>
              <input id="bcta" className="input" value={form.cta} onChange={setField('cta')} maxLength="30" placeholder="Xem ngay" />
            </div>
            <div className="field">
              <label htmlFor="border">Thứ tự hiển thị</label>
              <input id="border" className="input mono" type="number" value={form.sortOrder} onChange={setField('sortOrder')} />
            </div>
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="blink">Liên kết khi bấm</label>
              <input id="blink" className="input" value={form.link} onChange={setField('link')} placeholder="/product/category/..." aria-invalid={errors.link ? 'true' : undefined} />
              {errors.link && <p className="err" role="alert">{errors.link}</p>}
            </div>
            <div className="field">
              <label htmlFor="bpick">Chọn nhanh liên kết</label>
              <select id="bpick" className="input" value="" onChange={(e) => e.target.value && setForm({ ...form, link: e.target.value })}>
                <option value="">Chọn trang đích</option>
                <option value="/">Trang chủ</option>
                {categories.map((c) => <option key={c._id} value={`/product/category/${c._id}`}>Danh mục: {c.name}</option>)}
              </select>
            </div>
          </div>
          <label className="check"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Hiển thị trên trang chủ</label>
          <div className="field">
            <label htmlFor="bimg">Ảnh banner</label>
            <label className="drop" htmlFor="bimg">
              {form.image ? <img src={`data:image/jpeg;base64,${form.image}`} alt="Xem trước" style={{ width: 160, height: 60, objectFit: 'cover' }} /> : <span className="ph"><ImageIcon size={28} /></span>}
              <span><strong>{form.image ? 'Đổi ảnh' : 'Chọn ảnh banner'}</strong><span className="help">PNG hoặc JPG, dưới 2,5 MB. Chữ tiêu đề nằm bên trái ảnh nên để trống phần này.</span></span>
              <input id="bimg" type="file" accept="image/*" onChange={handleImage} />
            </label>
            {errors.image && <p className="err" role="alert">{errors.image}</p>}
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" type="submit">{editingId ? 'Cập nhật' : 'Thêm banner'}</button>
            <button className="btn btn-ghost" type="button" onClick={reset}>Hủy</button>
          </div>
        </form>
      )}

      <div className="card table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Banner</th><th>Liên kết</th><th className="num">Thứ tự</th><th>Trạng thái</th><th className="num" style={{ width: 140 }}>Thao tác</th></tr>
            </thead>
            <tbody>
              {banners === null && [0, 1].map((i) => <tr key={i}><td colSpan="5"><div className="skeleton" style={{ height: 56 }} /></td></tr>)}
              {banners && banners.map((b) => (
                <tr key={b._id}>
                  <td>
                    <div className="cell-main">
                      <img className="thumb wide" src={`data:image/jpeg;base64,${b.image}`} alt="" />
                      <div><strong>{b.title}</strong><span className="muted">{b.subtitle}</span></div>
                    </div>
                  </td>
                  <td className="muted">{b.link || '-'}</td>
                  <td className="num mono">{b.sortOrder}</td>
                  <td><span className={`status ${b.active ? 'approved' : 'pending'}`}>{b.active ? 'Đang hiện' : 'Đang ẩn'}</span></td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn" onClick={() => toggle(b)} aria-label={b.active ? `Ẩn ${b.title}` : `Hiện ${b.title}`} title={b.active ? 'Ẩn' : 'Hiện'}>{b.active ? <EyeSlash size={18} /> : <Eye size={18} />}</button>
                      <button className="icon-btn" onClick={() => handleEdit(b)} aria-label={`Sửa ${b.title}`} title="Sửa"><PencilSimple size={18} /></button>
                      <button className="icon-btn danger" onClick={() => handleDelete(b)} aria-label={`Xóa ${b.title}`} title="Xóa"><Trash size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {banners && banners.length === 0 && (
          <div className="empty">
            <ImageIcon size={40} />
            <strong>Chưa có banner nào</strong>
            <span>Khi chưa có banner, trang chủ hiện phần giới thiệu mặc định.</span>
          </div>
        )}
      </div>
    </div>
  );
}
