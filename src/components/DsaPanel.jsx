import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { timeAgo, currentStreak } from '../util.js';

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const PLATFORMS = ['LeetCode', 'HackerRank', 'Codeforces', 'GeeksforGeeks', 'Other'];

// Common DSA topics to tick off as you cover them.
const TOPIC_LIST = [
  'Arrays',
  'Strings',
  'Hashing',
  'Two Pointers',
  'Sliding Window',
  'Stack',
  'Queue',
  'Linked List',
  'Binary Search',
  'Sorting',
  'Recursion',
  'Backtracking',
  'Trees',
  'BST',
  'Heap',
  'Graphs',
  'BFS',
  'DFS',
  'Dynamic Programming',
  'Greedy',
  'Trie',
  'Bit Manipulation',
  'Math',
  'Intervals',
];

export default function DsaPanel() {
  const [problems, setProblems] = useState(null);
  const [leetcode, setLeetcode] = useState(null);
  const [cp, setCp] = useState({}); // { codeforces?, codechef? }
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    title: '',
    difficulty: 'medium',
    topic: '',
    platform: 'LeetCode',
  });
  const [saving, setSaving] = useState(false);

  // LeetCode sync — username persisted locally for convenience.
  const [lcUser, setLcUser] = useState(
    () => localStorage.getItem('devstacker_lc_user') || ''
  );
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [syncError, setSyncError] = useState(null);

  // Ticked DSA topics (persisted to the server).
  const [ticked, setTicked] = useState(() => new Set());

  function toggleTopic(topic) {
    setTicked((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) next.delete(topic);
      else next.add(topic);
      api.saveTopics([...next]).catch(() => {}); // best-effort persist
      return next;
    });
  }

  // Runs a sync. `silent` = background auto-sync on open (no error/result banner).
  async function runSync(username, silent) {
    if (!username) return;
    if (!silent) {
      setSyncError(null);
      setSyncResult(null);
    }
    setSyncing(true);
    try {
      const r = await api.syncLeetcode(username);
      localStorage.setItem('devstacker_lc_user', username);
      if (!silent) setSyncResult(r);
      load();
    } catch (err) {
      if (!silent) setSyncError(err.message);
    } finally {
      setSyncing(false);
    }
  }

  function onSyncSubmit(e) {
    e.preventDefault();
    runSync(lcUser.trim(), false);
  }

  function load() {
    api
      .dsa()
      .then((d) => {
        setProblems(d.problems);
        setLeetcode(d.leetcode);
        setCp(d.cp || {});
        setTicked(new Set(d.topics || []));
        if (d.leetcode?.username && !lcUser) setLcUser(d.leetcode.username);
      })
      .catch((e) => setError(e.message));
  }

  // On open: load, then auto-sync in the background if a username is known and
  // the last sync is stale (>2 min). Keeps totals fresh without a manual click.
  useEffect(() => {
    api
      .dsa()
      .then((d) => {
        setProblems(d.problems);
        setLeetcode(d.leetcode);
        setCp(d.cp || {});
        setTicked(new Set(d.topics || []));
        const uname =
          d.leetcode?.username ||
          localStorage.getItem('devstacker_lc_user') ||
          '';
        if (uname && !lcUser) setLcUser(uname);
        const stale =
          !d.leetcode ||
          Date.now() - new Date(d.leetcode.syncedAt).getTime() > 2 * 60 * 1000;
        if (uname && stale) runSync(uname, true);
      })
      .catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    if (!problems) return null;
    const byDiff = { easy: 0, medium: 0, hard: 0 };
    problems.forEach((p) => {
      byDiff[p.difficulty] = (byDiff[p.difficulty] || 0) + 1;
    });
    // When a LeetCode profile is synced, its numbers are the source of truth
    // (solved counts, streak, and active days all come straight from LeetCode).
    const lc = leetcode;
    return {
      total: lc ? lc.total : problems.length,
      byDiff: lc
        ? { easy: lc.easy, medium: lc.medium, hard: lc.hard }
        : byDiff,
      streak: lc ? lc.streak : currentStreak(problems.map((p) => p.solvedAt)),
      activeDays: lc ? lc.totalActiveDays : null,
      fromLeetcode: !!lc,
    };
  }, [problems, leetcode]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function addProblem(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.createProblem(form);
      setForm({ title: '', difficulty: 'medium', topic: '', platform: 'LeetCode' });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(p) {
    try {
      await api.deleteProblem(p._id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <form className="lc-sync" onSubmit={onSyncSubmit}>
        <span className="lc-label">Sync from LeetCode:</span>
        <input
          placeholder="your LeetCode username"
          value={lcUser}
          onChange={(e) => setLcUser(e.target.value)}
        />
        <button className="ghost-btn sm" disabled={syncing || !lcUser.trim()}>
          {syncing ? 'Syncing…' : 'Sync'}
        </button>
        {leetcode && (
          <a
            className="ghost-btn sm"
            href={`https://leetcode.com/u/${leetcode.username}/`}
            target="_blank"
            rel="noreferrer"
          >
            ↗ Profile
          </a>
        )}
        {syncResult && (
          <span className="lc-result muted">
            @{syncResult.username}: {syncResult.stats.total} solved ·{' '}
            {syncResult.stats.easy}E / {syncResult.stats.medium}M /{' '}
            {syncResult.stats.hard}H
            {syncResult.imported > 0
              ? ` · imported ${syncResult.imported} recent`
              : syncResult.recentVisible
              ? ' · up to date'
              : ' · recent solves are private'}
          </span>
        )}
        {syncError && <span className="lc-result err">⚠ {syncError}</span>}
        {!syncResult && !syncError && leetcode && (
          <span className="lc-result muted">
            {syncing
              ? 'refreshing from LeetCode…'
              : `auto-synced from LeetCode @${leetcode.username}`}
          </span>
        )}
      </form>

      {stats && (
        <div className="stat-row">
          <Stat label="Solved" value={stats.total} />
          <Stat
            label="Active Days"
            value={stats.activeDays == null ? '—' : stats.activeDays}
          />
          <Stat label="🔥 Streak" value={`${stats.streak}d`} />
          <Stat label="Easy" value={stats.byDiff.easy} tone="easy" />
          <Stat label="Medium" value={stats.byDiff.medium} tone="medium" />
          <Stat label="Hard" value={stats.byDiff.hard} tone="hard" />
        </div>
      )}

      <div className="cp-strip">
        <CpCard
          platform="codeforces"
          label="Codeforces"
          emoji="🟥"
          profile={cp.codeforces}
          onSynced={load}
        />
        <CpCard
          platform="codechef"
          label="CodeChef"
          emoji="🟫"
          profile={cp.codechef}
          onSynced={load}
        />
      </div>

      <div className="topics-tracker">
        <div className="topics-head">
          <span>Topics covered</span>
          <span className="muted">
            {ticked.size}/{TOPIC_LIST.length}
          </span>
        </div>
        <div className="topics-grid">
          {TOPIC_LIST.map((t) => {
            const on = ticked.has(t);
            return (
              <button
                key={t}
                type="button"
                className={`topic-chip${on ? ' on' : ''}`}
                onClick={() => toggleTopic(t)}
              >
                <span className="topic-tick">{on ? '✓' : '○'}</span>
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <form className="dsa-form" onSubmit={addProblem}>
        <input
          className="grow"
          placeholder="Problem title (e.g. Two Sum)"
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
        />
        <input
          placeholder="Topic (e.g. Arrays)"
          value={form.topic}
          onChange={(e) => update('topic', e.target.value)}
        />
        <select
          value={form.difficulty}
          onChange={(e) => update('difficulty', e.target.value)}
        >
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {d[0].toUpperCase() + d.slice(1)}
            </option>
          ))}
        </select>
        <select
          value={form.platform}
          onChange={(e) => update('platform', e.target.value)}
        >
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <button disabled={saving || !form.title.trim()}>
          {saving ? 'Saving…' : 'Log solve'}
        </button>
      </form>

      {error && <div className="panel-error">⚠ {error}</div>}

      {!problems ? (
        <div className="muted">Loading solved problems…</div>
      ) : problems.length === 0 ? (
        <div className="muted">
          No problems logged yet. Log your first solve above.
        </div>
      ) : (
        <div className="dsa-list">
          <div className="list-caption muted">Recent solves (up to 20)</div>
          {problems.map((p) => (
            <div key={p._id} className="dsa-row">
              <div className="dsa-main">
                <span className={`badge diff-${p.difficulty}`}>
                  {p.difficulty}
                </span>
                <span className="dsa-title">{p.title}</span>
                {p.topic && <span className="dsa-topic">{p.topic}</span>}
              </div>
              <div className="dsa-meta">
                <span className="muted">{p.platform}</span>
                <span className="muted">{timeAgo(p.solvedAt)}</span>
                <button
                  className="icon-btn"
                  onClick={() => remove(p)}
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className={`stat${tone ? ' stat-' + tone : ''}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function cpProfileUrl(platform, handle) {
  if (platform === 'codeforces')
    return `https://codeforces.com/profile/${handle}`;
  if (platform === 'codechef')
    return `https://www.codechef.com/users/${handle}`;
  return '#';
}

// A connectable Codeforces/CodeChef card. Handles its own username, sync, and
// background auto-sync on open (mirrors the LeetCode flow).
function CpCard({ platform, label, emoji, profile, onSynced }) {
  const lsKey = `devstacker_${platform}_user`;
  const [handle, setHandle] = useState(
    () => profile?.username || localStorage.getItem(lsKey) || ''
  );
  const [syncing, setSyncing] = useState(false);
  const [err, setErr] = useState(null);

  async function doSync(silent) {
    const u = handle.trim();
    if (!u) return;
    setSyncing(true);
    if (!silent) setErr(null);
    try {
      await api.syncCp(platform, u);
      localStorage.setItem(lsKey, u);
      onSynced();
    } catch (e) {
      if (!silent) setErr(e.message);
    } finally {
      setSyncing(false);
    }
  }

  // Auto-sync on open if a handle is known and the last sync is stale (>2 min).
  useEffect(() => {
    const u = profile?.username || localStorage.getItem(lsKey);
    if (!u) return;
    const stale =
      !profile ||
      Date.now() - new Date(profile.syncedAt).getTime() > 2 * 60 * 1000;
    if (stale) doSync(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`cp-card${profile ? ' connected' : ''}`}>
      <div className="cp-head">
        <span className="cp-emoji">{emoji}</span>
        {label}
        {profile && (
          <span className="cp-head-actions">
            <a
              className="cp-link"
              href={cpProfileUrl(platform, profile.username)}
              target="_blank"
              rel="noreferrer"
              title="Open profile"
            >
              ↗
            </a>
            <button
              className="cp-refresh"
              onClick={() => doSync(false)}
              disabled={syncing}
              title="Refresh"
            >
              {syncing ? '…' : '↻'}
            </button>
          </span>
        )}
      </div>

      {profile ? (
        <>
          <div className="cp-user muted">@{profile.username}</div>
          <div className="cp-stats">
            <span className="cp-big">{profile.solved}</span>
            <span className="muted"> solved</span>
          </div>
          {profile.rating > 0 && (
            <div className="cp-rating">
              {profile.rating}
              {profile.rankLabel ? ` · ${profile.rankLabel}` : ''}
              {profile.maxRating ? (
                <span className="muted"> (max {profile.maxRating})</span>
              ) : null}
            </div>
          )}
        </>
      ) : (
        <form
          className="cp-connect"
          onSubmit={(e) => {
            e.preventDefault();
            doSync(false);
          }}
        >
          <input
            placeholder={`${label} handle`}
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
          />
          <button className="ghost-btn sm" disabled={syncing || !handle.trim()}>
            {syncing ? '…' : 'Connect'}
          </button>
        </form>
      )}
      {err && <div className="cp-err">⚠ {err}</div>}
    </div>
  );
}
