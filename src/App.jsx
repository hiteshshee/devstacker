import React, { useEffect, useState } from 'react';
import { api } from './api.js';
import ReposPanel from './components/ReposPanel.jsx';
import ProjectsPanel from './components/ProjectsPanel.jsx';
import DsaPanel from './components/DsaPanel.jsx';
import ResumesPanel from './components/ResumesPanel.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [githubConfigured, setGithubConfigured] = useState(true);

  useEffect(() => {
    Promise.all([
      api.me().catch(() => null),
      api.authStatus().catch(() => ({ githubConfigured: true })),
    ]).then(([me, status]) => {
      setUser(me);
      setGithubConfigured(status?.githubConfigured ?? true);
      setLoading(false);
    });
  }, []);

  async function logout() {
    await api.logout();
    setUser(null);
  }

  if (loading) {
    return (
      <div className="center-screen">
        <div className="logo">Dev<span>Stacker</span></div>
        <div className="muted">Loading…</div>
      </div>
    );
  }

  if (!user) return <Landing githubConfigured={githubConfigured} />;

  return (
    <div className="app">
      <header className="topbar">
        <div className="logo">Dev<span>Stacker</span></div>
        <div className="user">
          {user.avatar && <img src={user.avatar} alt="" className="avatar" />}
          <span>{user.name || user.login}</span>
          <button className="ghost-btn" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      <main className="dashboard">
        <section className="card wide">
          <h2>
            Good to see you, {user.name?.split(' ')[0] || user.login} 👋
          </h2>
          <p className="muted">
            Your workspace at a glance. This is the walking skeleton —
            repositories and projects are live.
          </p>
        </section>

        <section className="card">
          <h3>GitHub Repositories</h3>
          <ReposPanel />
        </section>

        <section className="card">
          <h3>Projects</h3>
          <ProjectsPanel />
        </section>

        <section className="card wide">
          <h3>DSA Progress</h3>
          <DsaPanel />
        </section>

        <section className="card wide">
          <h3>Resume Manager</h3>
          <ResumesPanel />
        </section>
      </main>

      <footer className="footer muted">
        DevStacker · One Workspace. Every Project. Every Developer.
      </footer>
    </div>
  );
}

function Landing({ githubConfigured }) {
  return (
    <div className="center-screen landing">
      <div className="logo big">Dev<span>Stacker</span></div>
      <h1>The Developer Workspace OS</h1>
      <p className="tagline muted">
        One dashboard for your repos, projects, learning, and productivity.
        Stop switching between ten tabs every morning.
      </p>
      {githubConfigured ? (
        <a className="cta" href="/api/auth/github">
          <GithubMark /> Continue with GitHub
        </a>
      ) : (
        <div className="panel-error" style={{ maxWidth: 440 }}>
          GitHub sign-in isn't configured yet. Add <code>GITHUB_CLIENT_ID</code>{' '}
          and <code>GITHUB_CLIENT_SECRET</code> to the server environment, then
          reload.
        </div>
      )}
      <p className="fine muted">
        We request read access to your repositories to show them here.
      </p>
    </div>
  );
}

function GithubMark() {
  return (
    <svg height="18" width="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
