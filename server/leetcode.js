// Thin client over LeetCode's PUBLIC GraphQL endpoint.
// NOTE: this is an UNOFFICIAL endpoint — LeetCode has no official public API.
// Treat it as best-effort: it may change or break, and manual entry must
// always remain a working fallback (see PRD §15).

const ENDPOINT = 'https://leetcode.com/graphql';

async function gql(query, variables) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Referer: 'https://leetcode.com',
      'User-Agent': 'Mozilla/5.0 (DevStacker)',
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`LeetCode responded ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error('LeetCode query error');
  return json.data;
}

// Aggregate solved counts by difficulty. Throws if the username is unknown.
async function fetchStats(username) {
  let data;
  try {
    data = await gql(
      `query($u:String!){
        matchedUser(username:$u){
          submitStatsGlobal{ acSubmissionNum{ difficulty count } }
          userCalendar{ streak totalActiveDays }
        }
      }`,
      { u: username }
    );
  } catch {
    // LeetCode returns a GraphQL error (not null) for an unknown username.
    throw new Error("Couldn't find that LeetCode user (check the username, or the profile may be private)");
  }
  if (!data.matchedUser) {
    throw new Error("Couldn't find that LeetCode user (check the username, or the profile may be private)");
  }
  const nums = data.matchedUser.submitStatsGlobal.acSubmissionNum;
  const by = (d) => nums.find((n) => n.difficulty === d)?.count || 0;
  const cal = data.matchedUser.userCalendar || {};
  return {
    total: by('All'),
    easy: by('Easy'),
    medium: by('Medium'),
    hard: by('Hard'),
    // Real values from LeetCode's calendar (current year).
    streak: cal.streak || 0,
    totalActiveDays: cal.totalActiveDays || 0,
  };
}

// Recent accepted submissions (only visible if the profile allows it).
async function fetchRecentAC(username, limit = 20) {
  const data = await gql(
    `query($u:String!,$n:Int!){
      recentAcSubmissionList(username:$u, limit:$n){ title titleSlug timestamp }
    }`,
    { u: username, n: limit }
  );
  return (data.recentAcSubmissionList || []).map((s) => ({
    title: s.title,
    slug: s.titleSlug,
    solvedAt: new Date(Number(s.timestamp) * 1000),
  }));
}

// Difficulty for a single problem (recent-AC list doesn't include it).
async function fetchDifficulty(slug) {
  try {
    const data = await gql(
      `query($s:String!){ question(titleSlug:$s){ difficulty } }`,
      { s: slug }
    );
    const d = data.question?.difficulty;
    return d ? d.toLowerCase() : 'medium';
  } catch {
    return 'medium';
  }
}

module.exports = { fetchStats, fetchRecentAC, fetchDifficulty };
