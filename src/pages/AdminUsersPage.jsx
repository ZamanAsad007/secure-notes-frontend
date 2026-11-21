import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const AdminUsersPage = ({ onNavigateToPosts }) => {
  const { user: currentUser, updateUser, showStatus } = useAuth();

  // Initialize page and role filter from URL query params or sessionStorage
  const [initialParams] = useState(() => {
    let page = 1;
    let role = '';
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const urlPage = parseInt(searchParams.get('page'), 10);
      if (Number.isInteger(urlPage) && urlPage > 0) {
        page = urlPage;
      } else {
        const savedPage = parseInt(sessionStorage.getItem('secure_notes_users_page'), 10);
        if (Number.isInteger(savedPage) && savedPage > 0) {
          page = savedPage;
        }
      }

      const urlRole = searchParams.get('role');
      if (urlRole && ['admin', 'user'].includes(urlRole)) {
        role = urlRole;
      }
    } catch {
      // ignore
    }
    return { page, role };
  });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: initialParams.page, limit: 10, total: 0, totalPages: 1 });
  const [roleFilter, setRoleFilter] = useState(initialParams.role);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Sync URL search params and sessionStorage when page or role filter changes
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      if (pagination.page > 1) {
        searchParams.set('page', String(pagination.page));
      } else {
        searchParams.delete('page');
      }

      if (roleFilter) {
        searchParams.set('role', roleFilter);
      } else {
        searchParams.delete('role');
      }

      const newSearch = searchParams.toString();
      const newPath = window.location.pathname + (newSearch ? `?${newSearch}` : '');
      const currentFull = window.location.pathname + window.location.search;

      if (currentFull !== newPath) {
        window.history.replaceState({ ...window.history.state, page: pagination.page }, '', newPath);
      }

      sessionStorage.setItem('secure_notes_users_page', String(pagination.page));
    } catch {
      // ignore
    }
  }, [pagination.page, roleFilter]);

  // Sync state on browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const urlPage = parseInt(searchParams.get('page'), 10);
        const newPage = Number.isInteger(urlPage) && urlPage > 0 ? urlPage : 1;
        const newRole = searchParams.get('role') || '';

        setPagination((prev) => (prev.page === newPage ? prev : { ...prev, page: newPage }));
        setRoleFilter(newRole);
      } catch {
        // ignore
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Form states for Add User
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    interests: ''
  });
  const [addingUser, setAddingUser] = useState(false);

  // Form states for Edit User
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    role: 'user',
    interests: ''
  });
  const [editingUser, setEditingUser] = useState(false);

  // Delete state
  const [deletingUser, setDeletingUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const refetch = useCallback(() => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        let url = `/api/users?page=${pagination.page}&limit=${pagination.limit}`;
        if (roleFilter) {
          url += `&role=${roleFilter}`;
        }
        const res = await api(url);
        if (active) {
          setUsers(res.data || []);
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
  }, [pagination.page, pagination.limit, roleFilter, refreshKey, showStatus]);

  // Handle Add User
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.email.trim() || !addForm.password) {
      showStatus('Name, email, and password are required', true);
      return;
    }
    if (addForm.password.length < 8) {
      showStatus('Password must be at least 8 characters', true);
      return;
    }

    setAddingUser(true);
    try {
      const interestsArray = addForm.interests
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      await api('/api/users', {
        method: 'POST',
        body: JSON.stringify({
          name: addForm.name.trim(),
          email: addForm.email.trim(),
          password: addForm.password,
          role: addForm.role,
          interests: interestsArray
        })
      });

      showStatus(`User "${addForm.name}" created successfully`);
      setAddModalOpen(false);
      setAddForm({ name: '', email: '', password: '', role: 'user', interests: '' });
      setPagination((prev) => ({ ...prev, page: 1 }));
      refetch();
    } catch (err) {
      showStatus(err.message, true);
    } finally {
      setAddingUser(false);
    }
  };

  // Open Edit User Modal
  const openEdit = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name || '',
      role: user.role || 'user',
      interests: Array.isArray(user.interests) ? user.interests.join(', ') : ''
    });
    setEditModalOpen(true);
  };

  // Handle Edit User
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    setEditingUser(true);
    try {
      const interestsArray = editForm.interests
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      await api(`/api/users/${selectedUser._id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editForm.name.trim(),
          role: editForm.role,
          interests: interestsArray
        })
      });

      // If editing current logged-in user, keep context in sync
      if (selectedUser._id === currentUser?._id && updateUser) {
        updateUser({
          name: editForm.name.trim(),
          role: editForm.role,
          interests: interestsArray
        });
      }

      showStatus(`User updated successfully`);
      setEditModalOpen(false);
      refetch();
    } catch (err) {
      showStatus(err.message, true);
    } finally {
      setEditingUser(false);
    }
  };

  // Open Delete confirmation
  const openDelete = (user) => {
    if (user._id === currentUser?._id) {
      showStatus('Cannot delete your own admin account', true);
      return;
    }
    setDeletingUser(user);
    setDeleteModalOpen(true);
  };

  // Handle Delete User
  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    try {
      await api(`/api/users/${deletingUser._id}`, {
        method: 'DELETE'
      });
      showStatus(`User "${deletingUser.name}" and associated records deleted`);
      setDeleteModalOpen(false);
      setDeletingUser(null);
      refetch();
    } catch (err) {
      showStatus(err.message, true);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter local display by roleFilter and search query
  const displayedUsers = users.filter((u) => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u._id?.toLowerCase().includes(q)
    );
  });

  return (
    <main className="w-full pt-[114px] bg-[var(--bg-color)] min-h-[calc(100vh-64px)] pb-12 transition-colors duration-200">
      <div className="max-w-[1100px] mx-auto p-4 sm:p-6">
        <div className="flex flex-col w-full gap-6">
          {/* Header & Metric Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--card-border)]">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--text-color)]">Users</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary-light-text)] text-xs font-semibold">
                  {pagination.total} Registered
                </span>
              </div>
              <p className="text-sm text-[var(--text-muted)]">
                Manage accounts, roles, and community permissions (Admin Only)
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setAddModalOpen(true)}
                className="h-10 px-5 rounded-full bg-[var(--primary)] text-[var(--primary-text)] text-sm font-medium flex items-center gap-2 shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                <span>Add User</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--card-bg)] p-3.5 rounded-xl border border-[var(--card-border)]">
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-[var(--card-low)] border border-[var(--card-border)] text-[var(--text-color)] text-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                placeholder="Filter by name, email, or ObjectId..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                type="text"
              />
              <span className="material-symbols-outlined text-[var(--text-muted)] absolute left-2.5 top-2.5 text-[18px]">
                search
              </span>
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">Role:</span>
              <select
                className="h-10 px-3 rounded-lg bg-[var(--card-low)] border border-[var(--card-border)] text-[var(--text-color)] text-xs focus:outline-none focus:border-[var(--primary)] transition-colors cursor-pointer"
                value={roleFilter}
                onChange={(e) => {
                  setLoading(true);
                  setRoleFilter(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
              >
                <option value="">All Roles</option>
                <option value="admin">Admins Only</option>
                <option value="user">Users Only</option>
              </select>
            </div>
          </div>

          {/* Users Table Card */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span className="material-symbols-outlined text-3xl animate-spin text-[var(--primary)]">
                  refresh
                </span>
                <span className="text-sm text-[var(--text-muted)]">Loading users directory...</span>
              </div>
            ) : displayedUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-2">
                <span className="material-symbols-outlined text-4xl text-[var(--text-muted)]">group_off</span>
                <span className="text-base font-semibold text-[var(--text-color)]">No users found</span>
                <p className="text-xs text-[var(--text-muted)]">No registered users matched the filter criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--card-border)] bg-[var(--card-low)]/50 text-[var(--text-muted)] text-[11px] font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Interests</th>
                      <th className="py-3 px-4">Created</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--card-border)]">
                    {displayedUsers.map((u) => {
                      const isSelf = u._id === currentUser?._id;
                      return (
                        <tr key={u._id} className="hover:bg-[var(--card-low)]/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-[var(--primary)] text-[var(--primary-text)] font-semibold text-xs flex items-center justify-center select-none">
                                {u.name?.[0]?.toUpperCase() || 'U'}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-xs text-[var(--text-color)] flex items-center gap-1.5">
                                  {u.name}
                                  {isSelf && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--primary-light)] text-[var(--primary-light-text)] font-mono">
                                      you
                                    </span>
                                  )}
                                </span>
                                <span className="text-[11px] text-[var(--text-muted)]">{u.email}</span>
                                <span className="text-[10px] text-[var(--text-muted)] font-mono">{u._id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${
                                u.role === 'admin'
                                  ? 'bg-[var(--primary-light)] text-[var(--primary-light-text)] border border-[var(--card-border)]'
                                  : 'bg-[var(--card-low)] text-[var(--text-muted)] border border-[var(--card-border)]'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {Array.isArray(u.interests) && u.interests.length > 0 ? (
                                u.interests.map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-2 py-0.5 rounded-full bg-[var(--card-low)] text-[var(--text-color)] text-[10px] font-medium"
                                  >
                                    #{tag}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-[var(--text-muted)] italic">-</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-xs text-[var(--text-muted)] whitespace-nowrap">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* View Posts Button */}
                              {onNavigateToPosts && (
                                <button
                                  type="button"
                                  onClick={() => onNavigateToPosts(u._id, u.name)}
                                  className="p-1.5 rounded-full hover:bg-[var(--card-low)] text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors cursor-pointer"
                                  title={`View posts by ${u.name}`}
                                >
                                  <span className="material-symbols-outlined text-[18px]">forum</span>
                                </button>
                              )}

                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => openEdit(u)}
                                className="p-1.5 rounded-full hover:bg-[var(--card-low)] text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors cursor-pointer"
                                title="Edit user"
                              >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => openDelete(u)}
                                disabled={isSelf}
                                className={`p-1.5 rounded-full transition-colors ${
                                  isSelf
                                    ? 'text-[var(--text-muted)] opacity-30 cursor-not-allowed'
                                    : 'hover:bg-[var(--error-bg)] text-[var(--text-muted)] hover:text-[var(--error)] cursor-pointer'
                                }`}
                                title={isSelf ? 'Cannot delete self' : 'Delete user'}
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            <div className="flex items-center justify-between p-4 border-t border-[var(--card-border)] bg-[var(--card-low)]/30">
              <span className="text-xs text-[var(--text-muted)]">
                Showing {displayedUsers.length} of {pagination.total} users (Page {pagination.page} of {pagination.totalPages || 1})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }));
                  }}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 rounded-lg bg-[var(--card-bg)] text-xs text-[var(--text-color)] border border-[var(--card-border)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--card-low)] transition-colors cursor-pointer"
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
                  className="px-3 py-1 rounded-lg bg-[var(--card-bg)] text-xs text-[var(--text-color)] border border-[var(--card-border)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--card-low)] transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] shadow-xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--card-border)]">
              <h3 className="text-lg font-semibold text-[var(--text-color)] flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[var(--primary)]">person_add</span>
                Add New User
              </h3>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-color)] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[var(--text-color)] uppercase">Name</label>
                <input
                  className="h-10 px-3 rounded-lg bg-[var(--card-low)] border border-[var(--card-border)] text-xs text-[var(--text-color)] focus:outline-none focus:border-[var(--primary)]"
                  placeholder="Full name..."
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[var(--text-color)] uppercase">Email</label>
                <input
                  className="h-10 px-3 rounded-lg bg-[var(--card-low)] border border-[var(--card-border)] text-xs text-[var(--text-color)] focus:outline-none focus:border-[var(--primary)]"
                  placeholder="name@example.com"
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[var(--text-color)] uppercase">Password</label>
                <input
                  className="h-10 px-3 rounded-lg bg-[var(--card-low)] border border-[var(--card-border)] text-xs text-[var(--text-color)] focus:outline-none focus:border-[var(--primary)]"
                  placeholder="Min 8 characters..."
                  type="password"
                  minLength={8}
                  maxLength={72}
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[var(--text-color)] uppercase">Role</label>
                <select
                  className="h-10 px-3 rounded-lg bg-[var(--card-low)] border border-[var(--card-border)] text-xs text-[var(--text-color)] focus:outline-none focus:border-[var(--primary)] cursor-pointer"
                  value={addForm.role}
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[var(--text-color)] uppercase">
                  Interests (Comma separated)
                </label>
                <input
                  className="h-10 px-3 rounded-lg bg-[var(--card-low)] border border-[var(--card-border)] text-xs text-[var(--text-color)] focus:outline-none focus:border-[var(--primary)]"
                  placeholder="cryptography, security, algorithms"
                  value={addForm.interests}
                  onChange={(e) => setAddForm({ ...addForm, interests: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--card-low)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingUser}
                  className="px-5 py-2 rounded-full bg-[var(--primary)] text-[var(--primary-text)] text-xs font-medium disabled:opacity-50 cursor-pointer"
                >
                  {addingUser ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] shadow-xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--card-border)]">
              <h3 className="text-lg font-semibold text-[var(--text-color)] flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[var(--primary)]">edit</span>
                Edit User ({selectedUser.email})
              </h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-color)] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[var(--text-color)] uppercase">Name</label>
                <input
                  className="h-10 px-3 rounded-lg bg-[var(--card-low)] border border-[var(--card-border)] text-xs text-[var(--text-color)] focus:outline-none focus:border-[var(--primary)]"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[var(--text-color)] uppercase">Role</label>
                <select
                  className="h-10 px-3 rounded-lg bg-[var(--card-low)] border border-[var(--card-border)] text-xs text-[var(--text-color)] focus:outline-none focus:border-[var(--primary)] cursor-pointer"
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[var(--text-color)] uppercase">
                  Interests (Comma separated)
                </label>
                <input
                  className="h-10 px-3 rounded-lg bg-[var(--card-low)] border border-[var(--card-border)] text-xs text-[var(--text-color)] focus:outline-none focus:border-[var(--primary)]"
                  value={editForm.interests}
                  onChange={(e) => setEditForm({ ...editForm, interests: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--card-low)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editingUser}
                  className="px-5 py-2 rounded-full bg-[var(--primary)] text-[var(--primary-text)] text-xs font-medium disabled:opacity-50 cursor-pointer"
                >
                  {editingUser ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] shadow-xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3 text-[var(--error)]">
              <span className="material-symbols-outlined text-[28px]">warning</span>
              <h3 className="text-base font-bold text-[var(--text-color)]">Delete User Account?</h3>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-[var(--text-color)]">{deletingUser.name}</strong> ({deletingUser.email})?
            </p>

            <div className="p-3 rounded-lg bg-[var(--error-bg)] text-[var(--error-text)] text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">info</span>
              <span>Cascade warning: All notes and posts owned by this user will also be permanently deleted.</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-full text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--card-low)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-5 py-2 rounded-full bg-[var(--error)] text-white text-xs font-medium hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
