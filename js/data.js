/**
 * Datos de emprendimientos y menús — Plazoleta de Comidas Virtual
 */

const EMPRENDIMIENTOS_DATA = [
  {
    id: 'la-mansion',
    nombre: 'La Mansión',
    descripcion: 'Restaurante bar (Almuerzos, bebidas y eventos)',
    rating: 5,
    imagen: 'la-mansion.jpg',
    logo: 'la-mansion-logo.png'
  },
  {
    id: 'tajoy',
    nombre: 'Tajoy',
    descripcion: 'Licores artesanales (Cocteles, licor y experiencias)',
    rating: 4.5,
    imagen: 'tajoy.jpg',
    logo: 'tajoy-logo.png'
  },
  {
    id: 'mirador-ocanero',
    nombre: 'El Mirador Ocañero',
    descripcion: 'Mirador y restaurante (Comida tradicional y vista)',
    rating: 5,
    imagen: 'mirador-ocanero.jpg',
    logo: 'mirador-ocanero-logo.png'
  },
  {
    id: 'haoma',
    nombre: 'Haoma',
    descripcion: 'Restaurante fusión (Experiencias gastronómicas únicas)',
    rating: 4.5,
    imagen: 'haoma.jpg',
    logo: 'haoma-logo.png'
  },
  {
    id: 'pops-ice',
    nombre: 'Pops Ice',
    descripcion: 'Heladería artesanal (Helados, postres y dulces)',
    rating: 5,
    imagen: 'pops-ice.jpg',
    logo: 'pops-ice-logo.png'
  }
];

const MENUS_DATA = {
  'la-mansion': {
    categorias: [
      {
        nombre: 'Almuerzos ejecutivos',
        items: [
          { nombre: 'Bandeja paisa ocañera', descripcion: 'Frijoles, arroz, chicharrón, huevo, aguacate y arepa', precio: 28000 },
          { nombre: 'Pescado frito con patacón', descripcion: 'Pescado fresco del día con ensalada y arroz', precio: 32000 },
          { nombre: 'Sobrebarriga en salsa', descripcion: 'Con papas criollas y arroz blanco', precio: 26000 }
        ]
      },
      {
        nombre: 'Bebidas',
        items: [
          { nombre: 'Limonada natural', descripcion: 'Jarra 1 litro', precio: 8000 },
          { nombre: 'Cerveza nacional', descripcion: 'Botella 330 ml', precio: 6000 },
          { nombre: 'Cóctel de la casa', descripcion: 'Mezcla especial del bartender', precio: 18000 }
        ]
      }
    ]
  },
  'tajoy': {
    categorias: [
      {
        nombre: 'Licores artesanales',
        items: [
          { nombre: 'Aguardiente Tajoy', descripcion: 'Botella 750 ml — receta tradicional', precio: 45000 },
          { nombre: 'Crema de café', descripcion: 'Licor artesanal 375 ml', precio: 32000 },
          { nombre: 'Shot degustación', descripcion: 'Tres sabores de la casa', precio: 15000 }
        ]
      },
      {
        nombre: 'Coctelería',
        items: [
          { nombre: 'Mojito ocañero', descripcion: 'Ron, hierbabuena y limón', precio: 16000 },
          { nombre: 'Sour de maracuyá', descripcion: 'Licor local y fruta fresca', precio: 18000 }
        ]
      }
    ]
  },
  'mirador-ocanero': {
    categorias: [
      {
        nombre: 'Comida tradicional',
        items: [
          { nombre: 'Arepa ocañera rellena', descripcion: 'Carne desmechada, maíz y hogao', precio: 12000 },
          { nombre: 'Mute santandereano', descripcion: 'Receta tradicional de la región', precio: 22000 },
          { nombre: 'Picada ocañera', descripcion: 'Para compartir — chorizo, chicharrón y yuca', precio: 38000 }
        ]
      },
      {
        nombre: 'Bebidas',
        items: [
          { nombre: 'Chocolate santandereano', descripcion: 'Con queso y almojábana', precio: 9000 },
          { nombre: 'Jugo natural', descripcion: 'Fruta de temporada', precio: 7000 }
        ]
      }
    ]
  },
  'haoma': {
    categorias: [
      {
        nombre: 'Entradas',
        items: [
          { nombre: 'Ceviche de trucha', descripcion: 'Con chips de plátano y ají', precio: 24000 },
          { nombre: 'Croquetas de queso', descripcion: 'Con miel de panela', precio: 16000 }
        ]
      },
      {
        nombre: 'Platos fuertes',
        items: [
          { nombre: 'Salmón en salsa de maracuyá', descripcion: 'Con puré de papa y vegetales', precio: 42000 },
          { nombre: 'Risotto de hongos', descripcion: 'Fusión mediterránea con queso local', precio: 34000 }
        ]
      }
    ]
  },
  'pops-ice': {
    categorias: [
      {
        nombre: 'Helados artesanales',
        items: [
          { nombre: 'Maracumango', descripcion: 'Maracuyá y mango — vaso 12 oz', precio: 9000 },
          { nombre: 'Summer', descripcion: 'Frutos rojos y crema — vaso 12 oz', precio: 9000 },
          { nombre: 'Extra 16 oz', descripcion: 'Cualquier sabor de la casa', precio: 12000 }
        ]
      },
      {
        nombre: 'Promociones',
        items: [
          { nombre: 'Jueves de promo', descripcion: '2 vasos extra 16 oz por $12.000', precio: 12000 },
          { nombre: 'Malteada especial', descripcion: 'Galleta, crema y topping a elección', precio: 14000 }
        ]
      }
    ]
  }
};

