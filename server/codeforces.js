// Codeforces has an OFFICIAL public API — reliable, no scraping needed.
// https://codeforces.com/apidoc

function bucket(rating) {
  if (!rating) return 'medium';
  if (rating < 1300) return 'easy';
  if (rating < 1900) return 'medium';
  return 'hard';
}

async function fetchProfile(handle) {
  const infoRes = await fetch(
    `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`
  );
  const info = await infoRes.json();
  if (info.status !== 'OK' || !info.result || !info.result[0]) {
    throw new Error('Codeforces handle not found');
  }
  const u = info.result[0];

  // Pull the full submission history to count distinct solved problems.
  const statusRes = await fetch(
    `https://codeforces.com/api/user.status?handle=${encodeURIComponent(
      handle
    )}&from=1&count=10000`
  );
  const status = await statusRes.json();
  const subs = status.status === 'OK' ? status.result : [];

  const solved = new Set();
  const recent = [];
  for (const s of subs) {
    if (s.verdict !== 'OK') continue;
    const key = `${s.problem.contestId || ''}${s.problem.index}`;
    if (solved.has(key)) continue;
    solved.add(key);
    // subs are newest-first, so the first 20 distinct solves are the recent ones.
    if (recent.length < 20) {
      recent.push({
        title: s.problem.name,
        slug: `cf-${key}`,
        difficulty: bucket(s.problem.rating),
        solvedAt: new Date(s.creationTimeSeconds * 1000),
        url: s.problem.contestId
          ? `https://codeforces.com/problemset/problem/${s.problem.contestId}/${s.problem.index}`
          : '',
      });
    }
  }

  return {
    username: u.handle,
    solved: solved.size,
    rating: u.rating || 0,
    rankLabel: u.rank || 'unrated',
    maxRating: u.maxRating || 0,
    recent,
  };
}

module.exports = { fetchProfile };
