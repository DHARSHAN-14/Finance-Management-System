import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://10.98.223.213:4000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Refresh token on 401
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = data.data;

        await AsyncStorage.multiSet([
          ['accessToken', accessToken],
          ['refreshToken', newRefresh],
        ]);

        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        // Navigation to login handled in auth store
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
  me: () => api.get('/auth/me'),
  changePassword: (data: any) => api.put('/auth/change-password', data),
};

export const customerApi = {
  list: (params?: any) => api.get('/customers', { params }),
  getById: (id: string) => api.get(`/customers/${id}`),
  create: (data: any) => api.post('/customers', data),
  update: (id: string, data: any) => api.put(`/customers/${id}`, data),
  deactivate: (id: string) => api.patch(`/customers/${id}/deactivate`),
  getStats: (id: string) => api.get(`/customers/${id}/stats`),
  refreshScore: (id: string) => api.post(`/customers/${id}/refresh-score`),
};

export const loanApi = {
  list: (params?: any) => api.get('/loans', { params }),
  getById: (id: string) => api.get(`/loans/${id}`),
  getSchedule: (id: string) => api.get(`/loans/${id}/schedule`),
  create: (data: any) => api.post('/loans', data),
  approve: (id: string) => api.patch(`/loans/${id}/approve`),
  reject: (id: string) => api.patch(`/loans/${id}/reject`),
  disburse: (id: string, data: any) => api.patch(`/loans/${id}/disburse`, data),
  close: (id: string) => api.patch(`/loans/${id}/close`),
  getOverdue: () => api.get('/loans/overdue'),
  emiPreview: (principal: number, rate: number, tenure: number) =>
    api.get('/loans/emi-preview', { params: { principal, rate, tenure } }),
};

export const paymentApi = {
  list: (params?: any) => api.get('/payments', { params }),
  getById: (id: string) => api.get(`/payments/${id}`),
  record: (data: any) => api.post('/payments', data),
  getSummary: (customerId: string) => api.get(`/payments/customer/${customerId}/summary`),
};

export const chitApi = {
  list: (params?: any) => api.get('/chits', { params }),
  getById: (id: string) => api.get(`/chits/${id}`),
  create: (data: any) => api.post('/chits', data),
  myChits: () => api.get('/chits/my'),
  addMember: (chitId: string, data: any) => api.post(`/chits/${chitId}/members`, data),
  recordPayment: (chitId: string, instNo: number, data: any) =>
    api.post(`/chits/${chitId}/installments/${instNo}/payment`, data),
};

export const dashboardApi = {
  summary: () => api.get('/dashboard/summary'),
  activity: () => api.get('/dashboard/activity'),
  monthlyChart: () => api.get('/dashboard/monthly-chart'),
};

export const honestyApi = {
  myScore: () => api.get('/honesty-score/my-score'),
  mySuggestions: () => api.get('/honesty-score/my-suggestions'),
  getScore: (customerId: string) => api.get(`/honesty-score/${customerId}`),
  getHistory: (customerId: string) => api.get(`/honesty-score/${customerId}/history`),
  leaderboard: () => api.get('/honesty-score/leaderboard'),
};

export const notificationApi = {
  list: () => api.get('/notifications'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};
