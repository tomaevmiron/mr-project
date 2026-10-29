/* MR Project — interacción de la web.
   La marca que elige el visitante es el hilo conductor: cambia la foto de portada,
   el titular, la llamada a la acción, el configurador de cita y la banda final. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const WA = '34669446971';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } }
  };

  const BRANDS = {
    yamaha:   { name: 'Yamaha',   color: '#1f44d6', img: 'img/hero-yamaha.webp',   official: true },
    honda:    { name: 'Honda',    color: '#d4151c', img: 'img/hero-honda.webp' },
    kawasaki: { name: 'Kawasaki', color: '#3a9a22', img: 'img/hero-kawasaki.webp' },
    bmw:      { name: 'BMW',      color: '#1c69d4', img: 'img/hero-bmw.webp' },
    ducati:   { name: 'Ducati',   color: '#c8102e', img: 'img/hero-ducati.webp' },
    ktm:      { name: 'KTM',      color: '#e05a00', img: 'img/hero-ktm.webp' },
    suzuki:   { name: 'Suzuki',   color: '#0b4ea2', img: 'img/hero-suzuki.webp' },
    triumph:  { name: 'Triumph',  color: '#1d1d1f', img: 'img/hero-triumph.webp' },
    otra:     { name: 'Otra marca', color: '#1d1d1f', img: 'img/taller-katana.webp' }
  };
  const HERO_ORDER = ['yamaha', 'honda', 'kawasaki', 'bmw', 'ducati', 'ktm', 'suzuki', 'triumph'];
  const label = id => (BRANDS[id].official ? 'Servicio Oficial' : 'Taller multimarca');

  /* ---------- Estado global de marca ---------- */
  let brand = null; // null hasta que el visitante elige
  const subs = [];
  const onBrand = fn => subs.push(fn);
  function setBrand(id, opts = {}) {
    if (!BRANDS[id]) return;
    brand = id;
    if (!opts.silent) store.set('mrp-brand', id);
    subs.forEach(fn => fn(id, opts));
  }

  onBrand(id => {
    const b = BRANDS[id];
    document.documentElement.style.setProperty('--brand-c', b.color);
    $$('[data-brand-name]').forEach(el => { el.textContent = id === 'otra' ? 'moto' : b.name; });
    const cta = $('[data-cta]');
    if (cta) cta.textContent = id === 'otra' ? 'Pedir cita' : `Pedir cita para mi ${b.name}`;
    $$('[data-pick]').forEach(el => el.classList.toggle('on', el.dataset.pick === id));
  });

  /* ---------- Portada: carrusel de marcas ---------- */
  const stage = $('[data-stage]');
  const tabsBox = $('[data-brands]');
  const tabs = $$('[role="tab"]', tabsBox);
  const heroImgs = $$('img', stage);
  const word = $('[data-brand-word]');
  const pauseBtn = $('[data-pause]');
  let heroId = 'yamaha';
  let autoplay = !reduce;
  let swapTimer;

  function loadImg(img) { if (!img.getAttribute('src') && img.dataset.src) img.src = img.dataset.src; }

  function swapWord(id) {
    const b = BRANDS[id];
    if (word.textContent === b.name) { word.style.color = b.color; return; }
    clearTimeout(swapTimer);
    word.classList.add('out');
    swapTimer = setTimeout(() => {
      word.textContent = b.name;
      word.style.color = b.color;
      word.classList.remove('out');
    }, reduce ? 0 : 200);
  }

  function showHero(id) {
    heroId = id;
    const i = HERO_ORDER.indexOf(id);
    heroImgs.forEach(img => {
      const on = img.dataset.id === id;
      if (on) loadImg(img);
      img.classList.toggle('on', on);
    });
    // precarga la siguiente para que el fundido sea limpio
    loadImg(heroImgs[(i + 1) % heroImgs.length]);
    tabs.forEach(t => {
      const on = t.dataset.brand === id;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      t.classList.remove('run');
      t.style.setProperty('--brand-c', BRANDS[t.dataset.brand].color);
    });
    const active = tabs[i];
    if (autoplay && active) { void active.offsetWidth; active.classList.add('run'); }
    swapWord(id);
    $('[data-stage-index]').textContent = `${String(i + 1).padStart(2, '0')} / ${String(HERO_ORDER.length).padStart(2, '0')}`;
    $('[data-stage-label]').textContent = `${BRANDS[id].name} — ${label(id)}`;
  }

  function setAutoplay(on) {
    autoplay = on;
    pauseBtn.setAttribute('aria-pressed', String(!on));
    pauseBtn.setAttribute('aria-label', on ? 'Pausar el cambio automático de marca' : 'Reanudar el cambio automático de marca');
    showHero(heroId);
  }

  // El fin de la barra de progreso de la pestaña activa avanza a la siguiente marca
  tabsBox.addEventListener('animationend', e => {
    if (!autoplay || !e.target.classList.contains('run')) return;
    const next = HERO_ORDER[(HERO_ORDER.indexOf(heroId) + 1) % HERO_ORDER.length];
    showHero(next);
  });

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => setBrand(t.dataset.brand, { from: 'hero' }));
    t.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      n.focus();
      n.click();
    });
  });

  pauseBtn.addEventListener('click', () => setAutoplay(!autoplay));

  // Cuando el visitante elige marca (en cualquier parte), el carrusel se detiene en ella
  onBrand(id => {
    autoplay = false;
    pauseBtn.setAttribute('aria-pressed', 'true');
    pauseBtn.setAttribute('aria-label', 'Reanudar el cambio automático de marca');
    if (HERO_ORDER.includes(id)) {
      showHero(id);
      const t = tabs[HERO_ORDER.indexOf(id)];
      if (t) t.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' });
    }
  });

  // Fuera de pantalla, el carrusel se queda quieto
  new IntersectionObserver(([en]) => tabsBox.classList.toggle('paused', !en.isIntersecting), { threshold: 0.15 }).observe(stage);

  /* ---------- Navegación ---------- */
  const nav = $('#nav');
  const burger = $('.burger');
  const menu = $('#menu');
  function closeMenu() {
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Abrir menú');
    menu.hidden = true;
    document.body.style.overflow = '';
  }
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    menu.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
  });
  $$('a', menu).forEach(a => a.addEventListener('click', closeMenu));
  addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) closeMenu(); });

  // La barra se oscurece sobre las secciones negras
  const darkSecs = $$('[data-nav="dark"]');
  function navTheme() {
    const y = nav.offsetHeight / 2;
    const dark = darkSecs.some(s => { const r = s.getBoundingClientRect(); return r.top <= y && r.bottom >= y; });
    nav.classList.toggle('dark', dark);
  }

  /* ---------- Anatomía: cada punto acerca la imagen y, al volver a tocarlo, la aleja ---------- */
  const anat = $('#taller');
  const zoom = $('[data-anat-zoom]');
  const spots = $$('.hs', zoom);
  const idxBtns = $$('.anat-index button');
  const arts = $$('.anat-copy article');
  const ZOOM = [1, 2.1, 2.2, 2.1, 2.2, 2.1, 2.3]; // 0 = vista general, 1..6 = sistemas
  let phase = -1;

  function setPhase(p) {
    if (p === phase) return;
    phase = p;
    anat.dataset.phase = p;
    if (p === 0) {
      zoom.style.setProperty('--z', 1);
      zoom.style.setProperty('--dim', 0);
    } else {
      const s = spots[p - 1];
      zoom.style.setProperty('--ox', s.style.getPropertyValue('--x'));
      zoom.style.setProperty('--oy', s.style.getPropertyValue('--y'));
      zoom.style.setProperty('--z', ZOOM[p]);
      zoom.style.setProperty('--dim', 1);
    }
    spots.forEach((s, i) => {
      s.classList.toggle('on', i === p - 1);
      s.setAttribute('aria-pressed', String(i === p - 1));
    });
    idxBtns.forEach((b, i) => {
      b.classList.toggle('on', i === p - 1);
      b.setAttribute('aria-current', i === p - 1 ? 'step' : 'false');
    });
    arts.forEach((a, i) => a.classList.toggle('on', i === p));
  }

  $$('[data-phase-go]', anat).forEach(b => b.addEventListener('click', () => {
    const p = +b.dataset.phaseGo;
    setPhase(phase === p ? 0 : p);
  }));
  anat.addEventListener('keydown', e => { if (e.key === 'Escape' && phase > 0) setPhase(0); });
  setPhase(0);

  /* ---------- Gama Yamaha (carril horizontal) ---------- */
  const rail = $('[data-rail]');
  const prev = $('[data-rail-prev]');
  const next = $('[data-rail-next]');
  const bar = $('[data-rail-bar]');
  function railState() {
    const max = rail.scrollWidth - rail.clientWidth;
    prev.disabled = rail.scrollLeft < 8;
    next.disabled = rail.scrollLeft > max - 8;
    const w = Math.max(0.12, rail.clientWidth / rail.scrollWidth);
    bar.style.setProperty('--w', `${(w * 100).toFixed(2)}%`);
    bar.style.setProperty('--tx', `${(max > 0 ? (rail.scrollLeft / max) * (1 / w - 1) * 100 : 0).toFixed(2)}%`);
  }
  function railStep(dir) {
    const card = $('.car', rail);
    const step = card.offsetWidth + 18;
    rail.scrollBy({ left: dir * step * (innerWidth > 1100 ? 2 : 1), behavior: 'smooth' });
  }
  prev.addEventListener('click', () => railStep(-1));
  next.addEventListener('click', () => railStep(1));
  rail.addEventListener('scroll', railState, { passive: true });
  addEventListener('resize', railState);
  railState();

  /* ---------- Configurador de cita ---------- */
  const form = $('[data-book-form]');
  const err = $('[data-form-err]');
  const bookImg = $('[data-book-img]');
  const badge = $('[data-book-badge]');
  const T = k => $(`[data-t="${k}"]`);
  const yamahaOnly = $$('[data-only="yamaha"]', form);

  // Próximos días de apertura (lunes a viernes, de 9 a 13)
  const HOURS = { 1: [9, 13], 2: [9, 13], 3: [9, 13], 4: [9, 13], 5: [9, 13] };
  const madrid = () => new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
  const fmtDay = new Intl.DateTimeFormat('es-ES', { weekday: 'short' });
  const fmtMon = new Intl.DateTimeFormat('es-ES', { month: 'short' });
  const fmtLong = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  (function buildDays() {
    const box = $('[data-days]');
    const now = madrid();
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (now.getHours() >= 11) d.setDate(d.getDate() + 1);
    let n = 0;
    while (n < 10) {
      if (HOURS[d.getDay()]) {
        const lab = document.createElement('label');
        lab.className = 'chip day';
        const iso = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        lab.innerHTML = `<input type="radio" name="day" value="${iso}"><span><small>${fmtDay.format(d).replace('.', '')}</small><b>${d.getDate()}</b><small>${fmtMon.format(d).replace('.', '')}</small></span>`;
        lab.querySelector('input').dataset.long = fmtLong.format(d);
        box.appendChild(lab);
        n++;
      }
      d.setDate(d.getDate() + 1);
    }
  })();

  function setText(k, v, fallback) {
    const el = T(k);
    el.textContent = v || fallback;
    el.classList.toggle('empty', !v);
  }

  function readForm() {
    const f = new FormData(form);
    const b = f.get('brand');
    const day = form.querySelector('input[name="day"]:checked');
    return {
      brand: b,
      model: (f.get('model') || '').trim(),
      year: (f.get('year') || '').trim(),
      km: (f.get('km') || '').trim(),
      jobs: f.getAll('job'),
      notes: (f.get('notes') || '').trim(),
      day: day ? day.dataset.long : '',
      slot: f.get('slot') || '',
      name: (f.get('name') || '').trim()
    };
  }

  function motoText(v) {
    if (!v.brand) return '';
    const parts = [v.brand === 'otra' ? '' : BRANDS[v.brand].name, v.model].filter(Boolean).join(' ');
    const extra = [v.year, v.km && `${v.km} km`].filter(Boolean).join(' · ');
    return [parts || 'Otra marca', extra].filter(Boolean).join(' · ');
  }

  function renderTicket() {
    const v = readForm();
    setText('moto', motoText(v), 'Elige marca');
    setText('jobs', v.jobs.join(', '), 'Sin seleccionar');
    setText('day', [v.day, v.slot].filter(Boolean).join(', '), 'El que mejor te venga');
    setText('name', v.name, '—');
    if (!err.hidden && v.brand && v.jobs.length) err.hidden = true;
  }

  function bookBrand(id) {
    const b = BRANDS[id];
    const radio = form.querySelector(`input[name="brand"][value="${id}"]`);
    if (radio) radio.checked = true;
    yamahaOnly.forEach(el => {
      el.hidden = id !== 'yamaha';
      if (el.hidden) el.querySelector('input').checked = false;
    });
    badge.textContent = b.official ? 'Servicio Oficial Yamaha' : id === 'otra' ? 'Taller multimarca' : `Taller multimarca · ${b.name}`;
    badge.classList.toggle('official', !!b.official);
    const src = b.img;
    if (bookImg.getAttribute('src') !== src) {
      bookImg.classList.add('fade');
      setTimeout(() => { bookImg.src = src; bookImg.onload = () => bookImg.classList.remove('fade'); }, reduce ? 0 : 220);
    }
    renderTicket();
  }
  onBrand(bookBrand);

  form.addEventListener('change', e => {
    if (e.target.name === 'brand') setBrand(e.target.value, { from: 'form' });
    renderTicket();
  });
  form.addEventListener('input', renderTicket);

  form.addEventListener('submit', e => {
    e.preventDefault();
    const v = readForm();
    if (!v.brand || !v.jobs.length) {
      err.textContent = !v.brand ? 'Elige la marca de tu moto.' : 'Marca al menos un trabajo para que sepamos qué necesitas.';
      err.hidden = false;
      return;
    }
    const lines = [
      'Hola MR Project, quiero pedir cita para el taller.',
      '',
      `Moto: ${motoText(v)}`,
      `Trabajos: ${v.jobs.join(', ')}`
    ];
    if (v.notes) lines.push(`Detalles: ${v.notes}`);
    lines.push(`Preferencia: ${[v.day, v.slot].filter(Boolean).join(', ') || 'el día que mejor os venga'}`);
    if (v.name) lines.push(`Nombre: ${v.name}`);
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener');
  });

  // Los botones de la gama Yamaha preparan la cita
  $$('[data-book-model]').forEach(btn => btn.addEventListener('click', () => {
    setBrand('yamaha', { from: 'rail' });
    form.elements.model.value = btn.dataset.bookModel;
    renderTicket();
    $('#cita').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }));
  $$('[data-goto]').forEach(btn => btn.addEventListener('click', () => {
    $(btn.dataset.goto).scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }));
  $$('[data-pick]').forEach(btn => btn.addEventListener('click', () => setBrand(btn.dataset.pick, { from: 'list' })));

  /* ---------- Abierto / cerrado en directo ---------- */
  const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  function openStatus() {
    const now = madrid();
    const day = now.getDay();
    const mins = now.getHours() * 60 + now.getMinutes();
    const h = HOURS[day];
    if (h && mins >= h[0] * 60 && mins < h[1] * 60) return { open: true, text: `Abierto ahora · hasta las ${h[1]}:00` };
    if (h && mins < h[0] * 60) return { open: false, text: `Cerrado · abre hoy a las ${h[0]}:00` };
    for (let k = 1; k <= 7; k++) {
      const d = (day + k) % 7;
      if (HOURS[d]) return { open: false, text: `Cerrado · abre ${k === 1 ? 'mañana' : 'el ' + DAYS[d]} a las ${HOURS[d][0]}:00` };
    }
    return { open: false, text: 'Cerrado' };
  }
  function paintStatus() {
    const s = openStatus();
    $$('[data-status]').forEach(el => {
      el.classList.toggle('open', s.open);
      el.querySelector('span').textContent = s.text;
    });
    const today = madrid().getDay();
    $$('[data-hours] li').forEach(li => li.classList.toggle('today', +li.dataset.day === today));
  }
  paintStatus();
  setInterval(paintStatus, 60000);

  /* ---------- Aparición y contadores ---------- */
  const fmt1 = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  function countUp(el) {
    const to = parseFloat(el.dataset.count);
    if (reduce) { el.textContent = fmt1.format(to); return; }
    const t0 = performance.now();
    const dur = 1100;
    const tick = t => {
      const k = Math.min(1, (t - t0) / dur);
      el.textContent = fmt1.format(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add('in');
    $$('[data-count]', en.target).forEach(countUp);
    if (en.target.dataset.count) countUp(en.target);
    io.unobserve(en.target);
  }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  $$('.rv').forEach(el => io.observe(el));

  /* ---------- Barra inferior en móvil ---------- */
  const mbar = $('[data-mbar]');
  const hero = $('.hero');
  const cita = $('#cita');
  function mbarState() {
    const past = hero.getBoundingClientRect().bottom < 0;
    const r = cita.getBoundingClientRect();
    const inCita = r.top < innerHeight && r.bottom > 0;
    mbar.classList.toggle('show', past && !inCita);
  }

  /* ---------- Bucle de scroll ---------- */
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      navTheme();
      mbarState();
      ticking = false;
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Arranque ---------- */
  const yearEl = $('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const saved = store.get('mrp-brand');
  if (saved && BRANDS[saved]) {
    setBrand(saved, { silent: true });
  } else {
    showHero('yamaha');
    bookBrand('yamaha');
  }

  // Con la página cargada, se descargan el resto de fotos de portada
  addEventListener('load', () => {
    let i = 0;
    const queue = heroImgs.filter(img => !img.getAttribute('src'));
    const nextImg = () => { const img = queue[i++]; if (!img) return; loadImg(img); img.addEventListener('load', nextImg, { once: true }); img.addEventListener('error', nextImg, { once: true }); };
    nextImg();
  });
})();
