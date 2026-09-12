/* ============================================================
   个人主页交互脚本
   ------------------------------------------------------------
   ★ 想改内容，只需要看下面的 PROFILE 配置对象。
   ============================================================ */

const PROFILE = {
  // 你的名字（改动后页面所有位置会同步更新）
  name: '李金钊',
  // 头像方块 / 导航左侧显示的字符（这里用姓氏，配中文名更自然）
  mono: '李',
  school: '上海交通大学',
  status: '本科在读',

  // 终端里循环播放的内容。cls: 'cmd' 是命令行（逐字打印），'out' 是输出，'err' 是报错
  terminal: [
    { cls: 'cmd', prompt: '$ ', text: "python -c \"print('hello, world')\"" },
    { cls: 'out', text: 'hello, world' },
    { cls: 'cmd', prompt: '$ ', text: 'gcc -O2 -Wall main.c -o life' },
    { cls: 'cmd', prompt: '$ ', text: './life' },
    { cls: 'err', text: 'segmentation fault (core dumped)   # Working' },
    { cls: 'cmd', prompt: '$ ', text: '# 目标：成为 CPython Contributor' }
  ],

  // 页脚链接，例如：
  // [{ label: 'GitHub', url: 'https://github.com/yourname' },
  //  { label: '邮箱',   url: 'mailto:you@example.com' }]
  links: [
    { label: '邮箱', url: 'mailto:li.jinzhao.x@outlook.com' },
    { label: 'Github', url: 'https://github.com/PolarBear-tech' }
  ]
};

