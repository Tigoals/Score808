const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQi8xg0A9SKnffOrEp7CGY3QZGbrBUSn1qpxZZQvTstd7CpnSR_EjVK6LruqBNGWfPKaNOBZVV4CJ37/pub?gid=0&single=true&output=csv';

function parseCSV(text) {
  const rows = text.trim().split('\n').map(row => row.split(','));
  const headers = rows.shift().map(h => h.trim());
  return rows.map(row => {
    let obj = {};
    row.forEach((value, index) => {
      obj[headers[index]] = value.trim();
    });
    return obj;
  });
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function normalizeTime(jam) {
  const parts = jam.split(':');
  const hour = parts[0].padStart(2, '0');
  const minute = parts[1] ? parts[1].padStart(2, '0') : '00';
  return `${hour}:${minute}`;
}

function getHeaderTanggal(dateObj) {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const dayName = days[dateObj.getDay()];
  const day = dateObj.getDate();
  const monthName = months[dateObj.getMonth()];
  return `${dayName}, ${day} ${monthName}`;
}

function generateSectionHTML(data, tanggal, label) {
  const now = new Date();
  const upcoming = [];

  data.forEach(item => {
    if (item.tanggal === tanggal) {
      const time = normalizeTime(item.jam);
      const matchTime = new Date(`${item.tanggal}T${time}:00`);
      const matchEnd = new Date(matchTime.getTime() + 3 * 60 * 60 * 1000);
      if (matchEnd > now) {
        upcoming.push({ ...item, matchTime });
      }
    }
  });

  // Urutkan berdasarkan waktu terdekat
  upcoming.sort((a, b) => a.matchTime - b.matchTime);

  if (upcoming.length === 0) return '';

  let html = `
    <div class="match-date-header">${label}</div>
    <div class="match-section">`;

  upcoming.forEach(item => {
    const time = normalizeTime(item.jam);
    html += `
      <a href="https://score808pages.github.io/play.html?url+https://player.rosieworld.net/detail.html?v=1745381716708&mid=${item.linkStreaming}&type=1&pid=3&isTips=1&isLogin=0&sbtcolor=27c5c3&pfont=65px&host=dszb3.com&isStandalone=true" class="match-card" rel="noopener" target="_blank">
        <div class="match-league">🏆 <strong>${item.liga}</strong></div>
        <div class="match-info">
          <div class="match-left">
            <div class="match-time">${time} WIB</div>
            <div class="match-team">${item.MatchTim}</div>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" class="play-icon" viewBox="0 0 24 24">
            <path d="M21,3H3C1.89,3 1,3.89 1,5V17A2,2 0 0,0 3,19H8V21H16V19H21A2,2 0 0,0 23,17V5C23,3.89 22.1,3 21,3M21,17H3V5H21M16,11L9,15V7" />
          </svg>
        </div>
      </a>`;
  });

  html += '</div>';
  return html;
}

fetch(csvUrl)
  .then(response => response.text())
  .then(csv => {
    const data = parseCSV(csv);

    const today = new Date(); // Senin, 28 April 2025
    const besok = new Date(today);
    besok.setDate(today.getDate() + 1); // Selasa, 29 April 2025

    const todayStr = formatDate(today);
    const besokStr = formatDate(besok);

    const contentToday = generateSectionHTML(data, todayStr, `Next Match - ${getHeaderTanggal(today)}`);
    const contentBesok = generateSectionHTML(data, besokStr, `Next Match - ${getHeaderTanggal(besok)}`);

    const final = contentToday + contentBesok || `<div style="text-align:center;padding:20px;">Tidak ada pertandingan tersedia.</div>`;

    document.getElementById('jadwal-pertandingan').innerHTML = final;
  })
  .catch(() => {
    document.getElementById('jadwal-pertandingan').innerHTML = `<div style="text-align:center;padding:20px;">Gagal memuat data.</div>`;
  });