/**
 * Pulse Music Player — script.js  (v2 — Premium Edition)
 * Vanilla JS, no frameworks.
 * ─────────────────────────────────────────────────────────────
 * Features:
 *   Play/Pause, Next, Prev, Shuffle, Repeat
 *   Seekable progress bar (click + drag)
 *   Volume slider + mute toggle
 *   Keyboard shortcuts (Space, ←, →, M)
 *   Sidebar playlist with live "now-playing" bars
 *   Toast notifications on song change
 *   LocalStorage persistence (last song + volume + favourites)
 *   Animated album-art glow (gradient per song)
 *   🆕 Rotating album art while playing (vinyl effect)
 *   🆕 CSS Audio Visualizer (animated bars)
 *   🆕 Dynamic background blobs from song gradient
 *   🆕 Favourite songs (heart button, persisted)
 *   🆕 Mini Player (mobile fixed bar)
 *   🆕 Mobile sidebar drawer
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

/* ═══════════════════════════════════════════════════════════
   SONGS DATA
   ═══════════════════════════════════════════════════════════ */
const songs = [
  {
    title: "Luka Chippi",
    artist: "Seedhe Maut",
    src: "songs/song1.mp3",
    cover: "images/cover1.jpg",
    gradient: "135deg, #7c5cfc, #3b82f6",
    dynColor1: "#7c5cfc",
    dynColor2: "#3b82f6"
  },
  {
    title: "Never Enough",
    artist: "KR$NA",
    src: "songs/song2.mp3",
    cover: "images/cover2.jpg",
    gradient: "135deg, #f59e0b, #ef4444",
    dynColor1: "#f59e0b",
    dynColor2: "#ef4444"
  },
  {
    title: "Boom Shaka",
    artist: "Dhanda Nyoliwala & KR$NA",
    src: "songs/song3.mp3",
    cover: "images/cover3.jpg",
    gradient: "135deg, #10b981, #3b82f6",
    dynColor1: "#10b981",
    dynColor2: "#3b82f6"
  },
  {
    title: "Bounce",
    artist: "Subh",
    src: "songs/song4.mp3",
    cover: "images/cover4.jpg",
    gradient: "135deg, #f472b6, #a78bfa",
    dynColor1: "#f472b6",
    dynColor2: "#a78bfa"
  },
  {
    title: "Dealer",
    artist: "Diljit Dosanjh",
    src: "songs/song5.mp3",
    cover: "images/cover5.jpg",
    gradient: "135deg, #06b6d4, #7c5cfc",
    dynColor1: "#06b6d4",
    dynColor2: "#7c5cfc"
  }
];

/* ═══════════════════════════════════════════════════════════
   STATE
   ═══════════════════════════════════════════════════════════ */
let currentIndex = 0;
let isPlaying = false;
let isShuffle = false;
let repeatMode = 'none';   // 'none' | 'all' | 'one'
let isMuted = false;
let prevVolume = 1;
let isDragging = false;
let toastTimer = null;
let favourites = new Set();

/* ═══════════════════════════════════════════════════════════
   DOM REFS
   ═══════════════════════════════════════════════════════════ */
