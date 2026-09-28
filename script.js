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

  // 可交互终端的开场白。{name} / {status} / {school} 会自动替换成上面的资料
  terminalBanner: [
    '{name}@sjtu · session ready',
    '{status} / {school} · 数学 141',
    '输入 help 查看可用指令，Tab 补全，↑ ↓ 翻历史。'
  ],

  // 终端指令表：cmd 是指令名，desc 会出现在 help 列表里
  // go  = 执行后滚动到的区块 id（#about / #goals …）
  // out = 打印出来的说明文字，可以留空
  terminalCommands: [
    { cmd: 'help',    desc: '列出所有可用指令' },
    { cmd: 'about',   desc: '定位到「关于我」',       go: '#about',        out: '本科在读，数学 141，Python 两年，正在向 CPython Contributor 靠近。' },
    { cmd: 'works',   desc: '定位到「可展示的成就」', go: '#achievements', out: '竞赛、开源配置、笔记库与数学仓库都在这里。' },
    { cmd: 'honors',  desc: '定位到「荣誉」',         go: '#honors' },
    { cmd: 'journey', desc: '定位到「编程轨迹」',     go: '#journey',      out: '从 hello, world 到操作系统与编译原理的时间线。' },
    { cmd: 'life',    desc: '定位到「现在的爱好」',   go: '#interests' },
    { cmd: 'goals',   desc: '定位到「长期目标」',     go: '#goals' },
    { cmd: 'whoami',  desc: '打印身份信息',           out: '{name} · {status} @ {school}' },
    { cmd: 'contact', desc: '打印邮箱与 GitHub' },
    { cmd: 'top',     desc: '回到页面顶部',           go: '#hero' },
    { cmd: 'clear',   desc: '清空终端输出' },
    { cmd: 'exit',    desc: '假装退出登录',           out: '这里没有出口，只有更多笔记。' }
  ],

  // 页脚链接，例如：
  // [{ label: 'GitHub', url: 'https://github.com/yourname' },
  //  { label: '邮箱',   url: 'mailto:you@example.com' }]
  links: [
    { label: '邮箱', url: 'mailto:li.jinzhao.x@outlook.com' },
    { label: 'Github', url: 'https://github.com/PolarBear-tech' },
    { label: '画作', url: 'https://cn.club.vmall.com/mhw/consumer/cn/community/mhwnews/userhome/id_1000000000135732246' }
  ]
};

