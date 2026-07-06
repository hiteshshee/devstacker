// Thin fetch wrapper. All requests are same-origin and send cookies.
async function request(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const isJson = res.headers
    .get('content-type')
    ?.includes('application/json');
  const data = isJson ? await res.json() : null;
  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  me: () => request('/api/auth/me'),
  authStatus: () => request('/api/auth/status'),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  repos: () => request('/api/github/repos'),
  projects: () => request('/api/projects'),
  createProject: (body) =>
    request('/api/projects', { method: 'POST', body: JSON.stringify(body) }),
  updateProject: (id, body) =>
    request(`/api/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  deleteProject: (id) =>
    request(`/api/projects/${id}`, { method: 'DELETE' }),
  dsa: () => request('/api/dsa'),
  createProblem: (body) =>
    request('/api/dsa', { method: 'POST', body: JSON.stringify(body) }),
  deleteProblem: (id) => request(`/api/dsa/${id}`, { method: 'DELETE' }),
  syncLeetcode: (username) =>
    request('/api/dsa/sync-leetcode', {
      method: 'POST',
      body: JSON.stringify({ username }),
    }),
  saveTopics: (topics) =>
    request('/api/dsa/topics', {
      method: 'PUT',
      body: JSON.stringify({ topics }),
    }),
  // platform: 'codeforces' | 'codechef'
  syncCp: (platform, username) =>
    request(`/api/dsa/sync-${platform}`, {
      method: 'POST',
      body: JSON.stringify({ username }),
    }),

  resumes: () => request('/api/resumes'),
  // Upload uses FormData — do NOT set Content-Type (the browser adds the
  // multipart boundary). So this bypasses the JSON `request` helper.
  uploadResume: async (label, file) => {
    const fd = new FormData();
    fd.append('label', label);
    fd.append('file', file);
    const res = await fetch('/api/resumes', {
      method: 'POST',
      credentials: 'include',
      body: fd,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error((data && data.error) || 'Upload failed');
    return data;
  },
  deleteResume: (id) => request(`/api/resumes/${id}`, { method: 'DELETE' }),
  addSent: (id, body) =>
    request(`/api/resumes/${id}/sent`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
