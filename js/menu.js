/**
 * Página de menú — Plazoleta de Comidas Virtual
 */

document.addEventListener('DOMContentLoaded', () => {
  if (!isLoggedIn()) {
    window.location.href = '../index.html';
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const emp = getEmprendimientoById(id);
  const menu = getMenuById(id);
  const catalogoUrl = withAuthParam('catalogo.html');

  if (!emp || !menu) {
    document.getElementById('menu-content').innerHTML = `
      <div class="menu-empty">
        <h2>Menú no encontrado</h2>
        <p>El emprendimiento que buscas no existe o aún no tiene menú disponible.</p>
        <a href="${catalogoUrl}" class="btn btn--primary">Volver al catálogo</a>
      </div>
    `;
    return;
  }

  document.title = `Menú ${emp.nombre} | Plazoleta de Comidas Virtual`;

  const content = document.getElementById('menu-content');
  content.innerHTML = `
    <div class="menu-header">
      <a href="${catalogoUrl}" class="menu-back">← Volver al catálogo</a>
      <div class="menu-header__info">
        <img src="${emp.logo}" alt="Logo ${emp.nombre}" class="menu-header__logo">
        <div>
          <h1 class="menu-header__title">${emp.nombre}</h1>
          <p class="menu-header__desc">${emp.descripcion}</p>
          <div class="menu-header__stars" aria-label="Calificación ${emp.rating} de 5">${renderStars(emp.rating)}</div>
        </div>
      </div>
      <img src="${emp.imagen}" alt="${emp.nombre}" class="menu-header__cover">
    </div>

    <div class="menu-categorias">
      ${menu.categorias.map(cat => `
        <section class="menu-categoria">
          <h2 class="menu-categoria__title">${cat.nombre}</h2>
          <ul class="menu-lista">
            ${cat.items.map(item => `
              <li class="menu-item">
                <div class="menu-item__info">
                  <h3 class="menu-item__nombre">${item.nombre}</h3>
                  <p class="menu-item__desc">${item.descripcion}</p>
                </div>
                <span class="menu-item__precio">${formatPrecio(item.precio)}</span>
              </li>
            `).join('')}
          </ul>
        </section>
      `).join('')}
    </div>

    <p class="menu-nota">* Precios referenciales en pesos colombianos (COP). Sujetos a cambio.</p>
  `;
});

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}
