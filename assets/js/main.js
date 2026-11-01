(() => {
  'use strict';
  try {
  const C = window.SITE_CONFIG || {};
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Preloader ---------- */
  const done = () => document.documentElement.classList.add('is-loaded');
  if (document.readyState === 'complete') done();
  else { window.addEventListener('load', done); setTimeout(done, 1800); }

  /* ---------- WhatsApp links ---------- */
  const waLink = (msg) => {
    const text = encodeURIComponent(msg || C.waMessage || '');
    const num = (C.whatsapp || '').replace(/\D/g, '');
    return num ? `https://wa.me/${num}?text=${text}` : `https://wa.me/?text=${text}`;
  };
  $$('[data-wa]').forEach(a => { a.href = waLink(a.dataset.waMsg); });

  /* ---------- Campos configuráveis ---------- */
  const setField = (name, value) => {
    $$(`[data-field="${name}"]`).forEach(el => {
      if (!value) return;
      el.textContent = value; el.classList.remove('pending');
    });
  };
  if (C.phone) {
    const num = (C.whatsapp || C.phone).replace(/\D/g, '');
    $$('[data-field="phone"]').forEach(el => {
      el.classList.remove('pending');
      el.innerHTML = `<a href="tel:+${num.startsWith('55') ? num : '55' + num}">${C.phone}</a>`;
    });
  }
  setField('hours', C.hours);
  if (C.instagram && C.instagram.url) {
    const wrap = $('[data-field-wrap="instagram"]'); if (wrap) wrap.hidden = false;
    const a = $('[data-field="instagram"]'); if (a) { a.href = C.instagram.url; a.textContent = C.instagram.handle || C.instagram.url; }
    const ic = $('[data-field="instagram-icon"]'); if (ic) { ic.href = C.instagram.url; ic.hidden = false; }
  }
  if (C.googleReviewsUrl) { const g = $('#googleReviewsBtn'); if (g) g.href = C.googleReviewsUrl; }

  /* ---------- Avaliações reais ---------- */
  if (Array.isArray(C.reviews) && C.reviews.length) {
    const grid = $('#reviewsGrid');
    const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    grid.innerHTML = C.reviews.map((r, i) => {
      const n = Math.max(0, Math.min(5, Math.round(r.rating || 0)));
      const stars = Array.from({ length: 5 }, (_, k) => `<svg class="${k < n ? 'on' : ''}"><use href="#i-star"/></svg>`).join('');
      const date = r.date ? new Date(r.date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : '';
      return `<figure class="review reveal" style="--i:${i}">
        <div class="stars" role="img" aria-label="Nota ${n} de 5">${stars}</div>
        <blockquote>“${esc(r.text)}”</blockquote>
        <figcaption><strong>${esc(r.author)}</strong><span>${esc(r.source || 'Google')}${date ? ' · ' + date : ''}</span></figcaption>
      </figure>`;
    }).join('');
    grid.hidden = false;
    $('#reviewsEmpty p').textContent = 'Veja todas as avaliações públicas no Google.';
  }

  /* ---------- Ano ---------- */
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  /* ---------- Imagens com fallback ---------- */
  $$('.img-fallback img, .hero__img').forEach(img => {
    const ok = () => img.classList.add('is-ready');
    if (img.complete && img.naturalWidth) ok();
    img.addEventListener('load', ok);
    img.addEventListener('error', () => img.classList.add('is-broken'));
  });

  /* ---------- Header + progresso + parallax (rAF) ---------- */
  const header = $('.header');
  const progress = $('.scroll-progress');
  const parallax = $$('[data-parallax]');
  const heroImg = $('.hero__img');
  let ticking = false;
  const onScroll = () => {
    const sy = window.scrollY;
    header.classList.toggle('is-scrolled', sy > 40);
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? sy / max : 0})`;
    if (!reduce) {
      if (heroImg && sy < innerHeight) heroImg.style.setProperty('--sy', `${sy * 0.25}px`);
      parallax.forEach(el => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const off = (r.top + r.height / 2 - innerHeight / 2) * parseFloat(el.dataset.parallax);
        el.style.transform = `translate3d(0, ${off}px, 0) scale(1.18)`;
      });
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();

  /* ---------- Menu mobile ---------- */
  const burger = $('.burger');
  const nav = $('#menu');
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.body.classList.toggle('menu-open', open);
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', nav).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { setMenu(false); burger.focus(); } });
  window.addEventListener('resize', () => { if (innerWidth > 960) setMenu(false); });

  /* ---------- Link ativo ---------- */
  const links = $$('.nav__link');
  const sections = links.map(l => $(l.getAttribute('href'))).filter(Boolean);
  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => spy.observe(s));

  if (!('IntersectionObserver' in window)) { document.documentElement.classList.add('no-anim'); return; }
  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { const t = en.target; t.classList.add('is-in'); io.unobserve(t); setTimeout(() => { t.style.transitionDelay = '0s'; }, 1500); } });
  }, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });
  const observeReveal = () => $$('.reveal:not(.is-in), .reveal-img:not(.is-in)').forEach(el => io.observe(el));
  observeReveal();

  /* ---------- Efeitos de ponteiro (somente desktop) ---------- */
  if (fine && !reduce) {
    // Brilho do hero segue o mouse
    const hero = $('.hero');
    const glow = $('.hero__glow');
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      glow.style.setProperty('--x', `${e.clientX - r.left}px`);
      glow.style.setProperty('--y', `${e.clientY - r.top}px`);
      const mx = (e.clientX / r.width - .5), my = (e.clientY / r.height - .5);
      heroImg.style.setProperty('--mx', `${mx * -18}px`);
      heroImg.style.setProperty('--my', `${my * -12}px`);
    });

    // Tilt 3D + spotlight nos cartões
    $$('.tilt').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--rx', `${(0.5 - y) * 7}deg`);
        card.style.setProperty('--ry', `${(x - 0.5) * 9}deg`);
        card.style.setProperty('--px', `${x * 100}%`);
        card.style.setProperty('--py', `${y * 100}%`);
      });
      card.addEventListener('pointerleave', () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
    });

    // Botões magnéticos
    $$('.magnetic').forEach(btn => {
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .22}px, ${(e.clientY - r.top - r.height / 2) * .3}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------- Ripple no clique ---------- */
  document.addEventListener('pointerdown', e => {
    const b = e.target.closest('.btn');
    if (!b || reduce) return;
    const r = b.getBoundingClientRect();
    const s = document.createElement('span');
    s.className = 'ripple';
    s.style.left = `${e.clientX - r.left}px`; s.style.top = `${e.clientY - r.top}px`;
    b.appendChild(s);
    setTimeout(() => s.remove(), 650);
  });

  /* ---------- Lightbox ---------- */
  const items = $$('.g-item');
  const lb = $('#lightbox');
  const lbImg = $('.lightbox__img', lb);
  const lbCap = $('.lightbox__cap', lb);
  const lbCount = $('.lightbox__count', lb);
  let idx = 0, lastFocus = null;
  const show = (i) => {
    idx = (i + items.length) % items.length;
    const it = items[idx];
    lb.classList.remove('is-swap'); void lb.offsetWidth; lb.classList.add('is-swap');
    lbImg.src = it.dataset.full;
    lbImg.alt = $('img', it).alt;
    lbCap.textContent = it.dataset.caption || '';
    lbCount.textContent = `${idx + 1} / ${items.length}`;
  };
  const open = (i) => {
    lastFocus = document.activeElement;
    lb.hidden = false;
    requestAnimationFrame(() => lb.classList.add('is-open'));
    document.body.classList.add('no-scroll');
    show(i);
    $('.lightbox__close', lb).focus();
  };
  const close = () => {
    lb.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    setTimeout(() => { lb.hidden = true; }, reduce ? 0 : 350);
    lastFocus && lastFocus.focus();
  };
  items.forEach((it, i) => it.addEventListener('click', () => open(i)));
  $('.lightbox__close', lb).addEventListener('click', close);
  $('.lightbox__prev', lb).addEventListener('click', () => show(idx - 1));
  $('.lightbox__next', lb).addEventListener('click', () => show(idx + 1));
  lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lightbox__fig')) close(); });
  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
    if (e.key === 'Tab') { // trap de foco
      const f = $$('button', lb); const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  // swipe
  let sx = null;
  lb.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 45) show(idx + (dx < 0 ? 1 : -1));
    sx = null;
  });

  /* ---------- Formulário -> WhatsApp ---------- */
  const form = $('#quoteForm');
  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    $$('[required]', form).forEach(inp => {
      const err = inp.parentElement.querySelector('.field__err');
      const valid = inp.value.trim().length >= 2;
      inp.setAttribute('aria-invalid', !valid);
      err.textContent = valid ? '' : 'Preencha este campo.';
      if (!valid && ok) { inp.focus(); ok = false; }
    });
    if (!ok) return;
    const d = new FormData(form);
    const msg = `Olá! Conheci a AC.CUSTON06 pelo site e gostaria de solicitar um orçamento.\n\n` +
      `• Nome: ${d.get('nome').trim()}\n• Veículo: ${d.get('carro').trim()}\n• Serviço: ${d.get('servico')}` +
      (d.get('msg').trim() ? `\n• Mensagem: ${d.get('msg').trim()}` : '');
    const url = waLink(msg);
    let out = form.querySelector('.quote__go');
    if (!out) {
      out = document.createElement('a');
      out.className = 'btn btn--ghost btn--block quote__go';
      out.target = '_blank'; out.rel = 'noopener noreferrer';
      out.innerHTML = 'Mensagem pronta: abrir conversa no WhatsApp <svg class="ico"><use href="#i-arrow"/></svg>';
      form.querySelector('button[type=submit]').after(out);
    }
    out.href = url;
    const w = window.open(url, '_blank');
    if (!w) out.focus();
  });
  $$('[required]', form).forEach(inp => inp.addEventListener('input', () => {
    if (inp.value.trim().length >= 2) { inp.setAttribute('aria-invalid', 'false'); inp.parentElement.querySelector('.field__err').textContent = ''; }
  }));
  } catch (err) {
    document.documentElement.classList.add('is-loaded', 'no-anim');
    console.error(err);
  }
})();
