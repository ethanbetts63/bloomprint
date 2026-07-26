"use client";
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getAdminUsers } from '@/api/admin';
import type { AdminUser } from '@/types/AdminUser';
import { Loader2, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import UnifiedSummaryCard from '@/components/order/UnifiedSummaryCard';
import SummarySection from '@/components/SummarySection';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { errorMessage } from '@/lib/errors';

type SortKey = 'name' | 'email' | 'plans' | 'joined';
type SortDir = 'asc' | 'desc';

function formatDate(dtStr: string): string {
  return new Date(dtStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function sortUsers(users: AdminUser[], key: SortKey, dir: SortDir): AdminUser[] {
  const mul = dir === 'asc' ? 1 : -1;
  return [...users].sort((a, b) => {
    if (key === 'name') {
      const av = `${a.last_name} ${a.first_name}`.toLowerCase();
      const bv = `${b.last_name} ${b.first_name}`.toLowerCase();
      return av.localeCompare(bv) * mul;
    }
    if (key === 'email') {
      return a.email.localeCompare(b.email) * mul;
    }
    if (key === 'plans') {
      return (a.plan_count - b.plan_count) * mul;
    }
    if (key === 'joined') {
      return (new Date(a.date_joined).getTime() - new Date(b.date_joined).getTime()) * mul;
    }
    return 0;
  });
}

const SortIcon = ({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) => {
  if (col !== sortKey) return <ChevronsUpDown className="inline h-3 w-3 ml-1 text-black/20" />;
  return sortDir === 'asc'
    ? <ChevronUp className="inline h-3 w-3 ml-1" />
    : <ChevronDown className="inline h-3 w-3 ml-1" />;
};

const AdminUserListPage = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('joined');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setActiveSearch(searchInput), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    getAdminUsers(activeSearch || undefined)
      .then((result) => { if (!cancelled) { setUsers(result); setError(null); } })
      .catch((e) => { if (!cancelled) setError(errorMessage(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeSearch]);

  function handleSort(col: SortKey) {
    if (col === sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(col);
      setSortDir('asc');
    }
  }

  const sorted = sortUsers(users, sortKey, sortDir);

  return (
    <div style={{ backgroundColor: 'var(--color4)' }} className="min-h-screen py-0 md:py-12 px-0 md:px-4">
      <div className="container mx-auto max-w-5xl">
        <UnifiedSummaryCard
          title="Users"
          description="All registered user accounts."
        >
          <SummarySection label="Search">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Name or email…"
              className="w-full sm:max-w-sm px-3 py-2 text-sm border border-black/15 rounded-lg bg-white placeholder:text-black/30 focus:outline-none focus:ring-1 focus:ring-black/20"
            />
          </SummarySection>

          <SummarySection label={`Results (${users.length})`}>
            {loading ? (
              <div className="py-8 flex items-center justify-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-black/20" />
                <span className="text-sm text-black/40">Loading…</span>
              </div>
            ) : error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : sorted.length === 0 ? (
              <p className="text-sm text-black/40 italic">No users found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-black/5">
                    <TableHead
                      className="cursor-pointer select-none text-xs font-bold tracking-[0.15em] uppercase text-black/50"
                      onClick={() => handleSort('name')}
                    >
                      Name <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none text-xs font-bold tracking-[0.15em] uppercase text-black/50"
                      onClick={() => handleSort('email')}
                    >
                      Email <SortIcon col="email" sortKey={sortKey} sortDir={sortDir} />
                    </TableHead>
                    <TableHead className="text-xs font-bold tracking-[0.15em] uppercase text-black/50">
                      Tags
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none text-xs font-bold tracking-[0.15em] uppercase text-black/50 text-right"
                      onClick={() => handleSort('plans')}
                    >
                      Plans <SortIcon col="plans" sortKey={sortKey} sortDir={sortDir} />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none text-xs font-bold tracking-[0.15em] uppercase text-black/50"
                      onClick={() => handleSort('joined')}
                    >
                      Joined <SortIcon col="joined" sortKey={sortKey} sortDir={sortDir} />
                    </TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((user) => (
                    <TableRow key={user.id} className="border-black/5">
                      <TableCell>
                        <p className="font-semibold text-black text-sm">
                          {user.first_name} {user.last_name}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-black/60">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.is_superuser && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">Admin</span>
                          )}
                          {user.is_staff && !user.is_superuser && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Staff</span>
                          )}
                          {user.is_partner && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">Partner</span>
                          )}
                          {!user.is_active && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Inactive</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-black text-right">
                        {user.plan_count}
                      </TableCell>
                      <TableCell className="text-sm text-black/50">
                        {formatDate(user.date_joined)}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/admin/users/${user.id}`}
                          className="text-xs px-3 py-1.5 rounded border border-black/20 hover:bg-black/5 text-black/70 whitespace-nowrap"
                        >
                          View
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </SummarySection>
        </UnifiedSummaryCard>
      </div>
    </div>
  );
};

export default AdminUserListPage;
