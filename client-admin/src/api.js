import axios from 'axios';

const TOKEN_KEY = 'admin-token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

const api = axios.create({ baseURL: '/api/admin' });

// mọi request đều kèm token nếu đã đăng nhập
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers['x-access-token'] = token;
  return config;
});

// máy chủ báo token thiếu hoặc hết hạn thì phát sự kiện để AuthContext đăng xuất
api.interceptors.response.use((res) => {
  const d = res.data;
  if (d && d.success === false && typeof d.message === 'string' && d.message.startsWith('Auth token') && getToken()) {
    window.dispatchEvent(new Event('auth-expired'));
  }
  return res;
});

export default api;
