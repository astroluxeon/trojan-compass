// Mobile presentation reuses the saved directory, filters, map assets and actions.
// Moving the original nodes preserves their event handlers and current values.
export function setupMobileCampus({ search, categories, panel, resetMap, showResults, buildings, notify }) {
  const media = matchMedia('(max-width: 767px)')
  const header = document.createElement('header')
  header.className = 'campus-mobile-header'
  const brand = document.createElement('a')
  brand.href = '#map'
  brand.setAttribute('aria-label', 'Trojan Compass campus map')
  brand.innerHTML = '<img src="./assets/usc-monogram.png" alt="USC"><span class="campus-brand-divider" aria-hidden="true"></span><span class="campus-brand-name">Trojan <span>Compass</span></span>'
  brand.onclick = e => { e.preventDefault(); resetMap(); close() }
  const campuses = document.createElement('nav')
  campuses.setAttribute('aria-label', 'Campus')
  const upc = button('UPC', () => { resetMap(); close() })
  upc.setAttribute('aria-label', 'University Park Campus')
  upc.setAttribute('aria-current', 'location')
  const hsc = button('HSC', () => document.querySelector('[data-cy="top-bar-btn-1"]').click())
  hsc.setAttribute('aria-label', 'Health Sciences Campus')
  campuses.append(upc, hsc)
  campuses.className = 'campus-switcher'
  header.append(brand)

  const dock = document.createElement('div')
  dock.className = 'campus-mobile-dock'
  const sheet = document.createElement('section')
  sheet.className = 'campus-mobile-sheet'
  sheet.id = 'campus-mobile-sheet'
  sheet.hidden = true
  const grip = button('', close)
  grip.className = 'campus-sheet-grip'
  grip.setAttribute('aria-label', 'Collapse panel')
  grip.innerHTML = '<span></span>'
  let swipeY
  grip.onpointerdown = e => { swipeY = e.clientY; grip.setPointerCapture(e.pointerId) }
  grip.onpointerup = e => { if (swipeY !== undefined && e.clientY - swipeY > 32) close(); swipeY = undefined }
  grip.onpointercancel = () => { swipeY = undefined }
  const content = document.createElement('div')
  content.className = 'campus-sheet-content'
  sheet.append(grip, content)
  const input = search.querySelector('input')
  const results = search.querySelector('.demo-results')
  input.placeholder = 'Search Trojan Compass'
  const bar = document.createElement('div')
  bar.className = 'campus-search-bar'
  const lens = document.createElement('span')
  lens.className = 'campus-search-lens'
  lens.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>'
  const options = button('', () => { if (active) close(); else open('options') })
  options.className = 'campus-search-options'
  options.setAttribute('aria-label', 'Map options')
  options.setAttribute('aria-expanded', 'false')
  options.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2.5" fill="white"/><circle cx="15" cy="17" r="2.5" fill="white"/></svg>'
  bar.append(lens, options)
  const searchTray = document.createElement('div')
  searchTray.className = 'campus-search-tray'
  searchTray.append(bar)
  dock.append(sheet, searchTray)
  document.body.append(header, dock)
  const homes = new Map([input, results, categories, panel].map(node => {
    const marker = document.createComment('Original campus control position')
    node.before(marker)
    return [node, marker]
  }))
  let active = null
  let returnFocus = null

  function restore() {
    for (const [node, marker] of homes) {
      if (node !== input || !media.matches) marker.after(node)
    }
    if (media.matches && input.parentElement !== bar) bar.insertBefore(input, options)
    panel.hidden = true
  }
  function close() {
    restore()
    sheet.hidden = true
    active = null
    options.setAttribute('aria-expanded', 'false')
    input.blur()
    returnFocus?.focus({ preventScroll: true })
    returnFocus = null
    resizeMap()
  }
  function open(id, title, preserveResults = false) {
    if (!media.matches) return
    restore()
    content.replaceChildren()
    active = id
    returnFocus = options
    sheet.dataset.tool = id
    sheet.setAttribute('aria-label', title ?? ({search:'Search campus locations',options:'Map options',filters:'Campus filters',campus:'Choose campus',more:'More map tools'}[id] ?? 'Map information'))
    sheet.hidden = false
    options.setAttribute('aria-expanded', 'true')
    options.setAttribute('aria-controls', sheet.id)
    if (id === 'search') {
      content.append(results)
      if (!preserveResults && !input.value.trim()) showResults(buildings.filter(b => /\((LAW|THH|TCC|VKC)\)/.test(b.name)).slice(0, 4))
    } else if (id === 'options') {
      const actions = document.createElement('div')
      actions.className = 'campus-option-actions'
      actions.append(button('Filters', () => open('filters')), button('Campus', () => open('campus')), button('More', () => open('more')))
      content.append(actions)
    } else if (id === 'filters') {
      const controls = []
      const sync = () => controls.forEach(({ source, target }) => target.setAttribute('aria-checked', source.getAttribute('aria-checked')))
      const clear = button('Clear filters', () => { document.querySelector('#clear').click(); sync() })
      clear.className = 'campus-clear-filters'
      const list = document.createElement('div')
      list.className = 'campus-filter-list'
      const rows = [...categories.querySelectorAll('.category')]
      const rank = row => row.id.includes('buildings') ? 0 : row.id.includes('parking') ? 1 : 2
      rows.sort((a, b) => rank(a) - rank(b))
      for (const original of rows) {
        const name = original.querySelector('.name')
        const source = original.querySelector('[role="checkbox"]')
        const row = document.createElement('div')
        row.className = 'campus-filter-row'
        const browse = button('', () => {
          if (name.getAttribute('role') === 'button') name.click()
          else notify('This category is available on the official USC map.')
        })
        browse.className = 'campus-filter-name'
        browse.setAttribute('aria-label', `Browse ${name.textContent.trim()}`)
        const icon = original.querySelector('img')?.cloneNode(true)
        if (icon) { icon.removeAttribute('class'); browse.append(icon) }
        browse.append(Object.assign(document.createElement('span'), {textContent: name.textContent.trim()}))
        const toggle = button('', () => { source.click(); sync() })
        toggle.className = 'campus-filter-switch'
        toggle.setAttribute('role', 'switch')
        toggle.setAttribute('aria-label', `Show ${name.textContent.trim()}`)
        toggle.innerHTML = '<span></span>'
        controls.push({source, target:toggle})
        row.append(browse, toggle)
        list.append(row)
      }
      sync()
      content.append(clear, list)
    } else if (id === 'campus') {
      const recenter = button('Recenter map', () => { resetMap(); close(); notify('Map centered on University Park Campus.') })
      recenter.className = 'campus-recenter'
      content.append(campuses, recenter)
    } else if (id === 'more') {
      const actions = document.createElement('div')
      actions.className = 'campus-more-actions'
      actions.append(
        button('My location', () => document.querySelector('#location-services').click()),
        button('Campus tours', () => document.querySelector('#sidebar-tab-tours').click()),
        button('Street View', () => notify('Street View is available on the official USC map.')),
        button('Map gestures', () => notify('Drag to move. Pinch to zoom. Tap a building to explore inside.')),
      )
      const credits = document.querySelector('#atlas3d').cloneNode(true)
      credits.removeAttribute('id')
      credits.className = 'campus-mobile-credits'
      credits.querySelector('.cookie-preferences-link').onclick = () => document.querySelector('#atlas3d .cookie-preferences-link').click()
      content.append(actions, credits)
    } else {
      content.append(panel)
      panel.hidden = false
      panel.dataset.mobileTitle = ['share'].includes(id) ? 'hidden' : 'visible'
    }
    if (id !== 'search') grip.focus({ preventScroll: true })
    resizeMap()
  }
  function resizeMap() {
    document.body.style.setProperty('--campus-dock-height', `${dock.getBoundingClientRect().height}px`)
  }
  new ResizeObserver(resizeMap).observe(dock)
  document.addEventListener('campus:panel-open', e => {
    if (media.matches) open(e.detail.title === 'Share this map' ? 'share' : 'info', e.detail.title)
  })
  document.addEventListener('campus:results', () => {
    if (media.matches && active === 'filters') {
      input.value = ''
      open('search', undefined, true)
    }
  })
  document.addEventListener('keydown', e => { if (media.matches && e.key === 'Escape' && active) close() })
  for (const [id, action] of [
    ['search-link', () => { open('search'); input.focus() }],
    ['locations-and-tours-link', () => open('filters')],
    ['map-link', () => { close(); document.querySelector('#map').focus() }],
    ['tool-bar-link', () => input.focus()],
  ]) document.getElementById(id)?.addEventListener('click', e => {
    if (media.matches) { e.preventDefault(); action() }
  })
  function adapt() {
    close()
    document.body.classList.toggle('mobile-campus', media.matches)
    document.body.classList.remove('demo-sidebar-open')
    const sidebar = document.querySelector('#sidebar')
    sidebar.inert = true
    sidebar.setAttribute('aria-hidden', 'true')
    categories.hidden = !!input.value.trim()
    resizeMap()
  }
  input.addEventListener('focus', () => { if (media.matches && active !== 'search') open('search') })
  input.addEventListener('input', () => { if (media.matches && active !== 'search') open('search', undefined, true) })
  media.addEventListener('change', adapt)
  adapt()
}

function button(label, action) {
  const element = document.createElement('button')
  element.type = 'button'
  element.textContent = label
  element.onclick = action
  return element
}
