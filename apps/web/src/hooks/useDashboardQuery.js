import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

export function useDashboardQuery(url, params = {}, interval = 5000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stringify params to prevent infinite loop of object references in useEffect dependencies
  const paramsString = JSON.stringify(params);
  
  // Track parameters to check if they changed (to set loading state)
  const lastParamsRef = useRef(paramsString);

  const fetchData = useCallback(async (isFirstLoad = false) => {
    if (isFirstLoad) {
      setLoading(true);
    }
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(url, {
        params: JSON.parse(paramsString),
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
      setError(null);
    } catch (err) {
      console.error(`Error fetching dashboard url ${url}:`, err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [url, paramsString]);

  useEffect(() => {
    let active = true;
    
    // If query params changed, show loading spinner immediately
    if (lastParamsRef.current !== paramsString) {
      setLoading(true);
      lastParamsRef.current = paramsString;
    }

    const runner = async () => {
      if (active) {
        await fetchData();
      }
    };

    fetchData(true);
    const timer = setInterval(runner, interval);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [url, paramsString, interval, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true)
  };
}
