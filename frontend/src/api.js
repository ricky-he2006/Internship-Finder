/**
 * API client for the InternFinder FastAPI backend.
 * Uses Vite dev proxy (proxy config in vite.config.js).
 */

const BASE_URL = '';

/**
 * Send a chat message to the backend agent.
 * @param {string} message - The user's message text.
 * @param {string} [sessionId] - Existing session ID (omitted for first message).
 * @param {string[]} [activeSkills] - Currently selected skills.
 * @returns {Promise<{reply: string, sessionId: string}>}
 */
export async function chat(message, sessionId, activeSkills) {
  try {
    const body = { message };
    if (sessionId) body.session_id = sessionId;
    if (activeSkills) body.active_skills = activeSkills;

    const res = await fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Chat API error: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    console.error('[API] chat failed:', error.message);
    throw error;
  }
}

/**
 * Parse a resume file and extract structured profile data.
 * @param {File} file - The resume file (.pdf or .txt).
 * @param {string} [sessionId] - Existing session ID.
 * @returns {Promise<{profile: object, sessionId: string}>}
 */
export async function parseResume(file, sessionId) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (sessionId) formData.append('session_id', sessionId);

    const res = await fetch(`${BASE_URL}/parse-resume`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Parse API error: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    console.error('[API] parseResume failed:', error.message);
    throw error;
  }
}

/**
 * Health check endpoint.
 * @returns {Promise<{status: string, service: string, version: string}>}
 */
export async function healthCheck() {
  try {
    const res = await fetch('/health');
    if (!res.ok) throw new Error(`Health check: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('[API] healthCheck failed:', error.message);
    throw error;
  }
}
