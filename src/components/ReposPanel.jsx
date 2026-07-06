import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { timeAgo } from '../util.js';

export default function ReposPanel() {
  const [repos, setRepos] = useState(null);
  const [error, setError] = useState(null);
  const [onlyStale, setOnlyStale] = useState(false);

  useEffect(() => {
    api
      .repos()
      .then((d) => setRepos(d.repos))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="panel-error">⚠ {error}</div>;
  if (!repos) return <div className="muted">Loading repositories…</div>;

  const shown = onlyStale ? repos.filter((r) => r.stale) : repos;
  const staleCount = repos.filter((r) => r.stale).length;

  return (
    <div>
      <div className="panel-toolbar">
        <span className="muted">
          {repos.length} repos · {staleCount} stale
        </span>
        <label className="toggle">
          <input
            type="checkbox"
            checked={onlyStale}
            onChange={(e) => setOnlyStale(e.target.checked)}
          />
          Stale only
        </label>
      </div>
      <div className="repo-list">
        {shown.map((r) => (
          <a
            key={r.id}
            className="repo-row"
            href={r.url}
            target="_blank"
            rel="noreferrer"
          >
            <div className="repo-main">
              <span className="repo-name">{r.name}</span>
              {r.private && <span className="badge badge-muted">private</span>}
              {r.stale && <span className="badge badge-warn">stale</span>}
            </div>
            <div className="repo-meta">
              {r.language && <span className="dot-lang">{r.language}</span>}
              <span>★ {r.stars}</span>
              <span>pushed {timeAgo(r.pushedAt)}</span>
            </div>
          </a>
        ))}
        {shown.length === 0 && <div className="muted">Nothing to show.</div>}
      </div>
    </div>
  );
}
