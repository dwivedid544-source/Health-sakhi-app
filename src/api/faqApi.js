import apiClient from './apiClient';

const faqApi = {
  getFaqs: async (params = {}) => {
    const res = await apiClient.get('/faqs', { params });
    return res.data;
  },
  getFaqById: async (id) => {
    const res = await apiClient.get(`/faqs/${id}`);
    return res.data;
  },
  submitFeedback: async (id, type) => {
    const res = await apiClient.post(`/faqs/${id}/feedback`, { type });
    return res.data;
  },
};

export default faqApi;
