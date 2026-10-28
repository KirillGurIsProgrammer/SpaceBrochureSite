(function(){
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mx = 0, my = 0;
  function rnd(a, b){ return a + Math.random() * (b - a); }
  function gauss(){ return (Math.random() + Math.random() + Math.random() + Math.random() - 2) / .577; }

  /* ================= Небо ================= */
  var sky = document.getElementById('sky'), c = sky.getContext('2d');
  var W, H, dpr, layer, bright = [], shoot = null, nextShoot = 5000, px = 0, py = 0;

  function pick(){   
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

    bright = [];                             
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

  /* ============ Механический глаз ============ */
  var $ = function(id){ return document.getElementById(id); };
  var eye = $('eye'), look = $('look'), r1 = $('r1'), r2 = $('r2'), pupil = $('pupil'), lT = $('lT'), lB = $('lB');
  var MAXX = 78, MAXY = 20;
  var tx = 0, ty = 0, ex = 0, ey = 0, vx = 0, vy = 0, tiltX = 0, tiltY = 0, tiltTX = 0, tiltTY = 0;
  var prox = 0, pulse = 0, pr = 20, blink = 0, bdir = 0, nextBlink = 2500, again = false;
  var cursorSeen = false, lastX = null, lastY = null;

  function aim(x, y){
    var r = eye.getBoundingClientRect(), sc = r.width / 520;
    var dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2);
    var d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / (240 * sc));
    tx = dx / d * MAXX * k; ty = dy / d * MAXY * k;
    tiltTY = dx / d * k * 9; tiltTX = -dy / d * k * 7;
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
    if (!cursorSeen && !reduce){            // пока курсора нет, глаз сканирует
      tx = Math.sin(now / 1500) * MAXX * .8; ty = Math.sin(now / 1000) * MAXY * .3;
      tiltTY = tx / MAXX * 7; tiltTX = 0; prox = 0;
    }
    vx += (tx - ex) * .10; vx *= .72; ex += vx;      // пружина как у сервопривода
    vy += (ty - ey) * .10; vy *= .72; ey += vy;
    tiltX += (tiltTX - tiltX) * .08; tiltY += (tiltTY - tiltY) * .08;
    pulse *= .9;

    var prT = Math.max(8, 26 - 14 * prox - pulse * 8);   // зрачок сужается при приближении курсора и клике
    pr += (prT - pr) * .25;
    pupil.setAttribute('r', pr.toFixed(1));

    if (!reduce){                                       // быстрое механическое моргание
      if (!bdir && now > nextBlink){ bdir = 1; again = Math.random() < .25; }
      if (bdir){
        blink += bdir * .34;
        if (blink >= 1){ blink = 1; bdir = -1; }
        if (blink <= 0){ blink = 0; bdir = 0; nextBlink = now + (again ? 150 : 3000 + Math.random() * 3500); again = false; }
      }
    }
    lT.setAttribute('transform', 'translate(0 ' + (40 + 110 * blink).toFixed(1) + ')');
    lB.setAttribute('transform', 'translate(0 ' + (260 - 110 * blink).toFixed(1) + ')');
    look.setAttribute('transform', 'translate(' + ex.toFixed(2) + ' ' + ey.toFixed(2) + ')');
    r1.setAttribute('transform', 'rotate(' + ((now / 40) % 360).toFixed(1) + ' 260 150)');
    r2.setAttribute('transform', 'rotate(' + (-(now / 25) % 360).toFixed(1) + ' 260 150)');
    eye.style.transform = 'perspective(900px) rotateX(' + tiltX.toFixed(2) + 'deg) rotateY(' + tiltY.toFixed(2) + 'deg)';
    requestAnimationFrame(eyeLoop);
  }
  requestAnimationFrame(eyeLoop);
})();