(() => {
  'use strict';

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
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
      // 正在终端里打字时保持水平，免得文字跟着鼠标晃
      if (card.contains(document.activeElement) && document.activeElement.tagName === 'INPUT') {
        card.style.transform = '';
        return;
      }
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform =
        `perspective(900px) rotateY(${px * 9}deg) rotateX(${-py * 9}deg) translateY(-6px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  }

  /* ---------- 10. 可交互终端 ---------- */
  function initTerminal() {
    const card  = $('#termCard');
    const body  = $('#termBody');
    const form  = $('#termForm');
    const field = $('#termInput');
    if (!body || !form || !field) return;

    const PROMPT  = '$';
    const cmds    = PROFILE.terminalCommands || [];
    const find    = (name) => cmds.find((c) => c.cmd === name);
    const fill    = (s) => s.replace(/\{(\w+)\}/g, (m, k) => (PROFILE[k] != null ? PROFILE[k] : m));
    const history = [];
    let hIndex = -1;

    const scrollEnd = () => { body.scrollTop = body.scrollHeight; };

    // 往输出区追加一行；cls 可为空 / 'out' / 'err' / 'cmd'
    const push = (cls, text) => {
      const el = document.createElement('div');
      el.className = `term__line${cls ? ' ' + cls : ''}`;
      el.textContent = text;
      body.appendChild(el);
      scrollEnd();
      return el;
    };

    // 命令回显：$ xxx
    const echo = (text) => {
      const el = push('cmd', '');
      const p = document.createElement('span');
      p.className = 'term__prompt';
      p.textContent = PROMPT;
      el.appendChild(p);
      el.append(document.createTextNode(text));
      scrollEnd();
    };

    const clearLog = () => { body.textContent = ''; };

    const goTo = (sel) => {
      const target = sel && document.querySelector(sel);
      if (!target) return false;
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      return true;
    };

    // help：两列对齐的指令列表
    const printHelp = () => {
      const el = document.createElement('div');
      el.className = 'term__line term__help';
      cmds.forEach((c) => {
        const name = document.createElement('span');
        name.textContent = c.cmd;
        const desc = document.createElement('span');
        desc.textContent = c.desc;
        el.append(name, desc);
      });
      body.appendChild(el);
      scrollEnd();
    };

    const printLinks = () => {
      (PROFILE.links || []).forEach((l) => push('out', `${l.label}  ${l.url.replace(/^mailto:/i, '')}`));
    };

    // 执行一条命令
    const run = (raw) => {
      const input = raw.trim();
      if (!input) return;
      echo(input);
      if (history[0] !== input) history.unshift(input);
      hIndex = -1;

      const [name, ...args] = input.split(/\s+/);
      const cmd = find(name.toLowerCase());

      if (!cmd) {
        push('err', `command not found: ${name}`);
        push('out', '输入 help 查看可用指令。');
        return;
      }
      if (cmd.cmd === 'clear') { clearLog(); return; }
      if (cmd.cmd === 'help') {
        const sub = args[0] ? find(args[0].toLowerCase()) : null;
        if (sub) push('out', `${sub.cmd}  ${sub.desc}`);
        else printHelp();
        return;
      }
      if (cmd.cmd === 'contact') printLinks();
      if (cmd.out) push('out', fill(cmd.out));
      if (cmd.go && !goTo(cmd.go)) push('err', `无法定位到 ${cmd.go}`);
    };

    /* 输入区交互：回车执行、↑↓ 翻历史、Tab 补全、Ctrl+L 清屏 */
    field.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!history.length) return;
        hIndex = Math.min(hIndex + 1, history.length - 1);
        field.value = history[hIndex];
        field.setSelectionRange(field.value.length, field.value.length);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (hIndex <= 0) { hIndex = -1; field.value = ''; return; }
        field.value = history[--hIndex];
        field.setSelectionRange(field.value.length, field.value.length);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const typed = field.value.trim().toLowerCase();
        if (!typed) return;
        const hits = cmds.filter((c) => c.cmd.startsWith(typed));
        if (hits.length === 1) field.value = `${hits[0].cmd} `;
        else if (hits.length > 1) push('out', hits.map((c) => c.cmd).join('   '));
      } else if (e.key === 'Escape') {
        field.value = '';
      } else if (e.key.toLowerCase() === 'l' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        clearLog();
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = field.value;
      field.value = '';
      run(value);
    });

    // 点卡片任意位置就能开始输入（正在选中文字时不抢焦点）
    if (card) {
      card.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;
        if (String(window.getSelection())) return;
        field.focus();
      });
    }

    // 开场白
    clearLog();
    (PROFILE.terminalBanner || []).forEach((line, i) => push(i === 0 ? '' : 'out', fill(line)));
  }

  /* ---------- 12. 作品集占位链接 ---------- */
  // href 还是 "#" 时点击只给个提示；把 href 换成真实地址后即自动变成普通链接
  function initPortfolioLinks() {
    $$('[data-portfolio]').forEach((el) => {
      const tag = $('.tile__tag', el);
      const original = tag ? tag.textContent : '';
      let timer;

      el.addEventListener('click', (e) => {
        const href = (el.getAttribute('href') || '').trim();
        if (href && href !== '#') return;   // 已配好地址，正常跳转
        e.preventDefault();
        if (!tag) return;
        tag.textContent = '作品集整理中，敬请期待';
        clearTimeout(timer);
        timer = setTimeout(() => { tag.textContent = original; }, 1800);
      });
    });
  }

  /* ---------- 13. 启动 ---------- */
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
    initPortfolioLinks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