const audio           = document.getElementById('audio');
const albumArt        = document.getElementById('albumArt');
const artGlow         = document.getElementById('artGlow');
const bgBlurImg       = document.getElementById('bgBlurImg');
const songTitle       = document.getElementById('songTitle');
const songArtist      = document.getElementById('songArtist');
const playPauseBtn    = document.getElementById('playPauseBtn');
const playIcon        = document.getElementById('playIcon');
const prevBtn         = document.getElementById('prevBtn');
const nextBtn         = document.getElementById('nextBtn');
const shuffleBtn      = document.getElementById('shuffleBtn');
const repeatBtn       = document.getElementById('repeatBtn');
const progressBar     = document.getElementById('progressBar');
const progressFill    = document.getElementById('progressFill');
const progressThumb   = document.getElementById('progressThumb');
const currentTimeEl   = document.getElementById('currentTime');
const durationEl      = document.getElementById('duration');
const volumeSlider    = document.getElementById('volumeSlider');
const muteBtn         = document.getElementById('muteBtn');
const volumeIcon      = document.getElementById('volumeIcon');
const playlistEl      = document.getElementById('playlist');
const toast           = document.getElementById('toast');
const favBtn          = document.getElementById('favBtn');
const visualizerWrap  = document.getElementById('visualizerWrap');
// Mini player
const miniPlayer      = document.getElementById('miniPlayer');
const miniThumb       = document.getElementById('miniThumb');
const miniTitle       = document.getElementById('miniTitle');
const miniArtist      = document.getElementById('miniArtist');
const miniPlayBtn     = document.getElementById('miniPlayBtn');
const miniPlayIcon    = document.getElementById('miniPlayIcon');
const miniPrevBtn     = document.getElementById('miniPrevBtn');
const miniNextBtn     = document.getElementById('miniNextBtn');
const miniProgressFill= document.getElementById('miniProgressFill');
// Mobile drawer
const menuBtn         = document.getElementById('menuBtn');
const sidebar         = document.getElementById('sidebar');
const sidebarOverlay  = document.getElementById('sidebarOverlay');


/* ═══════════════════════════════════════════════════════════
   FAVOURITES
   ═══════════════════════════════════════════════════════════ */
function loadFavourites() {
  try {
    const saved = JSON.parse(localStorage.getItem('pulse_favs') || '[]');
    favourites = new Set(saved);
  } catch { favourites = new Set(); }
}

function saveFavourites() {
  localStorage.setItem('pulse_favs', JSON.stringify([...favourites]));
}

function toggleFavourite(index) {
  if (favourites.has(index)) {
    favourites.delete(index);
    showToast(`💔 Removed from favourites`);
  } else {
    favourites.add(index);
    showToast(`❤️ Added to favourites`);
  }
  saveFavourites();
  updateFavUI();
}

function updateFavUI() {
  // Update main heart button
  const isFaved = favourites.has(currentIndex);
  favBtn.textContent = isFaved ? '♥' : '♡';
  favBtn.classList.toggle('faved', isFaved);

  // Update playlist heart buttons
  const items = playlistEl.querySelectorAll('.fav-btn-playlist');
  items.forEach((btn, i) => {
    const faved = favourites.has(i);
    btn.textContent = faved ? '♥' : '♡';
    btn.classList.toggle('faved', faved);
  });
}


/* ═══════════════════════════════════════════════════════════
   DYNAMIC BACKGROUND
   ═══════════════════════════════════════════════════════════ */
function setDynamicBackground(song) {
  // Full-screen blur background — update image source
  if (bgBlurImg) {
    bgBlurImg.src = song.cover;
  }
}


/* ═══════════════════════════════════════════════════════════
   VISUALIZER
   ═══════════════════════════════════════════════════════════ */
function setVisualizerState(playing) {
  if (playing) {
    visualizerWrap.classList.remove('paused');
  } else {
    visualizerWrap.classList.add('paused');
  }
}


/* ═══════════════════════════════════════════════════════════
   PLAYLIST RENDER
   ═══════════════════════════════════════════════════════════ */
function buildPlaylist() {
  playlistEl.innerHTML = '';

  songs.forEach((song, i) => {
    const li = document.createElement('li');
    li.className = 'playlist-item';
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', 'false');
    li.dataset.index = i;

    li.innerHTML = `
      <div class="track-num">
        <span class="track-num-text">${i + 1}</span>
        <div class="bars" aria-hidden="true">
          <div class="bar"></div>
          <div class="bar"></div>
          <div class="bar"></div>
        </div>
      </div>
      <img class="playlist-thumb" src="${song.cover}"
           alt="${song.title} cover"
           onerror="this.style.background='#1a1a24';this.removeAttribute('src')" />
      <div class="track-info">
        <div class="track-name">${song.title}</div>
        <div class="track-artist">${song.artist}</div>
      </div>
      <span class="track-dur" data-dur-index="${i}">--:--</span>
      <button class="fav-btn-playlist" data-fav-index="${i}" aria-label="Favourite" title="Favourite">♡</button>
    `;

    // Click to play
    li.addEventListener('click', (e) => {
      if (e.target.closest('.fav-btn-playlist')) return; // handled below
      currentIndex = i;
      loadSong();
      playSong();
    });

    // Playlist fav button
    const favBtnPl = li.querySelector('.fav-btn-playlist');
    favBtnPl.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavourite(i);
    });

    playlistEl.appendChild(li);
  });

  // Eagerly resolve durations
  songs.forEach((song, i) => {
    const tmp = new Audio();
    tmp.preload = 'metadata';
    tmp.addEventListener('loadedmetadata', () => {
      const el = document.querySelector(`[data-dur-index="${i}"]`);
      if (el) el.textContent = formatTime(tmp.duration);
    });
    tmp.src = song.src;
  });

  updateFavUI();
}

