import type { WorkflowRecording, WorkflowSummary, CustomPrompt } from '../types';

const API_BASE_URL = '/api'; // Assuming the API is served from the same origin

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export const apiService = {
  startRecording: (): Promise<WorkflowRecording> => {
    return request(`${API_BASE_URL}/recordings/start`, { method: 'POST' });
  },

  stopRecording: (): Promise<WorkflowRecording> => {
    return request(`${API_BASE_URL}/recordings/stop`, { method: 'POST' });
  },

  getRecordings: (): Promise<WorkflowRecording[]> => {
    return request(`${API_BASE_URL}/recordings`);
  },

  getRecordingById: (id: string): Promise<WorkflowRecording> => {
    return request(`${API_BASE_URL}/recordings/${id}`);
  },

  getSummaries: (): Promise<WorkflowSummary[]> => {
    return request(`${API_BASE_URL}/summaries`);
  },

  getSummaryByRecordingId: (recordingId: string): Promise<WorkflowSummary> => {
    return request(`${API_BASE_URL}/summaries/${recordingId}`);
  },

  getPrompts: (): Promise<CustomPrompt[]> => {
    return request(`${API_BASE_URL}/prompts`);
  },

  createPrompt: (prompt: CustomPrompt): Promise<CustomPrompt> => {
    return request(`${API_BASE_URL}/prompts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prompt),
    });
  },

  updatePrompt: (id: string, prompt: CustomPrompt): Promise<CustomPrompt> => {
    return request(`${API_BASE_URL}/prompts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prompt),
    });
  },

  deletePrompt: (id: string): Promise<void> => {
    return request(`${API_BASE_URL}/prompts/${id}`, { method: 'DELETE' });
  },
};
