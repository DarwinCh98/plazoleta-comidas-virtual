document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const negocio = getEmprendimientoById(id);
  const content = document.getElementById('profile-content');

  if (!negocio) {
    content.innerHTML = `
      <div class="dashboard-empty">
        <h2>Perfil no encontrado</h2>
        <p>No hay información disponible para este emprendimiento.</p>
        <a href="catalogo.html" class="btn btn--primary">Volver al catálogo</a>
      </div>
    `;
    return;
  }

  const cover = negocio.cover || negocio.imagen || '';
  const logo = negocio.logo || '';

  content.innerHTML = `
    <div class="profile-hero">
      <div class="profile-hero__cover" style="background-image:url('${cover || '../img/fondo-madera.jpg'}')"></div>
      <div class="profile-hero__content">
        <img src="${logo || '../img/logo-principal.png'}" alt="Logo ${negocio.nombre}" class="profile-hero__logo">
        <div class="profile-hero__meta">
          <h1>${negocio.nombre}</h1>
          <p>${negocio.descripcion || 'Emprendimiento aliado de la plazoleta virtual.'}</p>
          <p>${negocio.categoria ? 'Categoría: ' + negocio.categoria : ''}</p>
        </div>
      </div>
    </div>

    <div class="profile-grid">
      <section class="dashboard-card">
        <h2 class="dashboard-card__title">Información del negocio</h2>
        <div class="profile-ficha">
          <div class="profile-ficha__item"><strong>Representante</strong><span>${negocio.representante || 'Por definir'}</span></div>
          <div class="profile-ficha__item"><strong>Correo</strong><span>${negocio.email || 'Por definir'}</span></div>
          <div class="profile-ficha__item"><strong>Teléfono</strong><span>${negocio.telefono || 'Por definir'}</span></div>
          <div class="profile-ficha__item"><strong>Dirección</strong><span>${negocio.direccion || 'Por definir'}</span></div>
        </div>
      </section>

      <section class="dashboard-card">
        <h2 class="dashboard-card__title">Ver menú</h2>
        <p class="dashboard-sub">Los clientes pueden descubrir los platos y precios del emprendimiento desde aquí.</p>
        <div class="dashboard-actions">
          <a href="menu.html?id=${encodeURIComponent(id)}" class="btn btn--primary">Ver menú</a>
          <a href="catalogo.html" class="btn btn--outline">Volver al catálogo</a>
        </div>
      </section>
    </div>
  `;
});
