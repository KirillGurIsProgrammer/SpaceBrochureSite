(function(){
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mx = 0, my = 0;
  function rnd(a, b){ return a + Math.random() * (b - a); }
  function gauss(){ return (Math.random() + Math.random() + Math.random() + Math.random() - 2) / .577; }

  /* ================= Небо ================= */
  var sky = document.getElementById('sky'), c = sky.getContext('2d');
  var W, H, dpr, layer, bright = [], shoot = null, nextShoot = 5000, px = 0, py = 0;

  function pick(){   // цвета звёзд по спектральным классам
    var r = Math.random();
    return r < .12 ? '155,176,255' : r < .3 ? '202,215,255' : r < .65 ? '248,247,255' :
           r < .82 ? '255,244,224' : r < .94 ? '255,210,161' : '255,173,122';
  }

  function build(){
    dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
    sky.width = W * dpr; sky.height = H * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0);
    var LW = W + 80, LH = H + 80;
    layer = document.createElement('canvas'); layer.width = LW * dpr; layer.height = LH * dpr;
    var g = layer.getContext('2d'); g.scale(dpr, dpr);

    var bg = g.createLinearGradient(0, 0, 0, LH);
    bg.addColorStop(0, '#01020a'); bg.addColorStop(.65, '#050918'); bg.addColorStop(1, '#0c1a2c');
    g.fillStyle = bg; g.fillRect(0, 0, LW, LH);
    var ag = g.createRadialGradient(LW / 2, LH * 1.05, 0, LW / 2, LH * 1.05, LW * .6);   // свечение атмосферы у горизонта
    ag.addColorStop(0, 'rgba(40,200,170,.16)'); ag.addColorStop(1, 'rgba(40,200,170,0)');
    g.fillStyle = ag; g.fillRect(0, 0, LW, LH);

    // Млечный Путь: полоса, наклонённая через экран
    var A = -.42, ca = Math.cos(A), sa = Math.sin(A), L = Math.hypot(LW, LH), cx0 = LW * .5, cy0 = LH * .48;
    function band(u, v){ return [cx0 + ca * u - sa * v, cy0 + sa * u + ca * v]; }
    var i, p, u, v, r, a, col;

    g.globalCompositeOperation = 'lighter';
    for (i = 0; i < 80; i++){   // светящиеся облака газа: тёплое ядро, холодные края
      u = rnd(-.5, .5) * L; v = gauss() * LH * .07; p = band(u, v);
      var warm = 1 - Math.abs(u) / (L * .5);
      r = rnd(.1, .3) * LH; col = warm > .55 ? '255,214,170' : '150,172,255'; a = .02 + warm * .05;
      var rg = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], r);
      rg.addColorStop(0, 'rgba(' + col + ',' + a + ')'); rg.addColorStop(1, 'rgba(' + col + ',0)');
      g.fillStyle = rg; g.fillRect(p[0] - r, p[1] - r, r * 2, r * 2);
    }
    g.globalCompositeOperation = 'source-over';
    for (i = 0; i < 36; i++){   // тёмные пылевые полосы
      u = rnd(-.45, .45) * L; v = gauss() * LH * .05 + LH * .01; p = band(u, v); r = rnd(.04, .12) * LH;
      var dg = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], r);
      dg.addColorStop(0, 'rgba(1,2,8,.3)'); dg.addColorStop(1, 'rgba(1,2,8,0)');
      g.fillStyle = dg; g.fillRect(p[0] - r, p[1] - r, r * 2, r * 2);
    }

    g.globalCompositeOperation = 'lighter';
    var nf = Math.round(LW * LH / 130);       // слабые звёзды по всему небу
    for (i = 0; i < nf; i++){
      if (Math.random() < .35){ p = [rnd(0, LW), rnd(0, LH)]; }
      else { p = band(rnd(-.5, .5) * L, gauss() * LH * .09); }
      g.fillStyle = 'rgba(' + pick() + ',' + rnd(.15, .7).toFixed(2) + ')';
      var sz = Math.random() < .12 ? 1.2 : .8; g.fillRect(p[0], p[1], sz, sz);
    }
    var nb = Math.round(LW * LH / 45);        // густая россыпь в полосе
    for (i = 0; i < nb; i++){
      p = band(rnd(-.5, .5) * L, gauss() * LH * .075);
      g.fillStyle = 'rgba(' + pick() + ',' + rnd(.08, .3).toFixed(2) + ')'; g.fillRect(p[0], p[1], .7, .7);
    }

    bright = [];                              // яркие звёзды: редкие, мерцают
    var nr = Math.round(LW * LH / 12000);
    for (i = 0; i < nr; i++){
      var m = Math.pow(Math.random(), 3.5);
      bright.push({ x: rnd(0, LW), y: rnd(0, LH), s: .9 + m * 2, c: pick(), t: rnd(0, 6.28), f: rnd(.6, 2.2), z: rnd(.3, 1) });
    }
  }

  function drawSky(now){
    px += (mx - px) * .04; py += (my - py) * .04;
    c.clearRect(0, 0, W, H);
    c.drawImage(layer, -40 - px * 14, -40 - py * 14, W + 80, H + 80);
    for (var i = 0; i < bright.length; i++){
      var b = bright[i], x = b.x - 40 - px * 28 * b.z, y = b.y - 40 - py * 28 * b.z;
      var al = reduce ? .9 : .65 + .35 * Math.sin(now / 1000 * b.f + b.t);
      if (b.s > 1.6){ c.fillStyle = 'rgba(' + b.c + ',' + (al * .1).toFixed(3) + ')'; c.beginPath(); c.arc(x, y, b.s * 4, 0, 6.283); c.fill(); }
      c.fillStyle = 'rgba(' + b.c + ',' + al.toFixed(2) + ')'; c.beginPath(); c.arc(x, y, b.s * .6, 0, 6.283); c.fill();
    }
    if (!reduce){
      if (!shoot && now > nextShoot){
        shoot = { x: rnd(.2, .9) * W, y: rnd(0, .35) * H, vx: rnd(9, 13) * (Math.random() < .5 ? -1 : 1), vy: rnd(3, 6), life: 0 };
        nextShoot = now + rnd(9000, 18000);
      }
      if (shoot){
        shoot.x += shoot.vx; shoot.y += shoot.vy; shoot.life++;
        var k = 1 - shoot.life / 45, tx2 = shoot.x - shoot.vx * 7, ty2 = shoot.y - shoot.vy * 7;
        var sg = c.createLinearGradient(shoot.x, shoot.y, tx2, ty2);
        sg.addColorStop(0, 'rgba(255,255,255,' + k + ')'); sg.addColorStop(1, 'rgba(255,255,255,0)');
        c.strokeStyle = sg; c.lineWidth = 1.6; c.beginPath(); c.moveTo(shoot.x, shoot.y); c.lineTo(tx2, ty2); c.stroke();
        if (shoot.life > 45) shoot = null;
      }
      requestAnimationFrame(drawSky);
    }
  }
  var rt;
  addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(function(){ build(); if (reduce) drawSky(0); }, 150); });
  build(); requestAnimationFrame(drawSky);

  /* ============ Кибер-глаз ============ */
  var $ = function(id){ return document.getElementById(id); };
  var eye = $('eye'), sock = $('sock'), plates = $('plates'), r1 = $('r1'), pupil = $('pupil'), sh = $('sh');
  var MAX = 60, tx = 0, ty = 0, ex = 0, ey = 0, vx = 0, vy = 0, tiltX = 0, tiltY = 0, tiltTX = 0, tiltTY = 0;
  var prox = 0, pulse = 0, pr = 24, blink = 0, bdir = 0, nextBlink = 2500, again = false;
  var cursorSeen = false, lastX = null, lastY = null;

  function aim(x, y){
    var r = eye.getBoundingClientRect(), sc = r.width / 400;
    var dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2);
    var d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / (260 * sc));
    tx = dx / d * MAX * k; ty = dy / d * MAX * k;
    tiltTY = dx / d * k * 6; tiltTX = -dy / d * k * 6;
    prox = Math.max(0, 1 - d / (700 * sc));
  }
  function onMove(e){
    cursorSeen = true; lastX = e.clientX; lastY = e.clientY;
    mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5;
    aim(e.clientX, e.clientY);
  }
  addEventListener('pointermove', onMove, {passive:true});
  addEventListener('pointerdown', function(e){ onMove(e); pulse = 1.2; }, {passive:true});
  addEventListener('scroll', function(){ if (lastX !== null) aim(lastX, lastY); }, {passive:true});

  function eyeLoop(now){
    if (!cursorSeen && !reduce){
      tx = Math.sin(now / 1700) * MAX * .8; ty = Math.sin(now / 1100) * MAX * .35;
      tiltTY = tx / MAX * 5; tiltTX = 0; prox = 0;
    }
    vx += (tx - ex) * .10; vx *= .72; ex += vx;      // пружина: шар доворачивается как сервопривод
    vy += (ty - ey) * .10; vy *= .72; ey += vy;
    tiltX += (tiltTX - tiltX) * .08; tiltY += (tiltTY - tiltY) * .08;
    pulse *= .9;
    var sx = 1 - .22 * Math.abs(ex) / MAX, sy = 1 - .22 * Math.abs(ey) / MAX;   // ракурс: на краю шара глазница сплющивается
    sock.setAttribute('transform', 'translate(' + ex.toFixed(2) + ' ' + ey.toFixed(2) + ') translate(200 200) scale(' + sx.toFixed(3) + ' ' + sy.toFixed(3) + ') translate(-200 -200)');
    plates.setAttribute('transform', 'translate(' + (ex * .6).toFixed(2) + ' ' + (ey * .6).toFixed(2) + ')');
    pr += (Math.max(10, 26 - 12 * prox - pulse * 8) - pr) * .25;
    pupil.setAttribute('r', pr.toFixed(1));
    if (!reduce){
      if (!bdir && now > nextBlink){ bdir = 1; again = Math.random() < .25; }
      if (bdir){
        blink += bdir * .3;
        if (blink >= 1){ blink = 1; bdir = -1; }
        if (blink <= 0){ blink = 0; bdir = 0; nextBlink = now + (again ? 150 : 3000 + Math.random() * 3500); again = false; }
      }
    }
    sh.setAttribute('r', (blink * 68).toFixed(1));
    r1.setAttribute('transform', 'rotate(' + ((now / 40) % 360).toFixed(1) + ' 200 200)');
    eye.style.transform = 'translateY(' + (reduce ? 0 : Math.sin(now / 900) * 5).toFixed(1) + 'px) perspective(900px) rotateX(' + tiltX.toFixed(2) + 'deg) rotateY(' + tiltY.toFixed(2) + 'deg)';
    requestAnimationFrame(eyeLoop);
  }
  requestAnimationFrame(eyeLoop);

  /* ============ Ракета ============ */
  var fxc = $('fx'), f = fxc.getContext('2d'), P = [], flying = false;
  function sizeFx(){ fxc.width = innerWidth * dpr; fxc.height = innerHeight * dpr; f.setTransform(dpr, 0, 0, dpr, 0, 0); }
  sizeFx(); addEventListener('resize', sizeFx);
  var idle = $('rocket'), go = $('go'), proj = $('projects');
  function ease(q){ return q < .5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2; }
  addEventListener('scroll', function(){ if (!flying && scrollY < innerHeight * .5) idle.style.visibility = 'visible'; }, {passive:true});

  function launch(){
    if (flying) return;
    var target = proj.getBoundingClientRect().top + scrollY;
    if (reduce){ scrollTo({top: target, behavior: 'smooth'}); return; }
    flying = true; go.disabled = true;
    var r = idle.getBoundingClientRect(), rk = idle.cloneNode(true);
    rk.removeAttribute('id'); rk.setAttribute('class', 'rk');
    rk.style.cssText = 'left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px';
    document.body.appendChild(rk); idle.style.visibility = 'hidden'; sizeFx();
    var y0 = r.top, hw = r.width / 2, rh = r.height, nx = r.left + hw, gy = r.bottom;
    var rise = Math.max(120, y0 - innerHeight * .4), ytop = y0 - rise;
    var s0 = scrollY, st = performance.now(), lastS = s0;
    P.length = 0;

    function step(now){
      var t = (now - st) / 1000, y = y0, thrust = Math.min(1, t / 1.2), sk = 0;
      if (t < 2.2) sk = thrust * (t < 1.2 ? 1.4 : .8);
      if (t >= 1.2 && t < 2.2){ var p = t - 1.2; y = y0 - rise * p * p; }
      else if (t >= 2.2){ y = ytop; }
      if (t >= 4.4){ var d = t - 4.4; y = ytop - 1800 * d * d; thrust = 1.4; }
      var q = (t - 2.2) / 2.2;
      if (q > 0) scrollTo({top: s0 + (target - s0) * ease(Math.min(q, 1)), behavior: 'instant'});
      var sd = scrollY - lastS; lastS = scrollY;
      var dx = (Math.random() - .5) * sk, dy = (Math.random() - .5) * sk;
      rk.style.transform = 'translate(' + dx.toFixed(2) + 'px,' + (y - y0 + dy).toFixed(2) + 'px) rotate(' + (Math.sin(t * 40) * .4 * sk).toFixed(2) + 'deg)';

      var ny = y + dy + rh * .97, X = nx + dx, i, pt;
      if (t < 3.2) for (i = 0; i < 3 * thrust; i++) P.push({k:'g', x: nx + (Math.random() - .5) * 20, y: gy, vx: (Math.random() - .5) * 7, vy: -Math.random() * 1.2, s: 10 + Math.random() * 14, l: 1, d: .012});
      for (i = 0; i < 4 * thrust; i++) P.push({k:'s', x: X + (Math.random() - .5) * hw, y: ny, vx: (Math.random() - .5) * 2, vy: 4 + Math.random() * 6, s: 1.5 + Math.random() * 2.5, l: 1, d: .05});
      if (q > 0 && q < 1.05){
        var amp = Math.sin(Math.PI * Math.min(q, 1));
        for (i = 0; i < 6; i++) P.push({k:'l', x: Math.random() * innerWidth, y: -Math.random() * 150, vy: 30 + Math.random() * 25, len: 50 + Math.random() * 90, l: .1 + Math.random() * .3 * amp, d: 0});
      }

      f.clearRect(0, 0, innerWidth, innerHeight);
      for (i = P.length - 1; i >= 0; i--){
        pt = P[i]; pt.y += pt.vy; pt.l -= pt.d;
        if (pt.k === 'g'){ pt.x += pt.vx; pt.vx *= .97; pt.y -= sd; pt.s += .5; }
        else if (pt.k === 's'){ pt.x += pt.vx; }
        if (pt.l <= 0 || pt.y > innerHeight + 250){ P.splice(i, 1); continue; }
        if (pt.k === 'g'){ f.fillStyle = 'rgba(205,205,220,' + (pt.l * .28).toFixed(3) + ')'; f.beginPath(); f.arc(pt.x, pt.y, pt.s, 0, 6.283); f.fill(); }
        else if (pt.k === 'l'){ f.strokeStyle = 'rgba(200,220,255,' + pt.l.toFixed(2) + ')'; f.lineWidth = 1.2; f.beginPath(); f.moveTo(pt.x, pt.y); f.lineTo(pt.x, pt.y - pt.len); f.stroke(); }
      }
      f.globalCompositeOperation = 'lighter';
      for (i = 0; i < P.length; i++){
        pt = P[i]; if (pt.k !== 's') continue;
        f.fillStyle = 'rgba(255,170,70,' + pt.l.toFixed(2) + ')'; f.beginPath(); f.arc(pt.x, pt.y, pt.s, 0, 6.283); f.fill();
      }
      if (thrust > 0){      // факел двигателя и отсвет
        var L = rh * (.25 + .9 * Math.min(thrust, 1.2)) * (.85 + Math.random() * .15), w = hw * .85 * Math.min(thrust, 1);
        var gr = f.createLinearGradient(0, ny, 0, ny + L);
        gr.addColorStop(0, 'rgba(225,240,255,.95)'); gr.addColorStop(.25, 'rgba(255,200,90,.85)'); gr.addColorStop(.7, 'rgba(255,90,20,.35)'); gr.addColorStop(1, 'rgba(255,60,0,0)');
        f.fillStyle = gr; f.beginPath(); f.moveTo(X - w, ny); f.quadraticCurveTo(X - w * .8, ny + L * .5, X, ny + L); f.quadraticCurveTo(X + w * .8, ny + L * .5, X + w, ny); f.fill();
        var gl = f.createRadialGradient(X, ny, 0, X, ny, 170 * Math.min(thrust, 1));
        gl.addColorStop(0, 'rgba(255,160,70,.28)'); gl.addColorStop(1, 'rgba(255,160,70,0)');
        f.fillStyle = gl; f.fillRect(X - 200, ny - 200, 400, 400);
      }
      f.globalCompositeOperation = 'source-over';

      if (t < 5.3) requestAnimationFrame(step);
      else { rk.remove(); P.length = 0; f.clearRect(0, 0, innerWidth, innerHeight); scrollTo({top: target, behavior: 'instant'}); flying = false; go.disabled = false; }
    }
    requestAnimationFrame(step);
  }
  go.addEventListener('click', launch);

  /* ============ Проекты-звёзды ============ */
  var sp = $('projects'), info = $('info'), stars = [].slice.call(document.querySelectorAll('.star')), pts = [];
  stars.forEach(function(s, i){
    s.style.left = s.dataset.x + '%'; s.style.top = s.dataset.y + '%'; s.style.setProperty('--i', i);
    pts.push(s.dataset.x + ',' + s.dataset.y);
    function show(){
      stars.forEach(function(o){ o.classList.remove('on'); }); s.classList.add('on');
      info.innerHTML = ''; ['b', 'span', 'small'].forEach(function(tag, n){
        var el = document.createElement(tag); el.textContent = [s.dataset.t, s.dataset.d, s.dataset.s][n]; info.appendChild(el);
      });
    }
    s.addEventListener('mouseenter', show); s.addEventListener('focus', show); s.addEventListener('click', show);
  });
  sp.querySelector('polyline').setAttribute('points', pts.join(' '));
  if ('IntersectionObserver' in window && !reduce) new IntersectionObserver(function(en){ if (en[0].isIntersecting) sp.classList.add('lit'); }, {threshold: .25}).observe(sp);
  else sp.classList.add('lit');
})();