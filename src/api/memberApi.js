import apiClient from './apiClient';

const memberApi = {
  // ── Profile ──────────────────────────────────────────────────────────────
  getProfile: async () => {
    const res = await apiClient.get('/members/profile');
    return res.data;
  },
  updateProfile: async (payload) => {
    const res = await apiClient.put('/members/profile', payload);
    return res.data;
  },

  // ── Dashboard ─────────────────────────────────────────────────────────────
  getDashboard: async () => {
    const res = await apiClient.get('/members/dashboard');
    return res.data;
  },

  // ── Subscriptions ─────────────────────────────────────────────────────────
  getSubscription: async () => {
    const res = await apiClient.get('/subscriptions/my');
    return res.data;
  },
  getPlans: async () => {
    const res = await apiClient.get('/subscriptions/plans');
    return res.data;
  },
  createOrder: async (payload) => {
    const res = await apiClient.post('/subscriptions/order', payload);
    return res.data;
  },
  verifyPayment: async (payload) => {
    const res = await apiClient.post('/subscriptions/verify', payload);
    return res.data;
  },
  recordFailure: async (payload) => {
    const res = await apiClient.post('/subscriptions/failure', payload);
    return res.data;
  },
  cancelSubscription: async () => {
    const res = await apiClient.post('/subscriptions/cancel');
    return res.data;
  },
  validateCoupon: async (payload) => {
    const res = await apiClient.post('/subscriptions/coupon/validate', payload);
    return res.data;
  },
  getInvoice: async (id) => {
    const res = await apiClient.get(`/subscriptions/invoice/${id}`);
    return res.data;
  },

  // ── Notifications / Admin Messages ───────────────────────────────────────
  getNotifications: async () => {
    const res = await apiClient.get('/notifications');
    return res.data;
  },
  markAllNotificationsRead: async () => {
    const res = await apiClient.patch('/notifications/read-all');
    return res.data;
  },
  sendNotificationReply: async (message, title) => {
    const res = await apiClient.post('/notifications/reply', { message, title });
    return res.data;
  },
  deleteNotification: async (id) => {
    const res = await apiClient.delete(`/notifications/${id}`);
    return res.data;
  },

  // ── Certificates ─────────────────────────────────────────────────────────
  getCertificates: async () => {
    const res = await apiClient.get('/certificates');
    return res.data;
  },
  checkCertificates: async () => {
    const res = await apiClient.post('/certificates/check');
    return res.data;
  },

  // ── Rewards ──────────────────────────────────────────────────────────────
  getRewards: async () => {
    try {
      const subRes = await apiClient.get('/subscriptions/my');
      const moodRes = await apiClient.get('/members/mood');
      const points = subRes.data?.subscription?.rewardPoints || subRes.subscription?.rewardPoints || 0;
      const history = (moodRes.data?.moodLogs || moodRes.moodLogs || []).map(m => ({
        id: m.id,
        title: 'Daily Mood Check-in',
        points: 10,
        createdAt: m.createdAt
      }));
      return { points, history, data: { points, history } };
    } catch (e) {
      return { points: 0, history: [], data: { points: 0, history: [] } };
    }
  },

  // ── Todos ─────────────────────────────────────────────────────────────────
  getTodos: async () => {
    try {
      const res = await apiClient.get('/todos');
      return res.data;
    } catch (e) { return { todos: [] }; }
  },

  // ── Transactions ──────────────────────────────────────────────────────────
  getTransactions: async () => {
    try {
      const res = await apiClient.get('/budget/transactions');
      return res.data;
    } catch (e) { return { transactions: [] }; }
  },

  // ── Mood Logs ─────────────────────────────────────────────────────────────
  getMoodLogs: async () => {
    try {
      const res = await apiClient.get('/members/mood');
      return res.data;
    } catch (e) { return { moodLogs: [] }; }
  },

  // ── Subscription Renew ────────────────────────────────────────────────────
  renewSubscription: async () => {
    const res = await apiClient.post('/subscriptions/renew');
    return res.data;
  },
};

export default memberApi;

