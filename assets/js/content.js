const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQi8xg0A9SKnffOrEp7CGY3QZGbrBUSn1qpxZZQvTstd7CpnSR_EjVK6LruqBNGWfPKaNOBZVV4CJ37/pub?gid=0&single=true&output=csv';

function parseCSV(text) {
  const [headerLine, ...lines] = text.trim().split('\n');
  const headers = headerLine.split(',').map(h => h.trim());
  return lines.map(line => {
    const values = line.split(',');
    return headers.reduce((obj, key, i) => {
      obj[key] = values[i]?.trim() || '';
      return obj;
    }, {});
  });
}

function normalizeTime(jam) {
  const [h = '00', m = '00'] = jam.split(':');
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
}

function formatTanggalIndonesia(tglStr) {
  const hari = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
  const bulan = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const dateObj = new Date(tglStr);
  return `${hari[dateObj.getDay()]}, ${dateObj.getDate()} ${bulan[dateObj.getMonth()]}`;
}

function renderMatchList(title, matchList) {
  if (!matchList.length) return '';
  let html = `<div class="match-date-header">${title}</div><div class="match-section">`;
  matchList.forEach(item => {
    const time = normalizeTime(item.jam);
    const tanggalFormatted = formatTanggalIndonesia(item.tanggal);
    html += `
      <a href="https://score808pages.github.io/play.html?url+https://player.rosieworld.net/detail.html?v=1745381716708&mid=${item.linkStreaming}&type=1&pid=3&isTips=1&isLogin=0&sbtcolor=27c5c3&pfont=65px&host=dszb3.com&isStandalone=true" class="match-card" rel="noopener" target="_blank">
        <div class="match-league">🏆 <strong>${item.liga}</strong></div>
        <div class="match-info">
          <div class="match-left">
            <div class="match-time">${tanggalFormatted} - ${time} WIB</div>
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

function loadMatchSchedule() {
  fetch(csvUrl)
    .then(response => response.text())
    .then(csv => {
      const data = parseCSV(csv);
      const now = new Date();
      const formatDate = d => d.toISOString().split('T')[0];

      const today = new Date();
      const tomorrow = new Date(today.getTime() + 86400000);
      const lusa = new Date(today.getTime() + 2 * 86400000);

      const todayStr = formatDate(today);
      const tomorrowStr = formatDate(tomorrow);
      const lusaStr = formatDate(lusa);

      const allMatches = data
        .filter(d => [todayStr, tomorrowStr, lusaStr].includes(d.tanggal))
        .map(item => {
          const jam = normalizeTime(item.jam);
          const matchTime = new Date(`${item.tanggal}T${jam}:00`);
          return { ...item, matchTime };
        });

      const todayUpcoming = [];
      const todayFinished = [];
      const nextMatches = [];

      allMatches.forEach(item => {
        const matchEnd = new Date(item.matchTime.getTime() + 2 * 60 * 60 * 1000);
        if (item.tanggal === todayStr) {
          (matchEnd > now ? todayUpcoming : todayFinished).push(item);
        } else {
          nextMatches.push(item);
        }
      });

      const sortByTime = (a, b) => a.matchTime - b.matchTime;
      todayUpcoming.sort(sortByTime);
      todayFinished.sort(sortByTime);
      nextMatches.sort(sortByTime);

      let html = '';
      if (todayUpcoming.length) html += renderMatchList(`Jadwal Pertandingan Hari Ini`, todayUpcoming);
      if (nextMatches.length) html += renderMatchList(`Jadwal Pertandingan Selanjutnya`, nextMatches);
      if (todayFinished.length) html += renderMatchList(`Pertandingan yang Sudah Selesai`, todayFinished);

      if (!html) {
        html = '<div style="text-align:center;padding:20px;">Tidak ada pertandingan tersedia.</div>';
      }

      document.getElementById('jadwal-pertandingan').innerHTML = html;
    })
    .catch(() => {
      document.getElementById('jadwal-pertandingan').innerHTML = `<div style="text-align:center;padding:20px;">Gagal memuat data.</div>`;
    });
}

// Jalankan pertama kali
loadMatchSchedule();

// Auto refresh setiap 3 menit (180.000 ms)
setInterval(loadMatchSchedule, 180000);
