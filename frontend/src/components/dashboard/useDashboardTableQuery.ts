'use client';

import { useCallback, useState, useSyncExternalStore } from 'react';
import type { SortState } from './DashboardDataTable';

function subscribe(callback: () => void) {
  window.addEventListener('popstate', callback);
  return () => window.removeEventListener('popstate', callback);
}

function browserSearch() { return window.location.search; }
function serverSearch() { return ''; }

// `kindParam` names the table's second filter in the URL — 'type' for most
// tables, but Events filters on a delivery-date 'window' instead.
export function useDashboardTableQuery(
  defaultSort: SortState = { field: 'created_at', dir: 'desc' },
  kindParam = 'type',
) {
  const searchString = useSyncExternalStore(subscribe, browserSearch, serverSearch);
  const params = new URLSearchParams(searchString);
  const status = params.get('status') || 'all';
  const kind = params.get(kindParam) || 'all';
  const search = params.get('search') || '';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const ordering = params.get('ordering') || `${defaultSort.dir === 'desc' ? '-' : ''}${defaultSort.field}`;
  const sort: SortState = { field: ordering.replace(/^-/, ''), dir: ordering.startsWith('-') ? 'desc' : 'asc' };
  const [draftSearch, setDraftSearch] = useState<string | null>(null);
  const query = draftSearch ?? search;
  const setQuery = (value: string) => setDraftSearch(value);

  const update = useCallback((changes: Record<string, string | number | null>) => {
    const next = new URLSearchParams(window.location.search);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === '' || value === 'all' || (key === 'page' && value === 1)) next.delete(key);
      else next.set(key, String(value));
    });
    const url = `${window.location.pathname}${next.size ? `?${next}` : ''}`;
    window.history.pushState(null, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);

  const setStatus = (value: string) => update({ status: value, page: null });
  const setKind = (value: string) => update({ [kindParam]: value, page: null });
  const setPage = (value: number | ((current: number) => number)) => update({ page: typeof value === 'function' ? value(page) : value });
  const submitSearch = () => { update({ search: query.trim(), page: null }); setDraftSearch(null); };
  const toggleSort = (field: string) => {
    const next: SortState = sort.field === field ? { field, dir: sort.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: field.includes('date') || field.endsWith('_at') ? 'desc' : 'asc' };
    update({ ordering: `${next.dir === 'desc' ? '-' : ''}${next.field}`, page: null });
  };
  const clear = () => { setDraftSearch(null); update({ status: null, [kindParam]: null, search: null, ordering: null, page: null }); };

  return { status, setStatus, kind, setKind, query, setQuery, search, sort, page, setPage, submitSearch, toggleSort, clear, ordering,
    isDirty: status !== 'all' || kind !== 'all' || search !== '' || ordering !== `${defaultSort.dir === 'desc' ? '-' : ''}${defaultSort.field}` };
}
