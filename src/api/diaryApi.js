import apiClient from './apiClient';
import { downloadAndOpenPdf } from '../utils/pdfDownloadService';

const diaryApi = {
  // GET /api/v1/diary
  getEntries: async () => {
    const res = await apiClient.get('/diary');
    return res.data;
  },

  // POST /api/v1/diary
  createEntry: async (payload) => {
    const res = await apiClient.post('/diary', payload);
    return res.data;
  },

  // POST /api/v1/diary (update entry)
  updateEntry: async (id, payload) => {
    const res = await apiClient.post('/diary', payload);
    return res.data;
  },

  // DELETE /api/v1/diary/:id
  deleteEntry: async (id) => {
    const res = await apiClient.delete(`/diary/${id}`);
    return res.data;
  },

  // Real PDF Report generation and native file save/open
  downloadReport: async (params = {}) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const filename = `Health_Sakhi_Diary_Report_${todayStr}.pdf`;
    return await downloadAndOpenPdf({
      endpoint: '/diary/report/download',
      params,
      filename,
      dialogTitle: 'Health Sakhi Clinical Diary Report'
    });
  }
};

export default diaryApi;
