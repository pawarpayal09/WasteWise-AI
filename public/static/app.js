/* ==========================================================================
   WasteWise AI — client application
   Vanilla JS SPA: hash router, persistent local storage, Second-Life Engine,
   impact dashboard, campus challenge. Demo Mode works with zero external APIs.
   ========================================================================== */

;(function () {
  'use strict'

  /* ----------------------------------------------------------- constants */

  const LADDER = [
    { key: 'reuse', label: 'REUSE', title: 'Reuse', icon: 'fas fa-rotate-left', accent: '#0e7c5a' },
    { key: 'repair', label: 'REPAIR', title: 'Repair', icon: 'fas fa-screwdriver-wrench', accent: '#0f9b8e' },
    { key: 'donate', label: 'DONATE', title: 'Donate', icon: 'fas fa-hand-holding-heart', accent: '#2563eb' },
    { key: 'repurpose', label: 'REPURPOSE', title: 'Repurpose', icon: 'fas fa-shapes', accent: '#7c3aed' },
    { key: 'recycle', label: 'RECYCLE', title: 'Recycle', icon: 'fas fa-recycle', accent: '#0e7490' },
    { key: 'disposal', label: 'SAFE DISPOSAL', title: 'Safe disposal', icon: 'fas fa-shield-heart', accent: '#dc2626' },
  ]

  /* Fallback samples in case /api/demo-items is unreachable */
  const FALLBACK_SAMPLES = [
    { id: 'laptop', label: 'Old Laptop', sampleIcon: 'fas fa-laptop', category: 'E-waste', detectedItem: 'Laptop computer' },
    { id: 'bottle', label: 'Plastic Bottle', sampleIcon: 'fas fa-bottle-water', category: 'Plastic', detectedItem: 'PET plastic bottle' },
    { id: 'tshirt', label: 'Old Clothes', sampleIcon: 'fas fa-shirt', category: 'Textile', detectedItem: 'Cotton t-shirt / clothing' },
    { id: 'chair', label: 'Broken Chair', sampleIcon: 'fas fa-chair', category: 'Furniture', detectedItem: 'Wooden chair (damaged joint)' },
    { id: 'battery', label: 'Phone Battery', sampleIcon: 'fas fa-battery-quarter', category: 'Batteries', detectedItem: 'Lithium-ion phone battery' },
    { id: 'phone', label: 'Old Phone', sampleIcon: 'fas fa-mobile-screen-button', category: 'E-waste', detectedItem: 'Smartphone' },
  ]

  const ACTION_LABELS = {
    reuse: { action: 'Marked as Reused', chip: 'chip-green', verb: 'Reused' },
    repair: { action: 'Marked as Repaired', chip: 'chip-cyan', verb: 'Repaired' },
    donate: { action: 'Marked as Donated', chip: 'chip-blue', verb: 'Donated' },
    repurpose: { action: 'Repurposed', chip: 'chip-violet', verb: 'Repurposed' },
    recycle: { action: 'Marked as Recycled', chip: 'chip-cyan', verb: 'Recycled' },
    disposal: { action: 'Sent to authorised collection', chip: 'chip-red', verb: 'Handled safely' },
  }

  const DEMO_HISTORY_SEED = [
    { itemLabel: 'Old Laptop', category: 'E-waste', pathway: 'repair', action: 'Marked as Repaired', daysAgo: 21, demo: true },
    { itemLabel: 'Smartphone', category: 'E-waste', pathway: 'donate', action: 'Marked as Donated', daysAgo: 19, demo: true },
    { itemLabel: 'Cotton T-shirts', category: 'Textile', pathway: 'donate', action: 'Marked as Donated', daysAgo: 17, demo: true },
    { itemLabel: 'Plastic Bottles', category: 'Plastic', pathway: 'recycle', action: 'Marked as Recycled', daysAgo: 15, demo: true },
    { itemLabel: 'Wooden Chair', category: 'Furniture', pathway: 'repair', action: 'Marked as Repaired', daysAgo: 13, demo: true },
    { itemLabel: 'Glass Jars', category: 'Glass', pathway: 'reuse', action: 'Marked as Reused', daysAgo: 12, demo: true },
    { itemLabel: 'Cardboard Boxes', category: 'Paper/Cardboard', pathway: 'recycle', action: 'Marked as Recycled', daysAgo: 10, demo: true },
    { itemLabel: 'Phone Battery', category: 'Batteries', pathway: 'disposal', action: 'Sent to authorised collection', daysAgo: 9, demo: true },
    { itemLabel: 'Bedside Table', category: 'Furniture', pathway: 'reuse', action: 'Marked as Reused', daysAgo: 7, demo: true },
    { itemLabel: 'Table Lamp', category: 'Appliances', pathway: 'repair', action: 'Marked as Repaired', daysAgo: 5, demo: true },
    { itemLabel: 'Denim Jeans', category: 'Textile', pathway: 'repurpose', action: 'Repurposed as rags/patches', daysAgo: 3, demo: true },
    { itemLabel: 'Mixed unknown item', category: 'Mixed/Unknown', pathway: null, action: 'Analysed — no action yet', daysAgo: 1, demo: true },
  ]

  /* --------------------------------------------------------- tiny helpers */

  const $ = (sel, root) => (root || document).querySelector(sel)
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel))
  const esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]))
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
  const daysBetween = (iso) => Math.round((Date.now() - new Date(iso).getTime()) / 86400000)
  const fmtDate = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  }
  const pct = (n, d) => (!d ? 0 : Math.round((n / d) * 100))

  async function api(path, opts) {
    const res = await fetch(
      path,
      Object.assign({ credentials: 'same-origin', headers: { 'Content-Type': 'application/json' } }, opts)
    )
    let data = null
    try { data = await res.json() } catch (e) { data = null }

    if (res.status === 401) {
      const err = new Error('UNAUTHORIZED')
      err.code = 'UNAUTHORIZED'
      err.data = data
      throw err
    }
    if (!res.ok) {
      const msg =
        (data && (data.error || (data.errors && Object.values(data.errors)[0]))) ||
        'Request failed (' + res.status + ')'
      const err = new Error(msg)
      err.code = 'HTTP_' + res.status
      err.data = data
      throw err
    }
    return data
  }

  /* ------------------------------------------------------------ app state */

  const state = {
    user: null,
    history: [],
    campus: null,
    samples: FALLBACK_SAMPLES,
    samplesLoaded: false,
    scan: { itemId: null, fileName: null, preview: null, describe: '' },
    analysis: null,
    answers: {},
    rec: null,
    recMeta: null,
    lastAction: null,
    charts: {},
    booted: false,
  }

  /* ------------------------------------------------------------- storage */
  /* History lives in the server-side SQLite database, scoped to the signed-in
     account. It is mirrored in memory so view functions can read it
     synchronously while the network call happens in the background. */

  const store = {
    all() {
      return state.history || []
    },

    async load() {
      try {
        const data = await api('/api/history')
        state.history = (data.events || []).map(normalizeEvent)
      } catch (e) {
        if (e.code === 'UNAUTHORIZED') return handleUnauthorized()
        state.history = []
      }
      return state.history
    },

    async add(ev) {
      const optimistic = Object.assign({}, ev, { id: 'tmp-' + uid(), pending: true })
      state.history = [optimistic].concat(state.history)
      try {
        const data = await api('/api/history', {
          method: 'POST',
          body: JSON.stringify({
            itemLabel: ev.itemLabel,
            category: ev.category,
            pathway: ev.pathway,
            action: ev.action,
            confidence: ev.confidence,
            mode: ev.mode,
            createdAt: ev.createdAt,
            answers: ev.answers,
          }),
        })
        optimistic.id = data.id
        optimistic.pending = false
        return optimistic
      } catch (e) {
        if (e.code === 'UNAUTHORIZED') handleUnauthorized()
        optimistic.pending = false
        optimistic.failed = true
        return optimistic
      }
    },

    async remove(id) {
      state.history = state.history.filter((e) => String(e.id) !== String(id))
      try {
        await api('/api/history/' + encodeURIComponent(id), { method: 'DELETE' })
      } catch (e) {
        if (e.code === 'UNAUTHORIZED') handleUnauthorized()
      }
    },

    async clear() {
      state.history = []
      try {
        await api('/api/history', { method: 'DELETE' })
      } catch (e) {
        if (e.code === 'UNAUTHORIZED') handleUnauthorized()
      }
    },

    /** Populate the signed-in account with 12 demo records. */
    async seed() {
      for (const h of DEMO_HISTORY_SEED) {
        const when = new Date(Date.now() - h.daysAgo * 86400000)
        const stamp = when.toISOString().slice(0, 19).replace('T', ' ')
        try {
          await api('/api/history', {
            method: 'POST',
            body: JSON.stringify({
              itemLabel: h.itemLabel,
              category: h.category,
              pathway: h.pathway,
              action: h.action,
              mode: 'demo-seed',
              createdAt: stamp,
            }),
          })
        } catch (e) {
          if (e.code === 'UNAUTHORIZED') return handleUnauthorized()
          break
        }
      }
      await this.load()
      return state.history
    },
  }

  /** Map a database row onto the shape the views expect. */
  function normalizeEvent(r) {
    const raw = r.created_at ? String(r.created_at) : ''
    const iso = raw ? new Date(raw.replace(' ', 'T') + (raw.endsWith('Z') ? '' : 'Z')).toISOString() : new Date().toISOString()
    return {
      id: r.id,
      itemLabel: r.item_label,
      category: r.category,
      pathway: r.pathway,
      action: r.action,
      confidence: r.confidence,
      createdAt: iso,
      demo: r.mode === 'demo-seed' || r.mode === 'demo',
    }
  }

  /* ------------------------------------------------------------- sidebar */

  function setActiveNav(route) {
    $$('.nav-item').forEach((a) => a.classList.toggle('active', a.getAttribute('data-nav') === route))
    const labels = { home: 'Home', scan: 'Scan Item', analysis: 'AI Analysis', secondlife: 'Second-Life Engine', plan: 'Action Plan', impact: 'My Impact', campus: 'Campus Challenge', history: 'History' }
    const crumb = $('#crumb')
    if (crumb) crumb.textContent = labels[route] || 'WasteWise AI'
  }

  function closeSidebar() {
    const sb = $('#sidebar')
    if (sb) sb.classList.remove('open')
    const scrim = $('.scrim')
    if (scrim) scrim.remove()
  }

  function openSidebar() {
    const sb = $('#sidebar')
    if (!sb) return
    sb.classList.add('open')
    const scrim = document.createElement('button')
    scrim.className = 'scrim'
    scrim.setAttribute('aria-label', 'Close navigation')
    scrim.addEventListener('click', closeSidebar)
    document.body.appendChild(scrim)
  }

  /* --------------------------------------------------------------- toast */

  function toast(msg, kind) {
    const wrap = $('#toast-wrap')
    if (!wrap) return
    const el = document.createElement('div')
    el.className = 'toast' + (kind === 'error' ? ' error' : '')
    el.innerHTML = `<i class="fas ${kind === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}"></i><span>${esc(msg)}</span>`
    wrap.appendChild(el)
    setTimeout(() => {
      el.style.opacity = '0'
      el.style.transform = 'translateY(10px)'
      el.style.transition = 'all .3s'
      setTimeout(() => el.remove(), 320)
    }, 3200)
  }

  /* --------------------------------------------------------------- charts */

  function destroyChart(id) {
    if (state.charts[id]) {
      try { state.charts[id].destroy() } catch (e) {}
      delete state.charts[id]
    }
  }

  function chartTheme() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark'
    return {
      grid: dark ? 'rgba(255,255,255,.08)' : 'rgba(9,45,37,.08)',
      text: dark ? '#b3c7c2' : '#4c5f5c',
      dark,
    }
  }

  /* ============================================================ VIEW: HOME */

  function viewHome() {
    const hist = store.all()
    const stats = computeStats(hist)
    return `
    <section class="fade-in">
      <div class="hero">
        <div class="hero-inner">
          <span class="eyebrow"><i class="fas fa-wand-magic-sparkles"></i> AI-powered circular economy assistant</span>
          <h1>WasteWise AI</h1>
          <div class="tagline">Don't Throw It. Ask AI.</div>
          <p class="sub">Turn unwanted items into opportunities for reuse, repair, donation and responsible recycling. WasteWise AI identifies the item and tells you the <strong>best next action</strong> — not just the bin.</p>
          <div class="hero-cta">
            <a class="btn btn-primary btn-lg" href="#/scan"><i class="fas fa-camera-retro"></i> Scan an Item</a>
            <a class="btn btn-outline btn-lg" href="#/scan?mode=describe"><i class="fas fa-keyboard"></i> Describe an Item</a>
          </div>
          <div class="hero-stats">
            <div class="stat"><strong>${stats.total}</strong><span>Items analysed (this profile)</span></div>
            <div class="stat"><strong>${stats.secondLife}</strong><span>Second-life pathways found</span></div>
            <div class="stat"><strong>${stats.pathways.length}</strong><span>Pathways in the engine</span></div>
            <div class="stat"><strong>6</strong><span>Demo items ready</span></div>
          </div>
        </div>
      </div>

      <div class="grid grid-4" style="margin-top:22px">
        ${miniCard('fas fa-circle-question', '#0e7c5a', 'Everyday decision', 'Most people do not know what to do with an unwanted item.')}
        ${miniCard('fas fa-microchip', '#0f9b8e', 'AI identifies it', 'Photo or description in. Category and visible condition out — clearly labelled as estimates.')}
        ${miniCard('fas fa-arrows-spin', '#2563eb', 'Second-Life Engine', 'Questions refine the answer until the best next-life pathway is clear.')}
        ${miniCard('fas fa-chart-line', '#7c3aed', 'Track your impact', 'Behaviour-based impact, never invented CO₂ numbers.')}
      </div>

      <section class="card card-pad" style="margin-top:22px">
        <div class="section-head">
          <div>
            <span class="eyebrow">The pathway</span>
            <h2>The second-life ladder</h2>
            <p>WasteWise AI always tries the highest-value option first, before recommending disposal.</p>
          </div>
          <a class="btn btn-outline btn-sm" href="#/scan"><i class="fas fa-play"></i> Try it now</a>
        </div>
        ${ladderHTML(null)}
      </section>

      <div class="grid grid-2" style="margin-top:22px">
        <section class="card card-pad">
          <div class="section-head">
            <div>
              <span class="eyebrow">Quick start</span>
              <h2>Demo items</h2>
              <p>Every sample produces a different, intelligent recommendation. No external API required.</p>
            </div>
          </div>
          <div class="sample-grid">
            ${state.samples.slice(0, 6).map(sampleBtnHTML).join('')}
          </div>
        </section>

        <section class="card card-pad">
          <div class="section-head">
            <div>
              <span class="eyebrow">Why it matters</span>
              <h2>Problem → Solution</h2>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:14px">
            <div class="alert alert-caution" style="border-left-width:4px">
              <i class="fas fa-triangle-exclamation"></i>
              <div><strong>Problem</strong><p>People throw away usable items because they don't know the best next action.</p></div>
            </div>
            <div class="alert alert-info" style="border-left-width:4px">
              <i class="fas fa-lightbulb"></i>
              <div><strong>Solution</strong><p>WasteWise AI identifies the item and recommends its best next-life pathway, with an action plan.</p></div>
            </div>
            <div class="alert alert-info" style="border-left-width:4px;background:rgba(14,124,90,.09);border-color:rgba(14,124,90,.24);color:#0e7c5a">
              <i class="fas fa-arrows-rotate"></i>
              <div><strong>Innovation</strong><p>AI does not stop at classification — it guides reuse, repair, donation, repurposing, recycling and safe disposal.</p></div>
            </div>
          </div>
        </section>
      </div>
    </section>`
  }

  function miniCard(icon, color, title, body) {
    return `<article class="card stat-card">
      <span class="sc-icon" style="background:${color}1f;color:${color}"><i class="${icon}"></i></span>
      <strong style="font-family:var(--font-display)">${esc(title)}</strong>
      <p class="small soft">${esc(body)}</p>
    </article>`
  }

  function sampleBtnHTML(s) {
    const active = state.scan.itemId === s.id ? ' is-active' : ''
    return `<button class="sample-btn${active}" type="button" data-sample="${esc(s.id)}">
      <span class="sb-ico"><i class="${esc(s.sampleIcon || 'fas fa-box')}"></i></span>
      <strong>${esc(s.label)}</strong>
      <span>${esc(s.category || '')}</span>
    </button>`
  }

  function ladderHTML(activeKey, scores) {
    return `<div class="ladder">${LADDER.map((step, i) => {
      const isActive = activeKey === step.key
      const dim = scores && !isActive && (scores[step.key] || 0) < 30 ? ' dimmed' : ''
      const sc = scores ? `<div class="tiny muted" style="margin-top:6px">AI score ${scores[step.key] ?? 0}</div>` : ''
      return `<div class="ladder-step${isActive ? ' active' : ''}${dim}" style="${isActive ? '--accent:' + step.accent : ''}">
        <div class="ls-num">STEP ${i + 1}</div>
        <div class="ls-label">${esc(step.label)}</div>
        <span class="ls-icon" style="color:${step.accent}"><i class="${step.icon}"></i></span>
        ${sc}
      </div>`
    }).join('')}</div>`
  }

  /* ============================================================ VIEW: SCAN */

  function viewScan() {
    const s = state.scan
    return `
    <section class="fade-in">
      <div class="section-head">
        <div>
          <span class="eyebrow">Step 1 of 5</span>
          <h1 style="font-size:clamp(1.6rem,2.6vw,2.1rem)">Give your item a second look.</h1>
          <p>Upload a photo, drag &amp; drop, describe it, or pick a demo item. WasteWise AI will estimate the category and visible condition.</p>
        </div>
        <div class="stepper">
          <span class="sp active"><span class="n">1</span> Scan</span><span class="sep">›</span>
          <span class="sp"><span class="n">2</span> Analyse</span><span class="sep">›</span>
          <span class="sp"><span class="n">3</span> Questions</span><span class="sep">›</span>
          <span class="sp"><span class="n">4</span> Plan</span><span class="sep">›</span>
          <span class="sp"><span class="n">5</span> Impact</span>
        </div>
      </div>

      <div class="grid" style="grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);align-items:start">
        <div class="card card-pad">
          ${s.preview
            ? `<div class="dz-preview">
                 <span class="dz-badge"><i class="fas fa-image"></i> ${esc(s.fileName || 'Uploaded image')}</span>
                 <img src="${s.preview}" alt="Selected item preview" />
                 <div style="display:flex;gap:10px;padding:14px;background:var(--surface)">
                   <button class="btn btn-outline btn-sm" type="button" id="clear-image"><i class="fas fa-trash-can"></i> Remove image</button>
                   <button class="btn btn-primary btn-sm" type="button" id="analyze-btn"><i class="fas fa-wand-magic-sparkles"></i> Analyze with AI</button>
                 </div>
               </div>`
            : `<div class="dropzone" id="dropzone" tabindex="0" role="button" aria-label="Upload an image">
                 <span class="dz-icon"><i class="fas fa-cloud-arrow-up"></i></span>
                 <h3>Drag &amp; drop an image here</h3>
                 <p class="soft small">or click to browse — PNG, JPG or WEBP up to 5 MB</p>
                 <p class="tiny muted" style="margin-top:10px"><i class="fas fa-lock"></i> Processed locally for the demo. No image leaves this browser session.</p>
                 <input type="file" id="file-input" accept="image/*" hidden />
               </div>`}

          <div style="margin-top:20px">
            <h4 style="margin-bottom:8px"><i class="fas fa-keyboard" style="color:var(--primary)"></i> Or describe the item</h4>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
              <input id="describe-input" class="opt" style="flex:1 1 260px;text-align:left;cursor:text" placeholder="e.g. old laptop that still turns on, cracked plastic bucket…" value="${esc(s.describe)}" />
              <button class="btn btn-outline" type="button" id="describe-btn"><i class="fas fa-arrow-right"></i> Describe an Item</button>
            </div>
            <p class="tiny muted" style="margin-top:8px">Tip: the demo engine recognises laptop, phone, bottle, clothes, chair and battery keywords.</p>
          </div>
        </div>

        <div class="card card-pad">
          <div class="section-head" style="margin-bottom:12px">
            <div>
              <span class="eyebrow">Demo Mode</span>
              <h3>Sample items</h3>
            </div>
            <span class="chip chip-green"><span class="dot" style="width:7px;height:7px;border-radius:50%;background:var(--green-500)"></span> Always available</span>
          </div>
          <div class="sample-grid" style="grid-template-columns:repeat(auto-fit,minmax(126px,1fr))">
            ${state.samples.map(sampleBtnHTML).join('')}
          </div>
          <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap">
            ${s.itemId
              ? `<button class="btn btn-primary" type="button" id="analyze-sample"><i class="fas fa-wand-magic-sparkles"></i> Analyze with AI</button>
                 <button class="btn btn-ghost" type="button" id="clear-sample"><i class="fas fa-xmark"></i> Clear</button>`
              : `<button class="btn btn-primary" type="button" disabled><i class="fas fa-arrow-left"></i> Select a sample to continue</button>`}
          </div>
        </div>
      </div>

      <div class="alert alert-info" style="margin-top:18px">
        <i class="fas fa-circle-info"></i>
        <div>
          <strong>Responsible AI</strong>
          <p>WasteWise AI never claims to have physically inspected an item. Analysis is an <strong>AI estimate from an image or a demo profile</strong> and cannot determine hidden damage, exact material composition, real recyclability or true repairability. Always verify locally.</p>
        </div>
      </div>
    </section>`
  }

  /* ======================================================== VIEW: ANALYSIS */

  function viewAnalysis() {
    const a = state.analysis
    if (!a) return notReady('No analysis yet', 'Scan an item first to see the AI analysis.', '#/scan', 'Scan an Item')

    const p = a.primary || LADDER[0]
    return `
    <section class="fade-in">
      <div class="section-head">
        <div>
          <span class="eyebrow">Step 2 of 5 · AI Analysis</span>
          <h1 style="font-size:clamp(1.6rem,2.6vw,2.1rem)">Item analysis</h1>
          <p>What the AI can reasonably say about this item from the image / demo profile.</p>
        </div>
        <span class="chip chip-amber"><i class="fas fa-flask"></i> AI estimate — not a physical inspection</span>
      </div>

      <div class="analysis-hero">
        <div class="card card-pad">
          <div style="display:flex;gap:20px;flex-wrap:wrap;align-items:center">
            <div class="dz-preview" style="width:180px;height:130px;flex:0 0 auto;display:grid;place-items:center;background:linear-gradient(135deg,var(--green-900),var(--teal-500))">
              <i class="${esc(p.icon)}" style="font-size:2.4rem;color:#fff"></i>
            </div>
            <div style="flex:1 1 260px">
              <span class="eyebrow">Detected item</span>
              <h2 style="margin:2px 0 6px">${esc(a.detectedItem)}</h2>
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
                <span class="chip chip-green"><i class="fas fa-tags"></i> ${esc(a.category)}</span>
                <span class="chip ${a.matched ? 'chip-blue' : 'chip-amber'}"><i class="fas fa-${a.matched ? 'circle-check' : 'triangle-exclamation'}"></i> ${a.matched ? 'Matched demo profile' : 'Low-confidence match'}</span>
                <span class="chip">${esc(a.mode === 'vision' ? 'Vision API' : 'Demo Mode')}</span>
              </div>
            </div>
            <div style="flex:0 0 150px">
              <div class="confidence-ring" style="--val:${a.confidence}">
                <span class="cr-inner"><span class="cr-value">${a.confidence}%</span><span class="cr-label">AI confidence</span></span>
              </div>
            </div>
          </div>

          <dl style="margin:18px 0 0">
            <div class="kv"><dt>Waste category</dt><dd>${esc(a.category)}</dd></div>
            <div class="kv"><dt>Visual condition assessment</dt><dd style="max-width:62%">${esc(a.condition)}</dd></div>
            <div class="kv"><dt>AI confidence</dt><dd>${a.confidence}% <span class="tiny muted">(estimate)</span></dd></div>
            <div class="kv"><dt>Estimated materials</dt><dd style="max-width:62%">${(a.materials || []).map(esc).join(' · ')}</dd></div>
            <div class="kv"><dt>Recommended path</dt><dd style="color:var(--primary)">${esc(a.recommendedPath)}</dd></div>
          </dl>
        </div>

        <div style="display:flex;flex-direction:column;gap:16px">
          ${safetyAlertHTML(a.safety)}
          <div class="card card-pad">
            <span class="eyebrow">AI summary</span>
            <p class="small" style="margin-top:8px">${esc(a.summary)}</p>
            <p class="tiny muted" style="margin-top:12px"><i class="fas fa-circle-info"></i> ${esc(a.estimateNotice)}</p>
          </div>
        </div>
      </div>

      <section style="margin-top:24px">
        <div class="section-head">
          <div>
            <span class="eyebrow">Step 3 of 5</span>
            <h2>Which pathway should we explore?</h2>
            <p>These are the four primary second-life routes. WasteWise AI will refine the ranking with a few questions.</p>
          </div>
        </div>
        <div class="grid grid-4">
          ${['reuse', 'repair', 'donate', 'recycle'].map((k) => actionCardHTML(p, k, true)).join('')}
        </div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:20px">
          <a class="btn btn-primary btn-lg" href="#/secondlife"><i class="fas fa-arrows-spin"></i> Continue to Second-Life Engine</a>
          <a class="btn btn-outline btn-lg" href="#/scan"><i class="fas fa-rotate-left"></i> Scan another item</a>
        </div>
      </section>
    </section>`
  }

  function actionCardHTML(primary, key, clickable) {
    const step = LADDER.find((s) => s.key === key)
    const isTop = primary && primary.key === key
    const blurb = {
      reuse: 'Keep using it or pass it on as-is',
      repair: 'Fix it and extend its life',
      donate: 'Give it to someone who needs it',
      repurpose: 'Turn it into something new',
      recycle: 'Recover the material properly',
      disposal: 'Authorised, safe collection',
    }[key]
    return `<button class="action-card${isTop ? ' is-top' : ''}" style="--accent:${step.accent}" data-pathway="${key}" type="button" ${clickable ? '' : ''}>
      <span class="ac-icon"><i class="${step.icon}"></i></span>
      <strong>${esc(step.label)}</strong>
      <p>${esc(blurb)}</p>
      ${isTop ? `<span class="chip chip-green" style="margin-top:2px"><i class="fas fa-star"></i> AI top pick</span>` : ''}
    </button>`
  }

  function safetyAlertHTML(safety) {
    if (!safety) return ''
    const map = { danger: ['alert-danger', 'fa-triangle-exclamation'], caution: ['alert-caution', 'fa-circle-exclamation'], info: ['alert-info', 'fa-circle-info'] }
    const [cls, icon] = map[safety.level] || map.info
    return `<div class="alert ${cls}">
      <i class="fas ${icon}"></i>
      <div><strong>${esc(safety.title)}</strong><p>${esc(safety.body)}</p></div>
    </div>`
  }

  /* ===================================================== VIEW: SECOND LIFE */

  function viewSecondLife() {
    const a = state.analysis
    if (!a) return notReady('No item to refine', 'Scan and analyse an item first.', '#/scan', 'Scan an Item')

    const qs = a.questions
    const answered = qs.filter((q) => state.answers[q.id]).length
    const ready = answered === qs.length
    return `
    <section class="fade-in">
      <div class="section-head">
        <div>
          <span class="eyebrow">Step 4 of 5 · Second-Life Engine</span>
          <h1 style="font-size:clamp(1.5rem,2.5vw,2rem)">Before you throw it away — give it a second life.</h1>
          <p>${qs.length} contextual question${qs.length === 1 ? '' : 's'} for <strong>${esc(a.detectedItem)}</strong>. Your answers dynamically change the recommendation.</p>
        </div>
        <div class="stepper">
          <span class="sp done"><span class="n"><i class="fas fa-check"></i></span> Scan</span><span class="sep">›</span>
          <span class="sp done"><span class="n"><i class="fas fa-check"></i></span> Analyse</span><span class="sep">›</span>
          <span class="sp active"><span class="n">3</span> Questions</span><span class="sep">›</span>
          <span class="sp"><span class="n">4</span> Plan</span><span class="sep">›</span>
          <span class="sp"><span class="n">5</span> Impact</span>
        </div>
      </div>

      <div class="card card-pad" style="margin-bottom:20px">
        <div class="section-head" style="margin-bottom:10px">
          <div>
            <span class="eyebrow">Circular pathway</span>
            <h3>The second-life ladder</h3>
            <p>We work down the ladder — the highlighted step is your current best pathway estimate.</p>
          </div>
          <span class="chip chip-green"><i class="fas fa-arrows-spin"></i> Live</span>
        </div>
        <div id="ladder-live">${ladderHTML(state.rec ? state.rec.pathway : null, state.rec ? state.rec.scores : null)}</div>
      </div>

      <div class="grid" style="grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);align-items:start">
        <div style="display:flex;flex-direction:column;gap:14px">
          ${qs.map((q, i) => questionHTML(q, i)).join('')}
          <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">
            <button class="btn btn-primary btn-lg" type="button" id="recommend-btn" ${ready ? '' : 'disabled'}>
              <i class="fas fa-wand-magic-sparkles"></i> ${ready ? 'Generate my action plan' : `Answer all ${qs.length} questions (${answered}/${qs.length})`}
            </button>
            <button class="btn btn-ghost" type="button" id="reset-answers"><i class="fas fa-rotate-left"></i> Reset answers</button>
          </div>
        </div>

        <aside style="display:flex;flex-direction:column;gap:16px;position:sticky;top:calc(var(--topbar-h) + 14px)">
          ${state.rec ? liveRecHTML(state.rec) : `<div class="card card-pad">
            <span class="eyebrow">Live recommendation</span>
            <h3 style="margin:6px 0">Waiting for your answers</h3>
            <p class="small soft">Answer the questions and the recommended pathway updates here in real time — no page reload.</p>
            <div class="progress-track" style="margin-top:16px"><div class="progress-fill" style="width:${pct(answered, qs.length)}%"></div></div>
            <p class="tiny muted" style="margin-top:8px">${answered} of ${qs.length} answered</p>
          </div>`}
          ${safetyAlertHTML(a.safety)}
        </aside>
      </div>
    </section>`
  }

  function questionHTML(q, i) {
    const chosen = state.answers[q.id]
    return `<div class="card q-card${q.safety ? ' q-safety' : ''}">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
        <div>
          <div class="q-title">${i + 1}. ${esc(q.text)}</div>
          ${q.hint ? `<div class="q-hint">${esc(q.hint)}</div>` : ''}
        </div>
        ${q.safety ? '<span class="chip chip-amber"><i class="fas fa-shield"></i> Safety</span>' : '<span class="chip chip-green"><i class="fas fa-brain"></i> Context</span>'}
      </div>
      <div class="opt-row">
        ${q.options.map((o) => `<button class="opt${chosen === o.value ? ' selected' : ''}" type="button" data-q="${esc(q.id)}" data-v="${esc(o.value)}">${esc(o.label)}</button>`).join('')}
      </div>
    </div>`
  }

  function liveRecHTML(rec) {
    return `<div class="card card-pad">
      <span class="eyebrow">Live recommendation</span>
      <div class="pathway-badge" style="--accent:${rec.accent};margin:12px 0">
        <i class="${rec.icon}"></i>
        <div><span class="pb-label">Best next step</span><strong>${esc(rec.title)}</strong></div>
      </div>
      <p class="small soft">${esc(rec.why[0])}</p>
      <div style="margin-top:16px">
        ${LADDER.map((s) => `<div class="score-row" style="--accent:${s.accent}">
          <span class="sr-label">${esc(s.label)}</span>
          <span class="score-bar"><span style="width:${rec.scores[s.key]}%"></span></span>
          <span class="sr-val">${rec.scores[s.key]}</span>
        </div>`).join('')}
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin-top:14px;flex-wrap:wrap">
        <span class="chip ${rec.confidence >= 80 ? 'chip-green' : rec.confidence >= 65 ? 'chip-amber' : 'chip-red'}">
          <i class="fas fa-gauge-high"></i> Confidence ${rec.confidence}%
        </span>
        ${rec.safetyFlag ? '<span class="chip chip-red"><i class="fas fa-triangle-exclamation"></i> Safety override active</span>' : ''}
      </div>
      <a class="btn btn-primary btn-block" href="#/plan" style="margin-top:14px"><i class="fas fa-list-check"></i> Open action plan</a>
      <p class="tiny muted" style="margin-top:10px">${esc(rec.notice)}</p>
    </div>`
  }

  /* ============================================================ VIEW: PLAN */

  function viewPlan() {
    const rec = state.rec
    const a = state.analysis
    if (!rec || !a) return notReady('No action plan yet', 'Complete the Second-Life questions first.', '#/scan', 'Start a scan')

    const alt = LADDER.find((s) => s.key === rec.alternateKey)
    return `
    <section class="fade-in">
      <div class="section-head">
        <div>
          <span class="eyebrow">Step 5 of 5 · Action Plan</span>
          <h1 style="font-size:clamp(1.6rem,2.6vw,2.1rem)">Your best next step</h1>
          <p>For <strong>${esc(a.detectedItem)}</strong> · ${esc(a.category)} · Confidence ${rec.confidence}% (AI estimate)</p>
        </div>
        <div class="stepper">
          <span class="sp done"><span class="n"><i class="fas fa-check"></i></span> Scan</span><span class="sep">›</span>
          <span class="sp done"><span class="n"><i class="fas fa-check"></i></span> Analyse</span><span class="sep">›</span>
          <span class="sp done"><span class="n"><i class="fas fa-check"></i></span> Questions</span><span class="sep">›</span>
          <span class="sp active"><span class="n">4</span> Plan</span><span class="sep">›</span>
          <span class="sp"><span class="n">5</span> Impact</span>
        </div>
      </div>

      <div class="grid" style="grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);align-items:start">
        <div style="display:flex;flex-direction:column;gap:18px">
          <div class="card card-pad" style="border-top:4px solid ${rec.accent}">
            <span class="eyebrow">Best next step</span>
            <div class="pathway-badge" style="--accent:${rec.accent};margin:12px 0 16px;width:100%;justify-content:flex-start">
              <i class="${rec.icon}"></i>
              <div><span class="pb-label">Recommended action</span><strong>${esc(rec.title)}</strong></div>
            </div>

            <h4 style="margin-bottom:6px"><i class="fas fa-circle-question" style="color:var(--primary)"></i> Why this action</h4>
            <ul style="margin:0 0 18px;padding-left:20px" class="small soft">
              ${rec.why.map((w) => `<li style="margin-bottom:5px">${esc(w)}</li>`).join('')}
            </ul>

            <h4 style="margin-bottom:6px"><i class="fas fa-forward" style="color:var(--primary)"></i> What you can do next</h4>
            <ol style="margin:0 0 18px;padding-left:20px" class="small soft">
              ${rec.next.map((w) => `<li style="margin-bottom:5px">${esc(w)}</li>`).join('')}
            </ol>

            <h4 style="margin-bottom:6px"><i class="fas fa-shield-halved" style="color:var(--amber)"></i> Safety considerations</h4>
            <ul style="margin:0 0 18px;padding-left:20px" class="small soft">
              ${rec.safety.map((w) => `<li style="margin-bottom:5px">${esc(w)}</li>`).join('')}
            </ul>

            <div class="alert alert-info">
              <i class="${alt.icon}"></i>
              <div><strong>Alternative option — ${esc(alt.title)}</strong><p>${esc(rec.alternateWhy)}</p></div>
            </div>
          </div>

          ${state.lastAction ? `<div class="alert alert-info" style="background:rgba(14,124,90,.09);border-color:rgba(14,124,90,.24);color:#0e7c5a">
              <i class="fas fa-circle-check"></i>
              <div><strong>Saved to your waste history</strong><p>${esc(state.lastAction)} · <a href="#/impact" style="text-decoration:underline">View My Impact →</a></p></div>
            </div>` : ''}

          <div class="card card-pad">
            <div class="section-head" style="margin-bottom:12px">
              <div>
                <span class="eyebrow">Record the outcome</span>
                <h3>What did you do with it?</h3>
                <p>Selecting an action saves it to your waste history and updates My Impact.</p>
              </div>
            </div>
            <div class="grid grid-4">
              ${['reuse', 'repair', 'donate', 'recycle'].map((k) => {
                const step = LADDER.find((s) => s.key === k)
                const primary = rec.pathway === k
                return `<button class="action-card${primary ? ' is-top' : ''}" style="--accent:${step.accent}" type="button" data-record="${k}">
                  <span class="ac-icon"><i class="${step.icon}"></i></span>
                  <strong>Mark as ${esc(ACTION_LABELS[k].verb)}</strong>
                  ${primary ? '<span class="chip chip-green" style="margin-top:2px"><i class="fas fa-star"></i> Recommended</span>' : '<span class="tiny muted" style="margin-top:2px">Alternative</span>'}
                </button>`
              }).join('')}
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">
              <button class="btn btn-outline btn-sm" type="button" data-record="repurpose"><i class="fas fa-shapes"></i> Mark as Repurposed</button>
              <button class="btn btn-ghost btn-sm" type="button" data-record="disposal"><i class="fas fa-shield-heart"></i> Handled via authorised collection</button>
              <button class="btn btn-ghost btn-sm" type="button" id="plan-skip"><i class="fas fa-clock"></i> Not decided yet</button>
            </div>
          </div>
        </div>

        <aside style="display:flex;flex-direction:column;gap:16px">
          <div class="card card-pad">
            <span class="eyebrow">Transparency</span>
            <h3 style="margin:6px 0">How this was decided</h3>
            <div class="progress-track" style="margin-top:8px"><div class="progress-fill" style="width:${rec.confidence}%"></div></div>
            <p class="tiny muted" style="margin-top:8px">AI confidence ${rec.confidence}% — item profile ${esc(a.category)}.</p>
            <hr style="border:none;border-top:1px dashed var(--border);margin:14px 0" />
            <h4 style="font-size:.86rem;margin-bottom:8px">Your inputs</h4>
            ${rec.inputs.length
              ? rec.inputs.map((x) => `<div class="kv"><dt style="max-width:60%">${esc(x.question)}</dt><dd>${esc(x.answer)}</dd></div>`).join('')
              : '<p class="small muted">No answers recorded — using the demo profile only.</p>'}
          </div>
          ${safetyAlertHTML(a.safety)}
          <div class="card card-pad">
            <span class="eyebrow">Disclaimer</span>
            <p class="small soft" style="margin-top:8px">${esc(rec.notice)}</p>
            <p class="tiny muted" style="margin-top:10px">WasteWise AI does not provide DIY instructions for batteries, electrical wiring, chemicals, medicines or hazardous materials. For those items, always use local authorised collection or professional guidance.</p>
          </div>
        </aside>
      </div>
    </section>`
  }

  /* ========================================================== VIEW: IMPACT */

  function computeStats(hist) {
    const counts = { reuse: 0, repair: 0, donate: 0, repurpose: 0, recycle: 0, disposal: 0, none: 0 }
    hist.forEach((e) => {
      if (e.pathway && counts[e.pathway] != null) counts[e.pathway]++
      else counts.none++
    })
    const total = hist.length
    const secondLife = counts.reuse + counts.repair + counts.donate + counts.repurpose
    const circular = counts.reuse + counts.repair + counts.donate
    const pathways = Object.keys(counts).filter((k) => k !== 'none' && counts[k] > 0)
    return {
      total,
      ...counts,
      secondLife,
      circular,
      pathways,
      circulationRate: pct(circular, Math.max(total - counts.none, 1)),
    }
  }

  function viewImpact() {
    const hist = store.all()
    const s = computeStats(hist)
    const byCat = {}
    hist.forEach((e) => {
      const c = e.category || 'Mixed/Unknown'
      byCat[c] = (byCat[c] || 0) + 1
    })
    const catEntries = Object.entries(byCat).sort((a, b) => b[1] - a[1])

    return `
    <section class="fade-in">
      <div class="section-head">
        <div>
          <span class="eyebrow">My Impact</span>
          <h1 style="font-size:clamp(1.6rem,2.6vw,2.1rem)">Your sustainability dashboard</h1>
          <p>Behaviour-based impact from your WasteWise decisions. ${hist.some((h) => h.demo) ? 'Includes seeded demo data.' : ''}</p>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-outline btn-sm" type="button" id="seed-history"><i class="fas fa-wand-magic-sparkles"></i> Load demo history</button>
          <button class="btn btn-ghost btn-sm" type="button" id="clear-history"><i class="fas fa-trash-can"></i> Clear</button>
        </div>
      </div>

      <div class="grid grid-4">
        ${statCardHTML('fas fa-layer-group', '#0e7c5a', s.total, 'Items analyzed')}
        ${statCardHTML('fas fa-rotate-left', '#14a06f', s.reuse, 'Reuse')}
        ${statCardHTML('fas fa-screwdriver-wrench', '#0f9b8e', s.repair, 'Repair')}
        ${statCardHTML('fas fa-hand-holding-heart', '#2563eb', s.donate, 'Donation')}
      </div>
      <div class="grid grid-4" style="margin-top:16px">
        ${statCardHTML('fas fa-shapes', '#7c3aed', s.repurpose, 'Repurpose')}
        ${statCardHTML('fas fa-recycle', '#0e7490', s.recycle, 'Recycling')}
        ${statCardHTML('fas fa-circle-question', '#dc2626', s.none + s.disposal, 'Other / unresolved')}
        ${statCardHTML('fas fa-arrows-spin', '#0e7c5a', s.secondLife, 'Second-life pathways')}
      </div>

      <div class="alert alert-info" style="margin-top:20px">
        <i class="fas fa-chart-simple"></i>
        <div>
          <strong>You identified a second-life pathway for ${s.secondLife} of ${s.total} items.</strong>
          <p>That is ${s.total ? Math.round((s.secondLife / s.total) * 100) : 0}% of everything you analysed. We deliberately report <em>behaviour</em> rather than kilogram or CO₂ claims, because those require a transparent, verified calculation methodology that image analysis alone cannot provide.</p>
        </div>
      </div>

      <div class="grid grid-2" style="margin-top:22px">
        <section class="card card-pad">
          <div class="section-head" style="margin-bottom:10px">
            <div><span class="eyebrow">Distribution</span><h3>Pathway split</h3></div>
          </div>
          <div class="chart-box-sm"><canvas id="chart-pathway"></canvas></div>
        </section>
        <section class="card card-pad">
          <div class="section-head" style="margin-bottom:10px">
            <div><span class="eyebrow">Categories</span><h3>Items analyzed by category</h3></div>
          </div>
          <div class="chart-box-sm"><canvas id="chart-category"></canvas></div>
        </section>
      </div>

      <section class="card card-pad" style="margin-top:22px">
        <div class="section-head">
          <div>
            <span class="eyebrow">Timeline</span>
            <h2>Your waste journey</h2>
            <p>Every decision you record builds a picture of your circular behaviour.</p>
          </div>
          <span class="chip chip-green"><i class="fas fa-arrows-spin"></i> ${s.circulationRate}% circular actions</span>
        </div>
        ${hist.length
          ? `<div class="timeline">${hist.slice(0, 12).map(tlItemHTML).join('')}</div>`
          : `<div class="empty"><i class="fas fa-clock-rotate-left"></i><p>No history yet. Scan an item and record an action.</p></div>`}
      </section>
    </section>`
  }

  function statCardHTML(icon, color, value, label) {
    return `<article class="card stat-card">
      <div class="sc-top">
        <span class="sc-icon" style="background:${color}1f;color:${color}"><i class="${icon}"></i></span>
      </div>
      <span class="sc-value" style="color:${value ? color : 'var(--text-mute)'}">${value}</span>
      <span class="sc-label">${esc(label)}</span>
    </article>`
  }

  function tlItemHTML(e) {
    const step = e.pathway ? LADDER.find((s) => s.key === e.pathway) : null
    const color = step ? step.accent : '#7e8f8c'
    const when = e.createdAt ? fmtDate(e.createdAt) : ''
    return `<div class="tl-item" style="--accent:${color}">
      <div class="tl-head">
        <strong>${esc(e.itemLabel)} <span class="chip" style="margin-left:6px;color:${color};border-color:${color}33;background:${color}18">${esc(step ? step.label : 'UNRESOLVED')}</span></strong>
        <small>${esc(when)}</small>
      </div>
      <p class="small muted" style="margin-top:2px">${esc(e.action)} · ${esc(e.category || '')}</p>
    </div>`
  }

  /* ========================================================== VIEW: CAMPUS */

  function viewCampus() {
    const c = state.campus
    if (!c) return `<div class="loading-screen"><div class="spinner"></div><p>Loading campus data…</p></div>`
    const totalActions = c.reuse + c.repair + c.donate + c.recycle + c.disposal
    return `
    <section class="fade-in">
      <div class="section-head">
        <div>
          <span class="eyebrow">Community</span>
          <h1 style="font-size:clamp(1.6rem,2.6vw,2.1rem)">WasteWise Campus</h1>
          <p>${esc(c.org)} — encourage students to make better waste decisions.</p>
        </div>
        <span class="chip chip-amber"><i class="fas fa-flask"></i> Demonstration data</span>
      </div>

      <div class="alert alert-caution" style="margin-bottom:20px">
        <i class="fas fa-circle-info"></i>
        <div><strong>This is demo data</strong><p>${esc(c.note)}</p></div>
      </div>

      <div class="grid grid-4">
        ${statCardHTML('fas fa-users', '#0e7c5a', c.participating, 'Students participating')}
        ${statCardHTML('fas fa-layer-group', '#0f9b8e', c.itemsAnalyzed, 'Items analyzed')}
        ${statCardHTML('fas fa-rotate-left', '#14a06f', c.reuse, 'Reuse actions')}
        ${statCardHTML('fas fa-screwdriver-wrench', '#0e7490', c.repair, 'Repair actions')}
      </div>
      <div class="grid grid-4" style="margin-top:16px">
        ${statCardHTML('fas fa-hand-holding-heart', '#2563eb', c.donate, 'Donation actions')}
        ${statCardHTML('fas fa-recycle', '#0e7490', c.recycle, 'Recycling actions')}
        ${statCardHTML('fas fa-shield-heart', '#dc2626', c.disposal, 'Safe disposal actions')}
        ${statCardHTML('fas fa-arrows-spin', '#0e7c5a', c.circulationRate + '%', 'Circular action rate')}
      </div>

      <div class="grid" style="grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);margin-top:22px;align-items:start">
        <section class="card card-pad">
          <div class="section-head" style="margin-bottom:10px">
            <div><span class="eyebrow">Leaderboard</span><h3>Team standings</h3><p>Ranked by circular actions (reuse + repair + donation).</p></div>
          </div>
          <div class="scroll-x">
            <div style="min-width:620px">
              <div class="lb-row lb-head" style="display:grid">
                <span>#</span><span>Team</span><span>Items</span><span>Reuse</span><span>Repair</span><span>Donate</span><span>Circularity</span>
              </div>
              ${c.teams.map(lbRowHTML).join('')}
            </div>
          </div>
        </section>

        <div style="display:flex;flex-direction:column;gap:16px">
          <section class="card card-pad">
            <span class="eyebrow">Actions breakdown</span>
            <h3 style="margin:6px 0 10px">Campus-wide</h3>
            <div class="chart-box-sm"><canvas id="chart-campus"></canvas></div>
          </section>
          <section class="card card-pad">
            <span class="eyebrow">Quick facts</span>
            <h3 style="margin:6px 0 10px">Participation</h3>
            <dl style="margin:0">
              <div class="kv"><dt>Items per student</dt><dd>${c.perStudent}</dd></div>
              <div class="kv"><dt>Total recorded actions</dt><dd>${totalActions}</dd></div>
              <div class="kv"><dt>Teams on the board</dt><dd>${c.teams.length}</dd></div>
              <div class="kv"><dt>Circular vs disposal</dt><dd>${c.circulationRate}% circular</dd></div>
            </dl>
          </section>
        </div>
      </div>

      <section class="hero" style="margin-top:24px;padding:34px 36px">
        <div class="hero-inner">
          <span class="eyebrow"><i class="fas fa-flag-checkered"></i> Run your own campaign</span>
          <h2 style="color:#fff">Start a Campus Circularity Challenge</h2>
          <p class="sub">Invite hostels, departments or societies to compete on circular actions. WasteWise AI tracks items analysed, reuse, repair, donation and recycling per team.</p>
          <form id="challenge-form" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:20px">
            <input class="opt" id="ch-org" style="flex:1 1 240px;text-align:left;cursor:text;background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.3);color:#fff" placeholder="Organisation / campus name" value="${esc(c.org.split('·')[0].trim())}" />
            <input class="opt" id="ch-contact" style="flex:1 1 200px;text-align:left;cursor:text;background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.3);color:#fff" placeholder="Contact email (optional)" />
            <input class="opt" id="ch-goal" type="number" min="10" value="500" style="flex:0 0 140px;background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.3);color:#fff" />
            <button class="btn btn-primary btn-lg" type="submit"><i class="fas fa-rocket"></i> Start the challenge</button>
          </form>
          <p class="tiny" style="color:rgba(234,250,244,.7);margin-top:10px">Demo submission — stored locally for the hackathon demonstration.</p>
        </div>
      </section>
    </section>`
  }

  function lbRowHTML(t) {
    const me = false
    return `<div class="lb-row${me ? ' is-me' : ''}">
      <div class="lb-rank"><i class="${esc(t.badge)}" style="font-size:.9rem"></i><div>${t.rank}</div></div>
      <div class="lb-name"><strong>${esc(t.name)}</strong><small>${esc(t.team)}</small></div>
      <div class="lb-cell"><strong>${t.items}</strong><span>items</span></div>
      <div class="lb-cell"><strong>${t.reuse}</strong><span>reuse</span></div>
      <div class="lb-cell"><strong>${t.repair}</strong><span>repair</span></div>
      <div class="lb-cell"><strong>${t.donate}</strong><span>donate</span></div>
      <div class="lb-cell"><strong style="color:var(--primary)">${t.circulation}%</strong><span>circular</span></div>
    </div>`
  }

  /* ========================================================= VIEW: HISTORY */

  function viewHistory() {
    const hist = store.all()
    return `
    <section class="fade-in">
      <div class="section-head">
        <div>
          <span class="eyebrow">Records</span>
          <h1 style="font-size:clamp(1.6rem,2.6vw,2.1rem)">Waste history</h1>
          <p>Every analysed item and recorded decision, stored locally and mirrored to the edge database.</p>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <a class="btn btn-primary btn-sm" href="#/scan"><i class="fas fa-camera-retro"></i> Scan an item</a>
          <button class="btn btn-ghost btn-sm" type="button" id="clear-history"><i class="fas fa-trash-can"></i> Clear</button>
        </div>
      </div>

      ${hist.length
        ? `<div class="card card-pad" style="padding:16px">
             <div class="hist-row hist-head" style="display:grid">
               <span>Item</span><span class="hist-hide">Category</span><span class="hist-hide">Action</span><span>Pathway</span><span></span>
             </div>
             ${hist.map(histRowHTML).join('')}
           </div>`
        : `<div class="empty"><i class="fas fa-box-open"></i><p>No waste history yet.</p><button class="btn btn-outline btn-sm" type="button" id="seed-history" style="margin-top:12px"><i class="fas fa-wand-magic-sparkles"></i> Load demo history</button></div>`}
    </section>`
  }

  function histRowHTML(e) {
    const step = e.pathway ? LADDER.find((s) => s.key === e.pathway) : null
    return `<div class="hist-row">
      <div>
        <strong style="font-family:var(--font-display);font-size:.9rem">${esc(e.itemLabel)}</strong>
        <div class="tiny muted">${esc(e.createdAt ? fmtDate(e.createdAt) : '')}${e.demo ? ' · demo' : ''}</div>
      </div>
      <div class="hist-hide"><span class="chip">${esc(e.category || '—')}</span></div>
      <div class="hist-hide small soft">${esc(e.action)}</div>
      <div>${step
        ? `<span class="chip" style="color:${step.accent};border-color:${step.accent}40;background:${step.accent}18"><i class="${step.icon}"></i> ${esc(step.label)}</span>`
        : '<span class="chip chip-amber">Unresolved</span>'}</div>
      <div><button class="icon-btn" type="button" data-del-history="${esc(e.id)}" title="Delete record" aria-label="Delete record"><i class="fas fa-xmark"></i></button></div>
    </div>`
  }

  function notReady(title, body, href, cta) {
    return `<section class="fade-in"><div class="empty" style="padding:70px 20px">
      <i class="fas fa-compass"></i>
      <h3 style="margin-bottom:6px">${esc(title)}</h3>
      <p style="margin-bottom:18px">${esc(body)}</p>
      <a class="btn btn-primary" href="${href}"><i class="fas fa-arrow-right"></i> ${esc(cta)}</a>
    </div></section>`
  }

  /* ============================================================== ROUTER */

  function currentQuery() {
    const hash = location.hash || '#/'
    const qi = hash.indexOf('?')
    return new URLSearchParams(qi >= 0 ? hash.slice(qi + 1) : '')
  }

  function route() {
    const hash = location.hash || '#/'
    const path = hash.replace(/^#/, '').split('?')[0] || '/'
    const view = $('#view')
    if (!view) return
    closeSidebar()
    destroyAllCharts()

    let html = ''
    switch (path) {
      case '/':
      case '':
        setActiveNav('home')
        html = viewHome()
        break
      case '/scan':
        setActiveNav('scan')
        html = viewScan()
        break
      case '/analysis':
        setActiveNav('analysis')
        html = viewAnalysis()
        break
      case '/secondlife':
        setActiveNav('secondlife')
        html = viewSecondLife()
        break
      case '/plan':
        setActiveNav('plan')
        html = viewPlan()
        break
      case '/impact':
        setActiveNav('impact')
        html = viewImpact()
        break
      case '/campus':
        setActiveNav('campus')
        html = viewCampus()
        break
      case '/history':
        setActiveNav('history')
        html = viewHistory()
        break
      default:
        setActiveNav('home')
        html = viewHome()
    }

    view.innerHTML = html
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' })

    // post-render hooks
    if (path === '/impact') renderImpactCharts()
    if (path === '/campus') renderCampusChart()
    if (path === '/scan') {
      const q = currentQuery()
      if (q.get('mode') === 'describe') setTimeout(() => { const el = $('#describe-input'); if (el) el.focus() }, 120)
    }
  }

  function destroyAllCharts() {
    Object.keys(state.charts).forEach(destroyChart)
  }

  /* ======================================================= chart rendering */

  function renderImpactCharts() {
    if (!window.Chart) return
    const hist = store.all()
    const s = computeStats(hist)
    const t = chartTheme()

    const pEl = $('#chart-pathway')
    if (pEl) {
      const labels = ['Reuse', 'Repair', 'Donate', 'Repurpose', 'Recycle', 'Safe disposal', 'Unresolved']
      const values = [s.reuse, s.repair, s.donate, s.repurpose, s.recycle, s.disposal, s.none]
      const colors = ['#0e7c5a', '#0f9b8e', '#2563eb', '#7c3aed', '#0e7490', '#dc2626', '#9aa8a5']
      const total = values.reduce((a, b) => a + b, 0)
      if (total === 0) {
        pEl.parentElement.innerHTML = '<div class="empty" style="padding:34px"><i class="fas fa-chart-pie"></i><p>No data yet</p></div>'
      } else {
        state.charts.pathway = new Chart(pEl, {
          type: 'doughnut',
          data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0, hoverOffset: 8 }] },
          options: {
            responsive: true, maintainAspectRatio: false, cutout: '64%',
            plugins: {
              legend: { position: 'bottom', labels: { color: t.text, boxWidth: 10, usePointStyle: true, padding: 12, font: { size: 11 } } },
              tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.parsed}` } },
            },
          },
        })
      }
    }

    const cEl = $('#chart-category')
    if (cEl) {
      const byCat = {}
      hist.forEach((e) => { const c = e.category || 'Mixed/Unknown'; byCat[c] = (byCat[c] || 0) + 1 })
      const entries = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 8)
      if (!entries.length) {
        cEl.parentElement.innerHTML = '<div class="empty" style="padding:34px"><i class="fas fa-chart-column"></i><p>No data yet</p></div>'
      } else {
        state.charts.category = new Chart(cEl, {
          type: 'bar',
          data: {
            labels: entries.map((e) => e[0]),
            datasets: [{ data: entries.map((e) => e[1]), backgroundColor: '#0e7c5a', borderRadius: 6, maxBarThickness: 34 }],
          },
          options: {
            responsive: true, maintainAspectRatio: false, indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: {
              x: { beginAtZero: true, ticks: { color: t.text, precision: 0 }, grid: { color: t.grid } },
              y: { ticks: { color: t.text, font: { size: 11 } }, grid: { display: false } },
            },
          },
        })
      }
    }
  }

  function renderCampusChart() {
    if (!window.Chart) return
    const c = state.campus
    const el = $('#chart-campus')
    if (!c || !el) return
    const t = chartTheme()
    state.charts.campus = new Chart(el, {
      type: 'polarArea',
      data: {
        labels: ['Reuse', 'Repair', 'Donate', 'Recycle', 'Safe disposal'],
        datasets: [{
          data: [c.reuse, c.repair, c.donate, c.recycle, c.disposal],
          backgroundColor: ['#0e7c5a99', '#0f9b8e99', '#2563eb99', '#0e749099', '#dc262699'],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: t.text, boxWidth: 10, usePointStyle: true, padding: 10, font: { size: 11 } } } },
        scales: { r: { ticks: { display: false }, grid: { color: t.grid }, angleLines: { color: t.grid } } },
      },
    })
  }

  /* ============================================================== actions */

  async function loadSamples() {
    if (state.samplesLoaded) return
    try {
      const data = await api('/api/demo-items')
      if (data && Array.isArray(data.items) && data.items.length) state.samples = data.items
      state.samplesLoaded = true
    } catch (e) {
      /* keep fallback */
    }
  }

  async function loadCampus() {
    try {
      const data = await api('/api/campus')
      if (data && data.data) state.campus = data.data
    } catch (e) {
      state.campus = null
    }
  }

  /* ============================================================ AUTH UI */

  function authMark(mode) {
    return `
    <div class="auth-screen">
      <div class="auth-visual">
        <div class="auth-visual-inner">
          <span class="auth-logo"><i class="fas fa-recycle"></i></span>
          <h1>WasteWise AI</h1>
          <p class="auth-tag">Don't Throw It. Ask AI.</p>
          <p class="auth-sub">Turn unwanted items into opportunities for reuse, repair, donation and responsible recycling.</p>
          <div class="auth-ladder">
            ${LADDER.map((s) => `<span class="auth-step" style="--accent:${s.accent}"><i class="${s.icon}"></i>${esc(s.label)}</span>`).join('')}
          </div>
          <ul class="auth-points">
            <li><i class="fas fa-circle-check"></i> Create your own free account</li>
            <li><i class="fas fa-circle-check"></i> Your waste history, saved privately</li>
            <li><i class="fas fa-circle-check"></i> Personal impact dashboard</li>
            <li><i class="fas fa-circle-check"></i> Works offline — no API keys needed</li>
          </ul>
        </div>
      </div>

      <div class="auth-panel">
        <div class="auth-card">
          <div class="auth-tabs" role="tablist">
            <button class="auth-tab${mode === 'login' ? ' active' : ''}" type="button" data-auth-tab="login" role="tab">Sign in</button>
            <button class="auth-tab${mode === 'signup' ? ' active' : ''}" type="button" data-auth-tab="signup" role="tab">Create account</button>
          </div>

          ${mode === 'login' ? loginFormHTML() : signupFormHTML()}

          <p class="auth-foot">
            <i class="fas fa-shield-halved"></i>
            Local demo app — accounts are stored in a SQLite file on this computer only.
          </p>
        </div>
        <button class="btn btn-ghost btn-sm" type="button" id="auth-theme" style="margin-top:14px;align-self:center">
          <i class="fas fa-moon"></i> Toggle dark mode
        </button>
      </div>
    </div>`
  }

  function loginFormHTML(prefillEmail) {
    return `
    <form id="login-form" class="auth-form" novalidate>
      <h2>Welcome back</h2>
      <p class="auth-form-sub">Sign in to continue to your waste dashboard.</p>

      <label class="field">
        <span>Email address</span>
        <input type="email" name="email" id="login-email" autocomplete="email" placeholder="you@example.com" value="${esc(prefillEmail || '')}" required />
        <small class="field-error" data-error-for="email"></small>
      </label>

      <label class="field">
        <span>Password</span>
        <input type="password" name="password" id="login-password" autocomplete="current-password" placeholder="Your password" required />
        <small class="field-error" data-error-for="password"></small>
      </label>

      <div class="auth-alert" id="login-alert" hidden></div>

      <button class="btn btn-primary btn-lg btn-block" type="submit" id="login-submit">
        <i class="fas fa-arrow-right-to-bracket"></i> Sign in
      </button>

      <p class="auth-switch">
        New here? <button type="button" class="link-btn" data-auth-tab="signup">Create an account</button>
      </p>
    </form>`
  }

  function signupFormHTML() {
    return `
    <form id="signup-form" class="auth-form" novalidate>
      <h2>Create your account</h2>
      <p class="auth-form-sub">Free forever. Takes about ten seconds.</p>

      <label class="field">
        <span>Full name</span>
        <input type="text" name="name" id="signup-name" autocomplete="name" placeholder="Alex Kumar" required />
        <small class="field-error" data-error-for="name"></small>
      </label>

      <label class="field">
        <span>Email address</span>
        <input type="email" name="email" id="signup-email" autocomplete="email" placeholder="you@example.com" required />
        <small class="field-error" data-error-for="email"></small>
      </label>

      <div class="field-row">
        <label class="field">
          <span>Password</span>
          <input type="password" name="password" id="signup-password" autocomplete="new-password" placeholder="At least 8 characters" required />
          <small class="field-error" data-error-for="password"></small>
        </label>
        <label class="field">
          <span>Confirm password</span>
          <input type="password" name="confirm" id="signup-confirm" autocomplete="new-password" placeholder="Repeat password" required />
          <small class="field-error" data-error-for="confirm"></small>
        </label>
      </div>

      <div class="auth-alert" id="signup-alert" hidden></div>

      <button class="btn btn-primary btn-lg btn-block" type="submit" id="signup-submit">
        <i class="fas fa-user-plus"></i> Create my account
      </button>

      <p class="auth-switch">
        Already have an account? <button type="button" class="link-btn" data-auth-tab="login">Sign in</button>
      </p>
    </form>`
  }

  function showAuthMessage(formId, message, kind) {
    const el = $('#' + formId + '-alert')
    if (!el) return
    el.className = 'auth-alert ' + (kind === 'error' ? 'is-error' : 'is-ok')
    el.innerHTML = `<i class="fas ${kind === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}"></i><span>${esc(message)}</span>`
    el.hidden = false
  }

  function clearFieldErrors(form) {
    $$('.field-error', form).forEach((el) => { el.textContent = '' })
    $$('.field', form).forEach((el) => el.classList.remove('has-error'))
    const alert = $('.auth-alert', form)
    if (alert) alert.hidden = true
  }

  function showFieldErrors(form, errors) {
    Object.entries(errors || {}).forEach(([key, msg]) => {
      const err = $('[data-error-for="' + key + '"]', form)
      if (err) {
        err.textContent = msg
        const field = err.closest('.field')
        if (field) field.classList.add('has-error')
      }
    })
  }

  let authMode = 'signup'

  function renderAuth(mode) {
    authMode = mode || authMode
    const root = $('#auth-root')
    const shell = $('#app-shell')
    if (!root) return
    root.innerHTML = authMark(authMode)
    root.hidden = false
    if (shell) shell.hidden = true
    document.body.classList.remove('booting')
    updateAuthThemeIcon()
    setTimeout(() => {
      const first = root.querySelector('input')
      if (first) first.focus()
    }, 80)
  }

  function showApp() {
    const root = $('#auth-root')
    const shell = $('#app-shell')
    if (root) { root.hidden = true; root.innerHTML = '' }
    if (shell) shell.hidden = false
    document.body.classList.remove('booting')
    updateProfileChip()
  }

  function updateProfileChip() {
    const u = state.user
    const initials = u ? (u.name || '?').trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase() : '?'
    const av = $('#profile-avatar')
    const nm = $('#profile-name')
    const em = $('#profile-email')
    if (av) av.textContent = initials
    if (nm) nm.textContent = u ? u.name : 'Account'
    if (em) em.textContent = u ? u.email : '—'
    const chip = $('#profile-chip')
    if (chip) chip.title = u ? `${u.name} · ${u.email}` : 'Your profile'
  }

  function updateAuthThemeIcon() {
    const btn = $('#auth-theme')
    if (!btn) return
    const dark = document.documentElement.getAttribute('data-theme') === 'dark'
    btn.innerHTML = `<i class="fas ${dark ? 'fa-sun' : 'fa-moon'}"></i> Toggle dark mode`
  }

  let loggingOut = false

  /** Session expired / not signed in: return to the auth screen. */
  function handleUnauthorized() {
    if (loggingOut) return
    state.user = null
    state.history = []
    authMode = 'login'
    renderAuth('login')
    const el = $('#login-alert')
    if (el) {
      el.className = 'auth-alert is-error'
      el.innerHTML = '<i class="fas fa-circle-exclamation"></i><span>Your session expired. Please sign in again.</span>'
      el.hidden = false
    }
  }

  async function doSignup(form) {
    clearFieldErrors(form)
    const body = {
      name: $('#signup-name').value,
      email: $('#signup-email').value,
      password: $('#signup-password').value,
      confirm: $('#signup-confirm').value,
    }
    const btn = $('#signup-submit')
    const original = btn.innerHTML
    btn.disabled = true
    btn.innerHTML = '<span class="spinner spinner-sm"></span> Creating your account…'
    try {
      const data = await api('/api/auth/signup', { method: 'POST', body: JSON.stringify(body) })
      state.user = data.user
      await afterAuth()
      toast(`Welcome to WasteWise AI, ${data.user.name.split(' ')[0]}!`)
    } catch (e) {
      if (e.data && e.data.errors) showFieldErrors(form, e.data.errors)
      else showAuthMessage('signup', e.message || 'Could not create your account.', 'error')
    } finally {
      btn.disabled = false
      btn.innerHTML = original
    }
  }

  async function doLogin(form) {
    clearFieldErrors(form)
    const body = { email: $('#login-email').value, password: $('#login-password').value }
    const btn = $('#login-submit')
    const original = btn.innerHTML
    btn.disabled = true
    btn.innerHTML = '<span class="spinner spinner-sm"></span> Signing in…'
    try {
      const data = await api('/api/auth/login', { method: 'POST', body: JSON.stringify(body) })
      state.user = data.user
      await afterAuth()
      toast(`Signed in as ${data.user.name}`)
    } catch (e) {
      if (e.data && e.data.errors) showFieldErrors(form, e.data.errors)
      else showAuthMessage('login', e.message || 'Incorrect email or password.', 'error')
    } finally {
      btn.disabled = false
      btn.innerHTML = original
    }
  }

  async function doLogout() {
    loggingOut = true
    try { await api('/api/auth/logout', { method: 'POST' }) } catch (e) { /* ignore */ }
    state.user = null
    state.history = []
    state.analysis = null
    state.rec = null
    state.answers = {}
    state.lastAction = null
    state.scan = { itemId: null, fileName: null, preview: null, describe: '' }
    if (location.hash) location.hash = '#/'
    setTimeout(() => { loggingOut = false }, 200)
    renderAuth('login')
    toast('You have been signed out')
  }

  /** Load per-account data and reveal the app. */
  async function afterAuth() {
    showApp()
    updateProfileChip()
    await Promise.all([loadSamples(), loadCampus()])
    await store.load()
    route()
  }

  function pickSample(id) {
    const s = state.samples.find((x) => x.id === id)
    if (!s) return
    state.scan.itemId = id
    state.scan.preview = null
    state.scan.fileName = null
    state.scan.describe = ''
    state.answers = {}
    toast(`${s.label} selected — ready to analyse`)
    route()
  }

  async function runAnalysis(payload) {
    const view = $('#view')
    // animated analysis feedback
    if (view) {
      view.innerHTML = analysisLoadingHTML()
      const steps = $$('#analysis-steps .sp')
      const fill = $('#analysis-progress')
      const stage = $('#analysis-stage')
      const messages = [
        'Reading image…',
        'Detecting object category…',
        'Assessing visible condition…',
        'Comparing with known item profiles…',
        'Preparing second-life pathways…',
      ]
      for (let i = 0; i < messages.length; i++) {
        if (stage) stage.textContent = messages[i]
        if (fill) fill.style.width = Math.round(((i + 1) / messages.length) * 100) + '%'
        if (steps[i]) {
          steps[i].classList.add('done')
        }
        if (steps[i + 1]) steps[i + 1].classList.add('active')
        await sleep(260)
      }
    }

    let result
    try {
      result = await api('/api/analyze', { method: 'POST', body: JSON.stringify(payload) })
    } catch (e) {
      // local fallback so the demo never breaks
      result = localAnalyzeFallback(payload)
    }
    if (!result || !result.ok) result = localAnalyzeFallback(payload)

    const primary = LADDER.find((s) => s.key === (result.signals ? topKey(result.signals) : 'reuse')) || LADDER[0]
    state.analysis = Object.assign({}, result, { primary })
    state.answers = {}
    state.rec = null
    state.lastAction = null
    await sleep(320)
    location.hash = '#/analysis'
  }

  function topKey(signals) {
    return Object.keys(signals).sort((a, b) => signals[b] - signals[a])[0]
  }

  function sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }

  function analysisLoadingHTML() {
    return `<section class="fade-in"><div class="card card-pad" style="max-width:660px;margin:40px auto;text-align:center">
      <span class="dz-icon" style="width:66px;height:66px;border-radius:20px;display:grid;place-items:center;font-size:1.5rem;color:#fff;background:linear-gradient(135deg,var(--green-600),var(--teal-500));margin:0 auto 18px"><i class="fas fa-wand-magic-sparkles"></i></span>
      <h2>Analysing your item…</h2>
      <p class="soft small" style="margin-top:6px">WasteWise AI is estimating the category and visible condition.</p>
      <div class="progress-track" style="margin:22px 0 10px"><div class="progress-fill" id="analysis-progress" style="width:6%"></div></div>
      <p class="small" id="analysis-stage" style="font-weight:600;color:var(--primary)">Starting…</p>
      <div class="stepper" id="analysis-steps" style="justify-content:center;margin-top:20px">
        <span class="sp active"><span class="n">1</span> Detect</span><span class="sep">›</span>
        <span class="sp"><span class="n">2</span> Condition</span><span class="sep">›</span>
        <span class="sp"><span class="n">3</span> Match</span><span class="sep">›</span>
        <span class="sp"><span class="n">4</span> Pathways</span><span class="sep">›</span>
        <span class="sp"><span class="n">5</span> Ready</span>
      </div>
      <p class="tiny muted" style="margin-top:18px">Demo Mode — results come from curated sample analyses, clearly labelled as AI estimates.</p>
    </div></section>`
  }

  function localAnalyzeFallback(payload) {
    const id = payload.itemId || guessId(payload.fileName || '')
    const s = state.samples.find((x) => x.id === id)
    const LADDER_BASE = {
      laptop: { reuse: 74, repair: 80, donate: 68, repurpose: 32, recycle: 28, disposal: 10 },
      bottle: { reuse: 46, repair: 4, donate: 6, repurpose: 76, recycle: 84, disposal: 12 },
      tshirt: { reuse: 66, repair: 46, donate: 84, repurpose: 72, recycle: 34, disposal: 14 },
      chair: { reuse: 42, repair: 84, donate: 38, repurpose: 58, recycle: 32, disposal: 26 },
      battery: { reuse: 4, repair: 12, donate: 2, repurpose: 4, recycle: 62, disposal: 92 },
      phone: { reuse: 76, repair: 70, donate: 80, repurpose: 38, recycle: 34, disposal: 12 },
    }
    return {
      ok: true,
      mode: 'demo',
      matched: Boolean(s),
      itemId: s ? s.id : null,
      detectedItem: s ? s.detectedItem : 'Unrecognised household item',
      category: s ? s.category : 'Mixed/Unknown',
      condition: s ? 'Visible condition assessed from the demo profile (visual assessment only)' : 'Visible condition assessment limited — image quality or angle restricted analysis',
      confidence: s ? 92 : 58,
      recommendedPath: s ? 'CHECK SECOND-LIFE PATHWAYS FIRST' : 'VERIFY ITEM → CHOOSE LOWEST-RISK PATHWAY',
      summary: s ? 'Demo profile result generated in the browser.' : 'The photo did not match a confident category. Answer a few questions and WasteWise AI will still build a safe recommendation.',
      safety: { level: 'caution', title: 'Handle with care', body: 'Verify the item locally. If it contains a battery, wiring or chemicals, use authorised collection.' },
      materials: ['Verify locally'],
      signals: LADDER_BASE[id] || { reuse: 44, repair: 42, donate: 40, repurpose: 48, recycle: 46, disposal: 34 },
      questions: QUESTIONS_FALLBACK[id] || QUESTIONS_FALLBACK.__default,
      estimateNotice: 'AI estimate from an image or demo profile — this is not a physical inspection.',
    }
  }

  const QUESTIONS_FALLBACK = {
    __default: [
      { id: 'other_user', text: 'Do you think another person could still use this item?', hint: '', options: [
        { label: 'Yes', value: 'yes', effects: { donate: 26, reuse: 20 } },
        { label: 'No', value: 'no', effects: { donate: -18, recycle: 8 } },
        { label: 'Not sure', value: 'unsure', effects: { donate: 4 } } ] },
      { id: 'repairable', text: 'Could it be repaired or repurposed with a simple, safe fix?', hint: '', options: [
        { label: 'Yes', value: 'yes', effects: { repair: 24, repurpose: 22 } },
        { label: 'No', value: 'no', effects: { repair: -18, recycle: 14 } },
        { label: 'Not sure', value: 'unsure', effects: { repair: 4, repurpose: 4 } } ] },
    ],
    laptop: [
      { id: 'power', text: 'Does the device still turn on and work normally?', hint: 'AI cannot test the device — this is based on your knowledge.', options: [
        { label: 'Yes', value: 'yes', effects: { reuse: 30, donate: 22, repair: 6, recycle: -22 } },
        { label: 'No', value: 'no', effects: { repair: 28, recycle: 12, reuse: -22, donate: -12 } },
        { label: 'Not sure', value: 'unsure', effects: { repair: 10, reuse: 2 } } ] },
      { id: 'repair_ok', text: 'Would you consider repairing it if the cost is reasonable?', hint: '', options: [
        { label: 'Yes', value: 'yes', effects: { repair: 26 } },
        { label: 'No', value: 'no', effects: { repair: -24, recycle: 14 } },
        { label: 'Not sure', value: 'unsure', effects: { repair: 6 } } ] },
      { id: 'other_user', text: 'Could another person still get good use from it as it is?', hint: '', options: [
        { label: 'Yes', value: 'yes', effects: { donate: 28, reuse: 16 } },
        { label: 'No', value: 'no', effects: { donate: -20, repurpose: 8 } },
        { label: 'Not sure', value: 'unsure', effects: { donate: 6 } } ] },
      { id: 'hazard', text: 'Do you see swelling, burn marks, exposed wiring, leaks or a chemical smell?', hint: 'Safety question — this overrides other preferences.', safety: true, options: [
        { label: 'No', value: 'no', effects: {} },
        { label: 'Yes', value: 'yes', effects: { disposal: 70, reuse: -45, donate: -45, repair: -45 } },
        { label: 'Not sure', value: 'unsure', effects: { disposal: 18, repair: -12 } } ] },
    ],
    battery: [
      { id: 'swollen', text: 'Is the battery swollen, punctured, leaking, hot or visibly damaged?', hint: 'Damaged lithium batteries are a fire and chemical hazard.', safety: true, options: [
        { label: 'Yes', value: 'yes', effects: { disposal: 90, recycle: 8, reuse: -60, repair: -60, donate: -60 } },
        { label: 'No', value: 'no', effects: { recycle: 16, disposal: 6 } },
        { label: 'Not sure', value: 'unsure', effects: { disposal: 30, recycle: 8 } } ] },
      { id: 'device_ok', text: 'Is the device it came from otherwise still working and worth keeping?', hint: '', options: [
        { label: 'Yes', value: 'yes', effects: { repair: 34, reuse: 10 } },
        { label: 'No', value: 'no', effects: { repair: -18, recycle: 14 } },
        { label: 'Not sure', value: 'unsure', effects: { repair: 4 } } ] },
      { id: 'receiving', text: 'Would you hand this in at an authorised battery collection point?', hint: 'Phone shops, campus e-waste bins and municipal drop-offs usually accept them.', options: [
        { label: 'Yes', value: 'yes', effects: { recycle: 26, disposal: 10 } },
        { label: 'No', value: 'no', effects: { recycle: -12 } },
        { label: 'Not sure', value: 'unsure', effects: {} } ] },
    ],
    bottle: [
      { id: 'clean', text: 'Is it clean, empty and free of food or chemical residue?', hint: 'Contaminated plastic usually cannot be recycled.', options: [
        { label: 'Yes', value: 'yes', effects: { recycle: 28, repurpose: 10 } },
        { label: 'No', value: 'no', effects: { recycle: -26, disposal: 18 } },
        { label: 'Not sure', value: 'unsure', effects: { recycle: -6 } } ] },
      { id: 'durable', text: 'Is it a sturdy container you or someone else could genuinely reuse?', hint: '', options: [
        { label: 'Yes', value: 'yes', effects: { reuse: 30, repurpose: 12 } },
        { label: 'No', value: 'no', effects: { reuse: -20, recycle: 10 } },
        { label: 'Not sure', value: 'unsure', effects: { reuse: 4 } } ] },
    ],
    tshirt: [
      { id: 'wearable', text: 'Is it still wearable — no major holes, stains or broken zips?', hint: '', options: [
        { label: 'Yes', value: 'yes', effects: { reuse: 26, donate: 26, recycle: -20 } },
        { label: 'No', value: 'no', effects: { repurpose: 26, recycle: 18, reuse: -18, donate: -18 } },
        { label: 'Not sure', value: 'unsure', effects: { donate: 6, repurpose: 6 } } ] },
      { id: 'repair_ok', text: 'Could a simple repair (stitch, patch, new button) make it wearable?', hint: '', options: [
        { label: 'Yes', value: 'yes', effects: { repair: 30, reuse: 10 } },
        { label: 'No', value: 'no', effects: { repair: -22, recycle: 10, repurpose: 8 } },
        { label: 'Not sure', value: 'unsure', effects: { repair: 4 } } ] },
      { id: 'other_user', text: 'Would another person wear it as it is?', hint: '', options: [
        { label: 'Yes', value: 'yes', effects: { donate: 26, reuse: 12 } },
        { label: 'No', value: 'no', effects: { donate: -18, repurpose: 10 } },
        { label: 'Not sure', value: 'unsure', effects: { donate: 5 } } ] },
    ],
    chair: [
      { id: 'structural', text: 'Is it still structurally safe to use as intended?', hint: '', options: [
        { label: 'Yes', value: 'yes', effects: { reuse: 28, donate: 24, recycle: -18 } },
        { label: 'No', value: 'no', effects: { repair: 26, repurpose: 14, reuse: -22, donate: -18 } },
        { label: 'Not sure', value: 'unsure', effects: { repair: 8, disposal: 6 } } ] },
      { id: 'repair_ok', text: 'Would a repair (re-glue, re-screw, new part) make it usable again?', hint: '', options: [
        { label: 'Yes', value: 'yes', effects: { repair: 30, repurpose: 6 } },
        { label: 'No', value: 'no', effects: { repair: -22, repurpose: 18, recycle: 12 } },
        { label: 'Not sure', value: 'unsure', effects: { repair: 5 } } ] },
      { id: 'splinters', text: 'Are there splinters, exposed nails/screws or broken metal parts?', hint: 'Safety question.', safety: true, options: [
        { label: 'No', value: 'no', effects: {} },
        { label: 'Yes', value: 'yes', effects: { disposal: 20, repair: 12, repurpose: 6 } },
        { label: 'Not sure', value: 'unsure', effects: { disposal: 8 } } ] },
    ],
    phone: null,
  }
  QUESTIONS_FALLBACK.phone = QUESTIONS_FALLBACK.laptop

  function guessId(text) {
    const t = String(text || '').toLowerCase()
    const map = [
      [['laptop', 'macbook', 'notebook', 'thinkpad'], 'laptop'],
      [['bottle', 'pet', 'flask', 'water'], 'bottle'],
      [['shirt', 'cloth', 'clothes', 'jeans', 'textile'], 'tshirt'],
      [['chair', 'stool', 'furniture', 'table', 'desk'], 'chair'],
      [['battery', 'cell', 'powerbank', 'power bank'], 'battery'],
      [['phone', 'mobile', 'smartphone', 'iphone', 'android'], 'phone'],
    ]
    for (const [keys, id] of map) if (keys.some((k) => t.includes(k))) return id
    return null
  }

  async function generateRecommendation() {
    const a = state.analysis
    if (!a) return
    let rec
    try {
      rec = await api('/api/recommend', {
        method: 'POST',
        body: JSON.stringify({ itemId: a.itemId, answers: state.answers, signals: a.matched ? null : a.signals }),
      })
    } catch (e) {
      rec = localRecommendFallback(a, state.answers)
    }
    if (!rec || !rec.ok) rec = localRecommendFallback(a, state.answers)
    state.rec = rec
    if (location.hash.indexOf('/plan') < 0) location.hash = '#/plan'
    route()
    toast(`Recommended pathway: ${rec.title} (${rec.confidence}% confidence)`)
  }

  function localRecommendFallback(a, answers) {
    const base = Object.assign({}, a.signals)
    const qs = a.questions || []
    let safetyFlag = false
    qs.forEach((q) => {
      const v = answers[q.id]
      const opt = (q.options || []).find((o) => o.value === v)
      if (!opt) return
      Object.entries(opt.effects || {}).forEach(([k, val]) => { if (k in base) base[k] += val })
      if (q.safety && v === 'yes') safetyFlag = true
    })
    Object.keys(base).forEach((k) => { base[k] = Math.max(0, Math.min(100, base[k])) })
    if (safetyFlag) base.disposal = Math.max(base.disposal, 88)
    const ranked = LADDER.map((s) => ({ key: s.key, score: base[s.key] })).sort((x, y) => y.score - x.score)
    const top = ranked[0]
    const alt = top.key === 'disposal' ? 'recycle' : 'reuse'
    const meta = LADDER.find((s) => s.key === top.key)
    const altMeta = LADDER.find((s) => s.key === alt)
    const margin = top.score - (ranked[1] ? ranked[1].score : 0)
    return {
      ok: true, pathway: top.key, title: meta.title, label: meta.label, icon: meta.icon, accent: meta.accent,
      why: ['Based on your answers and the demo profile, this is the highest-value safe pathway.', 'It keeps the item in circulation for as long as practical.'],
      next: ['Confirm the item locally and choose an appropriate service or collection point.', 'Record the outcome so your impact dashboard stays accurate.'],
      safety: safetyFlag ? ['A safety answer was flagged — use authorised collection and do not attempt repairs.'] : ['Verify locally before acting.'],
      alternateKey: alt, alternateTitle: altMeta.title, alternateWhy: 'A reasonable alternative if the primary action is not practical for you.',
      scores: base, ranked, confidence: Math.max(58, Math.min(96, Math.round(70 + margin * 0.5))),
      answered: Object.keys(answers).length, safetyFlag, inputs: [], notice: 'Recommendation is an AI estimate based on your answers. Verify locally before acting.',
      legend: LADDER.map((s) => ({ key: s.key, label: s.label, accent: s.accent })),
    }
  }

  async function recordAction(pathway) {
    const a = state.analysis
    const rec = state.rec
    if (!a) return
    const meta = ACTION_LABELS[pathway] || ACTION_LABELS.reuse
    const ev = {
      itemLabel: a.detectedItem,
      category: a.category,
      pathway,
      action: meta.action,
      confidence: rec ? rec.confidence : a.confidence,
      mode: 'demo',
      answers: state.answers,
    }
    state.lastAction = `${meta.action} — ${a.detectedItem}`
    route()
    toast(`Saved to your history: ${meta.action}`)
    const saved = await store.add(ev)
    // keep the plan screen's saved-confirmation in sync once the row lands
    if (saved && location.hash.indexOf('/plan') >= 0) route()
  }

  async function submitChallenge(form) {
    const org = ($('#ch-org') && $('#ch-org').value.trim()) || 'WasteWise Campus'
    const contact = ($('#ch-contact') && $('#ch-contact').value.trim()) || ''
    const goal = parseInt(($('#ch-goal') && $('#ch-goal').value) || '500', 10)
    try {
      await api('/api/challenge', { method: 'POST', body: JSON.stringify({ org, contact, goal }) })
      toast(`Campus Circularity Challenge started for ${org}`)
    } catch (e) {
      if (e.code === 'UNAUTHORIZED') return handleUnauthorized()
      toast('Could not register the challenge — please try again.', 'error')
    }
    form.reset()
  }

  /* ==================================================== global delegation */

  document.addEventListener('click', (e) => {
    const t = e.target
    const closest = (sel) => (t && t.closest ? t.closest(sel) : null)

    if (closest('#menu-btn')) { openSidebar(); return }
    const nav = closest('.nav-item')
    if (nav) { closeSidebar(); return }

    if (closest('#theme-btn')) { toggleTheme(); return }

    // sample selection
    const sample = closest('[data-sample]')
    if (sample) { pickSample(sample.getAttribute('data-sample')); return }

    if (closest('#clear-sample')) { state.scan.itemId = null; state.answers = {}; route(); return }
    if (closest('#clear-image')) { state.scan.preview = null; state.scan.fileName = null; route(); return }

    if (closest('#analyze-sample')) {
      if (!state.scan.itemId) return
      runAnalysis({ itemId: state.scan.itemId, source: 'demo' })
      return
    }

    if (closest('#analyze-btn')) {
      if (!state.scan.itemId && !state.scan.fileName) { toast('Choose a demo item or upload an image first', 'error'); return }
      runAnalysis({ itemId: state.scan.itemId, fileName: state.scan.fileName, source: 'demo' })
      return
    }

    if (closest('#dropzone')) {
      const fi = $('#file-input')
      if (fi) fi.click()
      return
    }

    if (closest('#describe-btn')) {
      const val = ($('#describe-input') && $('#describe-input').value.trim()) || ''
      if (!val) { toast('Type a short description of the item', 'error'); return }
      state.scan.describe = val
      state.scan.fileName = val
      runAnalysis({ fileName: val, source: 'demo' })
      return
    }

    // question options
    const opt = closest('[data-q]')
    if (opt) {
      const qid = opt.getAttribute('data-q')
      const val = opt.getAttribute('data-v')
      state.answers[qid] = val
      // live re-render of the question block + aside
      refreshSecondLife()
      return
    }

    if (closest('#reset-answers')) { state.answers = {}; state.rec = null; route(); return }

    if (closest('#recommend-btn')) { generateRecommendation(); return }

    // pathway cards on analysis screen explore the engine
    const pw = closest('[data-pathway]')
    if (pw) { location.hash = '#/secondlife'; return }

    const rec = closest('[data-record]')
    if (rec) { recordAction(rec.getAttribute('data-record')); return }

    if (closest('#plan-skip')) { toast('No outcome recorded — you can still see the plan later from History'); return }

    if (closest('#seed-history') || closest('#sidebar-demo-seed')) {
      seedDemoHistory()
      return
    }

    if (closest('#clear-history')) { clearHistory(); return }

    const del = closest('[data-del-history]')
    if (del) {
      const id = del.getAttribute('data-del-history')
      store.remove(id).then(() => { route(); toast('Record deleted') })
      return
    }

    // auth tabs / logout
    const authTab = closest('[data-auth-tab]')
    if (authTab) { renderAuth(authTab.getAttribute('data-auth-tab')); return }
    if (closest('#logout-btn') || closest('#logout-btn-sidebar')) { doLogout(); return }
    if (closest('#auth-theme')) { toggleTheme(); updateAuthThemeIcon(); return }
  })

  async function seedDemoHistory() {
    toast('Loading demo history…')
    await store.seed()
    route()
    toast('Demo history loaded (12 records)')
  }

  async function clearHistory() {
    await store.clear()
    route()
    toast('Waste history cleared (only your account)')
  }

  document.addEventListener('submit', (e) => {
    if (!e.target) return
    if (e.target.id === 'challenge-form') {
      e.preventDefault()
      submitChallenge(e.target)
    }
    if (e.target.id === 'signup-form') {
      e.preventDefault()
      doSignup(e.target)
    }
    if (e.target.id === 'login-form') {
      e.preventDefault()
      doLogin(e.target)
    }
  })

  document.addEventListener('change', (e) => {
    if (e.target && e.target.id === 'file-input') {
      const f = e.target.files && e.target.files[0]
      if (!f) return
      if (f.size > 5 * 1024 * 1024) { toast('Image is larger than 5 MB', 'error'); return }
      state.scan.fileName = f.name
      state.scan.itemId = guessId(f.name)
      const reader = new FileReader()
      reader.onload = () => { state.scan.preview = reader.result; route() }
      reader.readAsDataURL(f)
    }
  })

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebar()
    if (e.key === 'Enter' && e.target && e.target.id === 'describe-input') {
      const btn = $('#describe-btn')
      if (btn) btn.click()
    }
  })

  // drag & drop
  document.addEventListener('dragover', (e) => {
    const dz = e.target && e.target.closest ? e.target.closest('#dropzone') : null
    if (dz) { e.preventDefault(); dz.classList.add('dragover') }
  })
  document.addEventListener('dragleave', (e) => {
    const dz = e.target && e.target.closest ? e.target.closest('#dropzone') : null
    if (dz) dz.classList.remove('dragover')
  })
  document.addEventListener('drop', (e) => {
    const dz = e.target && e.target.closest ? e.target.closest('#dropzone') : null
    if (!dz) return
    e.preventDefault()
    dz.classList.remove('dragover')
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]
    if (!f || !/^image\//.test(f.type)) { toast('Please drop an image file', 'error'); return }
    state.scan.fileName = f.name
    state.scan.itemId = guessId(f.name)
    const reader = new FileReader()
    reader.onload = () => { state.scan.preview = reader.result; route() }
    reader.readAsDataURL(f)
  })

  function refreshSecondLife() {
    // Re-render options state without losing scroll position
    $$('[data-q]').forEach((b) => {
      const qid = b.getAttribute('data-q')
      const val = b.getAttribute('data-v')
      b.classList.toggle('selected', state.answers[qid] === val)
    })
    const a = state.analysis
    const qs = a ? a.questions : []
    const answered = qs.filter((q) => state.answers[q.id]).length
    const btn = $('#recommend-btn')
    if (btn) {
      btn.disabled = answered !== qs.length
      btn.innerHTML = `<i class="fas fa-wand-magic-sparkles"></i> ${answered === qs.length ? 'Generate my action plan' : `Answer all ${qs.length} questions (${answered}/${qs.length})`}`
    }
    // live ladder + aside
    const preview = localRecommendFallback(a, state.answers)
    const ladder = $('#ladder-live')
    if (ladder) ladder.innerHTML = ladderHTML(preview.pathway, preview.scores)
    const aside = document.querySelector('aside')
    if (aside && a) {
      const first = aside.querySelector('.card')
      if (first && answered > 0) {
        const tmp = document.createElement('div')
        tmp.innerHTML = `
          <span class="eyebrow">Live recommendation</span>
          <div class="pathway-badge" style="--accent:${preview.accent};margin:12px 0">
            <i class="${preview.icon}"></i>
            <div><span class="pb-label">Best next step</span><strong>${esc(preview.title)}</strong></div>
          </div>
          <p class="small soft">Based on your answers so far — ${answered}/${qs.length} answered.</p>
          <div style="margin-top:16px">
            ${LADDER.map((s) => `<div class="score-row" style="--accent:${s.accent}">
              <span class="sr-label">${esc(s.label)}</span>
              <span class="score-bar"><span style="width:${preview.scores[s.key]}%"></span></span>
              <span class="sr-val">${preview.scores[s.key]}</span>
            </div>`).join('')}
          </div>
          <div style="display:flex;align-items:center;gap:10px;margin-top:14px;flex-wrap:wrap">
            <span class="chip chip-green"><i class="fas fa-gauge-high"></i> Confidence ${preview.confidence}%</span>
            ${preview.safetyFlag ? '<span class="chip chip-red"><i class="fas fa-triangle-exclamation"></i> Safety override</span>' : ''}
          </div>
          <button class="btn btn-outline btn-block" type="button" disabled style="margin-top:14px">Answer all questions to continue</button>`
        first.innerHTML = tmp.innerHTML
      } else if (first && answered === 0) {
        first.innerHTML = `
          <span class="eyebrow">Live recommendation</span>
          <h3 style="margin:6px 0">Waiting for your answers</h3>
          <p class="small soft">Answer the questions and the recommended pathway updates here in real time — no page reload.</p>
          <div class="progress-track" style="margin-top:16px"><div class="progress-fill" style="width:0%"></div></div>
          <p class="tiny muted" style="margin-top:8px">0 of ${qs.length} answered</p>`
      }
    }
  }

  /* ------------------------------------------------------------- theming */

  function toggleTheme() {
    const root = document.documentElement
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
    root.setAttribute('data-theme', next)
    try { localStorage.setItem('ww-theme', next) } catch (e) {}
    updateThemeIcon()
    // re-render charts with new palette
    if (location.hash.indexOf('/impact') >= 0) { destroyAllCharts(); renderImpactCharts() }
    if (location.hash.indexOf('/campus') >= 0) { destroyAllCharts(); renderCampusChart() }
  }

  function updateThemeIcon() {
    const btn = $('#theme-btn')
    if (!btn) return
    const dark = document.documentElement.getAttribute('data-theme') === 'dark'
    btn.innerHTML = `<i class="fas ${dark ? 'fa-sun' : 'fa-moon'}"></i>`
  }

  /* ------------------------------------------------------------ app boot */

  async function boot() {
    updateThemeIcon()
    window.addEventListener('hashchange', route)

    // Who is signed in? The session lives in an httpOnly cookie.
    let me = null
    try {
      const data = await api('/api/auth/me')
      me = data ? data.user : null
    } catch (e) {
      me = null
    }

    if (!me) {
      renderAuth('signup')
      state.booted = true
      return
    }

    state.user = me
    await afterAuth()
    state.booted = true
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot)
  else boot()
})()
