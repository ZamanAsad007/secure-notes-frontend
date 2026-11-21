import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const AdminInterestsPage = ({ onNavigateToPosts }) => {
  const { showStatus } = useAuth();

  // Initialize page and interest filter from URL query params or sessionStorage
  const [initialParams] = useState(() => {
    let page = 1;
    let interest = '';
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const urlPage = parseInt(searchParams.get('page'), 10);
      if (Number.isInteger(urlPage) && urlPage > 0) {
        page = urlPage;
      } else {
        const savedPage = parseInt(sessionStorage.getItem('secure_notes_interests_page'), 10);
        if (Number.isInteger(savedPage) && savedPage > 0) {
          page = savedPage;
        }
      }

      const urlInterest = searchParams.get('interest');
      if (urlInterest && urlInterest.trim()) {
        interest = urlInterest.trim();
      }
    } catch {
      // ignore
    }
    return { page, interest };
  });

  const [interestGroups, setInterestGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: initialParams.page, limit: 6, total: 0, totalPages: 1 });
  const [filterQuery, setFilterQuery] = useState(initialParams.interest);
  const [appliedFilter, setAppliedFilter] = useState(initialParams.interest);
  const [refreshKey, setRefreshKey] = useState(0);

  // Sync URL search params and sessionStorage when page or applied filter changes
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      if (pagination.page > 1) {
        searchParams.set('page', String(pagination.page));
      } else {
        searchParams.delete('page');
      }

      if (appliedFilter.trim()) {
        searchParams.set('interest', appliedFilter.trim());
      } else {
        searchParams.delete('interest');
      }

      const newSearch = searchParams.toString();
      const newPath = window.location.pathname + (newSearch ? `?${newSearch}` : '');
      const currentFull = window.location.pathname + window.location.search;

      if (currentFull !== newPath) {
        window.history.replaceState({ ...window.history.state, page: pagination.page }, '', newPath);
      }

      sessionStorage.setItem('secure_notes_interests_page', String(pagination.page));
    } catch {
      // ignore
    }
  }, [pagination.page, appliedFilter]);

  // Sync state on browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const urlPage = parseInt(searchParams.get('page'), 10);
        const newPage = Number.isInteger(urlPage) && urlPage > 0 ? urlPage : 1;
        const newInterest = searchParams.get('interest') || '';

        setPagination((prev) => (prev.page === newPage ? prev : { ...prev, page: newPage }));
        setAppliedFilter(newInterest);
        setFilterQuery(newInterest);
      } catch {
        // ignore
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        let url = `/api/users/by-interests?page=${pagination.page}&limit=${pagination.limit}`;
        if (appliedFilter.trim()) {
          url += `&interest=${encodeURIComponent(appliedFilter.trim())}`;
        }
        const res = await api(url);
        if (active) {
          setInterestGroups(res.data || []);
          setPagination(res.pagination || { page: 1, limit: pagination.limit, total: 0, totalPages: 1 });
        }
      } catch (err) {
        if (active) showStatus(err.message, true);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [pagination.page, pagination.limit, appliedFilter, refreshKey, showStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setAppliedFilter(filterQuery.trim());
    setPagination((prev) => ({ ...prev, page: 1 }));
    refetch();
  };

  const handleClear = () => {
    setFilterQuery('');
    setLoading(true);
    setAppliedFilter('');
    setPagination((prev) => ({ ...prev, page: 1 }));
    refetch();
  };

  const handleQuickSelect = (tag) => {
    setFilterQuery(tag);
    setLoading(true);
    setAppliedFilter(tag);
    setPagination((prev) => ({ ...prev, page: 1 }));
    refetch();
  };

  const quickTags = ['cryptography', 'security', 'databases', 'chess', 'reading', 'travel'];

  return (
    <main className="w-full pt-[114px] bg-[var(--bg-color)] min-h-[calc(100vh-64px)] pb-12 transition-colors duration-200">
      <div className="max-w-[1100px] mx-auto p-4 sm:p-6">
        <div className="flex flex-col w-full gap-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between pb-4 border-b border-[var(--card-border)] gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-[var(--primary)] text-xs font-semibold uppercase tracking-wider mb-1">
                <span className="material-symbols-outlined text-[16px]">hub</span>
                <span>Directory Segmentation (Scenario 1)</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--text-color)]">
                Users by Interest
              </h1>
              <p className="text-sm text-[var(--text-muted)]">
                Aggregated community segmentation powered by index #2 (<code className="font-mono text-xs">interests_1</code>) and <code className="font-mono text-xs">$facet</code>
              </p>
            </div>

            {/* Quick Stat Telemetry Widget */}
            <div className="flex items-center gap-3 bg-[var(--card-low)] px-4 py-2 rounded-xl border border-[var(--card-border)] self-start md:self-auto">
              <span className="material-symbols-outlined text-[20px] text-[var(--primary)]">
                pie_chart
              </span>
              <div className="flex flex-col">
                <span className="text-[11px] text-[var(--text-muted)] font-medium">Distinct Interests</span>
                <span className="text-sm font-bold text-[var(--text-color)]">
                  {pagination.total} Categories
                </span>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4 shadow-xs flex flex-col gap-3">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <input
                  className="w-full h-10 pl-9 pr-3 rounded-lg bg-[var(--card-low)] border border-[var(--card-border)] text-xs text-[var(--text-color)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                  placeholder="Filter by interest name (e.g. chess, cryptography)..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  type="text"
                />
                <span className="material-symbols-outlined text-[var(--text-muted)] absolute left-2.5 top-2.5 text-[18px]">
                  search
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="h-10 px-5 rounded-full bg-[var(--primary)] text-[var(--primary-text)] text-xs font-medium flex items-center gap-1.5 shadow-sm hover:opacity-90 active:scale-95 transition-all whitespace-nowrap cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">filter_list</span>
                  <span>Filter Interests</span>
                </button>

                {appliedFilter && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="h-10 px-3.5 rounded-full bg-[var(--card-low)] text-[var(--text-color)] text-xs font-medium border border-[var(--card-border)] hover:bg-[var(--card-border)] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </form>

            {/* Quick Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[var(--card-border)]/60">
              <span className="text-[11px] text-[var(--text-muted)] mr-1">Suggested tags:</span>
              {quickTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleQuickSelect(tag)}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                    appliedFilter === tag
                      ? 'bg-[var(--primary)] text-[var(--primary-text)]'
                      : 'bg-[var(--card-low)] text-[var(--text-muted)] hover:text-[var(--text-color)] hover:bg-[var(--card-border)]'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Aggregation Results Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <span className="material-symbols-outlined text-3xl animate-spin text-[var(--primary)]">
                refresh
              </span>
              <span className="text-sm text-[var(--text-muted)]">Executing aggregation pipeline...</span>
            </div>
          ) : interestGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[var(--card-low)] flex items-center justify-center text-[var(--text-muted)]">
                <span className="material-symbols-outlined text-[24px]">interests</span>
              </div>
              <span className="text-base font-semibold text-[var(--text-color)]">No interest categories found</span>
              <p className="text-xs text-[var(--text-muted)] max-w-sm">
                {appliedFilter
                  ? `No user profiles match interest "${appliedFilter}".`
                  : 'No interests have been assigned to user profiles yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {interestGroups.map((group) => (
                <div
                  key={group.interest}
                  className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-5 shadow-xs flex flex-col justify-between gap-4"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-[var(--primary-light)] text-[var(--primary-light-text)] flex items-center justify-center text-xs font-bold">
                        #
                      </span>
                      <h3 className="font-bold text-base text-[var(--text-color)] capitalize">
                        {group.interest}
                      </h3>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[var(--card-low)] text-[var(--text-color)] text-xs font-semibold border border-[var(--card-border)]">
                      {group.userCount} {group.userCount === 1 ? 'User' : 'Users'}
                    </span>
                  </div>

                  {/* Users list chips */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      Members
                    </span>
                    <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                      {group.users?.map((usr) => (
                        <div
                          key={usr._id}
                          className="flex items-center justify-between p-2 rounded-lg bg-[var(--card-low)]/60 border border-[var(--card-border)] text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[var(--primary)] text-[var(--primary-text)] font-semibold text-[10px] flex items-center justify-center select-none">
                              {usr.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <span className="font-medium text-[var(--text-color)]">{usr.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-[var(--text-muted)] font-mono">
                              {usr.email}
                            </span>
                            {onNavigateToPosts && (
                              <button
                                type="button"
                                onClick={() => onNavigateToPosts(usr._id, usr.name)}
                                className="p-1 rounded-full hover:bg-[var(--card-bg)] text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors cursor-pointer"
                                title={`View posts by ${usr.name}`}
                              >
                                <span className="material-symbols-outlined text-[15px]">forum</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-2 border-t border-[var(--card-border)]/60 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                    <span>Index #2 Covered</span>
                    <span className="text-[var(--primary)] font-medium">Pipeline facet</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && interestGroups.length > 0 && (
            <div className="flex items-center justify-between bg-[var(--card-bg)] px-4 py-3 rounded-xl border border-[var(--card-border)]">
              <span className="text-xs text-[var(--text-muted)]">
                Showing {interestGroups.length} categories (Page {pagination.page} of {pagination.totalPages || 1})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }));
                  }}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 rounded-lg bg-[var(--card-low)] text-xs text-[var(--text-color)] border border-[var(--card-border)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--card-border)] transition-colors cursor-pointer"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
                  }}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1 rounded-lg bg-[var(--card-low)] text-xs text-[var(--text-color)] border border-[var(--card-border)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--card-border)] transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};
