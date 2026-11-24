(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var body = document.body;

  /* ---------- 사람·조직 연결망 캔버스 ---------- */
  function Network(canvas) {
    var ctx = canvas.getContext('2d');
    var nodes = [], w = 0, h = 0, dpr = 1, running = false, raf = 0;
    var LINK = 150;

    function resize() {
      var r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.max(18, Math.min(70, Math.round(w * h / 15000)));
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25,
          r: Math.random() < .18 ? 3.2 : 1.8,
          hub: Math.random() < .18
        });
      }
      draw();
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < nodes.length; i++) {
        var a = nodes[i];
        for (var j = i + 1; j < nodes.length; j++) {
          var b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK) {
            ctx.strokeStyle = 'rgba(140,190,230,' + (0.22 * (1 - d / LINK)).toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (var k = 0; k < nodes.length; k++) {
        var n = nodes[k];
        ctx.fillStyle = n.hub ? 'rgba(60,200,180,.85)' : 'rgba(200,220,245,.55)';
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      }
    }

    function step() {
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < -10) n.x = w + 10; else if (n.x > w + 10) n.x = -10;
        if (n.y < -10) n.y = h + 10; else if (n.y > h + 10) n.y = -10;
      }
      draw();
      raf = requestAnimationFrame(step);
    }

    this.start = function () { if (running || reduceMotion) return; running = true; raf = requestAnimationFrame(step); };
    this.stop = function () { running = false; cancelAnimationFrame(raf); };
    resize();
    var t;
    window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(resize, 150); });
  }

  var nets = [];
  Array.prototype.forEach.call(document.querySelectorAll('[data-net]'), function (c) {
    var net = new Network(c);
    nets.push({ el: c, net: net });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { e.isIntersecting ? net.start() : net.stop(); });
      }).observe(c.parentElement);
    } else { net.start(); }
  });

  /* ---------- 첫 화면(인트로) ---------- */
  var intro = document.getElementById('intro');
  var circle = document.getElementById('introCircle');
  var video = document.getElementById('introVideo');
  var skip = document.getElementById('skipBtn');
  var entered = false, readyDone = false;

  function ready() {
    if (readyDone) return;
    readyDone = true;
    intro.classList.add('ready');
    circle.disabled = false;
    circle.focus({ preventScroll: true });
  }

  function enter() {
    if (entered) return;
    entered = true;
    intro.classList.add('leaving');
    body.classList.remove('intro-on');
    try { video.pause(); } catch (e) {}
    setTimeout(function () {
      intro.classList.add('gone');
      nets.forEach(function (n) { if (n.el.closest('.intro')) n.net.stop(); });
      document.getElementById('top').focus({ preventScroll: true });
    }, reduceMotion ? 50 : 900);
    revealHeroNow();
  }

  function useFallbackImage() { video.style.display = 'none'; ready(); }

  // 활짝 웃기 전(약 3.0~3.2초, 손을 내린 차분한 정면)에서 멈춤 — 대표 요청 11-24
  var STOP_AT = 3.0;
  function stopAtSmile() {
    if (video.currentTime >= STOP_AT && !video.paused) { video.pause(); ready(); return true; }
    return false;
  }
  if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
    var onFrame = function () { if (!stopAtSmile()) video.requestVideoFrameCallback(onFrame); };
    video.requestVideoFrameCallback(onFrame);
  }
  video.addEventListener('timeupdate', stopAtSmile);
  video.addEventListener('ended', ready);
  video.addEventListener('error', useFallbackImage);
  var src = video.querySelector('source');
  if (src) src.addEventListener('error', useFallbackImage);

  if (reduceMotion) {
    useFallbackImage();
  } else {
    var p;
    try { p = video.play(); } catch (e) { useFallbackImage(); }
    if (p && typeof p.catch === 'function') p.catch(useFallbackImage);
    // 영상이 멈추거나 늦게 뜨는 경우 대비
    setTimeout(ready, 9000);
  }

  circle.addEventListener('click', enter);
  skip.addEventListener('click', enter);
  document.addEventListener('keydown', function (e) {
    if (!entered && e.key === 'Escape') enter();
  });

  /* ---------- 위쪽 메뉴 배경 ---------- */
  var topbar = document.getElementById('topbar');
  var hero = document.querySelector('.hero');
  function onScroll() {
    topbar.classList.toggle('solid', window.scrollY > hero.offsetHeight - 80);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 숫자 올라가기 ---------- */
  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (reduceMotion) { el.textContent = target.toLocaleString('ko-KR'); return; }
    var dur = 1600, t0 = null;
    function tick(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('ko-KR');
      if (p < 1) requestAnimationFrame(tick);
    }
    el.textContent = '0';
    requestAnimationFrame(tick);
  }

  /* ---------- 스크롤 등장 ---------- */
  var reveals = document.querySelectorAll('.reveal');
  function show(el) {
    if (el.classList.contains('in')) return;
    el.classList.add('in');
    var nums = el.querySelectorAll('[data-count]');
    Array.prototype.forEach.call(nums, countUp);
  }

  var io = null;
  if ('IntersectionObserver' in window && !reduceMotion) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  }

  function startReveals() {
    Array.prototype.forEach.call(reveals, function (el) {
      if (io && !el.closest('.hero')) io.observe(el);
      else if (!io) show(el);
    });
  }

  // 히어로는 입장 순간에 맞춰 차례로 등장
  function revealHeroNow() {
    Array.prototype.forEach.call(document.querySelectorAll('.hero .reveal'), function (el, i) {
      setTimeout(function () { show(el); }, reduceMotion ? 0 : 300 + i * 90);
    });
  }
  startReveals();

  /* ---------- 역량 카드 펼치기 ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.cap-head'), function (btn) {
    btn.addEventListener('click', function () {
      var card = btn.closest('.cap');
      var open = !card.classList.contains('open');
      card.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* ---------- About 영상: 화면에 들어오면 재생 ---------- */
  var about = document.getElementById('aboutVideo');
  if (about) {
    about.addEventListener('error', function () { about.style.display = 'none'; });
    var asrc = about.querySelector('source');
    if (asrc) asrc.addEventListener('error', function () { about.style.display = 'none'; });
    if (!reduceMotion && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { var q = about.play(); if (q && q.catch) q.catch(function () {}); }
          else about.pause();
        });
      }, { threshold: 0.3 }).observe(about);
    }
  }
})();
