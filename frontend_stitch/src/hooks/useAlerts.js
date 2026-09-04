import { useState, useEffect } from 'react';
import { API_BASE, POLL_INTERVAL } from '../utils/constants';

export default function useAlerts(filters) {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const [alertsRes, statsRes, clustersRes] = await Promise.all([
        fetch(`${API_BASE}/alerts`),
        fetch(`${API_BASE}/stats`),
        fetch(`${API_BASE}/clusters`)
      ]);

      if (!alertsRes.ok || !statsRes.ok || !clustersRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const alertsData = await alertsRes.json();
      const statsData = await statsRes.json();
      const clustersData = await clustersRes.json();

      setAlerts(alertsData);
      setStats(statsData);
      setClusters(clustersData);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to connect to backend API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Client-side filtering
  const filteredAlerts = alerts.filter(alert => {
    const statusMatch = !filters.status || filters.status.length === 0 || filters.status.includes(alert.status);
    const typeMatch = !filters.event_type || filters.event_type.length === 0 || filters.event_type.includes(alert.event_type);
    return statusMatch && typeMatch;
  });

  return { alerts: filteredAlerts, stats, clusters, loading, error };
}
