/* =========================================================================
   China 2026 — logica de la aplicacion
   Sin dependencias externas. Todo el contenido viene de /data.
   ========================================================================= */
(function () {
  'use strict';

  var D = window.TRIP;
  var MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
                'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  /* --- micro helpers de DOM ------------------------------------------- */

  function h(tag, attrs, kids) {
    var e = document.createElement(tag), k, v;
    if (attrs) {
      for (k in attrs) {
        v = attrs[k];
        if (v === null || v === undefined || v === false) continue;
        if (k === 'class') e.className = v;
        else if (k === 'text') e.textContent = v;
        else if (k === 'html') e.innerHTML = v;
        else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
        else e.setAttribute(k, v === true ? '' : v);
      }
    }
    (kids || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return e;
  }

  function svg(paths, box) {
    var s = '<svg viewBox="' + (box || '0 0 24 24') + '" aria-hidden="true" focusable="false">' +
            paths + '</svg>';
    var w = document.createElement('span');
    w.innerHTML = s;
    return w.firstChild;
  }

  function sceneBox(name, key, photo, alt) {
    var box = h('div', { class: 'scene' });
    box.innerHTML = D.scene(name, key || name);
    if (photo) {
      var img = h('img', {
        class: 'scene-photo',
        src: photo,
        alt: alt || '',
        decoding: 'async'
      });
      img.onload = function () { box.classList.add('has-photo'); };
      img.onerror = function () {
        if (img.parentNode) img.parentNode.removeChild(img);
        if (window.console && console.warn) {
          console.warn('China 2026: no se pudo cargar la foto «' + photo +
            '». Comprueba la ruta, las mayúsculas y que el formato sea jpg, png o webp.');
        }
      };
      box.appendChild(img);
    }
    return box;
  }

  /* --- fechas ---------------------------------------------------------- */

  function d(iso) {
    var p = iso.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2], 12, 0, 0);
  }
  function dayNum(iso) { return d(iso).getDate(); }
  function monShort(iso) { return MONTHS[d(iso).getMonth()].toUpperCase(); }
  function short(iso) { return dayNum(iso) + ' ' + monShort(iso); }
  function longDate(iso) {
    var x = d(iso);
    return x.getDate() + ' de ' + MONTHS[x.getMonth()] + '.';
  }
  function span(a, b) {
    if (a === b) return short(a);
    return dayNum(a) + (monShort(a) === monShort(b) ? '' : ' ' + monShort(a)) +
           '–' + dayNum(b) + ' ' + monShort(b);
  }
  function today() {
    var n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate(), 12, 0, 0);
  }
  function daysBetween(a, b) { return Math.round((b - a) / 86400000); }

  function stamp(iso, hhmm) {
    var x = d(iso);
    var m = /^(\d{1,2}):(\d{2})/.exec(hhmm || '');
    if (m) x.setHours(+m[1], +m[2], 0, 0);
    else x.setHours(23, 59, 0, 0);
    return x;
  }

  /* --- estado ---------------------------------------------------------- */

  var state = { view: '', openDay: null, openDest: null, variant: {} };

  var CHECK_KEY = 'china2026.checklist';
  function readChecks() {
    try { return JSON.parse(localStorage.getItem(CHECK_KEY) || '{}'); }
    catch (e) { return {}; }
  }
  function writeChecks(o) {
    try { localStorage.setItem(CHECK_KEY, JSON.stringify(o)); } catch (e) { /* modo privado */ }
  }

  /* --- avisos efimeros -------------------------------------------------- */

  var toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) {
      toastEl = h('div', { class: 'toast', role: 'status', 'aria-live': 'polite' });
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2200);
  }

  /* --- enlaces de mapas ------------------------------------------------- */

  function isApple() {
    return /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent);
  }
  function mapsHref(q) {
    return isApple()
      ? 'https://maps.apple.com/?q=' + encodeURIComponent(q)
      : 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
  }
  function copy(txt) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(
        function () { toast('Dirección copiada'); },
        function () { toast('No se ha podido copiar'); }
      );
      return;
    }
    var t = h('textarea', { class: 'sr' });
    t.value = txt;
    t.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(t);
    t.select();
    try { document.execCommand('copy'); toast('Dirección copiada'); }
    catch (e) { toast('No se ha podido copiar'); }
    document.body.removeChild(t);
  }

  /* --- iconos ----------------------------------------------------------- */

  var ICON = {
    manana: '<path d="M12 5v3M5.6 10.6 7.7 12M18.4 10.6 16.3 12M3 18h18M6.5 18a5.5 5.5 0 0 1 11 0"/>',
    tarde: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"/>',
    noche: '<path d="M19 14.8A8 8 0 0 1 9.2 5a8 8 0 1 0 9.8 9.8Z"/>',
    vuelo: '<path d="M4 13.5 20 9l-1 3.6-4.6 1.3-2.6 5.6-1.7.5.8-5.2-3.4 1-1.2 2-1.3.4.5-2.6L4 13.5Z"/>',
    tren: '<rect x="6" y="3.5" width="12" height="13" rx="3"/><path d="M6 12h12M8.5 20l-1.5 1.5M15.5 20l1.5 1.5M8.5 16.5v3M15.5 16.5v3"/>',
    barco: '<path d="M4 15.5h16l-2.4 4.5H6.4L4 15.5ZM7 15.5V8h10v7.5M12 8V4.5"/>',
    bus: '<rect x="4" y="4" width="16" height="13" rx="3"/><path d="M4 12h16M7 21v-2M17 21v-2"/><circle cx="8" cy="14.6" r="1"/><circle cx="16" cy="14.6" r="1"/>',
    traslado: '<path d="M4 16.5h16M5.5 16.5V13l2-4.5h9l2 4.5v3.5M5.5 19.5v-3M18.5 19.5v-3"/><circle cx="8" cy="13.5" r="1"/><circle cx="16" cy="13.5" r="1"/>',
    link: '<path d="M9 15 15 9M10 7h5a2 2 0 0 1 2 2v5"/>'
  };

  var KIND_LABEL = {
    vuelo: 'Vuelo', tren: 'Tren bala', barco: 'Barco',
    bus: 'Bus', traslado: 'Traslado'
  };

  /* ===================================================================== */
  /* 1 · INICIO                                                            */
  /* ===================================================================== */

  function tripStatus() {
    var t = today(), a = d(D.trip.start), b = d(D.trip.end);
    if (t < a) {
      var n = daysBetween(t, a);
      return {
        k: 'Cuenta atrás',
        v: n === 1 ? 'Falta 1 día' : 'Faltan ' + n + ' días',
        note: 'Salimos el ' + longDate(D.trip.start) + ' ' + D.trip.cities +
              ' ciudades, ' + D.trip.nights + ' noches.',
        href: '#/itinerario'
      };
    }
    if (t > b) {
      return { k: 'El viaje', v: 'Se acabó', note: 'Queda el itinerario, por si hace falta recordar algo.', href: '#/itinerario' };
    }
    var i = D.itinerary.filter(function (x) { return x.date === iso(t); })[0];
    var num = daysBetween(a, t) + 1;
    return {
      k: 'Día ' + num + ' de ' + D.itinerary.length,
      v: i ? i.city : 'En ruta',
      note: i ? 'Duermes en ' + i.sleep + '.' : '',
      href: '#/itinerario',
      link: 'Ver el plan de hoy'
    };
  }

  function iso(x) {
    return x.getFullYear() + '-' + ('0' + (x.getMonth() + 1)).slice(-2) + '-' + ('0' + x.getDate()).slice(-2);
  }

  function nextTransport() {
    var now = new Date(), i, t;
    for (i = 0; i < D.transport.length; i++) {
      t = D.transport[i];
      if (stamp(t.date, t.depart) >= now) return t;
    }
    return null;
  }

  function viewInicio() {
    var frag = document.createDocumentFragment();
    var st = tripStatus();

    var hero = h('section', { class: 'hero' }, [
      sceneBox('hero', 'china-2026'),
      h('div', { class: 'hero-body' }, [
        h('p', { class: 'hero-cn han', text: D.trip.cn, 'aria-hidden': 'true' }),
        h('h1', { class: 'hero-title' }, ['China ', h('br'), '2026']),
        h('p', { class: 'hero-meta', text: span(D.trip.start, D.trip.end) + ' · ' + D.trip.tagline })
      ])
    ]);
    frag.appendChild(hero);

    frag.appendChild(h('section', { class: 'status' }, [
      h('p', { class: 'status-k', text: st.k }),
      h('p', { class: 'status-v', text: st.v }),
      st.note ? h('p', { class: 'status-note', text: st.note }) : null,
      h('a', { class: 'status-link', href: st.href }, [
        st.link || 'Ver el itinerario completo', svg(ICON.link)
      ])
    ]));

    var nt = nextTransport();
    if (nt) {
      frag.appendChild(h('div', { class: 'wrap', style: 'margin-top:18px' }, [
        h('a', { class: 'trip is-next', href: '#/transportes', style: 'text-decoration:none;color:inherit' }, [
          h('span', { class: 'trip-next' }, [
            'Próximo desplazamiento',
            h('em', { text: short(nt.date) })
          ]),
          h('div', { class: 'trip-icon' }, [svg(ICON[nt.kind] || ICON.traslado)]),
          h('div', {}, [
            h('div', { class: 'leg' }, [
              h('span', { class: 'leg-place', text: nt.from }),
              h('span', { class: 'leg-time' + (nt.depart ? '' : ' is-empty'), text: nt.depart || '—' })
            ]),
            h('div', { class: 'trip-arrow' }, [
              h('i'),
              h('span', { text: nt.duration || KIND_LABEL[nt.kind] || 'Trayecto' })
            ]),
            h('div', { class: 'leg' }, [
              h('span', { class: 'leg-place', text: nt.to }),
              h('span', { class: 'leg-time' + (nt.arrive ? '' : ' is-empty'), text: nt.arrive || '—' })
            ])
          ])
        ])
      ]));
    }

    frag.appendChild(h('div', { class: 'section-head' }, [
      h('h2', { text: 'Dónde estamos cada día' }),
      h('span', { text: D.trip.cities + ' ciudades' })
    ]));

    var t = today();
    var route = h('div', { class: 'route' });
    D.trip.route.forEach(function (r) {
      var now = t >= d(r.from) && t <= d(r.to);
      route.appendChild(h('a', {
        class: 'route-item' + (r.stop ? ' is-stop' : '') + (now ? ' is-now' : ''),
        href: '#/itinerario'
      }, [
        h('span', { class: 'route-when', text: span(r.from, r.to) }),
        h('span', { class: 'route-main' }, [
          h('span', { class: 'route-city' }, [
            r.label,
            r.cn ? h('span', { class: 'han', text: r.cn }) : null
          ]),
          h('span', { class: 'route-note', text: r.note })
        ])
      ]));
    });
    frag.appendChild(route);

    frag.appendChild(h('div', { class: 'home-links' }, [
      h('a', { class: 'btn', href: '#/hoteles', text: 'Hoteles' }),
      h('a', { class: 'btn', href: '#/info', text: 'Guía y avisos' })
    ]));

    return frag;
  }

  /* ===================================================================== */
  /* 2 · ITINERARIO                                                        */
  /* ===================================================================== */

  function partBlock(kind, label, block) {
    if (!block || (!block.summary && (!block.items || !block.items.length))) return null;
    var wrap = h('section', { class: 'part' }, [
      h('div', { class: 'part-head' }, [
        svg(ICON[kind]),
        h('h4', { text: label }),
        h('i')
      ])
    ]);
    if (block.summary) wrap.appendChild(h('p', { class: 'part-summary', text: block.summary }));
    (block.items || []).forEach(function (it) {
      wrap.appendChild(h('div', { class: 'slot' }, [
        h('span', { class: 'slot-t' + (it.t ? '' : ' is-empty'), text: it.t || '·' }),
        h('span', {}, [
          h('span', { class: 'slot-txt', text: it.text }),
          it.note ? h('p', { class: 'slot-note', text: it.note }) : null
        ])
      ]));
    });
    return wrap;
  }

  function dayPanel(day) {
    var panel = h('div', { class: 'day-panel', id: 'panel-' + day.date, role: 'region',
                           'aria-label': short(day.date) + ' ' + day.city });
    fillDay(day, panel);
    return panel;
  }

  function fillDay(day, panel) {
    panel.innerHTML = '';
    var src = day;

    if (day.alt) {
      var key = day.date;
      if (!state.variant[key]) state.variant[key] = 'base';
      var seg = h('div', { class: 'variant', role: 'group', 'aria-label': 'Versión del día' });
      [['base', 'Plan general'], ['alt', day.alt.label]].forEach(function (o) {
        seg.appendChild(h('button', {
          type: 'button',
          'aria-pressed': state.variant[key] === o[0] ? 'true' : 'false',
          text: o[1],
          onclick: function () {
            state.variant[key] = o[0];
            fillDay(day, panel);
          }
        }));
      });
      panel.appendChild(seg);
      if (state.variant[key] === 'alt') src = day.alt;
    }

    [['manana', 'Mañana', src.morning],
     ['tarde', 'Tarde', src.afternoon],
     ['noche', 'Noche', src.evening]].forEach(function (p) {
      var b = partBlock(p[0], p[1], p[2]);
      if (b) panel.appendChild(b);
    });

    if (day.sleep || day.transfers) {
      var facts = h('dl', { class: 'dayfacts' });
      if (day.sleep) {
        facts.appendChild(h('div', { class: 'dayfact' }, [
          h('dt', { text: 'Duermes en' }), h('dd', { text: day.sleep })
        ]));
      }
      if (day.transfers) {
        facts.appendChild(h('div', { class: 'dayfact' }, [
          h('dt', { text: 'Traslados' }), h('dd', { text: day.transfers })
        ]));
      }
      panel.appendChild(facts);
    }

    if ((day.remember && day.remember.length) || (day.bookings && day.bookings.length)) {
      var call = h('section', { class: 'callout' }, [h('h4', { text: 'Para recordar' })]);
      if (day.remember && day.remember.length) {
        var ul = h('ul');
        day.remember.forEach(function (r) { ul.appendChild(h('li', { text: r })); });
        call.appendChild(ul);
      }
      (day.bookings || []).forEach(function (b) {
        call.appendChild(h('div', { class: 'booking' }, [
          h('b', { text: b.name }),
          h('span', { text: b.where }),
          b.when ? h('em', { text: b.when }) : null
        ]));
      });
      panel.appendChild(call);
    }

    if (day.links && day.links.length) {
      var lr = h('div', { class: 'linkrow' });
      day.links.forEach(function (l) {
        lr.appendChild(h('a', {
          class: 'btn', href: l.url, target: '_blank', rel: 'noopener noreferrer'
        }, [l.label, svg(ICON.link)]));
      });
      panel.appendChild(lr);
    }
  }

  function viewItinerario() {
    var frag = document.createDocumentFragment();
    var list = h('div', { class: 'days' });
    var t = iso(today());

    D.itinerary.forEach(function (day) {
      var isToday = day.date === t;
      var card = h('article', { class: 'day' + (isToday ? ' is-today' : '') });
      var panel = null;

      var btn = h('button', {
        class: 'day-btn', type: 'button',
        'aria-expanded': 'false',
        'aria-controls': 'panel-' + day.date,
        onclick: function () { toggle(); }
      }, [
        h('span', { class: 'day-date' }, [
          h('span', { class: 'day-day', text: String(dayNum(day.date)) }),
          h('span', { class: 'day-mon', text: monShort(day.date) })
        ]),
        h('span', {}, [
          h('span', { class: 'day-city', text: day.city }),
          h('span', { class: 'day-sub' }, [
            day.weekday + (isToday ? ' · hoy' : ''),
            day.cn ? h('span', { class: 'han', text: day.cn }) : null
          ])
        ]),
        h('span', { class: 'plus', 'aria-hidden': 'true' })
      ]);

      function toggle() {
        var open = card.classList.contains('is-open');
        closeAll();
        if (open) { state.openDay = null; return; }
        panel = dayPanel(day);
        card.appendChild(panel);
        card.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
        state.openDay = day.date;
        setTimeout(function () {
          var top = card.getBoundingClientRect().top + window.scrollY - 68;
          window.scrollTo({ top: top, behavior: prefersReduced() ? 'auto' : 'smooth' });
        }, 30);
      }

      card.appendChild(h('h3', { class: 'row-h' }, [btn]));
      card._close = function () {
        card.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
        if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
        panel = null;
      };
      list.appendChild(card);
    });

    function closeAll() {
      Array.prototype.forEach.call(list.children, function (c) {
        if (c._close) c._close();
      });
    }

    frag.appendChild(h('div', { class: 'section-head' }, [
      h('h2', { text: 'Día a día' }),
      h('span', { text: D.itinerary.length + ' jornadas' })
    ]));
    frag.appendChild(list);
    return frag;
  }

  function prefersReduced() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ===================================================================== */
  /* 3 · HOTELES                                                           */
  /* ===================================================================== */

  function viewHoteles() {
    var frag = document.createDocumentFragment();
    frag.appendChild(h('div', { class: 'section-head' }, [
      h('h2', { text: 'Dónde dormimos' }),
      h('span', { text: D.trip.nights + ' noches' })
    ]));

    var cards = h('div', { class: 'cards' });
    D.hotels.forEach(function (ht) {
      var q = ht.addressCn || (ht.name + ', ' + ht.address);
      var body = h('div', { class: 'hotel-body' }, [
        h('p', { class: 'hotel-city' }, [
          ht.city,
          ht.cn ? h('span', { class: 'han', text: ht.cn }) : null
        ]),
        h('h3', { class: 'hotel-name', text: ht.name }),
        h('p', { class: 'hotel-dates' }, [
          h('span', { text: short(ht.checkIn) }),
          h('i'),
          h('span', { text: short(ht.checkOut) }),
          h('small', { text: ht.nights === 1 ? '1 noche' : ht.nights + ' noches' })
        ]),
        h('p', { class: 'hotel-addr' }, [
          ht.address,
          ht.addressCn ? h('span', { class: 'han', text: ht.addressCn }) : null
        ])
      ]);

      var chips = h('div', { class: 'chips' });
      if (ht.booked) chips.appendChild(h('span', { class: 'chip is-ok', text: 'Reservado' }));
      (ht.amenities || []).forEach(function (a) {
        chips.appendChild(h('span', { class: 'chip', text: a }));
      });
      if (chips.children.length) body.appendChild(chips);

      if (ht.flag) body.appendChild(h('p', { class: 'hotel-flag', text: ht.flag }));
      if (ht.area) body.appendChild(h('p', { class: 'hotel-addr', text: ht.area }));

      var acts = h('div', { class: 'hotel-actions' }, [
        h('a', { class: 'btn', href: mapsHref(q), target: '_blank', rel: 'noopener noreferrer', text: 'Cómo llegar' }),
        h('button', {
          class: 'btn', type: 'button', text: 'Copiar dirección',
          onclick: function () { copy(ht.addressCn ? ht.addressCn + ' — ' + ht.address : ht.address); }
        })
      ]);
      if (ht.link) {
        acts.appendChild(h('a', {
          class: 'btn wide', href: ht.link, target: '_blank', rel: 'noopener noreferrer'
        }, ['Ver en Trip.com', svg(ICON.link)]));
      }
      body.appendChild(acts);

      cards.appendChild(h('article', { class: 'hotel' }, [
        sceneBox(ht.scene, 'hotel-' + ht.city, ht.photo,
          ht.photo ? 'Foto del hotel en ' + ht.city : 'Ilustración de ' + ht.city),
        body
      ]));
    });

    frag.appendChild(cards);
    frag.appendChild(h('div', { class: 'foot' }, [
      h('p', { text: 'Las ilustraciones son propias: si añadís fotos reales en assets/photos, se usan en su lugar.' })
    ]));
    return frag;
  }

  /* ===================================================================== */
  /* 4 · TRANSPORTES                                                       */
  /* ===================================================================== */

  function viewTransportes() {
    var frag = document.createDocumentFragment();
    frag.appendChild(h('div', { class: 'section-head' }, [
      h('h2', { text: 'Todos los desplazamientos' }),
      h('span', { text: D.transport.length + ' trayectos' })
    ]));

    var nt = nextTransport();
    var wrap = h('div', { class: 'wrap' });
    var lastDate = null;

    D.transport.forEach(function (t, i) {
      if (t.date !== lastDate) {
        lastDate = t.date;
        wrap.appendChild(h('div', { class: 'tdate' }, [
          h('h3', { text: short(t.date) }),
          h('i')
        ]));
      }

      var meta = [];
      if (t.duration) meta.push(t.duration);
      if (t.operator) meta.push(t.operator);

      var card = h('article', { class: 'trip' + (t === nt ? ' is-next' : '') }, [
        t === nt ? h('span', { class: 'trip-next', text: 'Próximo' }) : null,
        h('div', { class: 'trip-icon' }, [svg(ICON[t.kind] || ICON.traslado)]),
        h('div', {}, [
          h('div', { class: 'leg' }, [
            h('span', { class: 'leg-place', text: t.from }),
            h('span', { class: 'leg-time' + (t.depart ? '' : ' is-empty'), text: t.depart || '—' })
          ]),
          h('div', { class: 'trip-arrow' }, [
            h('i'),
            h('span', { text: KIND_LABEL[t.kind] || 'Trayecto' })
          ]),
          h('div', { class: 'leg' }, [
            h('span', { class: 'leg-place', text: t.to }),
            h('span', { class: 'leg-time' + (t.arrive ? '' : ' is-empty'), text: t.arrive || '—' })
          ]),
          (meta.length || t.note) ? h('p', { class: 'trip-meta' }, [
            meta.length ? h('b', { text: meta.join(' · ') }) : null,
            t.note ? h('span', { text: (meta.length ? ' — ' : '') + t.note }) : null
          ]) : null
        ])
      ]);
      wrap.appendChild(card);
    });

    frag.appendChild(wrap);
    frag.appendChild(h('div', { class: 'foot' }, [
      h('p', { text: 'En los trenes chinos el pasaporte es el billete: se pasa directamente por el torno.' })
    ]));
    return frag;
  }

  /* ===================================================================== */
  /* 5 · MÁS INFO                                                          */
  /* ===================================================================== */

  function accordion(group, id, title, meta, buildPanel) {
    var card = h('article', { class: 'acc' });
    var panel = null;
    var btn = h('button', {
      class: 'acc-btn', type: 'button',
      'aria-expanded': 'false', 'aria-controls': 'acc-' + id,
      onclick: function () {
        var open = card.classList.contains('is-open');
        group.forEach(function (c) { if (c._close) c._close(); });
        if (open) return;
        panel = buildPanel();
        panel.id = 'acc-' + id;
        card.appendChild(panel);
        card.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
        setTimeout(function () {
          var top = card.getBoundingClientRect().top + window.scrollY - 68;
          window.scrollTo({ top: top, behavior: prefersReduced() ? 'auto' : 'smooth' });
        }, 30);
      }
    }, [
      h('span', { class: 'txt' }, [
        h('span', { class: 'name', text: title }),
        meta ? h('span', { class: 'meta', html: meta }) : null
      ]),
      h('span', { class: 'plus', 'aria-hidden': 'true' })
    ]);
    card.appendChild(h('h3', { class: 'row-h' }, [btn]));
    group.push(card);
    card._close = function () {
      card.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
      panel = null;
    };
    return card;
  }

  function guidePanel(dest) {
    var p = h('div', { class: 'acc-panel guide' });
    p.appendChild(sceneBox(dest.scene, 'dest-' + dest.id, dest.photo || '',
      dest.photo ? 'Foto de ' + dest.name : 'Ilustración de ' + dest.name));

    p.appendChild(h('h4', { text: 'Sobre la ciudad' }));
    dest.about.forEach(function (t) { p.appendChild(h('p', { text: t })); });

    p.appendChild(h('h4', { text: 'Qué ver' }));
    var ul = h('ul');
    dest.see.forEach(function (t) { ul.appendChild(h('li', { text: t })); });
    p.appendChild(ul);

    p.appendChild(h('h4', { text: 'Datos curiosos' }));
    var ol = h('ol');
    dest.facts.forEach(function (t) { ol.appendChild(h('li', { text: t })); });
    p.appendChild(ol);

    p.appendChild(h('h4', { text: 'Gastronomía' }));
    var uf = h('ul');
    dest.food.forEach(function (t) { uf.appendChild(h('li', { text: t })); });
    p.appendChild(uf);

    p.appendChild(h('h4', { text: 'Consejos' }));
    var ut = h('ul');
    dest.tips.forEach(function (t) { ut.appendChild(h('li', { text: t })); });
    p.appendChild(ut);

    return p;
  }

  function checklistPanel() {
    var p = h('div', { class: 'acc-panel' });
    var checks = readChecks();
    var total = 0, done = 0;

    D.checklist.groups.forEach(function (g) {
      g.items.forEach(function (it) { total++; if (checks[it.id]) done++; });
    });

    var prog = h('p', { class: 'check-progress', text: done + ' de ' + total + ' hechas' });
    p.appendChild(prog);

    function refresh() {
      var c = readChecks(), n = 0;
      D.checklist.groups.forEach(function (g) {
        g.items.forEach(function (it) { if (c[it.id]) n++; });
      });
      prog.textContent = n + ' de ' + total + ' hechas';
    }

    D.checklist.groups.forEach(function (g) {
      var box = h('section', { class: 'check-group' }, [
        h('h5', { class: 'check-when', text: g.when })
      ]);
      g.items.forEach(function (it) {
        var b = h('button', {
          class: 'check', type: 'button',
          'aria-pressed': checks[it.id] ? 'true' : 'false',
          onclick: function () {
            var c = readChecks();
            c[it.id] = !c[it.id];
            if (!c[it.id]) delete c[it.id];
            writeChecks(c);
            b.setAttribute('aria-pressed', c[it.id] ? 'true' : 'false');
            refresh();
          }
        }, [
          h('span', { class: 'check-box', 'aria-hidden': 'true' }),
          h('span', {}, [
            h('span', { class: 'check-txt', text: it.text }),
            it.note ? h('span', { class: 'check-note', text: it.note }) : null
          ])
        ]);
        box.appendChild(b);
      });
      p.appendChild(box);
    });

    return p;
  }

  function warningsPanel() {
    var p = h('div', { class: 'acc-panel' });
    D.checklist.warnings.forEach(function (w) {
      p.appendChild(h('div', { class: 'warn' }, [
        h('b', { text: w.city }),
        h('span', { text: w.text })
      ]));
    });
    return p;
  }

  function viewInfo() {
    var frag = document.createDocumentFragment();

    frag.appendChild(h('div', { class: 'section-head' }, [
      h('h2', { text: 'Preparativos' }),
      h('span', { text: 'Antes de salir' })
    ]));
    var group = [];
    var prep = h('div', { class: 'wrap' });
    prep.appendChild(accordion(group, 'checklist', 'Antes de salir',
      'Todo lo que hay que reservar y preparar', checklistPanel));
    prep.appendChild(accordion(group, 'avisos', 'Avisos que no conviene olvidar',
      D.checklist.warnings.length + ' cosas aprendidas por las malas', warningsPanel));
    frag.appendChild(prep);

    frag.appendChild(h('div', { class: 'section-head' }, [
      h('h2', { text: 'Los destinos' }),
      h('span', { text: D.destinations.length + ' paradas' })
    ]));
    var dest = h('div', { class: 'wrap' });
    D.destinations.forEach(function (x) {
      dest.appendChild(accordion(group, x.id, x.name,
        '<span class="han">' + x.cn + '</span>' + x.days,
        function () { return guidePanel(x); }));
    });
    frag.appendChild(dest);

    var theme = readTheme();
    frag.appendChild(h('div', { class: 'setting' }, [
      h('span', { class: 'setting-k', text: 'Aspecto' }),
      h('div', { class: 'variant', role: 'group', 'aria-label': 'Aspecto de la aplicación' }, [
        h('button', {
          type: 'button', text: 'Oscuro',
          'aria-pressed': theme === 'dark' ? 'true' : 'false',
          onclick: function () { setTheme('dark'); }
        }),
        h('button', {
          type: 'button', text: 'Claro',
          'aria-pressed': theme === 'light' ? 'true' : 'false',
          onclick: function () { setTheme('light'); }
        })
      ])
    ]));

    frag.appendChild(h('div', { class: 'setting' }, [
      h('span', { class: 'setting-k', text: 'Datos' }),
      h('button', {
        class: 'btn', type: 'button', text: 'Recargar del servidor',
        onclick: function (ev) {
          var b = ev.currentTarget;
          b.disabled = true;
          b.textContent = 'Actualizando…';
          var jobs = [];
          if (window.caches && caches.keys) {
            jobs.push(caches.keys().then(function (ks) {
              return Promise.all(ks.map(function (k) { return caches.delete(k); }));
            }));
          }
          if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
            jobs.push(navigator.serviceWorker.getRegistrations().then(function (rs) {
              return Promise.all(rs.map(function (r) { return r.unregister(); }));
            }));
          }
          Promise.all(jobs)['catch'](function () { /* da igual */ })
            .then(function () { location.reload(); });
        }
      })
    ]));

    frag.appendChild(h('div', { class: 'foot' }, [
      h('p', { text: 'Esta app no guarda ningún dato personal ni económico del viaje. La contraseña solo evita que entre cualquiera con el enlace.' }),
      h('button', {
        class: 'btn', type: 'button', text: 'Cerrar sesión',
        onclick: function () {
          try { sessionStorage.removeItem(AUTH); } catch (e) { /* nada */ }
          location.reload();
        }
      })
    ]));

    return frag;
  }

  /* ===================================================================== */
  /* Router                                                                */
  /* ===================================================================== */

  var VIEWS = {
    inicio: { title: '', build: viewInicio },
    itinerario: { title: 'Itinerario', build: viewItinerario },
    hoteles: { title: 'Hoteles', build: viewHoteles },
    transportes: { title: 'Transportes', build: viewTransportes },
    info: { title: 'Más info', build: viewInfo }
  };

  function route() {
    var name = (location.hash || '').replace(/^#\/?/, '') || 'inicio';
    if (!VIEWS[name]) name = 'inicio';
    if (name === state.view) return;
    state.view = name;

    var view = document.getElementById('view');
    var bar = document.getElementById('topbar');
    view.innerHTML = '';
    view.appendChild(VIEWS[name].build());

    if (VIEWS[name].title) {
      document.getElementById('topbar-title').textContent = VIEWS[name].title;
      bar.hidden = false;
    } else {
      bar.hidden = true;
    }

    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (a) {
      if (a.getAttribute('data-tab') === name) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    window.scrollTo(0, 0);
  }

  /* ===================================================================== */
  /* Acceso                                                                */
  /* ===================================================================== */

  var THEME_KEY = 'china2026.theme';

  function readTheme() {
    try {
      var t = localStorage.getItem(THEME_KEY);
      if (t === 'light' || t === 'dark') return t;
    } catch (e) { /* nada */ }
    return 'dark';
  }

  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    if (D.setArtTheme) D.setArtTheme(t);
    var m = document.getElementById('theme-color');
    if (m) m.setAttribute('content', t === 'light' ? '#EFEBE2' : '#100F0E');
  }

  function setTheme(t) {
    applyTheme(t);
    try { localStorage.setItem(THEME_KEY, t); } catch (e) { /* nada */ }
    var y = window.scrollY;
    route();
    window.scrollTo(0, y);
  }

  var AUTH = 'china2026.auth';
  var HASH = 'be084b418d82bcde2d0eec92563c3f037639dfae8e1d9df9b730469987d2527b';

  function unlock() {
    var gate = document.getElementById('gate');
    var app = document.getElementById('app');
    if (!app || !app.hidden) return;
    if (gate && gate.parentNode) gate.parentNode.removeChild(gate);
    app.hidden = false;
    route();
    window.addEventListener('hashchange', route);
  }

  function boot() {
    applyTheme(readTheme());
    var authed = false;
    try { authed = sessionStorage.getItem(AUTH) === HASH; } catch (e) { authed = false; }

    if (authed) { unlock(); return; }

    var art = document.getElementById('gate-art');
    art.innerHTML = D.scene('hero', 'acceso');

    var form = document.getElementById('gate-form');
    var input = document.getElementById('gate-pass');
    var err = document.getElementById('gate-error');

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var digest = D.sha256(input.value.trim().toLowerCase());
      input.value = '';
      if (digest === HASH) {
        try { sessionStorage.setItem(AUTH, HASH); } catch (e) { /* modo privado */ }
        unlock();
      } else {
        err.hidden = false;
        input.focus();
      }
    });
    input.addEventListener('input', function () { err.hidden = true; });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* servicio offline: util cuando la conexion en China falla */
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* sin offline */ });
    });
  }
})();
