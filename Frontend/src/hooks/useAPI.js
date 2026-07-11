// ============================================================
// TRACE — Custom Hooks
// Wraps API calls with loading, error, and data state.
// src/hooks/useAPI.js
// ============================================================

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { casesAPI, alertsAPI, analyticsAPI, searchAPI, getToken } from "../api/client";

// ── Generic async hook ───────────────────────────────────────
export function useAsync(asyncFn, deps = [], runImmediately = true) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(runImmediately);
  const [error,   setError]   = useState(null);
  const mountedRef = useRef(true);
  const prevDepsStrRef = useRef(null);
  const asyncFnRef = useRef(asyncFn);

  useEffect(() => { 
    mountedRef.current = true; 
    return () => { mountedRef.current = false; }; 
  }, []);

  // Always keep asyncFnRef up to date
  asyncFnRef.current = asyncFn;

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFnRef.current(...args);
      if (mountedRef.current) setData(result);
      return result;
    } catch (err) {
      if (mountedRef.current) setError(err.message || "Something went wrong");
      throw err;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  // On first render, initialize deps
  if (prevDepsStrRef.current === null && runImmediately) {
    prevDepsStrRef.current = JSON.stringify(deps);
    execute();
  }

  // On every render, check if deps changed
  useEffect(() => {
    const depsStr = JSON.stringify(deps);
    if (depsStr !== prevDepsStrRef.current) {
      prevDepsStrRef.current = depsStr;
      if (runImmediately) {
        execute();
      }
    }
  }, []);

  return { data, loading, error, execute, setData };
}

// ── Cases ────────────────────────────────────────────────────
export function useCases(filters = {}) {
  const filtersStr = JSON.stringify(filters);
  const deps = useMemo(() => [filtersStr], [filtersStr]);
  return useAsync(
    () => casesAPI.list(filters),
    deps,
    true
  );
}

export function useCase(id) {
  return useAsync(
    () => casesAPI.get(id),
    [id],
    !!id
  );
}

export function useCreateCase() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const create = async (payload, photoFile = null) => {
    setLoading(true);
    setError(null);
    try {
      const newCase = await casesAPI.create(payload);
      if (photoFile) {
        await casesAPI.uploadPhoto(newCase.id, photoFile);
      }
      return newCase;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error };
}

// ── Face Search ──────────────────────────────────────────────
export function useFaceSearch() {
  const [results,  setResults]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [progress, setProgress] = useState(0);

  const search = async (file) => {
    setLoading(true);
    setError(null);
    setResults(null);
    setProgress(0);

    // Simulate progress while waiting for API (real scan takes 2-8s)
    const progressInterval = setInterval(() => {
      setProgress(p => {
        if (p >= 90) { clearInterval(progressInterval); return 90; }
        return p + Math.random() * 6 + 2;
      });
    }, 150);

    try {
      const data = await searchAPI.searchFace(file);
      clearInterval(progressInterval);
      setProgress(100);
      await new Promise(r => setTimeout(r, 300));
      setResults(data);
      return data;
    } catch (err) {
      clearInterval(progressInterval);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setResults(null); setError(null); setProgress(0); };

  return { search, results, loading, error, progress, reset };
}

// ── Alerts ───────────────────────────────────────────────────
export function useAlerts() {
  const hasToken = !!getToken();
  const { data, loading, error, execute, setData } = useAsync(
    () => alertsAPI.list(),
    [],
    hasToken // Only fetch if authenticated
  );

  const unreadCount = data?.filter(a => !a.is_read).length ?? 0;

  const markRead = async (id) => {
    await alertsAPI.markRead(id);
    setData(prev => prev?.map(a => a.id === id ? { ...a, is_read: true } : a));
  };

  const markAllRead = async () => {
    await alertsAPI.markAllRead();
    setData(prev => prev?.map(a => ({ ...a, is_read: true })));
  };

  return { alerts: data || [], loading, error, unreadCount, markRead, markAllRead, refresh: execute };
}

// ── Analytics ────────────────────────────────────────────────
export function useAnalytics() {
  return useAsync(() => analyticsAPI.get(), [], true);
}