(() => {
  'use strict';

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. 把 PROFILE 里的文字写进页面 ---------- */
  function bindProfile() {
    $$('[data-bind="name"]').forEach((el) => (el.textContent = PROFILE.name));
    $$('[data-bind="mono"]').forEach((el) => (el.textContent = PROFILE.mono));
    $$('[data-bind="school"]').forEach((el) => (el.textContent = PROFILE.school));
    $$('[data-bind="status"]').forEach((el) => (el.textContent = PROFILE.status));
    // 浏览器标签页标题（不含学校名）
    document.title = `${PROFILE.name} · 个人主页`;

    const box = $('#footerLinks');
    if (box) {
      PROFILE.links.forEach((link) => {
        const a = document.createElement('a');
        a.className = 'footer__link';
        a.href = link.url;
        if (/^https?:/.test(link.url)) { a.target = '_blank'; a.rel = 'noopener'; }
        a.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-link"></use></svg>';
        a.append(document.createTextNode(link.label));
        box.appendChild(a);
      });
    }
  }

  /* ---------- 2. 主题切换（带平滑过渡） ---------- */
  function initTheme() {
    const btn = $('#themeToggle');
    const root = document.documentElement;
    if (!btn) return;

    btn.addEventListener('click', () => {
      const next = root.dataset.theme === 'light' ? 'dark' : 'light';
      const apply = () => {
        root.dataset.theme = next;
        try { localStorage.setItem('theme', next); } catch (e) { /* 隐私模式下忽略 */ }
      };
      // 支持的浏览器用 View Transitions 做一次圆形扩散过渡
      if (document.startViewTransition && !reduceMotion) {
        document.startViewTransition(apply);
      } else {
        apply();
      }
    });
  }

  /* ---------- 3. 阅读进度 / 导航状态 / 回到顶部 ---------- */
  function initScrollUI() {
    const nav = $('#nav');
    const bar = $('#progressBar');
    const toTop = $('#toTop');
    const timeline = $('#timeline');
    const fill = $('#timelineFill');

    const update = () => {
      const y = window.scrollY || 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(y / max, 1) : 0;

      if (bar) bar.style.transform = `scaleX(${ratio})`;
      if (nav) nav.classList.toggle('scrolled', y > 30);
      if (toTop) toTop.classList.toggle('show', y > 620);

      // 时间轴的竖线跟着阅读进度生长
      if (timeline && fill) {
        const rect = timeline.getBoundingClientRect();
        const vh = window.innerHeight;
        const p = (vh * 0.75 - rect.top) / Math.max(rect.height, 1);
        fill.style.transform = `scaleY(${Math.min(Math.max(p, 0), 1)})`;
      }
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { update(); ticking = false; });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();

    if (toTop) {
      toTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    }
  }

  /* ---------- 4. 滚动揭示动画（带错峰延迟） ---------- */
  function initReveal() {
    const items = $$('.reveal');
    items.forEach((el) => {
      const d = el.dataset.delay;
      if (d) el.style.setProperty('--d', `${d}ms`);
    });

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('in'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    items.forEach((el) => io.observe(el));
  }

  /* ---------- 5. 数字滚动 ---------- */
  function initCounters() {
    const nums = $$('[data-count]');
    if (!nums.length) return;

    const run = (el) => {
      const target = Number(el.dataset.count) || 0;
      if (reduceMotion) { el.textContent = target; return; }
      const duration = 1500;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 4);           // easeOutQuart
        el.textContent = Math.round(target * eased);
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = target;
      };
      requestAnimationFrame(tick);
    };

    if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { run(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.5 });

    nums.forEach((el) => io.observe(el));
  }

  /* ---------- 6. 导航高亮跟随滚动 ---------- */
  function initScrollSpy() {
    const links = $$('.nav__link');
    if (!links.length || !('IntersectionObserver' in window)) return;

    const map = new Map();
    links.forEach((link) => {
      const section = $(link.getAttribute('href'));
      if (section) map.set(section, link);
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          links.forEach((l) => l.classList.remove('active'));
          const active = map.get(entry.target);
          if (active) active.classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    map.forEach((_link, section) => io.observe(section));
  }

  /* ---------- 7. 卡片跟随鼠标的柔光 ---------- */
  function initCardGlow() {
    if (!window.matchMedia('(hover: hover)').matches) return;
    $$('.card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }

  /* ---------- 8. 指针柔光 ---------- */
  function initSpotlight() {
    const spot = $('#spotlight');
    if (!spot || reduceMotion || !window.matchMedia('(hover: hover)').matches) return;

    let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
    let cx = tx, cy = ty;

    window.addEventListener('pointermove', (e) => {
      tx = e.clientX; ty = e.clientY;
      spot.classList.add('on');
    });
    window.addEventListener('pointerleave', () => spot.classList.remove('on'));

    const loop = () => {
      cx += (tx - cx) * 0.08;   // 缓动跟随，避免生硬
      cy += (ty - cy) * 0.08;
      spot.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();
  }

  /* ---------- 9. 终端卡片：3D 倾斜 ---------- */
  function initTilt() {
    const card = $('#termCard');
    if (!card || reduceMotion || !window.matchMedia('(hover: hover)').matches) return;

    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform =
        `perspective(900px) rotateY(${px * 9}deg) rotateX(${-py * 9}deg) translateY(-6px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  }

  /* ---------- 10. 终端打字机 ---------- */
  function initTerminal() {
    const body = $('#termBody');
    if (!body) return;

    const staticRender = () => {
      body.innerHTML = '';
      PROFILE.terminal.forEach((line) => {
        const el = document.createElement('div');
        el.className = `term__line ${line.cls || 'out'}`;
        el.textContent = (line.prompt || '') + line.text;
        body.appendChild(el);
      });
      const caret = document.createElement('div');
      caret.className = 'term__line term__caret';
      body.appendChild(caret);
    };

    if (reduceMotion) { staticRender(); return; }

    const type = async () => {
      // 只在终端可见时播放，省电
      while (true) {
        body.innerHTML = '';
        for (const line of PROFILE.terminal) {
          const el = document.createElement('div');
          el.className = `term__line ${line.cls || 'out'}`;
          body.appendChild(el);

          if (line.prompt) {
            const p = document.createElement('span');
            p.className = 'term__prompt';
            p.textContent = line.prompt;
            el.appendChild(p);
          }

          const span = document.createElement('span');
          el.appendChild(span);

          if (line.cls === 'cmd') {
            el.classList.add('is-typing');
            for (const ch of line.text) {
              span.textContent += ch;
              await sleep(24 + Math.random() * 26);
            }
            el.classList.remove('is-typing');
            await sleep(320);
          } else {
            span.textContent = line.text;
            await sleep(240);
          }
        }
        const caret = document.createElement('div');
        caret.className = 'term__line term__caret';
        body.appendChild(caret);
        await sleep(3000);
      }
    };

    type();
  }

  /* ---------- 11. 启动 ---------- */
  function boot() {
    const y = $('#year');
    if (y) y.textContent = new Date().getFullYear();

    bindProfile();
    initTheme();
    initScrollUI();
    initReveal();
    initCounters();
    initScrollSpy();
    initCardGlow();
    initSpotlight();
    initTilt();
    initTerminal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