function getImgBase() {
  return window.location.pathname.includes('/pages/') ? '../img/' : 'img/';
}

function resolveAssetUrl(value, fallback = '') {
  if (!value) return fallback;
  if (/^(data:|https?:\/\/)/i.test(value)) return value;
  return getImgBase() + value;
}

function getEmprendimientoById(id) {
  const customEntry = getBusinessCatalogEntries().find(entry => entry.id === id || entry.nombre?.toLowerCase() === String(id).toLowerCase());
  const defaultEntry = EMPRENDIMIENTOS_DATA.find(e => e.id === id || e.nombre.toLowerCase() === String(id).toLowerCase());
  const entry = customEntry || defaultEntry;
  if (!entry) return null;

  return {
    ...(defaultEntry || {}),
    ...entry,
    id: entry.id || defaultEntry?.id || slugify(entry.nombre || id),
    nombre: entry.nombre || defaultEntry?.nombre || 'Emprendimiento',
    descripcion: entry.descripcion || defaultEntry?.descripcion || 'Emprendimiento aliado',
    rating: Number(entry.rating || defaultEntry?.rating || 5),
    imagen: resolveAssetUrl(entry.imagen || entry.cover || defaultEntry?.imagen || '', ''),
    logo: resolveAssetUrl(entry.logo || defaultEntry?.logo || '', ''),
    cover: resolveAssetUrl(entry.cover || entry.imagen || '', ''),
    categoria: entry.categoria || '',
    telefono: entry.telefono || '',
    direccion: entry.direccion || '',
    email: entry.email || '',
    representante: entry.representante || ''
  };
}

function getCustomMenus() {
  try {
    return JSON.parse(localStorage.getItem('pcv_menu_custom') || '{}');
  } catch (e) {
    return {};
  }
}

/** Menú público: prioriza ediciones del emprendimiento guardadas en localStorage */
function getMenuById(id) {
  const emp = getEmprendimientoById(id);
  const customs = getCustomMenus();
  const candidateNames = [id, emp?.nombre].filter(Boolean);

  for (const name of candidateNames) {
    if (customs[name]) return customs[name];
  }

  if (emp && customs[emp.nombre]) return customs[emp.nombre];
  if (customs[id]) return customs[id];
  return MENUS_DATA[id] || (emp && MENUS_DATA[emp.id]) || null;
}

function formatPrecio(valor) {
  return '$' + valor.toLocaleString('es-CO');
}
