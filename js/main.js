/**
 * Plazoleta de Comidas Virtual — Sabores Ocañeros
 * Lógica principal (Fase 1: demo académica)
 */

function getEmprendimientos() {
  const customEntries = getBusinessCatalogEntries();
  const merged = [];
  const seen = new Set();

  customEntries.forEach(entry => {
    const normalized = entry.nombre?.toLowerCase();
    const fallback = EMPRENDIMIENTOS_DATA.find(emp => emp.id === entry.id || emp.nombre.toLowerCase() === normalized);
    const enriched = {
      ...(fallback || {}),
      ...entry,
      id: entry.id || fallback?.id || slugify(entry.nombre || 'emprendimiento'),
      nombre: entry.nombre || fallback?.nombre || 'Emprendimiento',
      descripcion: entry.descripcion || fallback?.descripcion || 'Emprendimiento aliado',
      rating: Number(entry.rating || fallback?.rating || 5),
      imagen: resolveAssetUrl(entry.imagen || entry.cover || fallback?.imagen || '', ''),
      logo: resolveAssetUrl(entry.logo || fallback?.logo || '', ''),
      cover: resolveAssetUrl(entry.cover || entry.imagen || '', ''),
      categoria: entry.categoria || '',
      telefono: entry.telefono || '',
      direccion: entry.direccion || '',
      email: entry.email || '',
      representante: entry.representante || ''
    };
    if (!seen.has(enriched.id)) {
      merged.push(enriched);
      seen.add(enriched.id);
    }
  });

  EMPRENDIMIENTOS_DATA.forEach(emp => {
    const normalized = emp.nombre.toLowerCase();
    if (!merged.some(item => item.id === emp.id || item.nombre.toLowerCase() === normalized)) {
      merged.push({
        ...emp,
        imagen: resolveAssetUrl(emp.imagen, ''),
        logo: resolveAssetUrl(emp.logo, '')
      });
    }
  });

  return merged;
}

document.addEventListener('DOMContentLoaded', () => {
  const emprendimientosGrid = document.getElementById('emprendimientos-grid');
  if (emprendimientosGrid) {
    renderEmprendimientos(emprendimientosGrid);
  }

  initModals();
  initMobileMenu();
  initProtectedActions();
  initForms();
  updateHeaderSession();
});

function renderEmprendimientos(container) {
  const emprendimientos = getEmprendimientos();
  container.innerHTML = emprendimientos.map(emp => `
    <article class="card-negocio" data-id="${emp.id}">
      <div class="card-negocio__top">
        <div class="card-negocio__image-wrap">
          <img src="${emp.imagen}" alt="${emp.nombre}" class="card-negocio__image" onerror="this.style.display='none'">
        </div>
        <div class="card-negocio__logo-wrap">
          <img src="${emp.logo}" alt="Logo ${emp.nombre}" class="card-negocio__logo">
        </div>
      </div>
      <div class="card-negocio__body">
        <div class="card-negocio__stars" aria-label="Calificación ${emp.rating} de 5">${renderStars(emp.rating)}</div>
        <h3 class="card-negocio__name">${emp.nombre}</h3>
        <p class="card-negocio__desc">${emp.descripcion}</p>
        <div class="card-negocio__btns">
          <button type="button" class="btn btn--outline card-negocio__btn btn-ver-perfil" data-profile-id="${emp.id}" data-negocio="${emp.nombre}">VER PERFIL</button>
          <button type="button" class="btn btn--primary card-negocio__btn btn-ver-menu" data-protected="menu" data-negocio-id="${emp.id}" data-negocio="${emp.nombre}">VER MENÚ</button>
        </div>
      </div>
    </article>
  `).join('');
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

function initModals() {
  document.querySelectorAll('[data-modal]').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.modal));
  });

  document.querySelectorAll('[data-close-modal]').forEach(el => {
    el.addEventListener('click', closeAllModals);
  });

  document.querySelectorAll('[data-switch-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeAllModals();
      setTimeout(() => openModal(btn.dataset.switchModal), 200);
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAllModals();
  });
}

function openModal(name) {
  const modal = document.getElementById(`modal-${name}`);
  if (!modal) return;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeAllModals() {
  document.querySelectorAll('.modal.is-open').forEach(modal => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  });
  document.body.style.overflow = '';
}

function initMobileMenu() {
  const toggle = document.querySelector('.header__menu-toggle');
  const nav = document.querySelector('.header__nav');
  const actions = document.querySelector('.header__actions');
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    actions.classList.toggle('is-open', isOpen);
    toggle.setAttribute('aria-expanded', isOpen);
  });
}

function getMenuPageUrl(negocioId) {
  const inPages = window.location.pathname.includes('/pages/');
  const base = inPages
    ? `menu.html?id=${encodeURIComponent(negocioId)}`
    : `pages/menu.html?id=${encodeURIComponent(negocioId)}`;
  return withAuthParam(base);
}

