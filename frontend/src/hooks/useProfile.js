import { useState, useCallback } from 'react';
import { parseResume as apiParseResume } from '../api';

/**
 * Hook managing resume upload and profile state.
 *
 * @returns {{ profile, isUploading, uploadComplete, error, parseResume, reset }}
 */
export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Upload a resume file for parsing.
   * @param {File} file
   * @param {string} sessionId
   * @returns {Promise<void>}
   */
  const parseResume = useCallback(async (file, sessionId) => {
    setIsUploading(true);
    setError(null);
    setUploadComplete(false);

    try {
      const result = await apiParseResume(file, sessionId);
      setProfile(result.profile);
      setUploadComplete(true);
    } catch (err) {
      console.error('[useProfile] parseResume failed:', err.message);
      setError(err.message || 'Resume parsing failed.');
    } finally {
      setIsUploading(false);
    }
  }, []);

  /**
   * Clear profile state.
   */
  const reset = useCallback(() => {
    setProfile(null);
    setUploadComplete(false);
    setError(null);
  }, []);

  return { profile, isUploading, uploadComplete, error, parseResume, reset };
}
