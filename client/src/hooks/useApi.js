import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Custom hook for making API calls with loading and error states
 * @param {function} apiFunction - The API function to call
 * @param {boolean} immediate - Whether to call the API immediately
 * @param {array} initialArgs - Initial arguments for the API function
 * @returns {object} API state and handlers
 */
const useApi = (apiFunction, immediate = false, initialArgs = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [called, setCalled] = useState(false);

  // Use a ref to store the apiFunction to prevent unnecessary re-renders
  const apiFunctionRef = useRef(apiFunction);

  // Update the ref if apiFunction changes
  useEffect(() => {
    apiFunctionRef.current = apiFunction;
  }, [apiFunction]);

  // Execute API call
  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    setCalled(true);

    try {
      // Use the ref to get the latest apiFunction
      const result = await apiFunctionRef.current(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies needed since we're using a ref

  // Reset state
  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
    setCalled(false);
  }, []);

  // Call API immediately if immediate is true
  useEffect(() => {
    let isMounted = true;

    if (immediate && !called) {
      (async () => {
        try {
          // Only set state if component is still mounted
          if (isMounted) {
            await execute(...initialArgs);
          }
        } catch (error) {
          // Error is already handled in execute function
        }
      })();
    }

    return () => {
      isMounted = false;
    };
  }, [immediate, called, execute, initialArgs]);

  return {
    data,
    loading,
    error,
    called,
    execute,
    reset,
  };
};

export default useApi;
