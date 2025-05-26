const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQoqUMApbGKBfLJOIE1jztwA5bOsiQuCx5LzexE8ip7jJK_Ue6Kkx7bqTOu8jLKUlw0sc6-zLg2kOmA/pub?gid=0&single=true&output=csv';

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

function getDayLabel(dateStr) {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const d = new Date(dateStr);
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
}

function normalizeTime(jam) {
  const parts = jam.split(':');
  return `${parts[0].padStart(2, '0')}:${(parts[1] || '00').padStart(2, '0')}`;
}

function base64Encode(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function generateHTML(data) {
  const grouped = {};

  data.forEach(item => {
    const key = item.liga + '|' + item.tanggal;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  });

  let html = '';

  for (const key in grouped) {
    const [liga, tanggal] = key.split('|');
    const label = `${liga} – ${getDayLabel(tanggal)}`;

    html += `<div class="match-block">
      <div class="league-header">🏆 ${label}</div>`;

    grouped[key].forEach(item => {
      const homeLogo = item.logoHome || 'https://via.placeholder.com/22';
      const awayLogo = item.logoAway || 'https://via.placeholder.com/22';
      const time = normalizeTime(item.jam);
      
      const streamingUrl = `https://player.rosieworld.net/detail.html?v=1745381716708&mid=${item.linkStreaming}&type=1&pid=3&isTips=1&isLogin=0&sbtcolor=27c5c3&pfont=65px&host=dszb3.com&isStandalone=true`;
      const encodedUrl = base64Encode(streamingUrl);

      const link = `https://beritanasional.eu.org/play.html?url+${encodedUrl}`;

      html += `
        <a href="${link}" class="match-card" target="_blank" rel="noopener">
          <div class="team-column">
            <div class="team-row">
              <img src="${homeLogo}" alt="${item.homeTeam}" class="team-logo">
              <span class="team-name">${item.homeTeam}</span>
            </div>
            <div class="team-row">
              <img src="${awayLogo}" alt="${item.awayTeam}" class="team-logo">
              <span class="team-name">${item.awayTeam}</span>
            </div>
          </div>
          <div class="match-time">
            <div>${time}</div>
            <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M10 16.5L16 12L10 7.5V16.5ZM21 3H3C1.89 3 1 3.89 1 5V17C1 18.11 1.89 19 3 19H8V21H16V19H21C22.11 19 23 18.11 23 17V5C23 3.89 22.11 3 21 3ZM21 17H3V5H21V17Z"/>
            </svg>
          </div>
        </a>`;
    });

    html += '</div>';
  }

  return html || `<div style="text-align:center;padding:20px;">Tidak ada pertandingan tersedia.</div>`;
}

let allData = [];

function renderFilteredData(filter = '') {
  if (!filter) {
    document.getElementById('jadwal-pertandingan').innerHTML = generateHTML(allData);
    return;
  }
  
  const lowerFilter = filter.toLowerCase();
  
  // Filter data berdasarkan nama tim, liga, atau tanggal
  const filtered = allData.filter(item => {
    return item.liga.toLowerCase().includes(lowerFilter) ||
           item.homeTeam.toLowerCase().includes(lowerFilter) ||
           item.awayTeam.toLowerCase().includes(lowerFilter) ||
           item.tanggal.toLowerCase().includes(lowerFilter);
  });
  
  document.getElementById('jadwal-pertandingan').innerHTML = generateHTML(filtered);
}

fetch(csvUrl)
  .then(response => response.text())
  .then(csv => {
    allData = parseCSV(csv);
    renderFilteredData();

    // Tambahkan event listener pencarian
    document.getElementById('searchInput').addEventListener('input', e => {
      renderFilteredData(e.target.value);
    });
  })
  .catch(() => {
    document.getElementById('jadwal-pertandingan').innerHTML = `<div style="text-align:center;padding:20px;">Gagal memuat data.</div>`;
  });
