import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE, POLL_INTERVAL } from '../utils/constants';

export function useAlerts(filters) {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({ total: 0, verified: 0, emerging: 0, flagged: 0, by_event_type: {} });
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBackendData = useCallback(async () => {
    try {
      // Build query params
      const params = new URLSearchParams();
      
      // We send multiple status/event_type as comma separated or multiple keys
      // Our simple flask backend expects a single string for now. Let's send the first selected one if any,
      // or we handle filtering on the frontend for multi-select to keep the backend simple.
      // Actually, since the backend expects a single status string, we'll fetch all and filter on the frontend for now,
      // or we can pass them. Let's fetch all and filter locally for multi-select.
      
      const [alertsRes, statsRes, clustersRes] = await Promise.all([
        axios.get(`${API_BASE}/alerts`),
        axios.get(`${API_BASE}/stats`),
        axios.get(`${API_BASE}/clusters`)
      ]);

      let fetchedAlerts = alertsRes.data;

      // Apply local filtering since the frontend allows multi-select arrays
      if (filters.status && filters.status.length > 0) {
        fetchedAlerts = fetchedAlerts.filter(a => filters.status.includes(a.status));
      }
      
      if (filters.eventType && filters.eventType.length > 0) {
        fetchedAlerts = fetchedAlerts.filter(a => filters.eventType.includes(a.event_type));
      }

      setAlerts(fetchedAlerts);
      setStats(statsRes.data);
      setClusters(clustersRes.data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Failed to connect to backend API");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    // Initial fetch
    fetchBackendData();
    
    // Setup polling
    const intervalId = setInterval(fetchBackendData, POLL_INTERVAL);
    
    return () => clearInterval(intervalId);
  }, [fetchBackendData]);

  return { alerts, stats, clusters, loading, error };
}
