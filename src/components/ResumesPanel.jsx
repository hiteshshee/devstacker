import React, { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { formatBytes, shortDate } from '../util.js';

export default function ResumesPanel() {
  const [resumes, setResumes] = useState(null);
  const [error, setError] = useState(null);
  const [label, setLabel] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState(null); // resume id whose sent-log is open
  const fileRef = useRef(null);

  function load() {
    api
      .resumes()
      .then((d) => setResumes(d.resumes))
      .catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function upload(e) {
    e.preventDefault();
    if (!file || !label.trim()) return;
    setUploading(true);
    setError(null);
    try {
      await api.uploadResume(label.trim(), file);
      setLabel('');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function remove(r) {
    if (!confirm(`Delete resume "${r.label}"?`)) return;
    try {
      await api.deleteResume(r._id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <form className="resume-form" onSubmit={upload}>
        <input
          placeholder="Version label (e.g. Backend v2)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => setFile(e.target.files[0] || null)}
        />
        <button disabled={uploading || !file || !label.trim()}>
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </form>

      {error && <div className="panel-error">⚠ {error}</div>}

      {!resumes ? (
        <div className="muted">Loading resumes…</div>
      ) : resumes.length === 0 ? (
        <div className="muted">
          No resumes yet. Upload your first version above (PDF or Word).
        </div>
      ) : (
        <div className="resume-list">
          {resumes.map((r) => (
            <ResumeItem
              key={r._id}
              resume={r}
              open={expanded === r._id}
              onToggle={() =>
                setExpanded(expanded === r._id ? null : r._id)
              }
              onDelete={() => remove(r)}
              onChanged={load}
              onError={setError}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ResumeItem({ resume: r, open, onToggle, onDelete, onChanged, onError }) {
  const [company, setCompany] = useState('');
  const [date, setDate] = useState('');
  const [saving, setSaving] = useState(false);

  async function addSent(e) {
    e.preventDefault();
    if (!company.trim()) return;
    setSaving(true);
    try {
      await api.addSent(r._id, { company: company.trim(), date: date || undefined });
      setCompany('');
      setDate('');
      onChanged();
    } catch (err) {
      onError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeSent(entryId) {
    try {
      await api.deleteSent(r._id, entryId);
      onChanged();
    } catch (err) {
      onError(err.message);
    }
  }

  return (
    <div className="resume-row">
      <div className="resume-head">
        <div className="resume-info">
          <span className="resume-label">{r.label}</span>
          <span className="muted resume-file">
            {r.filename} · {formatBytes(r.size)}
          </span>
        </div>
        <div className="resume-actions">
          {r.sentLog.length > 0 && (
            <button className="badge badge-muted" onClick={onToggle}>
              sent ×{r.sentLog.length}
            </button>
          )}
          <a
            className="ghost-btn sm"
            href={`/api/resumes/${r._id}/download`}
            target="_blank"
            rel="noreferrer"
          >
            View
          </a>
          <button className="ghost-btn sm" onClick={onToggle}>
            Sent to…
          </button>
          <button className="icon-btn" onClick={onDelete} title="Delete">
            ✕
          </button>
        </div>
      </div>

      {open && (
        <div className="sent-panel">
          {r.sentLog.length > 0 && (
            <ul className="sent-list">
              {r.sentLog.map((s) => (
                <li key={s._id}>
                  <span>
                    <strong>{s.company}</strong>
                    <span className="muted"> · {shortDate(s.date)}</span>
                  </span>
                  <button
                    className="icon-btn"
                    onClick={() => removeSent(s._id)}
                    title="Remove"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form className="sent-form" onSubmit={addSent}>
            <input
              placeholder="Company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <button disabled={saving || !company.trim()}>
              {saving ? '…' : 'Log send'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