function getProfilePageUrl(negocioId) {
  const inPages = window.location.pathname.includes('/pages/');
  const base = inPages
    ? `perfil.html?id=${encodeURIComponent(negocioId)}`
    : `pages/perfil.html?id=${encodeURIComponent(negocioId)}`;
  return withAuthParam(base);
}

function initProtectedActions() {
  document.addEventListener('click', e => {
    const profileBtn = e.target.closest('[data-profile-id]');
    if (profileBtn) {
      window.location.href = getProfilePageUrl(profileBtn.dataset.profileId);
      return;
    }

    const btn = e.target.closest('[data-protected]');
    if (!btn) return;

    if (!isLoggedIn()) {
      e.preventDefault();
      const hasLoginModal = document.getElementById('modal-login');
      if (hasLoginModal) {
        showToast('Debes iniciar sesión para ver menús, precios y promociones.');
        setTimeout(() => openModal('login'), 400);
      } else {
        const indexUrl = window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
        window.location.href = indexUrl;
      }
      return;
    }

    const negocioId = btn.dataset.negocioId;
    if (negocioId) {
      window.location.href = getMenuPageUrl(negocioId);
    }
  });
}

function initForms() {
  document.querySelectorAll('.registro-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.registro-tab').forEach(t => t.classList.remove('registro-tab--active'));
      tab.classList.add('registro-tab--active');

      const target = tab.dataset.tab;
      document.querySelectorAll('[data-registro-form]').forEach(form => {
        form.classList.toggle('form--hidden', form.dataset.registroForm !== target);
      });
    });
  });

  document.getElementById('form-login')?.addEventListener('submit', e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    const rol = data.rol === 'emprendimiento' ? 'emprendimiento' : 'cliente';
    setLoggedIn(rol, {
      email: data.email,
      negocio: rol === 'emprendimiento' ? (data.email.split('@')[0] || 'Mi negocio') : ''
    });
    closeAllModals();

    if (rol === 'emprendimiento') {
      showToast('Sesión de emprendimiento iniciada. Abriendo panel...');
      setTimeout(() => {
        const dash = window.location.pathname.includes('/pages/')
          ? withAuthParam('dashboard.html')
          : withAuthParam('pages/dashboard.html');
        window.location.href = dash;
      }, 500);
      return;
    }

    updateHeaderSession(true);
    showToast('¡Sesión iniciada! Ya puedes explorar menús y promociones.');
    setTimeout(() => {
      window.location.href = getDashboardUrl();
    }, 600);
  });

  document.getElementById('form-registro-cliente')?.addEventListener('submit', e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    setLoggedIn('cliente', {
      nombre: data.nombre,
      email: data.email,
      telefono: data.telefono,
      direccion: data.direccion
    });
    closeAllModals();
    updateHeaderSession(true);
    showToast('¡Cuenta creada! Teléfono y dirección listos para domicilio.');
    setTimeout(() => {
      window.location.href = getDashboardUrl();
    }, 700);
  });

  document.getElementById('form-registro-emprendimiento')?.addEventListener('submit', e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    setLoggedIn('emprendimiento', {
      nombre: data.representante,
      negocio: data.negocio,
      email: data.email,
      telefono: data.telefono,
      direccion: data.direccion,
      categoria: data.categoria
    });
    closeAllModals();
    showToast('¡Emprendimiento registrado! Abriendo tu panel...');
    setTimeout(() => {
      const dash = window.location.pathname.includes('/pages/')
        ? withAuthParam('dashboard.html')
        : withAuthParam('pages/dashboard.html');
      window.location.href = dash;
    }, 700);
  });
}

function getDashboardUrl() {
  const inPages = window.location.pathname.includes('/pages/');
  return withAuthParam(inPages ? 'dashboard.html' : 'pages/dashboard.html');
}

function updateHeaderSession(force = false) {
  const actions = document.querySelector('.header__actions');
  if (!actions) return;
  if (actions.dataset.sessionReady && !force) return;

  if (!isLoggedIn()) return;

  const esEmprendimiento = getRol() === 'emprendimiento';
  actions.innerHTML = `
    <a href="${getDashboardUrl()}" class="btn btn--primary">${esEmprendimiento ? 'MI PANEL' : 'MI PERFIL'}</a>
    <span class="header__user-badge">${esEmprendimiento ? 'Emprendimiento' : 'Sesión activa'}</span>
    <button type="button" class="btn btn--outline" id="btn-cerrar-sesion">CERRAR SESIÓN</button>
  `;
  actions.dataset.sessionReady = 'true';
  document.getElementById('btn-cerrar-sesion')?.addEventListener('click', () => {
    clearAuth();
    location.reload();
  });
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.remove('is-visible'), 3500);
}