function updatePlaylistHighlight() {
  const items = playlistEl.querySelectorAll('.playlist-item');
  items.forEach((item, i) => {
    const active = i === currentIndex;
    item.classList.toggle('active', active);
    item.classList.toggle('paused', active && !isPlaying);
    item.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  const activeItem = playlistEl.querySelector('.playlist-item.active');
  if (activeItem) {
    activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}


/* ═══════════════════════════════════════════════════════════
   CORE PLAYBACK
   ═══════════════════════════════════════════════════════════ */
function loadSong() {
  const song = songs[currentIndex];

  audio.src = song.src;

  // Album art — animate on change
  albumArt.style.opacity = '0';

  setTimeout(() => {
    albumArt.src = song.cover;
    albumArt.onerror = () => { albumArt.removeAttribute('src'); };
    albumArt.style.opacity = '1';
    setArtGlow(song.gradient);
    setDynamicBackground(song);
  }, 180);

  // Title + artist slide in
  songTitle.classList.remove('anim');
  songArtist.classList.remove('anim');
  void songTitle.offsetWidth;
  songTitle.textContent = song.title;
  songArtist.textContent = song.artist;
  songTitle.classList.add('anim');
  songArtist.classList.add('anim');

  // Mini player update
  miniThumb.src = song.cover;
  miniTitle.textContent = song.title;
  miniArtist.textContent = song.artist;

  // Reset progress
  progressFill.style.width = '0%';
  progressThumb.style.left = '0%';
  miniProgressFill.style.width = '0%';
  currentTimeEl.textContent = '0:00';
  durationEl.textContent = '0:00';

  updatePlaylistHighlight();
  updateFavUI();

  localStorage.setItem('pulse_lastIndex', currentIndex);
}

function playSong() {
  audio.play().catch(() => {});
  isPlaying = true;
  playIcon.className = 'ph ph-pause';
  miniPlayIcon.className = 'ph ph-pause';
  albumArt.classList.add('playing');
  setVisualizerState(true);
  updatePlaylistHighlight();
  showToast(`▶ ${songs[currentIndex].title}`);
}

function pauseSong() {
  audio.pause();
  isPlaying = false;
  playIcon.className = 'ph ph-play';
  miniPlayIcon.className = 'ph ph-play';
  albumArt.classList.remove('playing');
  setVisualizerState(false);
  updatePlaylistHighlight();
}

function nextSong() {
  if (repeatMode === 'one') {
    audio.currentTime = 0;
    playSong();
    return;
  }

  if (isShuffle) {
    let next;
    do { next = Math.floor(Math.random() * songs.length); }
    while (next === currentIndex && songs.length > 1);
    currentIndex = next;
  } else {
    currentIndex = (currentIndex + 1) % songs.length;
  }

  loadSong();
  if (isPlaying) playSong();
}

function prevSong() {
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  currentIndex = (currentIndex - 1 + songs.length) % songs.length;
  loadSong();
  if (isPlaying) playSong();
}


/* ═══════════════════════════════════════════════════════════
   PROGRESS
   ═══════════════════════════════════════════════════════════ */
function updateProgress() {
  if (!audio.duration || isDragging) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  setProgressUI(pct);
  currentTimeEl.textContent = formatTime(audio.currentTime);
  // Mini player progress
  miniProgressFill.style.width = `${pct}%`;
}

function setProgress(e) {
  const rect = progressBar.getBoundingClientRect();
  const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
  const pct = (x / rect.width) * 100;
  setProgressUI(pct);
  if (audio.duration) {
    audio.currentTime = (pct / 100) * audio.duration;
    currentTimeEl.textContent = formatTime(audio.currentTime);
  }
}

function setProgressUI(pct) {
  const clamp = Math.max(0, Math.min(pct, 100));
  progressFill.style.width = `${clamp}%`;
  progressThumb.style.left = `${clamp}%`;
  progressBar.setAttribute('aria-valuenow', Math.round(clamp));
}


/* ═══════════════════════════════════════════════════════════
   VOLUME
   ═══════════════════════════════════════════════════════════ */
function updateVolume() {
  const val = parseFloat(volumeSlider.value);
  audio.volume = val;
  isMuted = (val === 0);
  updateVolumeIcon(val);

  const pct = val * 100;
  volumeSlider.style.background =
    `linear-gradient(to right, var(--accent) ${pct}%, var(--bg-2) ${pct}%)`;

  localStorage.setItem('pulse_volume', val);
}

function updateVolumeIcon(val) {
  if (val === 0 || isMuted) {
    volumeIcon.className = 'ph ph-speaker-slash';
  } else if (val < 0.4) {
    volumeIcon.className = 'ph ph-speaker-low';
  } else if (val < 0.75) {
    volumeIcon.className = 'ph ph-speaker';
  } else {
    volumeIcon.className = 'ph ph-speaker-high';
  }
}

function toggleMute() {
  if (isMuted) {
    isMuted = false;
    audio.volume = prevVolume || 0.8;
    volumeSlider.value = audio.volume;
  } else {
    prevVolume = audio.volume;
    isMuted = true;
    audio.volume = 0;
    volumeSlider.value = 0;
  }
  updateVolume();
}


/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */
function formatTime(secs) {
  if (!isFinite(secs) || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function setArtGlow(gradient) {
  artGlow.style.background = `linear-gradient(${gradient})`;
}

function showToast(msg) {
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

function cycleRepeat() {
  if (repeatMode === 'none') {
    repeatMode = 'all';
    repeatBtn.classList.add('active');
    repeatBtn.querySelector('i').className = 'ph ph-repeat';
    showToast('Repeat: All');
  } else if (repeatMode === 'all') {
    repeatMode = 'one';
    repeatBtn.querySelector('i').className = 'ph ph-repeat-once';
    showToast('Repeat: One');
  } else {
    repeatMode = 'none';
    repeatBtn.classList.remove('active');
    repeatBtn.querySelector('i').className = 'ph ph-repeat';
    showToast('Repeat: Off');
  }
}


/* ═══════════════════════════════════════════════════════════
   MOBILE DRAWER
   ═══════════════════════════════════════════════════════════ */
function openSidebar() {
  sidebar.classList.add('open');
  sidebarOverlay.classList.add('visible');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('visible');
  document.body.style.overflow = '';
}

if (menuBtn) {
  menuBtn.addEventListener('click', openSidebar);
}
if (sidebarOverlay) {
  sidebarOverlay.addEventListener('click', closeSidebar);
}


/* ═══════════════════════════════════════════════════════════
   MINI PLAYER VISIBILITY
   ═══════════════════════════════════════════════════════════ */
function updateMiniPlayerVisibility() {
  // Show mini player on mobile always (CSS handles this)
  // On desktop, show when player is scrolled out of view
  const isMobile = window.innerWidth <= 640;
  if (!isMobile) {
    // On desktop, mini player is hidden via CSS (display:none)
    return;
  }
}

// Mini player controls
miniPlayBtn.addEventListener('click', () => {
  isPlaying ? pauseSong() : playSong();
});
miniPrevBtn.addEventListener('click', prevSong);
miniNextBtn.addEventListener('click', nextSong);


/* ═══════════════════════════════════════════════════════════
   EVENT LISTENERS
   ═══════════════════════════════════════════════════════════ */

// Play / Pause
playPauseBtn.addEventListener('click', () => {
  isPlaying ? pauseSong() : playSong();
});

// Previous / Next
prevBtn.addEventListener('click', prevSong);
nextBtn.addEventListener('click', nextSong);

// Shuffle
shuffleBtn.addEventListener('click', () => {
  isShuffle = !isShuffle;
  shuffleBtn.classList.toggle('active', isShuffle);
  showToast(isShuffle ? 'Shuffle: On' : 'Shuffle: Off');
});

// Repeat
repeatBtn.addEventListener('click', cycleRepeat);

// Favourite (main button)
favBtn.addEventListener('click', () => {
  toggleFavourite(currentIndex);
});

// Audio — time update
audio.addEventListener('timeupdate', updateProgress);

// Audio — metadata loaded
audio.addEventListener('loadedmetadata', () => {
  durationEl.textContent = formatTime(audio.duration);
});

// Audio — song ended
audio.addEventListener('ended', () => {
  if (repeatMode === 'one') {
    audio.currentTime = 0;
    playSong();
  } else if (repeatMode === 'all') {
    nextSong();
    playSong();
  } else {
    if (currentIndex < songs.length - 1) {
      nextSong();
      playSong();
    } else {
      isPlaying = false;
      playIcon.className = 'ph ph-play';
      miniPlayIcon.className = 'ph ph-play';
      albumArt.classList.remove('playing');
      setVisualizerState(false);
      updatePlaylistHighlight();
    }
  }
});

/* ─── Progress bar — click ────────────────────────────── */
progressBar.addEventListener('click', (e) => {
  if (!isDragging) setProgress(e);
});

/* ─── Progress bar — drag (mouse) ────────────────────── */
progressBar.addEventListener('mousedown', (e) => {
  isDragging = true;
  progressBar.classList.add('dragging');
  setProgress(e);
});

document.addEventListener('mousemove', (e) => {
  if (isDragging) setProgress(e);
});

document.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;
    progressBar.classList.remove('dragging');
  }
});

/* ─── Progress bar — drag (touch) ────────────────────── */
progressBar.addEventListener('touchstart', (e) => {
  isDragging = true;
  progressBar.classList.add('dragging');
  setProgress(e.touches[0]);
}, { passive: true });

document.addEventListener('touchmove', (e) => {
  if (isDragging) setProgress(e.touches[0]);
}, { passive: true });

document.addEventListener('touchend', () => {
  if (isDragging) {
    isDragging = false;
    progressBar.classList.remove('dragging');
  }
});

/* ─── Volume slider ───────────────────────────────────── */
volumeSlider.addEventListener('input', updateVolume);

/* ─── Mute button ─────────────────────────────────────── */
muteBtn.addEventListener('click', toggleMute);

/* ─── Keyboard shortcuts ──────────────────────────────── */
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;

  switch (e.code) {
    case 'Space':
      e.preventDefault();
      isPlaying ? pauseSong() : playSong();
      break;
    case 'ArrowRight':
      e.preventDefault();
      nextSong();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      prevSong();
      break;
    case 'KeyM':
      toggleMute();
      break;
    case 'KeyF':
      toggleFavourite(currentIndex);
      break;
  }
});


/* ═══════════════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════════════ */
function init() {
  // Load favourites
  loadFavourites();

  // Restore last song index
  const savedIndex = parseInt(localStorage.getItem('pulse_lastIndex'), 10);
  if (!isNaN(savedIndex) && savedIndex >= 0 && savedIndex < songs.length) {
    currentIndex = savedIndex;
  }

  // Restore volume
  const savedVolume = parseFloat(localStorage.getItem('pulse_volume'));
  if (!isNaN(savedVolume)) {
    audio.volume = savedVolume;
    volumeSlider.value = savedVolume;
  } else {
    audio.volume = 1;
    volumeSlider.value = 1;
  }
  updateVolume();

  // Build playlist sidebar
  buildPlaylist();

  // Load the song (don't autoplay — browser policy)
  loadSong();

  // Init visualizer as paused
  setVisualizerState(false);
}

init();