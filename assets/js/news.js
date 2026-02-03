/* ============================
   Helper Base64 UTF-8 SAFE
============================ */
function base64EncodeUtf8(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

/* ============================
   Generate Liveskor Link
============================ */
function makeLiveScoreLink(mid) {
  if (!mid) return null;

  const liveScoreUrl =
    `https://widgets-livetracker.nami.com/id/football` +
    `?profile=g9rzlugz3uxie81` +
    `&trend=0` +
    `&id=${mid}` +
    `&timezone=%207%3A00`;

  const encoded = btoa(unescape(encodeURIComponent(liveScoreUrl)));
  return `https://tigoals.candil.eu.org/p/score-808-liveskor.html?url+${encoded}`;
}


/* ============================
   Fetch & Render Matches
============================ */
fetch("https://idlive.falou.net/live/list")
  .then(res => res.json())
  .then(json => {
    const container = document.getElementById("live-matches");
    const list = json?.data?.list || [];

    if (!list.length) {
      container.innerHTML = "<p>Tidak ada pertandingan ditemukan.</p>";
      return;
    }

    container.innerHTML = list.map(match => {
      const dateObj = new Date(match.match_time * 1000);
      const timeStr = dateObj.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit"
      });

      const isLive = match.type?.includes("live");
      const badgeClass = isLive ? "live" : "upcoming";
      const badgeLabel = isLive ? "LIVE" : "Upcoming";

      // ✅ tombol hanya muncul saat LIVE
      const playLinks = isLive
        ? `<a class="btn-live" href="${makeLiveScoreLink(match.match_id)}">🔴 Play</a>`
        : "";

      return `
        <div class="livecard-match">
          <div class="livecard-header">
            ${match.competition_name}
            <span class="livecard-badge ${badgeClass}">${badgeLabel}</span>
          </div>

          <div class="livecard-teams">
            <div class="livecard-team">
              <img src="${match.home_logo}" alt="${match.home_name}">
              <div>${match.home_name}</div>
            </div>

            <div class="livecard-vs">VS</div>

            <div class="livecard-team">
              <img src="${match.away_logo}" alt="${match.away_name}">
              <div>${match.away_name}</div>
            </div>
          </div>

          <div class="livecard-time">🕒 ${timeStr} WIB</div>

          <div class="livecard-links">
            ${playLinks}
          </div>
        </div>
      `;
    }).join("");
  })
  .catch(() => {
    document.getElementById("live-matches").innerHTML =
      "<p>Gagal memuat data pertandingan.</p>";
  });
