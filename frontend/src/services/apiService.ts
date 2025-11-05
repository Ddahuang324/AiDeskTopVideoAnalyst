
import { ActivityCard, Observation } from "./geminiService";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

/**
 * Uploads a single video chunk to the backend.
 * @param {Blob} chunk The video chunk to upload.
 * @returns {Promise<any>} The response from the server.
 */
export const uploadVideoChunk = async (chunk: Blob): Promise<any> => {
  const formData = new FormData();
  formData.append('chunk', chunk, `chunk-${Date.now()}.webm`);

  try {
    const response = await fetch(`${API_BASE_URL}/api/analysis/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to upload video chunk.');
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading video chunk:', error);
    throw error;
  }
};

/**
 * Signals the backend to start the analysis process.
 * @returns {Promise<{ observations: Observation[]; activityCards: ActivityCard[] }>} The analysis result.
 */
export const startAnalysis = async (): Promise<{ observations: Observation[]; activityCards: ActivityCard[] }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analysis/analyze`, {
      method: 'POST',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to start analysis.');
    }

    return await response.json();
  } catch (error) {
    console.error('Error starting analysis:', error);
    throw error;
  }
};
