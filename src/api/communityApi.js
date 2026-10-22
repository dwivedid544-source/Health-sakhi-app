import apiClient from './apiClient';

const communityApi = {
  getCircles: async () => {
    const res = await apiClient.get('/community/circles');
    return res.data;
  },
  getCircleMessages: async (circleId) => {
    const res = await apiClient.get(`/community/circles/${circleId}/messages`);
    return res.data;
  },
  sendMessage: async (circleId, payload) => {
    const res = await apiClient.post(`/community/circles/${circleId}/messages`, payload);
    return res.data;
  },
  joinCircle: async (circleId) => {
    const res = await apiClient.post(`/community/circles/${circleId}/join`);
    return res.data;
  },
  leaveCircle: async (circleId) => {
    const res = await apiClient.post(`/community/circles/${circleId}/leave`);
    return res.data;
  },
};

export default communityApi;
