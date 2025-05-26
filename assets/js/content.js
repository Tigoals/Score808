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

function filterByDateAndTime(data) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return data.filter(item => {
    const [year, month, day] = item.tanggal.split('-');
    const [hour, minute] = normalizeTime(item.jam).split(':');

    const matchDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);
    const matchDay = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());

    const isTodayOrTomorrow = matchDay.getTime() === today.getTime() || matchDay.getTime() === tomorrow.getTime();
    const matchEndTime = new Date(matchDate.getTime() + 2 * 60 * 60 * 1000); // +2 jam

    return isTodayOrTomorrow && now <= matchEndTime;
  });
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
      const homeLogo = item.logoHome || 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
      const awayLogo = item.logoAway || 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
      const time = normalizeTime(item.jam);
      
      const streamingUrl = `https://player.rosieworld.net/detail.html?v=1745381716708&mid=${item.linkStreaming}&type=1&pid=3&isTips=1&isLogin=0&sbtcolor=27c5c3&pfont=65px&host=dszb3.com&isStandalone=true`;
      const encodedUrl = base64Encode(streamingUrl);

      const link = `https://beritanasional.eu.org/play.html?url+${encodedUrl}`;

      html += `
        <a href="${link}" class="match-card elementskit_button" target="_blank" rel="noopener">
          <div class="team-column">
            <div class="team-row">
              <img data-src="${homeLogo}" alt="${item.homeTeam}" class="team-logo" src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" loading="lazy">
              <span class="team-name">${item.homeTeam}</span>
            </div>
            <div class="team-row">
              <img data-src="${awayLogo}" alt="${item.awayTeam}" class="team-logo" src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" loading="lazy">
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

function lazyLoadImages() {
  const imgs = document.querySelectorAll('img.team-logo');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.getAttribute('data-src');
          if (src) {
            img.setAttribute('src', src);
            img.removeAttribute('data-src');
          }
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '0px 0px 100px 0px',
      threshold: 0.1
    });

    imgs.forEach(img => {
      if (img.hasAttribute('data-src')) {
        observer.observe(img);
      }
    });
  } else {
    // Fallback untuk browser lama
    imgs.forEach(img => {
      const src = img.getAttribute('data-src');
      if (src) {
        img.setAttribute('src', src);
        img.removeAttribute('data-src');
      }
    });
  }
}


let allData = [];

function renderFilteredData(filter = '') {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const matchesToday = [];
  const matchesTomorrow = [];
  const matchesDone = [];

  allData.forEach(item => {
    const [year, month, day] = item.tanggal.split('-');
    const [hour, minute] = normalizeTime(item.jam).split(':');
    const matchDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);
    const matchDay = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
    const matchEndTime = new Date(matchDate.getTime() + 2 * 60 * 60 * 1000); // +2 jam

    const isToday = matchDay.getTime() === today.getTime();
    const isTomorrow = matchDay.getTime() === tomorrow.getTime();

    let include = true;
    if (filter) {
      const lowerFilter = filter.toLowerCase();
      include = item.liga.toLowerCase().includes(lowerFilter) ||
                item.homeTeam.toLowerCase().includes(lowerFilter) ||
                item.awayTeam.toLowerCase().includes(lowerFilter) ||
                item.tanggal.toLowerCase().includes(lowerFilter);
    }

    if (include) {
      if (isToday && now <= matchEndTime) {
        matchesToday.push(item);
      } else if (isTomorrow && now <= matchEndTime) {
        matchesTomorrow.push(item);
      } else if (now > matchEndTime) {
        matchesDone.push(item);
      }
    }
  });

  let html = '';

  if (matchesToday.length > 0) {
    html += `<h2 class="day-divider">📅 Jadwal Lengkap Hari Ini</h2>` + generateHTML(matchesToday);
  }

  if (matchesTomorrow.length > 0) {
    html += `<h2 class="day-divider">📅 Jadwal Lengkap Selanjutnya</h2>` + generateHTML(matchesTomorrow);
  }

  if (matchesDone.length > 0) {
    html += `<h2 class="day-divider">✅ Pertandingan Selesai</h2>` + generateHTML(matchesDone);
  }

  document.getElementById('jadwal-pertandingan').innerHTML = html || `<div style="text-align:center;padding:20px;">Tidak ada pertandingan tersedia.</div>`;
  lazyLoadImages();
}


fetch(csvUrl)
  .then(response => response.text())
  .then(csv => {
    allData = parseCSV(csv);
    renderFilteredData();

    document.getElementById('searchInput').addEventListener('input', e => {
      renderFilteredData(e.target.value);
    });
  })
  .catch(() => {
    document.getElementById('jadwal-pertandingan').innerHTML = `<div style="text-align:center;padding:20px;">Gagal memuat data.</div>`;
  });
