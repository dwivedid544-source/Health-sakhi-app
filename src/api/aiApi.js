import apiClient from './apiClient';

const aiApi = {
  // Create a new AI chat session (1:1 matching web frontend frontenhealth/src/api/aiApi.js)
  createSession: async (title = 'New Session') => {
    const response = await apiClient.post('/ai/chat', {
      message: 'Hello Sakhi'
    });
    return response.data;
  },

  // Get all AI chat sessions
  getSessions: async () => {
    const response = await apiClient.get('/ai/history');
    return response.data;
  },

  // Delete a specific AI chat session
  deleteSession: async (sessionId) => {
    const response = await apiClient.delete(`/ai/history/${sessionId}`);
    return response.data;
  },

  // Get messages for a specific session
  getMessages: async (sessionId) => {
    const response = await apiClient.get('/ai/history', {
      params: { session_id: sessionId }
    });
    return response.data;
  },

  // Send a message to the AI chat session
  sendMessage: async (sessionId, messageText, mode = null) => {
    const response = await apiClient.post('/ai/chat', {
      session_id: sessionId,
      message: messageText,
      mode: mode
    });
    return response.data;
  },

  // Execute a pending parsed action
  executeAction: async (actionId) => {
    const response = await apiClient.post('/ai/action', {
      action_id: actionId
    });
    return response.data;
  },

  // Get user long-term memories
  getMemories: async (category) => {
    const response = await apiClient.get('/ai/memories', {
      params: { category }
    });
    return response.data;
  }
};

export default aiApi;
