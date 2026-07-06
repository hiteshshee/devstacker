import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

const STATUS_NEXT = { active: 'paused', paused: 'done', done: 'active' };

export default function ProjectsPanel() {
  const [projects, setProjects] = useState(null);
  const [error, setError] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  function load() {
    api
      .projects()
      .then((d) => setProjects(d.projects))
      .catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function addProject(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.createProject({ name, description });
      setName('');
      setDescription('');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function cycleStatus(p) {
    try {
      await api.updateProject(p._id, { status: STATUS_NEXT[p.status] });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(p) {
    try {
      await api.deleteProject(p._id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <form className="project-form" onSubmit={addProject}>
        <input
          placeholder="New project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Short description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button disabled={saving || !name.trim()}>
          {saving ? 'Adding…' : 'Add'}
        </button>
      </form>

      {error && <div className="panel-error">⚠ {error}</div>}

      {!projects ? (
        <div className="muted">Loading projects…</div>
      ) : projects.length === 0 ? (
        <div className="muted">No projects yet. Add your first one above.</div>
      ) : (
        <div className="project-list">
          {projects.map((p) => (
            <div key={p._id} className="project-row">
              <div className="project-main">
                <span className="project-name">{p.name}</span>
                {p.description && (
                  <span className="project-desc">{p.description}</span>
                )}
              </div>
              <div className="project-actions">
                <button
                  className={`badge status-${p.status}`}
                  onClick={() => cycleStatus(p)}
                  title="Click to change status"
                >
                  {p.status}
                </button>
                <button className="icon-btn" onClick={() => remove(p)} title="Delete">
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
