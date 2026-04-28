import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';
const SERVER_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Функция для получения полного URL для загруженных файлов
export const getAssetUrl = (path) => {
  if (!path) return null;
  // Если путь уже полный URL, возвращаем как есть
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // Если путь начинается с /uploads/, добавляем URL сервера
  if (path.startsWith('/uploads/')) {
    return `${SERVER_URL}${path}`;
  }
  // Для base64 и других случаев возвращаем как есть
  return path;
};

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  updateMe: (data) => api.put('/users/me', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export const eventsAPI = {
  getAll: (params) => api.get('/events', { params }),
  getById: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  participate: (id) => api.post(`/events/${id}/participate`),
  cancelParticipation: (id) => api.delete(`/events/${id}/participate`),
  getParticipants: (id) => api.get(`/events/${id}/participants`),
};

export const postsAPI = {
  getAll: () => api.get('/posts'),
  create: (data, config) => api.post('/posts', data, config),
  update: (id, data, config) => api.put(`/posts/${id}`, data, config),
  delete: (id) => api.delete(`/posts/${id}`),
};

export default api;
