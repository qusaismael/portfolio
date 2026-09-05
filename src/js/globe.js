/* Optional 3D globe; the destination list also works without a graphics context. */
(async () => {

    // --- Globe Configuration: Visited & Bucket Destinations ---
    const locationFrom = el => ({ id:el.dataset.id, name:el.dataset.city, country:el.dataset.country, flag:el.dataset.flag || '', lat:Number(el.dataset.lat), lon:Number(el.dataset.lon), size:0.06, desc:el.dataset.desc });
    const visitedLocations = [...document.querySelectorAll('.globe-chip')].map(locationFrom);
    const bucketLocations = [...document.querySelectorAll('.globe-bucket-trigger')].map(locationFrom);
    let useWebGL = false;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let redraw = () => {};


    function coordsToAngles(lat, lon) {
      if (!useWebGL) {
        return {
          phi: -(lon * Math.PI / 180),
          theta: Math.max(-0.6, Math.min(0.6, (lat * Math.PI / 180)))
        };
      }
      const phi = ((180 - lon) * Math.PI) / 180 - Math.PI / 2;
      const theta = (lat * Math.PI) / 180 * 0.7;
      return { phi, theta };
    }

    let initialJordanAngles = coordsToAngles(31.9566, 35.9457);
    let phi = initialJordanAngles.phi;
    let theta = initialJordanAngles.theta;
    let targetPhi = phi;
    let targetTheta = theta;
    let isDragging = false;
    let isFocusing = false;
    let autoSpin = false;
    let startX = 0;
    let startY = 0;
    let pressX = 0;
    let pressY = 0;
    let velocityPhi = 0;

    let canvas = document.getElementById('cobe-globe-canvas');
    if (!canvas) { console.error('[Globe] Canvas not found'); }

    let globeInstance = null;
    let activePin = 'amman';

    // --- GeoJSON Dynamic Pipeline & 3D Orthographic Projection ---
    let geoJsonBorders = [];
    let isGeoJsonLoading = false;

    function extractBordersFromGeoJson(geojson) {
      const paths = [];
      if (!geojson) return paths;

      function addRing(ring) {
        if (Array.isArray(ring) && ring.length > 1) {
          const validPoints = [];
          for (let i = 0; i < ring.length; i++) {
            const pt = ring[i];
            if (Array.isArray(pt) && pt.length >= 2 && typeof pt[0] === 'number' && typeof pt[1] === 'number') {
              validPoints.push([pt[0] * Math.PI / 180, pt[1] * Math.PI / 180]);
            }
          }
          if (validPoints.length > 1) {
            paths.push(validPoints);
          }
        }
      }

      function processGeom(g) {
        if (!g || !g.type) return;
        if (g.type === 'GeometryCollection' && Array.isArray(g.geometries)) {
          g.geometries.forEach(processGeom);
          return;
        }
        if (!g.coordinates) return;
        if (g.type === 'Polygon') {
          g.coordinates.forEach(addRing);
        } else if (g.type === 'MultiPolygon') {
          g.coordinates.forEach(poly => {
            if (Array.isArray(poly)) poly.forEach(addRing);
          });
        } else if (g.type === 'LineString') {
          addRing(g.coordinates);
        } else if (g.type === 'MultiLineString') {
          g.coordinates.forEach(addRing);
        }
      }

      if (geojson.type === 'FeatureCollection' && Array.isArray(geojson.features)) {
        geojson.features.forEach(f => {
          if (f && f.geometry) processGeom(f.geometry);
        });
      } else if (geojson.type === 'Feature') {
        if (geojson.geometry) processGeom(geojson.geometry);
      } else {
        processGeom(geojson);
      }
      return paths;
    }

    function getFallbackLandmassRings() {
      const degRings = [
        // Africa
        [[-17, 14], [-15, 28], [-5, 36], [10, 37], [25, 32], [32, 31], [34, 27], [43, 12], [51, 12], [40, -10], [32, -28], [18, -35], [12, -15], [9, 4], [-17, 14]],
        // Europe & Middle East
        [[-9, 36], [-9, 43], [-4, 48], [2, 51], [8, 54], [14, 54], [24, 58], [30, 60], [38, 55], [48, 46], [40, 41], [28, 41], [26, 38], [35, 32], [34, 28], [40, 37], [48, 30], [56, 26], [60, 22], [54, 16], [44, 13], [35, 27], [26, 38], [-9, 36]],
        // Asia & Siberia
        [[38, 55], [50, 55], [60, 68], [100, 75], [140, 70], [170, 66], [170, 60], [140, 50], [130, 42], [120, 38], [120, 22], [105, 10], [90, 22], [80, 13], [70, 22], [60, 25], [48, 46], [38, 55]],
        // Japan
        [[130, 32], [132, 34], [140, 40], [145, 44], [141, 43], [136, 36], [130, 32]],
        // UK & Ireland
        [[-10, 52], [-5, 50], [1, 51], [2, 53], [-2, 58], [-6, 58], [-10, 52]],
        // North America
        [[-168, 65], [-140, 70], [-100, 70], [-60, 60], [-65, 45], [-75, 35], [-80, 25], [-97, 20], [-105, 20], [-120, 34], [-125, 48], [-168, 65]],
        // South America
        [[-80, 8], [-60, 10], [-35, -5], [-38, -13], [-55, -35], [-68, -55], [-75, -45], [-70, -20], [-80, 8]],
        // Australia
        [[114, -22], [123, -15], [136, -12], [142, -10], [150, -23], [153, -28], [148, -38], [138, -35], [115, -34], [114, -22]]
      ];
      return degRings.map(ring => ring.map(([lon, lat]) => [lon * Math.PI / 180, lat * Math.PI / 180]));
    }

    // Pre-populate with fallback landmass rings so immediate rendering is crisp
    geoJsonBorders = getFallbackLandmassRings();

    async function loadWorldGeoJson() {
      if (isGeoJsonLoading) return;
      isGeoJsonLoading = true;

      if (window.__GEOJSON_WORLD_CACHE__ && Array.isArray(window.__GEOJSON_WORLD_CACHE__) && window.__GEOJSON_WORLD_CACHE__.length > 0) {
        geoJsonBorders = window.__GEOJSON_WORLD_CACHE__;
        isGeoJsonLoading = false;
        return;
      }

      try {
        const cached = sessionStorage.getItem('portfolio_geojson_world_110m');
        if (cached) {
          const parsed = JSON.parse(cached);
          const extracted = extractBordersFromGeoJson(parsed);
          if (extracted && extracted.length > 0) {
            geoJsonBorders = extracted;
            window.__GEOJSON_WORLD_CACHE__ = extracted;
            isGeoJsonLoading = false;
            return;
          }
        }
      } catch (_) { }

      const CDNS = ['/js/land-110m.geo.json']; // Local public-domain outlines; no third-party requests.

      for (const url of CDNS) {
        try {
          const res = await fetch(url, { mode: 'cors' });
          if (res.ok) {
            const data = await res.json();
            const extracted = extractBordersFromGeoJson(data);
            if (extracted && extracted.length > 0) {
              geoJsonBorders = extracted;
              window.__GEOJSON_WORLD_CACHE__ = extracted;
              try {
                sessionStorage.setItem('portfolio_geojson_world_110m', JSON.stringify(data));
              } catch (_) { }
              isGeoJsonLoading = false;
              redraw();
              return;
            }
          }
        } catch (e) {
          // Try next CDN in cascade
        }
      }
      isGeoJsonLoading = false;
    }

    // Trigger asynchronous GeoJSON prefetching
    loadWorldGeoJson();

    function projectPoint(latRad, lonRad, phi, theta) {
      const rotLon = lonRad + phi;
      const x1 = Math.cos(latRad) * Math.sin(rotLon);
      const y1 = Math.sin(latRad);
      const z1 = Math.cos(latRad) * Math.cos(rotLon);

      const x2 = x1;
      const y2 = y1 * Math.cos(theta) - z1 * Math.sin(theta);
      const z2 = y1 * Math.sin(theta) + z1 * Math.cos(theta);

      return { x: x2, y: y2, z: z2, visible: z2 > 0 };
    }

    // Quick WebGL support check
    function hasWebGL() {
      try {
        const c = document.createElement('canvas');
        return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
      } catch (e) { return false; }
    }

    const forceCanvas = (typeof window !== 'undefined' && window.__FORCE_CANVAS_2D__) ||
      (typeof location !== 'undefined' && new URLSearchParams(location.search).has('canvas2d'));

    // --- Try WebGL COBE ---
    if (canvas && hasWebGL() && !forceCanvas) {
      try {
        const { default:createGlobe } = await import('/js/cobe.mjs');
        if (createGlobe) {
          const markers = [
            ...visitedLocations.map(loc => ({ location: [loc.lat, loc.lon], size: loc.size })),
            ...bucketLocations.map(loc => ({ location: [loc.lat, loc.lon], size: loc.size }))
          ];
          const wrapper = canvas.parentElement;
          const width = (wrapper ? wrapper.clientWidth : 400) || 400;
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          canvas.width = width * dpr;
          canvas.height = width * dpr;
          const isLight = document.documentElement.dataset.theme === 'light';
          globeInstance = createGlobe(canvas, {
            devicePixelRatio: dpr, width: width * dpr, height: width * dpr,
            phi, theta, dark: isLight ? 0 : 1, diffuse: 1.3,
            mapSamples: 14000, mapBrightness: isLight ? 4.0 : 5.5,
            baseColor: isLight ? [0.88, 0.84, 0.78] : [0.18, 0.09, 0.07],
            markerColor: isLight ? [0.42, 0.27, 0.14] : [0.29, 0.87, 0.50],
            glowColor: isLight ? [0.92, 0.88, 0.82] : [0.45, 0.35, 0.22],
            markers,
            onRender: (state) => {
              if (isFocusing && motion.matches) { phi = targetPhi; theta = targetTheta; isFocusing = false; }
              if (isFocusing) {
                phi += (targetPhi - phi) * 0.08;
                theta += (targetTheta - theta) * 0.08;
                if (Math.abs(targetPhi - phi) < 0.001 && Math.abs(targetTheta - theta) < 0.001) isFocusing = false;
              } else if (!isDragging && autoSpin && !motion.matches && !document.hidden) {
                velocityPhi *= 0.92;
                phi += velocityPhi + 0.003;
              }
              state.phi = phi; state.theta = theta;
              const light = document.documentElement.dataset.theme === 'light';
              state.dark = light ? 0 : 1;
              state.baseColor = light ? [0.88,0.84,0.78] : [0.18,0.09,0.07];
              const size = canvas.parentElement.clientWidth * dpr;
              state.width = size; state.height = size;
            }
          });
          useWebGL = true;
          initialJordanAngles = coordsToAngles(31.9566, 35.9457);
          phi = targetPhi = initialJordanAngles.phi;
          theta = targetTheta = initialJordanAngles.theta;
          console.log('[Globe] WebGL COBE globe initialized');
        }
      } catch (err) {
        console.warn('[Globe] WebGL failed:', err);
      }
    }

    // --- Canvas 2D Fallback Globe (High-Resolution GeoJSON + Dual Category Markers) ---
    if (canvas && !useWebGL) {
      console.log('[Globe] Using High-Resolution Canvas 2D fallback globe');
      // A canvas cannot switch context types after a failed WebGL initialization.
      const fresh = canvas.cloneNode(true);
      canvas.replaceWith(fresh);
      canvas = fresh;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        canvas.hidden = true;
        document.querySelector('.globe-drag-hint').textContent = 'The globe is unavailable in this browser. You can still explore every place using the buttons.';
        document.querySelectorAll('.globe-mini-btn').forEach(button => { button.hidden = true; });
      }

      let animId = null;
      let isVisible = true;

      function getColors() {
        const isLight = document.documentElement.dataset.theme === 'light';
        return isLight ? {
          ocean: ['#E6E0D6', '#D0C8BB', '#B5AC9D'],
          grid: 'rgba(90, 70, 50, 0.14)',
          border: 'rgba(60, 50, 40, 0.35)',
          pin: '#16A34A',
          pinGlow: 'rgba(22, 163, 74, 0.45)',
          bucketPin: '#0284C7',
          bucketGlow: 'rgba(2, 132, 199, 0.45)',
          activePin: '#D97706',
          activePinGlow: 'rgba(217, 119, 6, 0.75)',
          rim: 'rgba(90, 70, 50, 0.30)'
        } : {
          ocean: ['#0A192F', '#060D1A', '#020617'],
          grid: 'rgba(0, 229, 255, 0.12)',
          border: 'rgba(0, 255, 157, 0.38)',
          pin: '#00FF9D',
          pinGlow: 'rgba(0, 255, 157, 0.55)',
          bucketPin: '#00E5FF',
          bucketGlow: 'rgba(0, 229, 255, 0.55)',
          activePin: '#FFB703',
          activePinGlow: 'rgba(255, 183, 3, 0.85)',
          rim: 'rgba(0, 255, 157, 0.25)'
        };
      }

      function drawDiamond(x, y, s) {
        ctx.beginPath();
        ctx.moveTo(x, y - s);
        ctx.lineTo(x + s, y);
        ctx.lineTo(x, y + s);
        ctx.lineTo(x - s, y);
        ctx.closePath();
      }

      function draw() {
        if (!ctx || !isVisible || document.hidden) return;
        cancelAnimationFrame(animId);
        const wrapper = canvas.parentElement;
        const cssSize = (wrapper ? wrapper.clientWidth : 400) || 400;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = cssSize * dpr;
        if (canvas.width !== w || canvas.height !== w) {
          canvas.width = w; canvas.height = w;
          canvas.style.width = cssSize + 'px';
          canvas.style.height = cssSize + 'px';
        }
        const cx = w / 2, cy = w / 2, r = (w / 2) - (12 * dpr);
        const colors = getColors();
        ctx.clearRect(0, 0, w, w);

        // 1. Ocean Sphere Background Gradient
        const oceanGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 2, cx, cy, r);
        oceanGrad.addColorStop(0, colors.ocean[0]);
        oceanGrad.addColorStop(0.7, colors.ocean[1]);
        oceanGrad.addColorStop(1, colors.ocean[2]);
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = oceanGrad; ctx.fill();

        // 2. Circular Stencil Clip for clean spherical bounds
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.clip();

        // 3. Graticule Lines (Latitude & Longitude)
        ctx.strokeStyle = colors.grid;
        ctx.lineWidth = 1 * dpr;
        for (let lat = -60; lat <= 60; lat += 30) {
          const latRad = (lat * Math.PI) / 180;
          ctx.beginPath();
          let first = true;
          for (let lon = -180; lon <= 180; lon += 5) {
            const p = projectPoint(latRad, (lon * Math.PI) / 180, phi, theta);
            if (p.z > 0) {
              const sx = cx + r * p.x, sy = cy - r * p.y;
              if (first) { ctx.moveTo(sx, sy); first = false; }
              else { ctx.lineTo(sx, sy); }
            } else {
              first = true;
            }
          }
          ctx.stroke();
        }

        for (let lon = 0; lon < 180; lon += 30) {
          const lonRad = (lon * Math.PI) / 180;
          ctx.beginPath();
          let first = true;
          for (let lat = -85; lat <= 85; lat += 5) {
            const p = projectPoint((lat * Math.PI) / 180, lonRad, phi, theta);
            if (p.z > 0) {
              const sx = cx + r * p.x, sy = cy - r * p.y;
              if (first) { ctx.moveTo(sx, sy); first = false; }
              else { ctx.lineTo(sx, sy); }
            } else {
              first = true;
            }
          }
          ctx.stroke();
        }

        // 4. GeoJSON High-Resolution Country Borders
        if (geoJsonBorders && geoJsonBorders.length > 0) {
          ctx.strokeStyle = colors.border;
          ctx.lineWidth = 1.1 * dpr;
          ctx.beginPath();
          for (let b = 0; b < geoJsonBorders.length; b++) {
            const ring = geoJsonBorders[b];
            if (!ring || ring.length < 2) continue;
            let prevVisible = false;
            let prevP = null;

            for (let i = 0; i < ring.length; i++) {
              const [lonRad, latRad] = ring[i];
              const p = projectPoint(latRad, lonRad, phi, theta);
              const isVis = p.z >= 0;

              if (isVis) {
                const sx = cx + r * p.x, sy = cy - r * p.y;
                if (!prevVisible) {
                  if (prevP) {
                    const t = prevP.z / (prevP.z - p.z);
                    const cxClip = prevP.x + t * (p.x - prevP.x);
                    const cyClip = prevP.y + t * (p.y - prevP.y);
                    ctx.moveTo(cx + r * cxClip, cy - r * cyClip);
                    ctx.lineTo(sx, sy);
                  } else {
                    ctx.moveTo(sx, sy);
                  }
                } else {
                  ctx.lineTo(sx, sy);
                }
                prevVisible = true;
              } else {
                if (prevVisible && prevP) {
                  const t = prevP.z / (prevP.z - p.z);
                  const cxClip = prevP.x + t * (p.x - prevP.x);
                  const cyClip = prevP.y + t * (p.y - prevP.y);
                  ctx.lineTo(cx + r * cxClip, cy - r * cyClip);
                }
                prevVisible = false;
              }
              prevP = p;
            }
          }
          ctx.stroke();
        }

        // 5. Visited Location Pins (10 Circular Radar Beacons)
        visitedLocations.forEach((loc) => {
          const p = projectPoint((loc.lat * Math.PI) / 180, (loc.lon * Math.PI) / 180, phi, theta);
          if (p.z > -0.1) {
            const depth = Math.max(0.18, (p.z + 0.1) / 1.1);
            const px = cx + r * p.x, py = cy - r * p.y;
            const isAct = activePin === loc.id;
            const pinR = (isAct ? 6.5 : 4.2) * dpr * depth;
            const coreR = (isAct ? 3.8 : 2.2) * dpr * depth;

            // Glow Halo
            const glow = ctx.createRadialGradient(px, py, 0, px, py, pinR * 2.6);
            glow.addColorStop(0, isAct ? colors.activePinGlow : colors.pinGlow);
            glow.addColorStop(1, 'transparent');
            ctx.globalAlpha = depth;
            ctx.beginPath(); ctx.arc(px, py, pinR * 2.6, 0, Math.PI * 2); ctx.fillStyle = glow; ctx.fill();

            // Outer Ring
            ctx.beginPath(); ctx.arc(px, py, pinR, 0, Math.PI * 2); ctx.fillStyle = isAct ? colors.activePinGlow : colors.pinGlow; ctx.fill();

            // Core Luminous Dot
            ctx.beginPath(); ctx.arc(px, py, coreR, 0, Math.PI * 2); ctx.fillStyle = isAct ? colors.activePin : colors.pin; ctx.fill();
            ctx.globalAlpha = 1.0;
          }
        });

        // 6. Bucket List Pins (8 Cyan Diamond Blips)
        bucketLocations.forEach((loc) => {
          const p = projectPoint((loc.lat * Math.PI) / 180, (loc.lon * Math.PI) / 180, phi, theta);
          if (p.z > -0.1) {
            const depth = Math.max(0.18, (p.z + 0.1) / 1.1);
            const px = cx + r * p.x, py = cy - r * p.y;
            const isAct = activePin === loc.id;
            const pinR = (isAct ? 6.5 : 4.5) * dpr * depth;
            const coreR = (isAct ? 4.0 : 2.5) * dpr * depth;

            // Diamond Glow Halo
            ctx.globalAlpha = depth * 0.75;
            drawDiamond(px, py, pinR * 2.0);
            ctx.fillStyle = isAct ? colors.activePinGlow : colors.bucketGlow;
            ctx.fill();

            // Diamond Core
            ctx.globalAlpha = depth;
            drawDiamond(px, py, coreR);
            ctx.fillStyle = isAct ? colors.activePin : colors.bucketPin;
            ctx.fill();
            ctx.globalAlpha = 1.0;
          }
        });

        // Restore Stencil Clip
        ctx.restore();

        // 7. Atmosphere Rim Glow & Specular Highlight
        const rimGrad = ctx.createRadialGradient(cx, cy, r * 0.92, cx, cy, r * 1.06);
        rimGrad.addColorStop(0, 'transparent');
        rimGrad.addColorStop(0.5, colors.rim);
        rimGrad.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.arc(cx, cy, r * 1.03, 0, Math.PI * 2); ctx.strokeStyle = rimGrad; ctx.lineWidth = 3 * dpr; ctx.stroke();

        const specGrad = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, 0, cx - r * 0.35, cy - r * 0.35, r * 0.6);
        specGrad.addColorStop(0, 'rgba(255,255,255,0.08)');
        specGrad.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = specGrad; ctx.fill();

        // 8. Physics & Camera Lerp
        if (isFocusing && motion.matches) { phi = targetPhi; theta = targetTheta; isFocusing = false; }
        if (isFocusing) {
          phi += (targetPhi - phi) * 0.08;
          theta += (targetTheta - theta) * 0.08;
          if (Math.abs(targetPhi - phi) < 0.001 && Math.abs(targetTheta - theta) < 0.001) isFocusing = false;
        } else if (!isDragging && autoSpin) {
          velocityPhi *= 0.92;
          phi += velocityPhi + 0.003;
        }
        if (!motion.matches && (autoSpin || isFocusing || isDragging)) animId = requestAnimationFrame(draw);
      }

      // Visibility optimization
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            isVisible = entry.isIntersecting;
            if (isVisible) { cancelAnimationFrame(animId); animId = requestAnimationFrame(draw); }
          });
        }, { threshold: 0.05 }).observe(canvas);
      }

      redraw = draw;
      new ResizeObserver(draw).observe(canvas.parentElement);
      new MutationObserver(draw).observe(document.documentElement, {attributes:true,attributeFilter:['data-theme']});
      document.addEventListener('visibilitychange', draw);
      draw();
    }

    // --- Shared Interaction Code ---
    if (canvas) {
      canvas.addEventListener('pointerdown', (e) => {
        isDragging = true; isFocusing = false;
        startX = e.clientX; startY = e.clientY;
        pressX = e.clientX; pressY = e.clientY;
        try { canvas.setPointerCapture(e.pointerId); } catch (_) { }
      });
      canvas.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX, dy = e.clientY - startY;
        startX = e.clientX; startY = e.clientY;
        phi -= dx * 0.005;
        theta = Math.max(-0.6, Math.min(0.6, theta + dy * 0.005));
        velocityPhi = -dx * 0.005;
        redraw();
      });
      const stopDrag = (e) => {
        if (isDragging) {
          const dragDist = Math.hypot(e.clientX - pressX, e.clientY - pressY);
          isDragging = false;
          try { canvas.releasePointerCapture(e.pointerId); } catch (_) { }

          if (e.type !== 'pointercancel' && dragDist < 6 && !useWebGL) {
            const rect = canvas.getBoundingClientRect();
            const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
            const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const r = (canvas.width / 2) - (12 * (canvas.width / rect.width));

            const allLocs = [
              ...visitedLocations.map(l => ({ ...l, isBucket: false })),
              ...bucketLocations.map(l => ({ ...l, isBucket: true }))
            ];

            let closestLoc = null;
            let minDist = Infinity;

            allLocs.forEach(loc => {
              const p = projectPoint((loc.lat * Math.PI) / 180, (loc.lon * Math.PI) / 180, phi, theta);
              if (p.z > 0) {
                const px = cx + r * p.x;
                const py = cy - r * p.y;
                const dist = Math.hypot(clickX - px, clickY - py);
                if (dist < 35 * (canvas.width / rect.width) && dist < minDist) {
                  minDist = dist;
                  closestLoc = loc;
                }
              }
            });

            if (closestLoc) {
              activePin = closestLoc.id;
              document.querySelectorAll('.globe-chip').forEach(c => {
                c.classList.toggle('active', c.dataset.id === closestLoc.id);
              });
              focusLocation(closestLoc.lat, closestLoc.lon, closestLoc.name || closestLoc.city, closestLoc.country, closestLoc.flag || '📍', closestLoc.desc, closestLoc.isBucket);
            }
          }
        }
      };
      canvas.addEventListener('pointerup', stopDrag);
      canvas.addEventListener('pointercancel', stopDrag);

      function focusLocation(lat, lon, city, country, flag, desc, isBucket = false) {
        const angles = coordsToAngles(lat, lon);
        targetPhi = angles.phi; targetTheta = angles.theta; isFocusing = true;
        const hc = document.getElementById('hud-city'), hf = document.getElementById('hud-flag');
        const hco = document.getElementById('hud-country'), hcr = document.getElementById('hud-coords');
        const hd = document.getElementById('hud-description'), hb = document.getElementById('hud-category-label');
        if (hf) hf.textContent = flag;
        if (hc && hc.firstChild) hc.firstChild.nodeValue = `${city} `;
        if (hco) hco.textContent = country;
        if (hcr) hcr.textContent = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? 'E' : 'W'}`;
        if (hd) hd.textContent = desc;
        if (hb) hb.textContent = isBucket ? 'Someday destination' : 'Visited';
        if (motion.matches) { phi = targetPhi; theta = targetTheta; isFocusing = false; }
        document.querySelectorAll('.globe-chip, .globe-bucket-trigger').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.id === activePin)));
        redraw();
      }

      document.querySelectorAll('.globe-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          document.querySelectorAll('.globe-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          activePin = chip.dataset.id;
          focusLocation(parseFloat(chip.dataset.lat), parseFloat(chip.dataset.lon), chip.dataset.city, chip.dataset.country, chip.dataset.flag, chip.dataset.desc, false);
        });
      });

      document.querySelectorAll('.globe-bucket-trigger').forEach(card => {
        card.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); card.click(); } });
        card.addEventListener('click', () => {
          document.querySelectorAll('.globe-chip').forEach(c => c.classList.remove('active'));
          activePin = card.dataset.id || (card.dataset.city ? card.dataset.city.toLowerCase() : null);
          focusLocation(parseFloat(card.dataset.lat), parseFloat(card.dataset.lon), card.dataset.city, card.dataset.country, '📍', card.dataset.desc, true);
          document.getElementById('globe-hud-card').scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth', block: 'center' });
        });
      });

      const resetBtn = document.getElementById('globe-reset-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          targetPhi = initialJordanAngles.phi; targetTheta = initialJordanAngles.theta; isFocusing = true;
          activePin = 'amman';
          const fc = document.querySelector('.globe-chip[data-id="amman"]');
          if (fc) fc.click();
        });
      }

      const spinToggle = document.getElementById('globe-spin-toggle');
      if (spinToggle) {
        const syncMotion = () => {
          autoSpin = false;
          spinToggle.disabled = motion.matches;
          spinToggle.setAttribute('aria-pressed', 'false');
          spinToggle.title = motion.matches ? 'Auto-spin is off because you prefer reduced motion' : 'Toggle auto-spin';
          redraw();
        };
        motion.addEventListener('change', syncMotion);
        syncMotion();
        spinToggle.addEventListener('click', () => {
          autoSpin = !autoSpin;
          spinToggle.setAttribute("aria-pressed", String(autoSpin));
          redraw();
          spinToggle.classList.toggle('paused', !autoSpin);
          const icon = spinToggle.querySelector('.spin-icon');
          if (icon) icon.style.color = autoSpin ? '#4ADE80' : '#888';
        });
      }
    }
  
})();
