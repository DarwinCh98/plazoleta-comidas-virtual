/**
 * Panel del emprendimiento — gestionar perfil y menú
 */

document.addEventListener('DOMContentLoaded', () => {
  if (!isLoggedIn()) {
    window.location.href = '../index.html';
    return;
  }

  const rol = getRol();

  const nav = document.querySelector('.header__nav');
  if (nav) {
    nav.innerHTML = `
      <a href="${withAuthParam('../index.html')}" class="nav-link">INICIO</a>
      <a href="${withAuthParam('catalogo.html')}" class="nav-link">CATÁLOGO</a>
      <a href="${withAuthParam('dashboard.html')}" class="nav-link nav-link--active">${rol === 'emprendimiento' ? 'MI PANEL' : 'MI PERFIL'}</a>
    `;
  }

  document.getElementById('btn-cerrar-sesion')?.addEventListener('click', () => {
    clearAuth();
    window.location.href = '../index.html';
  });

  renderDashboard();
});

function getCustomMenus() {
  try {
    return JSON.parse(localStorage.getItem(MENUS_STORAGE_KEY) || '{}');
  } catch (e) {
    return {};
  }
}

function saveCustomMenus(data) {
  localStorage.setItem(MENUS_STORAGE_KEY, JSON.stringify(data));
}

function getNegocioMenu(negocioNombre) {
  const custom = getCustomMenus();
  if (custom[negocioNombre]) return custom[negocioNombre];

  const match = getBusinessCatalogEntries().find(
    e => e.nombre?.toLowerCase() === negocioNombre.toLowerCase()
  );
  const fallback = EMPRENDIMIENTOS_DATA.find(
    e => e.nombre.toLowerCase() === negocioNombre.toLowerCase()
  );

  if (match && MENUS_DATA[match.id]) {
    return JSON.parse(JSON.stringify(MENUS_DATA[match.id]));
  }
  if (fallback && MENUS_DATA[fallback.id]) {
    return JSON.parse(JSON.stringify(MENUS_DATA[fallback.id]));
  }

  return {
    categorias: [
      {
        nombre: 'Platos principales',
        items: []
      }
    ]
  };
}

function persistMenu(negocioNombre, menuActual) {
  const customs = getCustomMenus();
  customs[negocioNombre] = menuActual;

  const match = getBusinessCatalogEntries().find(
    e => e.nombre?.toLowerCase() === negocioNombre.toLowerCase()
  );
  if (match) customs[match.id] = menuActual;

  saveCustomMenus(customs);
}

async function readFileToDataUrl(file) {
  if (!file) return '';
  return await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result || '');
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

