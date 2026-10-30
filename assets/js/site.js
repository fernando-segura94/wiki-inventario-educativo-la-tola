(() => {
  const body = document.body;
  const root = body.dataset.root || '';
  const pageId = body.dataset.page || 'home';
  const site = document.getElementById('site');
  const route = (path) => `${root}${path}`;
  const textNode = (tag, text, className) => {
    const el = document.createElement(tag);
    if (text !== undefined && text !== null) el.textContent = text;
    if (className) el.className = className;
    return el;
  };
  const linkTo = (id, navigation) => navigation.find((item) => item.id === id)?.path;

  function start() {
    try {
      const data = window.SIGMA_PROJECT_DATA;
      if (!data) throw new Error('Falta la información del proyecto.');
      renderSite(data);
    } catch (error) {
      site.innerHTML = '';
      const message = textNode('section', '', 'error-panel');
      message.append(textNode('h1', 'No se pudo abrir el contenido'));
      message.append(textNode('p', 'Revisa que el archivo assets/js/project-data.js esté presente y cargue antes del script del sitio.'));
      message.append(textNode('p', 'En la carpeta del proyecto ejecuta: python -m http.server 8000 y visita http://localhost:8000.'));
      site.append(message);
    }
  }

  function renderSite(data) {
    const current = data.navigation.find((item) => item.id === pageId) || data.navigation[0];
    const page = data.pages[pageId] || data.pages.home;
    document.title = `${page.title} | ${data.site.name}`;
    document.getElementById('brand-name').textContent = data.site.name;
    document.getElementById('brand-subtitle').textContent = data.site.location;
    document.getElementById('site-version').textContent = data.site.version;
    document.getElementById('site-credit').textContent = `Desarrollado por ${data.site.author} · Proyecto Aplicado`;
    buildNavigation(data.navigation, current);
    buildPage(page, current, data.navigation, data.site.references);
    document.getElementById('menu-toggle').addEventListener('click', () => {
      const open = body.classList.toggle('nav-open');
      document.getElementById('menu-toggle').setAttribute('aria-expanded', String(open));
    });
    const search = document.getElementById('page-search');
    search.addEventListener('input', () => {
      const needle = search.value.trim().toLocaleLowerCase('es');
      document.querySelectorAll('.nav-link').forEach((a) => {
        a.hidden = needle.length > 0 && !a.textContent.toLocaleLowerCase('es').includes(needle);
      });
      document.querySelectorAll('.nav-group').forEach((group) => {
        group.hidden = !group.querySelector('.nav-link:not([hidden])');
      });
    });
  }

  function buildNavigation(items, current) {
    const container = document.getElementById('navigation');
    container.innerHTML = '';
    let activeGroup = '';
    let group;
    for (const item of items) {
      if (item.phase !== activeGroup) {
        activeGroup = item.phase;
        group = textNode('section', '', 'nav-group');
        group.append(textNode('h2', activeGroup, 'nav-group-title'));
        container.append(group);
      }
      const a = textNode('a', item.label, `nav-link${item.id === current.id ? ' active' : ''}`);
      a.href = route(item.path);
      if (item.id === current.id) a.setAttribute('aria-current', 'page');
      group.append(a);
    }
  }

  function buildPage(page, current, navigation, references) {
    const main = document.getElementById('page-content');
    main.innerHTML = '';
    const breadcrumb = textNode('div', '', 'breadcrumb');
    breadcrumb.append(textNode('span', current.phase));
    breadcrumb.append(textNode('span', '/', 'breadcrumb-separator'));
    breadcrumb.append(textNode('span', current.label, 'breadcrumb-current'));
    main.append(breadcrumb);

    const header = textNode('header', '', 'page-header');
    header.append(textNode('p', page.eyebrow || current.phase.toUpperCase(), 'eyebrow'));
    header.append(textNode('h1', page.title, 'page-title'));
    header.append(textNode('p', page.intro || '', 'page-intro'));
    main.append(header);

    const content = textNode('div', '', 'content-blocks');
    (page.blocks || []).forEach((block) => content.append(renderBlock(block, navigation, references)));
    main.append(content);

    const refLink = navigation.find((item) => item.id === 'referencias');
    if (refLink) {
      const footerLink = textNode('a', 'Fuentes y referencias del proyecto', 'reference-shortcut');
      footerLink.href = route(refLink.path);
      main.append(footerLink);
    }

    const index = navigation.findIndex((item) => item.id === current.id);
    const next = navigation.slice(index + 1).find((item) => item.phase === current.phase);
    if (next) {
      const nextLink = textNode('a', '', 'next-page');
      nextLink.href = route(next.path);
      nextLink.append(textNode('span', 'Siguiente página', 'next-label'));
      nextLink.append(textNode('strong', next.label));
      main.append(nextLink);
    }
  }

  function renderBlock(block, navigation, references) {
    if (block.type === 'heading') return textNode('h2', block.text, 'section-heading');
    if (block.type === 'paragraph') return textNode('p', block.text, 'body-copy');
    if (block.type === 'note' || block.type === 'callout') {
      const box = textNode('aside', '', block.type === 'note' ? 'note' : 'callout');
      if (block.title) box.append(textNode('h3', block.title));
      box.append(textNode('p', block.text));
      return box;
    }
    if (block.type === 'bullets') {
      const list = document.createElement('ul'); list.className = 'bullet-list';
      block.items.forEach((item) => list.append(textNode('li', item)));
      return list;
    }
    if (block.type === 'metrics') {
      const grid = textNode('div', '', 'metric-grid');
      block.items.forEach((item) => {
        const card = textNode('article', '', 'metric-card');
        card.append(textNode('strong', item.value)); card.append(textNode('span', item.label)); grid.append(card);
      });
      return grid;
    }
    if (block.type === 'cards') {
      const grid = textNode('div', '', 'card-grid');
      block.items.forEach((item) => {
        const path = linkTo(item.link, navigation);
        const card = textNode(path ? 'a' : 'article', '', 'topic-card');
        if (path) card.href = route(path);
        card.append(textNode('h3', item.title)); card.append(textNode('p', item.text));
        if (path) card.append(textNode('span', 'Abrir sección →', 'card-action'));
        grid.append(card);
      });
      return grid;
    }
    if (block.type === 'table') {
      const wrap = textNode('div', '', 'table-wrap');
      const table = document.createElement('table');
      const thead = document.createElement('thead'); const header = document.createElement('tr');
      block.columns.forEach((col) => header.append(textNode('th', col)));
      thead.append(header); table.append(thead);
      const tbody = document.createElement('tbody');
      block.rows.forEach((row) => {
        const tr = document.createElement('tr'); row.forEach((value) => tr.append(textNode('td', value)));
        tbody.append(tr);
      });
      table.append(tbody); wrap.append(table); return wrap;
    }
    if (block.type === 'links') {
      const section = textNode('section', '', 'resource-list');
      if (block.title) section.append(textNode('h2', block.title, 'section-heading'));
      const ul = document.createElement('ul');
      block.items.forEach((item) => {
        const li = document.createElement('li'); const a = textNode('a', item.label);
        a.href = item.external ? item.href : route(item.href);
        if (item.external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
        li.append(a); ul.append(li);
      });
      section.append(ul); return section;
    }
    if (block.type === 'diagram') {
      const figure = document.createElement('figure'); figure.className = 'diagram';
      const img = document.createElement('img'); img.src = route(block.src); img.alt = block.alt; img.loading = 'lazy';
      const cap = textNode('figcaption', block.caption);
      const a = textNode('a', 'Abrir o guardar imagen', 'diagram-link'); a.href = route(block.src); a.target = '_blank'; a.rel = 'noopener noreferrer';
      figure.append(img, cap, a); return figure;
    }
    if (block.type === 'timeline') {
      const list = textNode('ol', '', 'timeline');
      block.items.forEach((item) => {
        const li = document.createElement('li');
        li.append(textNode('span', item.periodo, 'timeline-period'));
        li.append(textNode('h3', item.title)); li.append(textNode('p', item.text)); list.append(li);
      });
      return list;
    }
    if (block.type === 'references') {
      const list = textNode('div', '', 'reference-list');
      const table = document.createElement('table');
      const head = document.createElement('thead'); const row = document.createElement('tr');
      ['Entidad o autor', 'Documento', 'Enlace'].forEach((label) => row.append(textNode('th', label)));
      head.append(row); table.append(head);
      const body = document.createElement('tbody');
      (references || []).forEach((ref) => {
        const tr = document.createElement('tr');
        tr.append(textNode('td', ref.author), textNode('td', ref.title));
        const td = document.createElement('td');
        if (ref.url && ref.url !== '#') { const a = textNode('a', 'Consultar fuente'); a.href = ref.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; td.append(a); }
        else td.append(textNode('span', 'PDF entregado para este proyecto'));
        tr.append(td); body.append(tr);
      });
      table.append(body); list.append(table); return list;
    }
    return document.createDocumentFragment();
  }

  start();
})();
