import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const PostsPage = ({ initialAuthor }) => {
  const { user, showStatus } = useAuth();

  // Create Post state
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [publishing, setPublishing] = useState(false);

  // Browse Posts by User state (Scenario 2)
  const [targetUserId, setTargetUserId] = useState(initialAuthor?.id || initialAuthor?.name || user?._id || '');
  const [inputQuery, setInputQuery] = useState(initialAuthor?.name || initialAuthor?.id || user?.name || user?._id || '');
  const [postsData, setPostsData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [lookupError, setLookupError] = useState(null);
  const [refreshPostsKey, setRefreshPostsKey] = useState(0);

  // Sync internal targetUserId if initialAuthor changes
  const [prevAuthor, setPrevAuthor] = useState(initialAuthor);
  if (initialAuthor !== prevAuthor) {
    setPrevAuthor(initialAuthor);
    if (initialAuthor?.id) {
      setTargetUserId(initialAuthor.id);
      setInputQuery(initialAuthor.name || initialAuthor.id);
      setCurrentPage(1);
    }
  }

  // Authors list for quick selection
  const [authors, setAuthors] = useState([]);
  const [loadingAuthors, setLoadingAuthors] = useState(false);

  // Fetch authors on mount
  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingAuthors(true);
      try {
        const res = await api('/api/posts/authors');
        if (active && Array.isArray(res.data)) {
          setAuthors(res.data);
        }
      } catch {
        // Fallback: If authors endpoint fails and user is admin, try /api/users
        if (user?.role === 'admin') {
          try {
            const uRes = await api('/api/users?limit=8');
            if (active && uRes.data) setAuthors(uRes.data);
          } catch {
            // ignore
          }
        }
      } finally {
        if (active) setLoadingAuthors(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [user?.role]);

  // Load posts for target user (by ObjectId, email, or name)
  const refetchPosts = useCallback(() => {
    setLoadingPosts(true);
    setRefreshPostsKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!targetUserId) return;

    let active = true;
    (async () => {
      setLookupError(null);
      try {
        const res = await api(`/api/users/${encodeURIComponent(targetUserId)}/posts?page=${currentPage}&limit=5`);
        if (active) {
          setPostsData(res);
        }
      } catch (err) {
        if (active) {
          setLookupError(err.message || 'User not found or unable to fetch posts');
          setPostsData(null);
        }
      } finally {
        if (active) setLoadingPosts(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [targetUserId, currentPage, refreshPostsKey]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = inputQuery.trim();
    if (!query) {
      showStatus('Please enter an author name, email, or user ID', true);
      return;
    }
    setLoadingPosts(true);
    setTargetUserId(query);
    setCurrentPage(1);
    refetchPosts();
  };

  const selectAuthor = (author) => {
    setInputQuery(author.name || author._id);
    setLoadingPosts(true);
    setTargetUserId(author._id);
    setCurrentPage(1);
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) {
      showStatus('Please enter both title and content for the post', true);
      return;
    }

    setPublishing(true);
    try {
      await api('/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          title: postTitle.trim(),
          content: postContent.trim()
        })
      });
      showStatus('Post published successfully to the encrypted workspace timeline!');
      setPostTitle('');
      setPostContent('');

      // Refresh authors list and active author feed
      refetchPosts();
      try {
        const authorsRes = await api('/api/posts/authors');
        if (Array.isArray(authorsRes.data)) setAuthors(authorsRes.data);
      } catch {
        // ignore
      }
    } catch (err) {
      showStatus(err.message, true);
    } finally {
      setPublishing(false);
    }
  };

  const copyShareLink = (title, content) => {
    navigator.clipboard?.writeText?.(`${title}\n\n${content}`);
    showStatus('Post snippet copied to clipboard');
  };

  // Helper to extract author name & posts list regardless of response wrapper
  const currentAuthorName = postsData?.name || postsData?.data?.name || 'Author';
  const currentAuthorId = postsData?._id || postsData?.data?._id || targetUserId;
  const postsList = postsData?.posts || postsData?.data?.posts || [];
  const hasMorePosts = postsData?.hasMore ?? postsData?.pagination?.hasMore ?? false;

  return (
    <main className="w-full pt-[114px] bg-[var(--bg-color)] min-h-[calc(100vh-64px)] pb-12 transition-colors duration-200">
      <div className="max-w-[1100px] mx-auto p-4 sm:p-6">
        <div className="flex flex-col w-full">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 mb-6 gap-3 border-b border-[var(--card-border)]">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[var(--primary)] text-xs font-semibold tracking-wider uppercase">
                <span className="material-symbols-outlined text-[16px]">forum</span>
                <span>Vault Community Workspace</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--text-color)]">Posts</h1>
              <p className="text-sm text-[var(--text-muted)]">Share updates and browse team publications</p>
            </div>

            {/* Live Feed Activity Metric Widget */}
            <div className="flex items-center gap-3 self-start md:self-auto bg-[var(--card-low)] border border-[var(--card-border)] px-4 py-2 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--tertiary)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--tertiary)]"></span>
                </span>
                <span className="text-xs text-[var(--text-muted)] font-medium">Live Sync Active</span>
              </div>
              <div className="w-px h-4 bg-[var(--card-border)]"></div>
              <span className="text-xs text-[var(--primary)] font-semibold">Feed Node #84</span>
            </div>
          </div>

          {/* Bento Grid: Two Column Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Compose & System Status (lg: 5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Section 1: Write a Post Card */}
              <section className="bg-[var(--card-bg)] rounded-xl p-6 shadow-sm border border-[var(--card-border)] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)]">
                      <span className="material-symbols-outlined text-[18px]">edit_note</span>
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-[var(--text-color)]">Write a post</h2>
                      <p className="text-xs text-[var(--text-muted)]">Publish to encrypted workspace timeline</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[var(--card-low)] text-[var(--text-muted)] text-xs font-medium border border-[var(--card-border)]">
                    Public Post
                  </span>
                </div>

                <form className="flex flex-col gap-4 mt-1" onSubmit={handlePublish}>
                  {/* Outlined Input: Title */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[var(--text-color)] uppercase tracking-wider" htmlFor="postTitle">
                      Title
                    </label>
                    <input
                      id="postTitle"
                      className="w-full h-11 px-3.5 rounded-lg bg-[var(--card-low)] border border-[var(--card-border)] text-[var(--text-color)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                      placeholder="Post title..."
                      value={postTitle}
                      onChange={(e) => setPostTitle(e.target.value)}
                      maxLength={120}
                      required
                      type="text"
                    />
                  </div>

                  {/* Outlined Textarea: Content */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[var(--text-color)] uppercase tracking-wider" htmlFor="postContent">
                      Content
                    </label>
                    <textarea
                      id="postContent"
                      className="w-full p-3.5 rounded-lg bg-[var(--card-low)] border border-[var(--card-border)] text-[var(--text-color)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors resize-none leading-relaxed"
                      placeholder="What would you like to share? Write your thoughts here..."
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      maxLength={800}
                      required
                      rows={4}
                    />
                    <div className="flex items-center justify-between text-xs text-[var(--text-muted)] px-1">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-[var(--tertiary)]">lock</span>
                        Encrypted post
                      </span>
                      <span>{postContent.length} / 800</span>
                    </div>
                  </div>

                  {/* Bottom Action Row */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1 text-[var(--text-muted)]">
                      <span className="text-xs text-[var(--text-muted)]">Author: {user?.name}</span>
                    </div>
                    <button
                      className="h-10 px-6 rounded-full bg-[var(--primary)] text-[var(--primary-text)] text-sm font-medium flex items-center gap-2 shadow-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                      disabled={publishing}
                      type="submit"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {publishing ? 'refresh' : 'send'}
                      </span>
                      <span>{publishing ? 'Publishing...' : 'Publish'}</span>
                    </button>
                  </div>
                </form>
              </section>

              {/* Contextual Quick Stats & Encryption Insight */}
              <div className="bg-[var(--card-low)] rounded-xl p-5 border border-[var(--card-border)] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-color)]">Community Telemetry</span>
                  <span className="material-symbols-outlined text-[var(--text-muted)] text-[20px]">insights</span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-[var(--card-bg)] p-3.5 rounded-lg border border-[var(--card-border)] flex flex-col">
                    <span className="text-xs text-[var(--text-muted)]">Active Protocol</span>
                    <span className="text-base font-semibold text-[var(--text-color)] mt-1">Scenario 2</span>
                  </div>
                  <div className="bg-[var(--card-bg)] p-3.5 rounded-lg border border-[var(--card-border)] flex flex-col">
                    <span className="text-xs text-[var(--text-muted)]">Index Optimization</span>
                    <span className="text-base font-semibold text-[var(--text-color)] mt-1">author_1__id_-1</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] pt-1">
                  <span className="material-symbols-outlined text-[14px] text-[var(--tertiary)]">check_circle</span>
                  <span>Single-pipeline $lookup with limit+1 cursor pagination</span>
                </div>
              </div>
            </div>

            {/* Right Column: Browse Posts by User (lg: 7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <section className="bg-[var(--card-bg)] rounded-xl p-6 shadow-sm border border-[var(--card-border)] flex flex-col gap-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[var(--card-low)] border border-[var(--card-border)] flex items-center justify-center text-[var(--text-color)]">
                      <span className="material-symbols-outlined text-[18px]">badge</span>
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-[var(--text-color)]">Browse posts by author</h2>
                      <p className="text-xs text-[var(--text-muted)]">
                        Select an active author or search by name, email, or ID
                      </p>
                    </div>
                  </div>

                  {user?._id && (
                    <button
                      onClick={() => {
                        setInputQuery(user.name || user._id);
                        setLoadingPosts(true);
                        setTargetUserId(user._id);
                        setCurrentPage(1);
                      }}
                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[var(--primary-light)] text-[var(--primary-light-text)] hover:opacity-90 transition-all self-start cursor-pointer flex items-center gap-1"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[14px]">person</span>
                      <span>My Posts</span>
                    </button>
                  )}
                </div>

                {/* Active Authors Quick-Select Chips */}
                <div className="flex flex-col gap-2 pt-1">
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <span className="font-semibold uppercase tracking-wider text-[11px]">
                      Active Authors in Community:
                    </span>
                    {loadingAuthors && (
                      <span className="text-[10px] animate-pulse">Updating authors...</span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {authors.length === 0 ? (
                      <span className="text-xs text-[var(--text-muted)] italic">
                        No published authors yet. Publish a post to be listed!
                      </span>
                    ) : (
                      authors.map((author) => {
                        const isSelected =
                          targetUserId === author._id ||
                          targetUserId === author.name ||
                          targetUserId === author.email;
                        return (
                          <button
                            key={author._id}
                            type="button"
                            onClick={() => selectAuthor(author)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer shadow-2xs ${
                              isSelected
                                ? 'bg-[var(--primary)] text-[var(--primary-text)] font-semibold shadow-sm'
                                : 'bg-[var(--card-low)] text-[var(--text-color)] border border-[var(--card-border)] hover:bg-[var(--card-border)]'
                            }`}
                          >
                            <span className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center text-[10px] font-bold">
                              {author.name?.[0]?.toUpperCase() || 'U'}
                            </span>
                            <span>{author.name}</span>
                            {author.postCount !== undefined && (
                              <span
                                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                                  isSelected ? 'bg-white/20 text-white' : 'bg-black/5 text-[var(--text-muted)]'
                                }`}
                              >
                                {author.postCount}
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Search Form Row */}
                <form className="flex flex-col gap-1.5 pt-2" onSubmit={handleSearchSubmit}>
                  <label className="text-xs font-semibold text-[var(--text-color)] uppercase tracking-wider" htmlFor="userIdInput">
                    Search Author by Name, Email, or ID
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        id="userIdInput"
                        className="w-full h-11 pl-10 pr-3.5 rounded-lg bg-[var(--card-low)] border border-[var(--card-border)] text-[var(--text-color)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                        placeholder="Type author name (e.g. Alice), email, or paste ID..."
                        value={inputQuery}
                        onChange={(e) => setInputQuery(e.target.value)}
                        type="text"
                      />
                      <span className="material-symbols-outlined text-[var(--text-muted)] absolute left-3 top-2.5 text-[20px]">
                        search
                      </span>
                    </div>
                    <button
                      className="h-11 px-5 rounded-full bg-[var(--primary)] text-[var(--primary-text)] text-sm font-medium flex items-center justify-center gap-1.5 shadow-sm hover:opacity-90 active:scale-95 transition-all whitespace-nowrap cursor-pointer"
                      type="submit"
                    >
                      <span className="material-symbols-outlined text-[18px]">manage_search</span>
                      <span>Find Posts</span>
                    </button>
                  </div>
                </form>

                <div className="w-full h-px bg-[var(--card-border)] my-1"></div>

                {/* Results Section */}
                {loadingPosts ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <span className="material-symbols-outlined text-3xl animate-spin text-[var(--primary)]">
                      refresh
                    </span>
                    <span className="text-sm text-[var(--text-muted)]">Aggregating posts by author...</span>
                  </div>
                ) : lookupError ? (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--error-bg)] text-[var(--error-text)] border border-[var(--error)]/20">
                    <span className="material-symbols-outlined text-[24px]">error</span>
                    <div className="flex flex-col gap-1 flex-1">
                      <span className="font-semibold text-sm">Author Not Found</span>
                      <p className="text-xs opacity-90">{lookupError}</p>
                    </div>
                  </div>
                ) : !postsData ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                    <span className="material-symbols-outlined text-4xl text-[var(--text-muted)]">
                      manage_search
                    </span>
                    <span className="text-sm font-medium text-[var(--text-color)]">
                      Select an author from above or search to view their posts
                    </span>
                  </div>
                ) : postsList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 rounded-xl bg-[var(--card-low)] text-center gap-3 border border-[var(--card-border)]">
                    <div className="w-12 h-12 rounded-full bg-[var(--card-bg)] flex items-center justify-center text-[var(--text-muted)] shadow-sm">
                      <span className="material-symbols-outlined text-[24px]">post_add</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-semibold text-sm text-[var(--text-color)]">
                        This user has no posts yet
                      </span>
                      <p className="text-xs text-[var(--text-muted)] max-w-sm">
                        {currentAuthorName} has not published any public timeline records yet.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {/* Author Banner */}
                    <div className="flex items-center justify-between bg-[var(--card-low)] p-4 rounded-xl border border-[var(--card-border)]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-[var(--primary-text)] font-semibold text-base">
                          {currentAuthorName?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm text-[var(--text-color)]">
                              Posts by {currentAuthorName}
                            </h3>
                            <span className="px-2 py-0.5 rounded bg-[var(--primary-light)] text-[var(--primary-light-text)] text-xs font-semibold">
                              Verified Author
                            </span>
                          </div>
                          <span className="text-xs text-[var(--text-muted)] font-mono">
                            {currentAuthorId}
                          </span>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-[var(--card-bg)] text-[var(--text-color)] text-xs font-medium border border-[var(--card-border)] shadow-sm">
                        {postsList.length} loaded
                      </span>
                    </div>

                    {/* Posts List */}
                    {postsList.map((post) => (
                      <article
                        key={post._id}
                        className="bg-[var(--card-bg)] p-5 rounded-xl border border-[var(--card-border)] shadow-sm hover:shadow-md transition-shadow flex flex-col gap-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="font-semibold text-base text-[var(--text-color)]">
                            {post.title}
                          </h4>
                          <button
                            onClick={() => copyShareLink(post.title, post.content)}
                            className="text-[var(--text-muted)] hover:text-[var(--text-color)] p-1 rounded-full transition-colors cursor-pointer"
                            title="Copy post content"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[18px]">share</span>
                          </button>
                        </div>
                        <p className="text-sm text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap">
                          {post.content}
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-[var(--card-border)]/50 mt-1">
                          <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                            {new Date(post.createdAt).toLocaleString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-[var(--card-low)] text-[var(--primary)] text-xs font-medium">
                            #encrypted
                          </span>
                        </div>
                      </article>
                    ))}

                    {/* Scenario 2 Pagination */}
                    <div className="flex items-center justify-between pt-2 bg-[var(--card-low)] px-4 py-2.5 rounded-xl border border-[var(--card-border)]">
                      <button
                        onClick={() => {
                          setLoadingPosts(true);
                          setCurrentPage((p) => p - 1);
                        }}
                        disabled={currentPage <= 1}
                        className="px-3.5 py-1.5 rounded-full bg-[var(--card-bg)] text-[var(--text-color)] text-xs font-medium border border-[var(--card-border)] shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all cursor-pointer"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                        <span>Prev</span>
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[var(--primary)]"></span>
                        <span className="text-xs font-semibold text-[var(--text-color)]">
                          Page {currentPage}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setLoadingPosts(true);
                          setCurrentPage((p) => p + 1);
                        }}
                        disabled={!hasMorePosts}
                        className="px-3.5 py-1.5 rounded-full bg-[var(--card-bg)] text-[var(--primary)] text-xs font-medium border border-[var(--card-border)] shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all hover:bg-[var(--card-low)] cursor-pointer"
                        type="button"
                      >
                        <span>Next</span>
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
