// The page: language (English unless the visitor picked Arabic), the download buttons, the header, the mobile
// menu, the in-game menu tabs, and the rise-on-scroll of everything below the film.
(function () {
  const C = window.CRIMSON, TEXT = window.CRIMSON_TEXT;
  const site = document.querySelector('.crimson-site');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const lookup = (t, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), t);
  let lang = 'en';
  try { if (localStorage.getItem('crimson-language') === 'ar') lang = 'ar'; } catch { /* storage may be off */ }

  document.querySelectorAll('[data-discord]').forEach(a => { a.href = C.DISCORD_URL; });

  function downloadControl(compact, t) {
    const url = C.DOWNLOAD_URL;
    const label = url ? (compact ? t.download : t.downloadWindows) : t.soon;
    const inner = `<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-download"/></svg><span>${esc(label)}${compact ? '' : `<small>${esc(t.windows)}</small>`}</span>`;
    const cls = `btn crimson-button download-button${compact ? ' compact' : ''}`;
    const button = url
      ? `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${inner}</a>`
      : `<button type="button" class="${cls} unavailable" aria-disabled="true">${inner}</button>`;
    const note = !url && !compact
      ? `<a class="download-note" href="${esc(C.DISCORD_URL)}" target="_blank" rel="noopener noreferrer">${esc(t.hearFirst)}<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-arrow-up-right"/></svg></a>`
      : '';
    return `<div class="download-control${compact ? ' compact-download' : ''}">${button}${note}${compact ? '' : `<p class="phone-note">${esc(t.phone)}</p>`}</div>`;
  }

  // --- the in-game menu tabs
  const tabs = [...document.querySelectorAll('.tab-button')];
  const panel = document.getElementById('game-panel');
  const tabImage = panel.querySelector('img');
  const tabCaption = document.querySelector('.tab-caption');
  const TAB_IMAGES = [['img/mod-menu.jpg', 'alt.mods', 1920, 1080], ['img/hud-editor.jpg', 'alt.editor', 1920, 1080], ['img/mod-menu-arabic.jpg', 'alt.arabic', 854, 480]];
  let tab = 0;
  function showTab(i, focus) {
    tab = i;
    tabs.forEach((b, k) => { b.setAttribute('aria-selected', String(k === i)); b.tabIndex = k === i ? 0 : -1; });
    panel.setAttribute('aria-labelledby', `game-tab-${i}`);
    const [src, alt, w, h] = TAB_IMAGES[i];
    const img = tabImage.cloneNode();
    img.src = src; img.width = w; img.height = h; img.dataset.i18nAlt = alt; img.alt = lookup(TEXT[lang], alt);
    panel.replaceChildren(img);
    tabCaption.dataset.i18n = `tabCaptions.${i}`;
    tabCaption.textContent = TEXT[lang].tabCaptions[i];
    if (focus) tabs[i].focus();
  }
  tabs.forEach((b, i) => {
    b.addEventListener('click', () => showTab(i));
    b.addEventListener('keydown', e => {
      const dir = lang === 'ar' ? -1 : 1;
      let next = i;
      if (e.key === 'ArrowRight') next = (i + dir + 3) % 3;
      else if (e.key === 'ArrowLeft') next = (i - dir + 3) % 3;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = 2;
      else return;
      e.preventDefault();
      showTab(next, true);
    });
  });

  // --- language
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  function applyLanguage(next) {
    lang = next;
    const t = TEXT[lang];
    document.documentElement.lang = lang;
    document.documentElement.dir = site.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i18n]').forEach(el => { const v = lookup(t, el.dataset.i18n); if (typeof v === 'string') el.textContent = v; });
    document.querySelectorAll('[data-i18n-alt]').forEach(el => { const v = lookup(t, el.dataset.i18nAlt); if (typeof v === 'string') el.alt = v; });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => { const v = lookup(t, el.dataset.i18nAria); if (typeof v === 'string') el.setAttribute('aria-label', v); });
    document.querySelectorAll('[data-download]').forEach(el => { el.innerHTML = downloadControl(el.dataset.download === 'compact', t); });
    document.querySelectorAll('.language-button').forEach(b => {
      const on = b.dataset.lang === lang;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    menuToggle.setAttribute('aria-label', menuToggle.getAttribute('aria-expanded') === 'true' ? t.closeMenu : t.menu);
  }
  document.querySelectorAll('.language-button').forEach(b => b.addEventListener('click', () => {
    applyLanguage(b.dataset.lang);
    try { localStorage.setItem('crimson-language', b.dataset.lang); } catch { /* optional */ }
  }));

  // --- header and mobile menu
  const header = document.querySelector('.site-header');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 12);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  const mobileNav = document.getElementById('mobile-navigation');
  function setMenu(open) {
    mobileNav.hidden = !open;
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? TEXT[lang].closeMenu : TEXT[lang].menu);
  }
  menuToggle.addEventListener('click', () => setMenu(mobileNav.hidden));
  mobileNav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  window.addEventListener('keydown', e => { if (e.key === 'Escape' && !mobileNav.hidden) setMenu(false); });

  // --- rise on scroll, below the film (nothing is hidden until this runs; off for reduced motion)
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const revealing = [...document.querySelectorAll('.section h2, .section h3, .section-copy > p, .section-heading > p, .dances-heading > p, .launcher-heading p, .section .screenshot-figure, .section .dot-list, .safety-list, .faq-accordion, .measurement, .key-note, .tab-caption, .final-inner > h2, .final-actions')];
  let observer;
  function startReveal() {
    observer?.disconnect();
    revealing.forEach(el => el.classList.remove('reveal-pending'));
    if (reduced.matches || !('IntersectionObserver' in window)) return;
    observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.remove('reveal-pending');
      observer.unobserve(entry.target);
    }), { threshold: 0.15 });
    revealing.forEach(el => {
      el.classList.add('scroll-reveal', 'reveal-pending');
      const siblings = el.parentElement ? [...el.parentElement.children] : [];
      el.style.setProperty('--reveal-delay', `${Math.max(0, siblings.indexOf(el)) * 80}ms`);
      observer.observe(el);
    });
  }
  reduced.addEventListener('change', startReveal);

  applyLanguage(lang);
  startReveal();
})();
