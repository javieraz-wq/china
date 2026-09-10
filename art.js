/* Ilustraciones del viaje.
   Escenas SVG generadas en el propio navegador: sin peticiones de red,
   sin dependencias y con el mismo aspecto en cualquier pantalla.
   Cada destino usa un duotono distinto sobre la misma familia grafica. */
(function () {
  'use strict';

  /* --- utilidades ------------------------------------------------------ */

  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function seedOf(str) {
    var h = 2166136261, i;
    for (i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  var W = 1200, H = 720;

  /* Paletas duotono: [cielo alto, cielo bajo, tinta, disco] */
  var PAL_LIGHT = {
    sage:   ['#E8E6D8', '#CFD3C2', '#2E3A33', '#C9A24A'],
    slate:  ['#E2E4E4', '#C2C8CB', '#2B3238', '#E7D9C4'],
    ochre:  ['#F0E6D4', '#DCC7A6', '#3A2E24', '#A8442F'],
    rose:   ['#F1E5DE', '#D9BFB6', '#33262A', '#B4553F'],
    indigo: ['#D9DCE4', '#A8AEBE', '#22242E', '#A8442F'],
    mist:   ['#EAEAE4', '#CBCEC8', '#2D322F', '#DCCBA8'],
    warm:   ['#F3E8D8', '#E0C9A8', '#38291F', '#B4553F'],
    dusk:   ['#E9DED4', '#C3B2A6', '#292421', '#8C2B22']
  };

  /* Version nocturna: mismo duotono, cielo apagado y siluetas casi negras,
     para que las capas se sigan separando sobre fondo oscuro. */
  var PAL_DARK = {
    sage:   ['#5E6D60', '#1C2320', '#080B09', '#E2BE68'],
    slate:  ['#5C6A77', '#191E24', '#070A0D', '#E9DAC0'],
    ochre:  ['#6D5742', '#1F1712', '#0B0806', '#DA9C54'],
    rose:   ['#6D4E55', '#1F1618', '#0C0809', '#DB856C'],
    indigo: ['#4E5972', '#151921', '#06080B', '#CB7C48'],
    mist:   ['#606964', '#1B1F1D', '#080A09', '#E5D1A8'],
    warm:   ['#725941', '#211912', '#0C0806', '#DA8951'],
    dusk:   ['#674F46', '#1C1513', '#0A0707', '#CA5B46']
  };

  var THEME = 'dark';
  var PAL = PAL_DARK;

  function grad(id, a, b) {
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + a + '"/>' +
      '<stop offset="1" stop-color="' + b + '"/></linearGradient>';
  }

  function layerFill(ink, alpha) {
    return 'fill="' + ink + '" fill-opacity="' + alpha + '"';
  }

  /* --- perfiles de silueta --------------------------------------------- */

  /* Colinas carsticas: cupulas redondeadas */
  function karst(r, base, count, min, max, jitter) {
    var d = 'M -60 ' + H + ' L -60 ' + base + ' ';
    var x = -60, i, w, h, apex;
    for (i = 0; i < count; i++) {
      w = min * 0.6 + r() * (max * 0.5);
      h = min + r() * (max - min);
      apex = x + w;
      d += 'C ' + (x + w * 0.35) + ' ' + (base - h * 0.15) + ' ' +
           (apex - w * 0.45) + ' ' + (base - h) + ' ' + apex + ' ' + (base - h) + ' ';
      d += 'C ' + (apex + w * 0.45) + ' ' + (base - h) + ' ' +
           (apex + w * 0.65) + ' ' + (base - h * 0.15) + ' ' + (apex + w * 2) + ' ' + base + ' ';
      x = apex + w * 2 - (jitter ? r() * w : 0);
      if (x > W + 60) break;
    }
    d += 'L ' + (W + 60) + ' ' + base + ' L ' + (W + 60) + ' ' + H + ' Z';
    return d;
  }

  /* Pilares de cuarcita: columnas verticales sobre una base */
  function pillars(r, base, count, min, max) {
    var d = 'M -60 ' + H + ' L -60 ' + (base - 10) + ' L ' + (W + 60) + ' ' + (base - 10) +
            ' L ' + (W + 60) + ' ' + H + ' Z ';
    var i, x, w, hh, t, slot = (W + 120) / count;
    for (i = 0; i < count * 2; i++) {
      x = -50 + (i / 2) * slot + (i % 2 ? slot * 0.42 : 0) + r() * slot * 0.16;
      w = (i % 2) ? 26 + r() * 34 : 60 + r() * 90;
      hh = (min + r() * (max - min)) * ((i % 2) ? 0.62 : 1);
      t = base - hh;
      d += 'M ' + x + ' ' + base + ' L ' + (x + 4) + ' ' + (t + 30) +
           ' C ' + (x + 4) + ' ' + (t + 8) + ' ' + (x + w * 0.24) + ' ' + t + ' ' + (x + w * 0.5) + ' ' + t +
           ' C ' + (x + w * 0.78) + ' ' + t + ' ' + (x + w - 4) + ' ' + (t + 8) + ' ' + (x + w - 4) + ' ' + (t + 30) +
           ' L ' + (x + w) + ' ' + base + ' Z ';
    }
    return d;
  }

  /* Banda de niebla con bordes difuminados */
  function mistGrad(id, color) {
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + color + '" stop-opacity="0"/>' +
      '<stop offset="0.5" stop-color="' + color + '" stop-opacity="1"/>' +
      '<stop offset="1" stop-color="' + color + '" stop-opacity="0"/></linearGradient>';
  }
  function mist(id, y, hgt, alpha) {
    return '<rect x="-40" y="' + y + '" width="' + (W + 80) + '" height="' + hgt +
           '" fill="url(#' + id + ')" opacity="' + alpha + '"/>';
  }

  /* Skyline de torres */
  function skyline(r, base, count, min, max, special) {
    var d = '', i, x, w, h, cx, extra = '';
    var step = (W + 120) / count;
    for (i = 0; i < count; i++) {
      x = -60 + i * step + r() * 8;
      w = step * (0.45 + r() * 0.45);
      h = min + r() * (max - min);
      d += 'M ' + x + ' ' + H + ' L ' + x + ' ' + (base - h) + ' L ' + (x + w) + ' ' + (base - h) +
           ' L ' + (x + w) + ' ' + H + ' Z ';
      if (r() > 0.72) {
        cx = x + w / 2;
        d += 'M ' + (cx - 3) + ' ' + (base - h) + ' L ' + (cx - 1.5) + ' ' + (base - h - 46) +
             ' L ' + (cx + 1.5) + ' ' + (base - h - 46) + ' L ' + (cx + 3) + ' ' + (base - h) + ' Z ';
      }
    }
    if (special) {
      /* torre conica y torre de esferas, como marca de Shanghai */
      cx = W * 0.62;
      d += 'M ' + (cx - 46) + ' ' + H + ' L ' + (cx - 28) + ' ' + (base - 430) +
           ' L ' + (cx + 28) + ' ' + (base - 430) + ' L ' + (cx + 46) + ' ' + H + ' Z ';
      cx = W * 0.3;
      d += 'M ' + (cx - 7) + ' ' + H + ' L ' + (cx - 7) + ' ' + (base - 400) +
           ' L ' + (cx + 7) + ' ' + (base - 400) + ' L ' + (cx + 7) + ' ' + H + ' Z ';
      extra = '<circle cx="' + cx + '" cy="' + (base - 250) + '" r="40"/>' +
              '<circle cx="' + cx + '" cy="' + (base - 372) + '" r="26"/>';
    }
    return { d: d, extra: extra };
  }

  /* Ciudad en terrazas sobre el rio */
  function terraces(r, base) {
    var d = '', i, x, w, h, g;
    for (i = 0; i < 26; i++) {
      x = -40 + i * 48 + r() * 12;
      g = base - (i % 3) * 34;
      w = 24 + r() * 26;
      h = 90 + r() * 300;
      d += 'M ' + x + ' ' + H + ' L ' + x + ' ' + (g - h) + ' L ' + (x + w) + ' ' + (g - h) +
           ' L ' + (x + w) + ' ' + H + ' Z ';
    }
    return d;
  }

  /* Cresta de montana con la muralla recorriendola */
  function wall(r, base) {
    var pts = [], i, x, y, n = 11;
    for (i = 0; i <= n; i++) {
      x = -70 + i * ((W + 140) / n);
      y = base - 60 - Math.abs(Math.sin(i * 0.95 + 0.6)) * 150 - r() * 30;
      pts.push([x, y]);
    }
    var ridge = 'M -70 ' + H;
    for (i = 0; i < pts.length; i++) ridge += ' L ' + pts[i][0] + ' ' + pts[i][1];
    ridge += ' L ' + (W + 70) + ' ' + H + ' Z';

    var line = 'M';
    for (i = 0; i < pts.length; i++) line += ' ' + pts[i][0] + ' ' + (pts[i][1] - 12);

    var towers = '', peak;
    for (i = 1; i < pts.length - 1; i += 2) {
      peak = pts[i];
      towers += '<rect x="' + (peak[0] - 23) + '" y="' + (peak[1] - 62) + '" width="46" height="60"/>' +
                '<rect x="' + (peak[0] - 31) + '" y="' + (peak[1] - 72) + '" width="62" height="13"/>';
    }
    return { ridge: ridge, line: line, towers: towers };
  }

  /* Muralla, torre de la puerta y pagoda */
  function imperial(base) {
    var g = '', i, x;
    /* muralla con almenas */
    g += '<rect x="-60" y="' + (base - 70) + '" width="' + (W + 120) + '" height="' + (H - base + 70) + '"/>';
    for (i = 0; i < 40; i++) {
      x = -60 + i * 34;
      g += '<rect x="' + x + '" y="' + (base - 88) + '" width="20" height="20"/>';
    }
    /* torre de la puerta */
    var cx = W * 0.30, w = 300;
    g += '<rect x="' + (cx - w / 2) + '" y="' + (base - 190) + '" width="' + w + '" height="120"/>';
    g += '<path d="M ' + (cx - w / 2 - 34) + ' ' + (base - 190) + ' Q ' + cx + ' ' + (base - 254) + ' ' +
         (cx + w / 2 + 34) + ' ' + (base - 190) + ' Z"/>';
    g += '<rect x="' + (cx - w / 2 + 30) + '" y="' + (base - 300) + '" width="' + (w - 60) + '" height="80"/>';
    g += '<path d="M ' + (cx - w / 2) + ' ' + (base - 300) + ' Q ' + cx + ' ' + (base - 356) + ' ' +
         (cx + w / 2) + ' ' + (base - 300) + ' Z"/>';
    /* pagoda escalonada */
    var px = W * 0.76, pw = 150, py = base - 70, k;
    for (k = 0; k < 6; k++) {
      var kw = pw - k * 16, ky = py - 62 - k * 58;
      g += '<rect x="' + (px - kw / 2 + 10) + '" y="' + ky + '" width="' + (kw - 20) + '" height="50"/>';
      g += '<path d="M ' + (px - kw / 2) + ' ' + ky + ' Q ' + px + ' ' + (ky - 26) + ' ' +
           (px + kw / 2) + ' ' + ky + ' Z"/>';
    }
    g += '<path d="M ' + (px - 5) + ' ' + (py - 62 - 5 * 58 - 26) + ' L ' + px + ' ' +
         (py - 62 - 5 * 58 - 62) + ' L ' + (px + 5) + ' ' + (py - 62 - 5 * 58 - 26) + ' Z"/>';
    return g;
  }

  /* Farallon con el pueblo asomado y la cascada cayendo por delante */
  function cliff(r, base) {
    var top = base - 120, i, x, w, hh, y;
    var face = 'M -60 ' + H + ' L -60 ' + (top + 30) +
               ' L ' + (W * 0.16) + ' ' + (top + 8) +
               ' L ' + (W * 0.58) + ' ' + top +
               ' L ' + (W * 0.86) + ' ' + (top + 14) +
               ' L ' + (W + 60) + ' ' + (top + 44) + ' L ' + (W + 60) + ' ' + H + ' Z';
    var grooves = '';
    for (i = 0; i < 7; i++) {
      x = 90 + i * 165 + r() * 50;
      grooves += '<rect x="' + x + '" y="' + (top + 60) + '" width="' + (10 + r() * 16) +
                 '" height="' + (H - top) + '"/>';
    }
    var houses = '', spots = [0.03, 0.10, 0.17, 0.24, 0.31, 0.60, 0.68, 0.77, 0.87];
    for (i = 0; i < spots.length; i++) {
      x = W * spots[i];
      w = 54 + r() * 32;
      hh = 42 + r() * 36;
      y = top - hh - r() * 24;
      houses += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + hh + '"/>';
      houses += '<path d="M ' + (x - 16) + ' ' + y + ' L ' + (x + w / 2) + ' ' + (y - 30) +
                ' L ' + (x + w + 16) + ' ' + y + ' Z"/>';
      houses += '<rect x="' + (x + 5) + '" y="' + (y + hh) + '" width="5" height="' + (top - y - hh + 18) + '"/>' +
                '<rect x="' + (x + w - 10) + '" y="' + (y + hh) + '" width="5" height="' + (top - y - hh + 18) + '"/>';
    }
    return { face: face, grooves: grooves, houses: houses, top: top };
  }

  /* Casas sobre pilotes, alturas irregulares */
  function stilts(r, base) {
    var g = '', i, x = -30, w, hh, top;
    for (i = 0; i < 12; i++) {
      w = 66 + r() * 62;
      hh = 40 + r() * 86;
      top = base - hh;
      g += '<rect x="' + x + '" y="' + top + '" width="' + w + '" height="' + hh + '"/>';
      g += '<path d="M ' + (x - 13) + ' ' + top + ' L ' + (x + w / 2) + ' ' + (top - 24 - r() * 12) +
           ' L ' + (x + w + 13) + ' ' + top + ' Z"/>';
      g += '<rect x="' + (x + 7) + '" y="' + base + '" width="6" height="46"/>' +
           '<rect x="' + (x + w / 2 - 3) + '" y="' + base + '" width="6" height="46"/>' +
           '<rect x="' + (x + w - 13) + '" y="' + base + '" width="6" height="46"/>';
      x += w + 16 + r() * 40;
      if (x > W + 40) break;
    }
    return g;
  }

  /* Puente de piedra de tres ojos, calados con fill-rule */
  function bridge(base) {
    var x0 = W * 0.50, w = 390, deck = base - 30, bot = base + 60;
    var d = 'M ' + x0 + ' ' + bot + ' L ' + x0 + ' ' + deck + ' L ' + (x0 + w) + ' ' + deck +
            ' L ' + (x0 + w) + ' ' + bot + ' Z ';
    var i, ax;
    for (i = 0; i < 3; i++) {
      ax = x0 + 30 + i * 115;
      d += 'M ' + ax + ' ' + bot + ' L ' + ax + ' ' + (base + 8) +
           ' q 42 -52 84 0 L ' + (ax + 84) + ' ' + bot + ' Z ';
    }
    var body = '<path fill-rule="evenodd" d="' + d + '"/>' +
               '<rect x="' + (x0 - 10) + '" y="' + (deck - 15) + '" width="' + (w + 20) + '" height="13"/>';
    return { body: body, x0: x0, w: w };
  }

  /* Canas de bambu enmarcando la escena */
  function bamboo(r) {
    var g = '', i, k, j, x, w, y, top;
    var xs = [40, 118, 196, 300, 880, 968, 1046, 1130];
    for (i = 0; i < xs.length; i++) {
      x = xs[i] + r() * 24;
      w = 16 + r() * 12;
      top = H * 0.06 + r() * 150;
      g += '<rect x="' + x + '" y="' + top + '" width="' + w + '" height="' + H + '"/>';
      for (k = 0; k < 5; k++) {
        y = top + 96 + k * 118;
        if (y > H) break;
        g += '<rect x="' + (x - 3) + '" y="' + y + '" width="' + (w + 6) + '" height="5"/>';
        if (k % 2 === 0 && k < 4) {
          for (j = 0; j < 3; j++) {
            var dir = x < W / 2 ? 1 : -1;
            var len = 70 + j * 26;
            var ey = y - 12 - j * 22;
            g += '<path d="M ' + (x + (dir > 0 ? w : 0)) + ' ' + ey +
                 ' q ' + (dir * len * 0.6) + ' ' + (-24 - j * 6) + ' ' + (dir * len) + ' ' + (-10 - j * 8) +
                 ' q ' + (-dir * len * 0.5) + ' ' + (20 + j * 6) + ' ' + (-dir * len) + ' ' + (10 + j * 8) + ' Z"/>';
          }
        }
      }
    }
    return g;
  }

  /* Bandas de nubes y avion */
  function clouds(r) {
    var g = '', i, x, y, w;
    for (i = 0; i < 7; i++) {
      x = r() * W - 100;
      y = 120 + i * 78 + r() * 20;
      w = 240 + r() * 320;
      g += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + (16 + r() * 14) +
           '" rx="14"/>';
    }
    return g;
  }

  /* --- montaje de escenas ---------------------------------------------- */

  var SCENES = {
    shanghai: { pal: 'indigo', label: 'Skyline de Shanghái al anochecer' },
    guilin:   { pal: 'sage',   label: 'Colinas cársticas de Guilin' },
    yangshuo: { pal: 'mist',   label: 'Karsts y río de Yangshuo' },
    zhangjiajie: { pal: 'slate', label: 'Pilares de piedra de Zhangjiajie entre la niebla' },
    furong:   { pal: 'warm',   label: 'El pueblo de Furong sobre la cascada' },
    fenghuang: { pal: 'rose',  label: 'Casas colgantes de Fenghuang sobre el río' },
    chongqing: { pal: 'indigo', label: 'Chongqing en terrazas sobre el río' },
    chengdu:  { pal: 'sage',   label: 'Bambú y colinas de Chengdu' },
    xian:     { pal: 'ochre',  label: 'Muralla y pagoda de Xi\'an' },
    beijing:  { pal: 'dusk',   label: 'La Gran Muralla sobre la cresta' },
    clouds:   { pal: 'slate',  label: 'Cielo y nubes en ruta' },
    hero:     { pal: 'dusk',   label: 'Paisaje de montañas cársticas sobre el agua' }
  };

  function build(name, key) {
    var cfg = SCENES[name] || SCENES.hero;
    var p = PAL[cfg.pal];
    var ink = p[2], disc = p[3];
    var r = rng(seedOf(key || name));
    var gid = 'sky-' + Math.abs(seedOf((key || name) + name)).toString(36);
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid slice" ' +
            'xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + cfg.label + '" focusable="false">';
    var mid = 'mist-' + gid;
    s += '<defs>' + grad(gid, p[0], p[1]) + mistGrad(mid, p[0]) + '</defs>';
    s += '<rect width="' + W + '" height="' + H + '" fill="url(#' + gid + ')"/>';

    var base = H * 0.78, sun;

    switch (name) {
      case 'hero':
        s += '<circle cx="' + (W * 0.70) + '" cy="' + (H * 0.22) + '" r="92" fill="' + disc + '" fill-opacity="0.85"/>';
        s += '<path d="' + karst(r, base - 40, 8, 150, 300, true) + '" ' + layerFill(ink, 0.20) + '/>';
        s += '<path d="' + karst(r, base, 7, 200, 380, true) + '" ' + layerFill(ink, 0.38) + '/>';
        s += '<path d="' + karst(r, base + 40, 6, 240, 420, true) + '" ' + layerFill(ink, 0.66) + '/>';
        s += '<rect x="0" y="' + (base + 40) + '" width="' + W + '" height="' + (H - base - 40) + '" ' +
             layerFill(ink, 0.70) + '/>';
        s += '<g ' + layerFill(p[0], 0.34) + '><rect x="120" y="' + (base + 92) + '" width="360" height="6" rx="3"/>' +
             '<rect x="240" y="' + (base + 126) + '" width="520" height="5" rx="3"/></g>';
        break;

      case 'guilin':
      case 'yangshuo':
        sun = name === 'guilin' ? 0.26 : 0.22;
        s += '<circle cx="' + (W * 0.24) + '" cy="' + (H * sun) + '" r="74" fill="' + disc + '" fill-opacity="0.7"/>';
        s += '<path d="' + karst(r, base - 50, 9, 130, 260, true) + '" ' + layerFill(ink, 0.18) + '/>';
        s += '<path d="' + karst(r, base, 7, 180, 340, true) + '" ' + layerFill(ink, 0.36) + '/>';
        s += '<path d="' + karst(r, base + 46, 6, 220, 400, true) + '" ' + layerFill(ink, 0.64) + '/>';
        s += '<rect x="0" y="' + (base + 46) + '" width="' + W + '" height="' + (H - base - 46) + '" ' +
             layerFill(ink, 0.80) + '/>';
        break;

      case 'zhangjiajie':
        s += '<path d="' + pillars(r, base - 50, 3, 250, 400) + '" ' + layerFill(ink, 0.17) + '/>';
        s += mist(mid, H * 0.34, 130, 0.85);
        s += '<path d="' + pillars(r, base + 30, 3, 300, 470) + '" ' + layerFill(ink, 0.40) + '/>';
        s += mist(mid, H * 0.54, 118, 0.72);
        s += '<path d="' + pillars(r, base + 150, 2, 340, 520) + '" ' + layerFill(ink, 0.78) + '/>';
        break;

      case 'shanghai':
        s += '<circle cx="' + (W * 0.18) + '" cy="' + (H * 0.24) + '" r="60" fill="' + disc + '" fill-opacity="0.55"/>';
        var sk1 = skyline(r, base, 14, 120, 300, false);
        s += '<path d="' + sk1.d + '" ' + layerFill(ink, 0.24) + '/>';
        var sk2 = skyline(r, base + 30, 11, 200, 460, true);
        s += '<g ' + layerFill(ink, 0.62) + '><path d="' + sk2.d + '"/>' + sk2.extra + '</g>';
        s += '<rect x="0" y="' + (base + 108) + '" width="' + W + '" height="' + (H - base - 108) + '" ' +
             layerFill(ink, 0.80) + '/>';
        break;

      case 'chongqing':
        s += '<circle cx="' + (W * 0.80) + '" cy="' + (H * 0.22) + '" r="52" fill="' + disc + '" fill-opacity="0.65"/>';
        var ck = skyline(r, base - 40, 12, 120, 320, false);
        s += '<path d="' + ck.d + '" ' + layerFill(ink, 0.22) + '/>';
        s += '<path d="' + terraces(r, base + 40) + '" ' + layerFill(ink, 0.60) + '/>';
        s += '<rect x="0" y="' + (base + 92) + '" width="' + W + '" height="' + (H - base - 92) + '" ' +
             layerFill(ink, 0.82) + '/>';
        s += '<path d="M -40 ' + (base + 70) + ' Q ' + (W / 2) + ' ' + (base - 10) + ' ' + (W + 40) + ' ' +
             (base + 70) + '" fill="none" stroke="' + ink + '" stroke-opacity="0.72" stroke-width="10"/>';
        break;

      case 'beijing':
        s += '<circle cx="' + (W * 0.20) + '" cy="' + (H * 0.22) + '" r="66" fill="' + disc + '" fill-opacity="0.5"/>';
        var w1 = wall(r, base - 70);
        s += '<path d="' + w1.ridge + '" ' + layerFill(ink, 0.18) + '/>';
        var w2 = wall(r, base + 40);
        s += '<path d="' + w2.ridge + '" ' + layerFill(ink, 0.40) + '/>';
        s += '<path d="' + w2.line + '" fill="none" stroke="' + ink + '" stroke-opacity="0.80" ' +
             'stroke-width="19" stroke-linejoin="round" stroke-linecap="round"/>';
        s += '<path d="' + w2.line + '" fill="none" stroke="' + p[0] + '" stroke-opacity="0.30" ' +
             'stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>';
        s += '<g ' + layerFill(ink, 0.88) + '>' + w2.towers + '</g>';
        s += '<path d="' + karst(r, H + 70, 3, 120, 190, true) + '" ' + layerFill(ink, 0.88) + '/>';
        break;

      case 'xian':
        s += '<circle cx="' + (W * 0.52) + '" cy="' + (H * 0.22) + '" r="80" fill="' + disc + '" fill-opacity="0.42"/>';
        s += '<path d="' + karst(r, base - 90, 6, 80, 150, true) + '" ' + layerFill(ink, 0.16) + '/>';
        s += '<g ' + layerFill(ink, 0.72) + '>' + imperial(base + 40) + '</g>';
        break;

      case 'furong':
        s += '<circle cx="' + (W * 0.80) + '" cy="' + (H * 0.22) + '" r="66" fill="' + disc + '" fill-opacity="0.6"/>';
        s += '<path d="' + karst(r, base - 150, 6, 90, 180, true) + '" ' + layerFill(ink, 0.15) + '/>';
        var cf = cliff(r, base + 30);
        s += '<path d="' + cf.face + '" ' + layerFill(ink, 0.74) + '/>';
        s += '<g ' + layerFill(ink, 0.14) + '>' + cf.grooves + '</g>';
        s += '<path d="M ' + (W * 0.40) + ' ' + (cf.top + 6) + ' L ' + (W * 0.505) + ' ' + (cf.top + 6) +
             ' L ' + (W * 0.525) + ' ' + (H - 30) + ' L ' + (W * 0.375) + ' ' + (H - 30) + ' Z" fill="' +
             p[0] + '" fill-opacity="0.94"/>';
        s += '<ellipse cx="' + (W * 0.45) + '" cy="' + (H - 34) + '" rx="210" ry="40" fill="' +
             p[0] + '" fill-opacity="0.5"/>';
        s += '<g ' + layerFill(ink, 0.92) + '>' + cf.houses + '</g>';
        break;

      case 'fenghuang':
        s += '<circle cx="' + (W * 0.18) + '" cy="' + (H * 0.20) + '" r="58" fill="' + disc + '" fill-opacity="0.5"/>';
        s += '<path d="' + karst(r, base - 150, 6, 90, 180, true) + '" ' + layerFill(ink, 0.15) + '/>';
        var br = bridge(base - 44);
        s += '<g ' + layerFill(ink, 0.70) + '>' + stilts(r, base - 44) + '</g>';
        s += '<g ' + layerFill(ink, 0.86) + '>' + br.body + '</g>';
        s += '<rect x="0" y="' + (base + 2) + '" width="' + W + '" height="' + (H - base - 2) + '" ' +
             layerFill(ink, 0.80) + '/>';
        s += '<g ' + layerFill(p[0], 0.26) + '><rect x="90" y="' + (base + 48) + '" width="300" height="6" rx="3"/>' +
             '<rect x="220" y="' + (base + 84) + '" width="460" height="5" rx="3"/>' +
             '<rect x="640" y="' + (base + 120) + '" width="330" height="6" rx="3"/></g>';
        break;

      case 'chengdu':
        s += '<circle cx="' + (W * 0.66) + '" cy="' + (H * 0.26) + '" r="72" fill="' + disc + '" fill-opacity="0.5"/>';
        s += '<path d="' + karst(r, base - 30, 5, 90, 170, true) + '" ' + layerFill(ink, 0.16) + '/>';
        s += '<path d="' + karst(r, base + 60, 4, 120, 210, true) + '" ' + layerFill(ink, 0.34) + '/>';
        s += '<g ' + layerFill(ink, 0.66) + '>' + bamboo(r) + '</g>';
        break;

      default: /* clouds */
        s += '<circle cx="' + (W * 0.74) + '" cy="' + (H * 0.26) + '" r="76" fill="' + disc + '" fill-opacity="0.55"/>';
        s += '<g ' + layerFill(ink, 0.16) + '>' + clouds(r) + '</g>';
        s += '<g ' + layerFill(ink, 0.62) + '><path d="M 300 400 l 150 -34 l 34 -74 l 26 0 l -8 68 l 120 -28 l 10 -44 l 20 0 l 0 40 l 70 -16 l 0 26 l -70 16 l 0 40 l -20 0 l -10 -34 l -120 28 l 8 66 l -26 0 l -34 -60 Z"/></g>';
        s += '<g ' + layerFill(ink, 0.28) + '>' + clouds(r) + '</g>';
        break;
    }

    s += '</svg>';
    return s;
  }

  window.TRIP = window.TRIP || {};
  window.TRIP.scene = build;
  window.TRIP.setArtTheme = function (name) {
    THEME = name === 'light' ? 'light' : 'dark';
    PAL = THEME === 'light' ? PAL_LIGHT : PAL_DARK;
  };
  window.TRIP.sceneLabel = function (name) {
    return (SCENES[name] || SCENES.hero).label;
  };
})();
