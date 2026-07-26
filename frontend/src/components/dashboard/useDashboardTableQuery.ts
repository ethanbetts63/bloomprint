'use client';

import { useState } from 'react';
import type { SortState } from './DashboardDataTable';

export function useDashboardTableQuery(defaultSort: SortState = { field: 'created_at', dir: 'desc' }) {
  const [status, setStatusValue] = useState('all');
  const [kind, setKindValue] = useState('all');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState(defaultSort);
  const [page, setPage] = useState(1);
  const setStatus = (value: string) => { setStatusValue(value); setPage(1); };
  const setKind = (value: string) => { setKindValue(value); setPage(1); };
  const submitSearch = () => { setSearch(query.trim()); setPage(1); };
  const toggleSort = (field: string) => {
    setPage(1);
    setSort((current) => current.field === field ? { field, dir: current.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: field.includes('date') || field.endsWith('_at') ? 'desc' : 'asc' });
  };
  const clear = () => { setStatusValue('all'); setKindValue('all'); setQuery(''); setSearch(''); setSort(defaultSort); setPage(1); };
  return { status, setStatus, kind, setKind, query, setQuery, search, sort, page, setPage, submitSearch, toggleSort, clear,
    ordering: `${sort.dir === 'desc' ? '-' : ''}${sort.field}`,
    isDirty: status !== 'all' || kind !== 'all' || search !== '' || sort.field !== defaultSort.field || sort.dir !== defaultSort.dir };
}
