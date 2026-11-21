import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const NotesPage = () => {
  const { user, showStatus } = useAuth();

  const [notes, setNotes] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 9, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('new'); // 'new' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [saving, setSaving] = useState(false);

  // Preview modal
  const [previewNote, setPreviewNote] = useState(null);

  // Delete modal
  const [deletingNote, setDeletingNote] = useState(null);

  const refetch = useCallback(() => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const ownerParam = user?._id ? `&owner=${user._id}` : '&owner=me';
        const res = await api(`/api/notes?page=${pagination.page}&limit=${pagination.limit}${ownerParam}`);
        if (active) {
          setNotes(res.data || []);
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
  }, [pagination.page, pagination.limit, user?._id, refreshKey, showStatus]);

  const openNewDialog = () => {
    setDialogMode('new');
    setEditingId(null);
    setNoteTitle('');
    setNoteContent('');
    setDialogOpen(true);
  };

  const openEditDialog = (note) => {
    setDialogMode('edit');
    setEditingId(note._id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setDialogOpen(true);
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) {
      showStatus('Please provide both title and content.', true);
      return;
    }

    setSaving(true);
    try {
      if (dialogMode === 'new') {
        await api('/api/notes', {
          method: 'POST',
          body: JSON.stringify({ title: noteTitle.trim(), content: noteContent.trim() })
        });
        showStatus('Note created successfully!');
        setPagination((prev) => ({ ...prev, page: 1 }));
      } else {
        await api(`/api/notes/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify({ title: noteTitle.trim(), content: noteContent.trim() })
        });
        showStatus('Note updated successfully!');
      }
      setDialogOpen(false);
      refetch();
    } catch (err) {
      showStatus(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingNote) return;
    try {
      await api(`/api/notes/${deletingNote._id}`, {
        method: 'DELETE'
      });
      showStatus('Note deleted from vault.');
      setDeletingNote(null);
      if (notes.length === 1 && pagination.page > 1) {
        setPagination((prev) => ({ ...prev, page: prev.page - 1 }));
      }
      refetch();
    } catch (err) {
      showStatus(err.message, true);
    }
  };

  const filteredNotes = notes.filter((n) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
  });

  return (
    <main className="w-full pt-[114px] bg-[var(--bg-color)] min-h-[calc(100vh-64px)] pb-12 transition-colors duration-200">
      <div className="max-w-[1100px] mx-auto p-4 sm:p-6">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-[var(--card-border)]">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-color)]">
                My Notes
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[var(--card-low)] border border-[var(--card-border)] text-xs font-semibold text-[var(--text-muted)]">
                Encrypted Vault
              </span>
            </div>
            <p className="text-sm text-[var(--text-muted)] mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--tertiary)]"></span>
              <span>{pagination.total} private notes in your vault</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search bar */}
            <div className="relative flex-1 sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-[20px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="w-full h-10 pl-10 pr-8 rounded-full bg-[var(--card-bg)] border border-[var(--card-border)] text-xs text-[var(--text-color)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] shadow-xs transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-color)] p-0.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {/* New note button */}
            <button
              onClick={openNewDialog}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-[var(--primary)] text-[var(--primary-text)] text-xs font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>New note</span>
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[var(--text-muted)]">
            <span className="material-symbols-outlined animate-spin text-[36px] text-[var(--primary)]">
              progress_activity
            </span>
            <span className="text-sm mt-3">Loading notes...</span>
          </div>
        ) : filteredNotes.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center p-12 my-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] text-center shadow-sm">
            <div className="w-20 h-20 rounded-full bg-[var(--primary-light)] flex items-center justify-center mb-4 text-[var(--primary)]">
              <span className="material-symbols-outlined text-[40px]">sticky_note_2</span>
            </div>
            <h2 className="text-xl font-bold text-[var(--text-color)]">No notes yet</h2>
            <p className="text-sm text-[var(--text-muted)] max-w-sm mt-1 mb-6">
              Create your first secure note to store confidential thoughts, code snippets, and credentials.
            </p>
            <button
              onClick={openNewDialog}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--primary)] text-[var(--primary-text)] text-sm font-semibold shadow hover:bg-[var(--primary-hover)] transition-all cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span>Create your first note</span>
            </button>
          </div>
        ) : (
          /* Notes Grid */
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredNotes.map((note) => (
                <article
                  key={note._id}
                  className="flex flex-col justify-between rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-[var(--primary)] shadow-sm hover:shadow-md transition-all duration-200 p-5 group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[var(--primary-light)] text-[var(--primary-light-text)]">
                        Vault Item
                      </span>
                      <span className="material-symbols-outlined text-[var(--text-muted)] text-[18px]">
                        lock
                      </span>
                    </div>
                    <h2 className="text-base font-semibold text-[var(--text-color)] line-clamp-1 group-hover:text-[var(--primary)] transition-colors">
                      {note.title}
                    </h2>
                    <p className="text-sm text-[var(--text-muted)] mt-2 line-clamp-3 leading-relaxed">
                      {note.content}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 flex items-center justify-between bg-[var(--card-low)] -mx-5 -mb-5 px-5 py-3 rounded-b-2xl border-t border-[var(--card-border)]">
                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPreviewNote(note)}
                        className="p-1.5 rounded-full hover:bg-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors cursor-pointer"
                        title="View Note"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </button>
                      <button
                        onClick={() => openEditDialog(note)}
                        className="p-1.5 rounded-full hover:bg-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors cursor-pointer"
                        title="Edit Note"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={() => setDeletingNote(note)}
                        className="p-1.5 rounded-full hover:bg-[var(--error-bg)] text-[var(--text-muted)] hover:text-[var(--error)] transition-colors cursor-pointer"
                        title="Delete Note"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="mt-8 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[var(--card-border)]">
              <span className="text-xs text-[var(--text-muted)]">
                Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total notes)
              </span>
              <div className="flex items-center gap-3">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => {
                    setLoading(true);
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }));
                  }}
                  className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-semibold bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-color)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--card-low)] transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                  <span>Prev</span>
                </button>
                <span className="text-xs font-medium text-[var(--text-color)] px-2">
                  Page {pagination.page} of {pagination.totalPages || 1}
                </span>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => {
                    setLoading(true);
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
                  }}
                  className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-semibold bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-color)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--card-low)] transition-colors cursor-pointer"
                  type="button"
                >
                  <span>Next</span>
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Note Editor Modal */}
        {dialogOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-xl rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] p-6 shadow-2xl flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)]">
                    <span className="material-symbols-outlined text-[18px]">edit_note</span>
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-color)]">
                    {dialogMode === 'new' ? 'Create new note' : 'Edit note'}
                  </h3>
                </div>
                <button
                  onClick={() => setDialogOpen(false)}
                  className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-color)] hover:bg-[var(--card-low)] cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <form onSubmit={handleSaveNote} className="flex flex-col gap-4 mt-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Title
                  </label>
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    maxLength={200}
                    required
                    placeholder="e.g. Architecture Decisions & Keys"
                    className="w-full rounded-lg bg-[var(--card-low)] border border-[var(--card-border)] px-4 py-2 text-sm text-[var(--text-color)] focus:outline-none focus:border-[var(--primary)]"
                  />
                  <span className="text-right text-[11px] text-[var(--text-muted)]">
                    {noteTitle.length} / 200
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Content
                  </label>
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    maxLength={10000}
                    required
                    rows={7}
                    placeholder="Enter private note content here..."
                    className="w-full rounded-lg bg-[var(--card-low)] border border-[var(--card-border)] p-4 text-sm text-[var(--text-color)] focus:outline-none focus:border-[var(--primary)] resize-y leading-relaxed"
                  />
                  <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                    <span className="text-[var(--tertiary)] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">lock</span>
                      Stored in MongoDB encrypted vault
                    </span>
                    <span>{noteContent.length} / 10000</span>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-[var(--card-border)]">
                  <button
                    type="button"
                    onClick={() => setDialogOpen(false)}
                    className="px-4 py-2 rounded-full text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--card-low)] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-6 py-2 rounded-full bg-[var(--primary)] text-[var(--primary-text)] text-sm font-semibold shadow hover:bg-[var(--primary-hover)] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {saving ? (
                      <span className="material-symbols-outlined animate-spin text-[18px]">
                        progress_activity
                      </span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">check</span>
                        <span>Save note</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Note Preview Modal */}
        {previewNote && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-xl rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] p-6 shadow-2xl flex flex-col">
              <div className="flex items-start justify-between pb-3 border-b border-[var(--card-border)]">
                <div>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[var(--primary-light)] text-[var(--primary-light-text)]">
                    Secure Vault Item
                  </span>
                  <h3 className="text-xl font-bold text-[var(--text-color)] mt-1">
                    {previewNote.title}
                  </h3>
                  <span className="text-xs text-[var(--text-muted)] block mt-0.5">
                    Created: {new Date(previewNote.createdAt).toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => setPreviewNote(null)}
                  className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-color)] hover:bg-[var(--card-low)] cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="my-4 p-4 rounded-xl bg-[var(--card-low)] text-sm text-[var(--text-color)] leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap">
                {previewNote.content}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[var(--card-border)]">
                <div className="flex items-center gap-1 text-xs text-[var(--tertiary)] font-medium">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  Decrypted via verified session
                </div>
                <button
                  onClick={() => setPreviewNote(null)}
                  className="px-5 py-2 rounded-full bg-[var(--card-low)] text-sm font-semibold text-[var(--text-color)] hover:bg-[var(--card-border)] transition-colors cursor-pointer"
                  type="button"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingNote && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] p-6 shadow-2xl flex flex-col">
              <div className="w-12 h-12 rounded-full bg-[var(--error-bg)] text-[var(--error)] flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[24px]">delete_forever</span>
              </div>
              <h3 className="text-lg font-bold text-[var(--text-color)]">Delete this note?</h3>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                "{deletingNote.title}" will be permanently removed from your vault. This cannot be undone.
              </p>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeletingNote(null)}
                  className="px-4 py-2 rounded-full text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--card-low)] cursor-pointer"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[var(--error)] text-[var(--primary-text)] text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