function renderDashboard() {
  const perfil = getPerfil();
  const rol = getRol();
  const content = document.getElementById('dashboard-content');

  if (!perfil) {
    content.innerHTML = '<p class="dashboard-sub">No hay información de perfil disponible.</p>';
    return;
  }

  if (rol !== 'emprendimiento') {
    content.innerHTML = `
      <h1 class="dashboard-title">Mi perfil</h1>
      <p class="dashboard-sub">Actualiza tus datos personales y mantén tu información al día.</p>
      <div class="dashboard-grid">
        <section class="dashboard-card">
          <h2 class="dashboard-card__title">Datos personales</h2>
          <div class="perfil-resumen">
            <div class="perfil-row"><strong>Nombre</strong><span>${perfil.nombre || '—'}</span></div>
            <div class="perfil-row"><strong>Correo</strong><span>${perfil.email || '—'}</span></div>
            <div class="perfil-row"><strong>Teléfono</strong><span>${perfil.telefono || '—'}</span></div>
            <div class="perfil-row"><strong>Dirección</strong><span>${perfil.direccion || '—'}</span></div>
          </div>
          <form class="form" id="form-editar-perfil-cliente" style="margin-top:1.25rem; gap:0.75rem;">
            <label class="form__label">Nombre completo
              <input type="text" name="nombre" required value="${perfil.nombre || ''}" placeholder="Tu nombre completo">
            </label>
            <label class="form__label">Correo electrónico
              <input type="email" name="email" required value="${perfil.email || ''}" placeholder="tu@correo.com">
            </label>
            <label class="form__label">Teléfono / WhatsApp
              <input type="tel" name="telefono" required value="${perfil.telefono || ''}" placeholder="300 123 4567">
            </label>
            <label class="form__label">Dirección
              <input type="text" name="direccion" required value="${perfil.direccion || ''}" placeholder="Barrio, calle o referencia">
            </label>
            <button type="submit" class="btn btn--primary btn--full">Guardar datos</button>
          </form>
          <div class="dashboard-actions">
            <a href="${withAuthParam('../index.html')}" class="btn btn--outline">Volver al inicio</a>
            <a href="${withAuthParam('catalogo.html')}" class="btn btn--secondary">Explorar catálogo</a>
            <button type="button" class="btn btn--danger" id="btn-eliminar-perfil-cliente">Eliminar perfil</button>
          </div>
        </section>
      </div>
    `;

    document.getElementById('form-editar-perfil-cliente')?.addEventListener('submit', e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target).entries());
      setLoggedIn('cliente', {
        ...perfil,
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono,
        direccion: data.direccion
      });
      showToast('Perfil actualizado.');
      renderDashboard();
    });

    document.getElementById('btn-eliminar-perfil-cliente')?.addEventListener('click', () => {
      if (confirm('¿Estás seguro? Se eliminará tu perfil y cerrarás sesión.')) {
        deleteProfile();
        window.location.href = '../index.html';
      }
    });
    return;
  }

  const negocio = perfil.negocio || 'Mi emprendimiento';
  const menu = getNegocioMenu(negocio);

  content.innerHTML = `
    <h1 class="dashboard-title">Panel de ${negocio}</h1>
    <p class="dashboard-sub">Administra tus datos de contacto, tu perfil público y el menú que verán los clientes.</p>

    <div class="dashboard-grid">
      <section class="dashboard-card">
        <h2 class="dashboard-card__title">Perfil del negocio</h2>
        <div class="perfil-resumen">
          <div class="perfil-row"><strong>Negocio</strong><span>${negocio}</span></div>
          <div class="perfil-row"><strong>Representante</strong><span>${perfil.nombre || '—'}</span></div>
          <div class="perfil-row"><strong>Correo</strong><span>${perfil.email || '—'}</span></div>
          <div class="perfil-row"><strong>Teléfono</strong><span>${perfil.telefono || '—'}</span></div>
          <div class="perfil-row"><strong>Dirección</strong><span>${perfil.direccion || '—'}</span></div>
          <div class="perfil-row"><strong>Categoría</strong><span>${perfil.categoria || '—'}</span></div>
        </div>
        <form class="form" id="form-editar-perfil" style="margin-top:1.25rem; gap:0.75rem;">
          <label class="form__label">Nombre del negocio
            <input type="text" name="negocio" required value="${perfil.negocio || ''}" placeholder="Ej: La Mansión">
          </label>
          <label class="form__label">Nombre del representante
            <input type="text" name="representante" required value="${perfil.nombre || ''}" placeholder="Nombre y apellido">
          </label>
          <label class="form__label">Correo electrónico
            <input type="email" name="email" required value="${perfil.email || ''}" placeholder="contacto@negocio.com">
          </label>
          <label class="form__label">Teléfono / WhatsApp
            <input type="tel" name="telefono" required value="${perfil.telefono || ''}" placeholder="300 123 4567">
          </label>
          <label class="form__label">Dirección del local
            <input type="text" name="direccion" required value="${perfil.direccion || ''}" placeholder="Dirección para domicilios">
          </label>
          <label class="form__label">Categoría
            <select name="categoria" required>
              <option value="">Seleccionar...</option>
              <option value="restaurante" ${perfil.categoria === 'restaurante' ? 'selected' : ''}>Restaurante</option>
              <option value="bar" ${perfil.categoria === 'bar' ? 'selected' : ''}>Bar / Licores</option>
              <option value="heladeria" ${perfil.categoria === 'heladeria' ? 'selected' : ''}>Heladería / Postres</option>
              <option value="otro" ${perfil.categoria === 'otro' ? 'selected' : ''}>Otro</option>
            </select>
          </label>
          <label class="form__label">Descripción breve para el perfil público
            <textarea name="descripcion" rows="3" placeholder="Describe el negocio para que los clientes lo conozcan">${perfil.descripcion || ''}</textarea>
          </label>
          <label class="form__label">Logo del negocio (opcional)
            <input type="file" name="logo" id="input-logo" accept="image/*">
          </label>
          <label class="form__label">Imagen de portada (opcional)
            <input type="file" name="cover" id="input-cover" accept="image/*">
          </label>
          <button type="submit" class="btn btn--primary btn--full">Guardar perfil del negocio</button>
        </form>
        <div class="dashboard-actions">
          <a href="${withAuthParam('../index.html')}" class="btn btn--outline">Ver página principal</a>
          <a href="${withAuthParam('catalogo.html')}" class="btn btn--secondary">Ver catálogo</a>
          <button type="button" class="btn btn--danger" id="btn-eliminar-perfil-negocio">Eliminar perfil</button>
        </div>
      </section>

      <section class="dashboard-card">
        <h2 class="dashboard-card__title">Mi menú</h2>
        <ul class="menu-editor-lista" id="lista-platos">
          ${renderMenuItems(menu)}
        </ul>

        <form class="form-add-plato" id="form-agregar-plato">
          <p style="font-size:0.85rem; font-weight:600; color:var(--color-green-dark);">Agregar plato</p>
          <div class="form-add-plato__row">
            <label class="form__label">Categoría
              <select name="categoria" required>
                ${menu.categorias.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('')}
                <option value="__nueva">+ Nueva categoría</option>
              </select>
            </label>
            <label class="form__label">Nueva categoría (si aplica)
              <input type="text" name="categoriaNueva" placeholder="Ej: Postres">
            </label>
          </div>
          <label class="form__label">Nombre del plato
            <input type="text" name="nombre" required placeholder="Ej: Arepa rellena">
          </label>
          <label class="form__label">Descripción
            <input type="text" name="descripcion" required placeholder="Breve descripción">
          </label>
          <label class="form__label">Precio (COP)
            <input type="number" name="precio" required min="1000" step="500" placeholder="12000">
          </label>
          <button type="submit" class="btn btn--primary btn--full">Agregar al menú</button>
        </form>
      </section>
    </div>
  `;

  document.getElementById('form-editar-perfil')?.addEventListener('submit', async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    const logoInput = document.getElementById('input-logo');
    const coverInput = document.getElementById('input-cover');
    const logo = await readFileToDataUrl(logoInput?.files?.[0]);
    const cover = await readFileToDataUrl(coverInput?.files?.[0]);

    setLoggedIn('emprendimiento', {
      ...perfil,
      nombre: data.representante,
      negocio: data.negocio,
      email: data.email,
      telefono: data.telefono,
      direccion: data.direccion,
      categoria: data.categoria,
      descripcion: data.descripcion,
      logo: logo || perfil.logo || '',
      imagen: cover || perfil.imagen || perfil.cover || '',
      cover: cover || perfil.cover || perfil.imagen || ''
    });
    showToast('Perfil del negocio actualizado.');
    renderDashboard();
  });

  document.getElementById('btn-eliminar-perfil-negocio')?.addEventListener('click', () => {
    if (confirm('¿Estás seguro? Se eliminará tu perfil del emprendimiento y cerrarás sesión.')) {
      deleteProfile();
      window.location.href = '../index.html';
    }
  });

  document.getElementById('form-agregar-plato')?.addEventListener('submit', e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    const catNombre = data.categoria === '__nueva'
      ? (data.categoriaNueva || '').trim()
      : data.categoria;

    if (!catNombre) {
      showToast('Escribe el nombre de la nueva categoría.');
      return;
    }

    const menuActual = getNegocioMenu(negocio);
    let cat = menuActual.categorias.find(c => c.nombre === catNombre);
    if (!cat) {
      cat = { nombre: catNombre, items: [] };
      menuActual.categorias.push(cat);
    }

    cat.items.push({
      nombre: data.nombre.trim(),
      descripcion: data.descripcion.trim(),
      precio: Number(data.precio)
    });

    persistMenu(negocio, menuActual);
    showToast('Plato agregado al menú.');
    renderDashboard();
  });

  content.querySelectorAll('[data-eliminar]').forEach(btn => {
    btn.addEventListener('click', () => {
      const catIndex = Number(btn.dataset.cat);
      const itemIndex = Number(btn.dataset.item);
      const menuActual = getNegocioMenu(negocio);
      menuActual.categorias[catIndex].items.splice(itemIndex, 1);
      if (menuActual.categorias[catIndex].items.length === 0) {
        menuActual.categorias.splice(catIndex, 1);
      }
      if (menuActual.categorias.length === 0) {
        menuActual.categorias.push({ nombre: 'Platos principales', items: [] });
      }
      persistMenu(negocio, menuActual);
      showToast('Plato eliminado.');
      renderDashboard();
    });
  });
}

function renderMenuItems(menu) {
  if (!menu.categorias.length || menu.categorias.every(c => !c.items.length)) {
    return '<li style="color:var(--color-text-muted); font-size:0.9rem;">Aún no hay platos. Agrega el primero abajo.</li>';
  }

  return menu.categorias.map((cat, catIndex) => `
    <li>
      <p style="font-weight:700; font-size:0.85rem; color:var(--color-green-dark); margin-bottom:0.4rem;">${cat.nombre}</p>
      ${cat.items.map((item, itemIndex) => `
        <div class="menu-editor-item" style="margin-bottom:0.5rem;">
          <div class="menu-editor-item__row">
            <strong>${item.nombre}</strong>
            <span style="color:var(--color-green-dark); font-weight:700;">$${Number(item.precio).toLocaleString('es-CO')}</span>
            <button type="button" class="btn--danger" data-eliminar data-cat="${catIndex}" data-item="${itemIndex}">Eliminar</button>
          </div>
          <p style="font-size:0.8rem; color:var(--color-text-muted);">${item.descripcion}</p>
        </div>
      `).join('')}
    </li>
  `).join('');
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.remove('is-visible'), 3000);
}
