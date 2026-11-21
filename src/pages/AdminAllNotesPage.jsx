import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const AdminAllNotesPage = ({ onNavigateToPosts }) => {
  const { showStatus } = useAuth();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 9, total: 0, totalPages: 1 });
  const [ownerFilter, setOwnerFilter] = useState('');
  const [inputOwner, setInputOwner] = useState('');

  // Inspection modal
  const [inspectedNote, setInspectedNote] = useState(null);

  const fetchAllNotes = async (page = 1, owner = ownerFilter) => {
    setLoading(true);
    try {
      let url = `/api/notes?page=${page}&limit=${pagination.limit}`;
      if (owner.trim()) {
        url += `&owner=${encodeURIComponent(owner.trim())}`;
      }
      const res = await api(url);
      setNotes(res.data || []);
      setPagination(res.pagination || { page: 1, limit: pagination.limit, total: 0, totalPages: 1 });
    } catch (err) {
      showStatus(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllNotes(pagination.page, ownerFilter);
  }, [pagination.page, ownerFilter]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setOwnerFilter(inputOwner.trim());
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleClearFilter = () => {
    setInputOwner('');
    setOwnerFilter('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <main className="w-full pt-[114px] bg-[var(--bg-color)] min-h-[calc(100vh-64px)] pb-12 transition-colors duration-200">
      <div className="max-w-[1100px] mx-auto p-4 sm:p-6">
        <div className="flex flex-col w-full gap-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between pb-4 border-b border-[var(--card-border)] gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-[var(--primary)] text-xs font-semibold tracking-wider uppercase mb-1">
                <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                <span>Administrative Audit</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--text-color)]">All Notes</h1>
              <p className="text-sm text-[var(--text-muted)]">
                System-wide note vault inspection (read-only admin audit)
              </p>
            </div>

            <div className="flex items-center gap-2 bg-[var(--card-low)] px-3.5 py-1.5 rounded-xl border border-[var(--card-border)] self-start md:self-auto">
              <span className="w-2 h-2 rounded-full bg-[var(--tertiary)]"></span>
              <span className="text-xs font-medium text-[var(--text-color)]">
                Admin Clearance Active
              </span>
            </div>
          </div>

          {/* Owner Filter Bar */}
          <form
            onSubmit={handleFilterSubmit}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-[var(--card-bg)] p-4 rounded-xl border border-[var(--card-border)] shadow-xs"
          >
            <div className="relative flex-1">
              <input
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-[var(--card-low)] border border-[var(--card-border)] text-xs text-[var(--text-color)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] font-mono transition-colors"
                placeholder="Filter by Owner ObjectId (e.g. 64b1f...)..."
                value={inputOwner}
                onChange={(e) => setInputOwner(e.target.value)}
                type="text"
              />
              <span className="material-symbols-outlined text-[var(--text-muted)] absolute left-2.5 top-2.5 text-[18px]">
                fingerprint
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="h-10 px-5 rounded-full bg-[var(--primary)] text-[var(--primary-text)] text-xs font-medium flex items-center gap-1.5 shadow-sm hover:opacity-90 active:scale-95 transition-all whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[16px]">search</span>
                <span>Filter by Owner</span>
              </button>

              {ownerFilter && (
                <button
                  type="button"
                  onClick={handleClearFilter}
                  className="h-10 px-3.5 rounded-full bg-[var(--card-low)] text-[var(--text-color)] text-xs font-medium border border-[var(--card-border)] hover:bg-[var(--card-border)] transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                  <span>Clear</span>
                </button>
              )}
            </div>
          </form>

          {/* Active Filter Notification */}
          {ownerFilter && (
            <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-[var(--primary-light)]/40 border border-[var(--card-border)] text-xs text-[var(--text-color)]">
              <span>
                Filtered by Owner ID: <strong className="font-mono">{ownerFilter}</strong>
              </span>
              <span className="font-semibold">{pagination.total} Notes Found</span>
            </div>
          )}

          {/* Notes Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <span className="material-symbols-outlined text-3xl animate-spin text-[var(--primary)]">
                refresh
              </span>
              <span className="text-sm text-[var(--text-muted)]">Inspecting all vault notes...</span>
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[var(--card-low)] flex items-center justify-center text-[var(--text-muted)]">
                <span className="material-symbols-outlined text-[24px]">folder_off</span>
              </div>
              <span className="text-base font-semibold text-[var(--text-color)]">No notes found</span>
              <p className="text-xs text-[var(--text-muted)] max-w-sm">
                {ownerFilter
                  ? `No records found for owner ${ownerFilter}.`
                  : 'There are currently no notes in the database vault.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {notes.map((note) => (
                <div
                  key={note._id}
                  onClick={() => setInspectedNote(note)}
                  className="group bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-base text-[var(--text-color)] line-clamp-1 group-hover:text-[var(--primary)] transition-colors">
                        {note.title}
                      </h3>
                      <span className="material-symbols-outlined text-[18px] text-[var(--text-muted)] opacity-60">
                        visibility
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] line-clamp-3 leading-relaxed">
                      {note.content}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-[var(--card-border)]/60">
                    <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">person</span>
                        Owner:
                      </span>
                      <span className="font-mono bg-[var(--card-low)] px-1.5 py-0.5 rounded text-[10px] text-[var(--text-color)]">
                        {typeof note.owner === 'object' ? note.owner._id : note.owner}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                      <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                      <span className="text-[var(--primary)] font-medium">Inspect Note →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && notes.length > 0 && (
            <div className="flex items-center justify-between bg-[var(--card-bg)] px-4 py-3 rounded-xl border border-[var(--card-border)]">
              <span className="text-xs text-[var(--text-muted)]">
                Page {pagination.page} of {pagination.totalPages || 1} ({pagination.total} total notes)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 rounded-lg bg-[var(--card-low)] text-xs text-[var(--text-color)] border border-[var(--card-border)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--card-border)] transition-colors"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1 rounded-lg bg-[var(--card-low)] text-xs text-[var(--text-color)] border border-[var(--card-border)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--card-border)] transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inspect Note Read-Only Modal */}
      {inspectedNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] shadow-xl p-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-[var(--card-border)]">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-[var(--primary)] uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">lock_open</span>
                  Read-Only Inspection
                </span>
                <h3 className="text-xl font-bold text-[var(--text-color)]">{inspectedNote.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectedNote(null)}
                className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-color)]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-[var(--text-color)] uppercase">Content</span>
              <div className="p-4 rounded-xl bg-[var(--card-low)] text-sm text-[var(--text-color)] leading-relaxed whitespace-pre-wrap border border-[var(--card-border)] font-sans">
                {inspectedNote.content}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-[var(--card-low)] border border-[var(--card-border)]">
                <span className="text-[10px] text-[var(--text-muted)] uppercase">Note ID</span>
                <span className="font-mono text-[11px] text-[var(--text-color)] truncate">
                  {inspectedNote._id}
                </span>
              </div>
              <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-[var(--card-low)] border border-[var(--card-border)]">
                <span className="text-[10px] text-[var(--text-muted)] uppercase">Owner ID</span>
                <span className="font-mono text-[11px] text-[var(--text-color)] truncate">
                  {typeof inspectedNote.owner === 'object' ? inspectedNote.owner._id : inspectedNote.owner}
                </span>
              </div>
              <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-[var(--card-low)] border border-[var(--card-border)]">
                <span className="text-[10px] text-[var(--text-muted)] uppercase">Created At</span>
                <span className="text-[11px] text-[var(--text-color)]">
                  {new Date(inspectedNote.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-[var(--card-low)] border border-[var(--card-border)]">
                <span className="text-[10px] text-[var(--text-muted)] uppercase">Updated At</span>
                <span className="text-[11px] text-[var(--text-color)]">
                  {new Date(inspectedNote.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {onNavigateToPosts ? (
                <button
                  type="button"
                  onClick={() => {
                    const ownerId = typeof inspectedNote.owner === 'object' ? inspectedNote.owner._id : inspectedNote.owner;
                    setInspectedNote(null);
                    onNavigateToPosts(ownerId);
                  }}
                  className="px-4 py-2 rounded-full bg-[var(--card-low)] hover:bg-[var(--card-border)] text-xs text-[var(--text-color)] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">forum</span>
                  <span>View Author Posts</span>
                </button>
              ) : <div></div>}
              <button
                type="button"
                onClick={() => setInspectedNote(null)}
                className="px-5 py-2 rounded-full bg-[var(--primary)] text-[var(--primary-text)] text-xs font-medium cursor-pointer"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
