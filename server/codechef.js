// CodeChef has NO official API, so we scrape the public profile page.
// This is best-effort: if CodeChef changes their layout it degrades to an
// error (manual entry stays available). Never a hard dependency (PRD §15).

function ratingToStars(r) {
  if (r >= 2500) return 7;
  if (r >= 2200) return 6;
  if (r >= 2000) return 5;
  if (r >= 1800) return 4;
  if (r >= 1600) return 3;
  if (r >= 1400) return 2;
  if (r > 0) return 1;
  return 0;
}

async function fetchProfile(handle) {
  const res = await fetch(
    `https://www.codechef.com/users/${encodeURIComponent(handle)}`,
    { headers: { 'User-Agent': 'Mozilla/5.0 (DevStacker)' } }
  );
  if (res.status === 404) throw new Error('CodeChef user not found');
  if (!res.ok) throw new Error('CodeChef is unavailable right now');

  const html = await res.text();
  const ratingM = html.match(/rating-number[^>]*>\s*([0-9]+)/);
  const solvedM =
    html.match(/Total Problems Solved[^0-9]*([0-9]+)/i) ||
    html.match(/Problems Solved[^0-9]*([0-9]+)/i);

  const rating = ratingM ? Number(ratingM[1]) : 0;
  const solved = solvedM ? Number(solvedM[1]) : 0;

  if (!rating && !solved) {
    throw new Error(
      "Couldn't read that CodeChef profile (check the handle, or the profile may be private)"
    );
  }

  const stars = ratingToStars(rating);
  return {
    username: handle,
    solved,
    rating,
    rankLabel: stars ? `${stars}★` : '',
    maxRating: 0,
  };
}

module.exports = { fetchProfile };
