// The scroll film. Scrolling through the tall section moves through the film: from above the forest, down the
// road, through the doors into the hall. The whole file is loaded first so every seek is instant. The last frame
// is reached at FILM_END of the section and then held perfectly still, so the guard, his sign and the button are
// all in view before the page moves on; there the film's own DOWNLOAD button becomes a real link.
(function () {
  const C = window.CRIMSON;
  const section = document.querySelector('.scroll-film');
  const stage = section.querySelector('.film-stage');
  const video = stage.querySelector('.film-video');
  const still = stage.querySelector('.film-still');
  const intro = stage.querySelector('.film-intro');
  const scrim = stage.querySelector('.film-scrim');
  const captions = [...stage.querySelectorAll('.film-caption')];
  const hotspot = stage.querySelector('.film-hotspot');
  const detail = stage.querySelector('.film-download-detail');
  const note = detail.querySelector('.film-download-note');
  const loadLine = stage.querySelector('.film-load-line');
  const header = document.querySelector('.site-header');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  const FILM_END = 0.86;                                   // share of the section that plays the film
  const BUTTON = { left: 0.362, top: 0.329, width: 0.27, height: 0.149 };  // the button in the last frame
  const CAPTIONS = [[0.24, 0.38], [0.40, 0.54], [0.56, 0.68]];
  const clamp = v => Math.min(1, Math.max(0, v));

  // Where the film sits in the stage. Landscape: fill the stage; when it has to be cut, cut mostly the top (sky,
  // ceiling) so the guard's sign at the bottom stays whole. Portrait: the middle 40% of the film fills the width.
  function filmBox(w, h) {
    const width = w >= h ? 16 * Math.max(w / 16, h / 9) : w / 0.4;
    const height = width * 9 / 16;
    const top = height > h ? (h - height) * 0.85 : (h - height) / 2;
    return { left: (w - width) / 2, top, width, height };
  }
  function layout() {
    const box = filmBox(stage.clientWidth, stage.clientHeight);
    const px = v => `${v}px`;
    for (const el of [video, still]) Object.assign(el.style, { left: px(box.left), top: px(box.top), width: px(box.width), height: px(box.height) });
    const b = { left: box.left + BUTTON.left * box.width, top: box.top + BUTTON.top * box.height, width: BUTTON.width * box.width, height: BUTTON.height * box.height };
    Object.assign(hotspot.style, { left: px(b.left), top: px(b.top), width: px(b.width), height: px(b.height), borderRadius: px(0.18 * b.height) });
    Object.assign(detail.style, { left: px(b.left), top: px(b.top + b.height + 12), width: px(b.width) });
  }
  new ResizeObserver(layout).observe(stage);
  layout();

  hotspot.href = C.DOWNLOAD_URL || '#';
  if (C.DOWNLOAD_URL) { hotspot.target = '_blank'; hotspot.rel = 'noopener noreferrer'; }
  hotspot.addEventListener('click', e => { if (!C.DOWNLOAD_URL) { e.preventDefault(); note.hidden = false; } });

  // --- loading: the smaller file on small screens, the full one otherwise; whole file into memory
  let ready = false;
  async function fetchFilm(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${url}: ${response.status}`);
    const total = Number(response.headers.get('content-length')) || 0;
    const reader = response.body && response.body.getReader();
    if (!reader) return response.blob();
    const chunks = [];
    let received = 0;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.byteLength;
      loadLine.style.transform = `scaleX(${total ? Math.min(0.99, received / total) : Math.min(0.9, received / (received + 4e6))})`;
    }
    return new Blob(chunks, { type: 'video/mp4' });
  }
  async function load() {
    const small = stage.clientWidth * (window.devicePixelRatio || 1) <= 1400;
    const order = small ? [C.FILM_SD, C.FILM_HD] : [C.FILM_HD];
    for (const url of order) {
      try { video.src = URL.createObjectURL(await fetchFilm(url)); return; } catch { /* try the next one */ }
    }
    video.src = C.FILM_HD;                                  // streamed, if the whole-file load is not possible
  }
  video.addEventListener('loadeddata', () => { ready = true; stage.classList.add('film-ready'); });

  // --- scroll → film time, eased, one seek at a time
  let shown = 0, seeking = false, wasActive, wasEnd;
  video.addEventListener('seeked', () => { seeking = false; });
  function tick() {
    const rect = section.getBoundingClientRect();
    const sh = stage.clientHeight;
    const progress = clamp(-rect.top / Math.max(1, section.offsetHeight - sh));
    const film = reduced.matches ? 1 : clamp(progress / FILM_END);
    const active = rect.top <= sh && rect.bottom > 80;
    if (active !== wasActive) { header.classList.toggle('over-film', active); wasActive = active; }
    const atEnd = film >= 0.95;
    if (atEnd !== wasEnd) { hotspot.hidden = detail.hidden = !atEnd; if (!atEnd) note.hidden = true; wasEnd = atEnd; }
    const o = reduced.matches ? 1 : clamp((0.16 - film) / 0.08);
    intro.style.opacity = String(o);
    intro.style.transform = `translateY(${-16 * (1 - o)}px)`;
    intro.style.visibility = o === 0 ? 'hidden' : 'visible';
    if (!reduced.matches) scrim.style.opacity = String(o);
    captions.forEach((cap, i) => {
      const [a, b] = CAPTIONS[i];
      const c = reduced.matches ? 0 : Math.max(0, Math.min(1, (film - a) / 0.025, (b - film) / 0.025));
      cap.style.opacity = String(c);
      cap.style.transform = `translateY(${16 * (1 - c)}px)`;
      cap.style.visibility = c === 0 ? 'hidden' : 'visible';
    });
    if (ready && Number.isFinite(video.duration)) {
      const target = film * Math.max(0, video.duration - 0.05);
      shown += (target - shown) * 0.18;
      if (!seeking && !video.seeking && Math.abs(shown - video.currentTime) >= 1 / 60) { seeking = true; video.currentTime = shown; }
    }
    requestAnimationFrame(tick);
  }

  if (reduced.matches) {                                   // no scrubbing: the last frame as a still hero
    section.classList.add('film-reduced');
    still.src = 'media/film-end.jpg';
    still.dataset.i18nAlt = 'alt.filmEnd';
  } else {
    load();
  }
  requestAnimationFrame(tick);
})();
