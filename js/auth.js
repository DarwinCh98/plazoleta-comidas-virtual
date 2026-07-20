/**
 * Autenticación — compatible con archivos locales (file://)
 * En file:// cada HTML tiene su propio localStorage, por eso el perfil
 * viaja en la URL (authdata) y se sincroniza al cargar cada página.
 */

const AUTH_STORAGE_KEY = 'pcv_auth';
const MENUS_STORAGE_KEY = 'pcv_menu_custom';
const BUSINESS_CATALOG_STORAGE_KEY = 'pcv_business_catalog';
const ACCOUNTS_STORAGE_KEY = 'pcv_accounts';

function encodeAuthData(data) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
}

function decodeAuthData(raw) {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(raw))));
  } catch (e) {
    return null;
  }
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'perfil';
}

function readAuthFromStorage() {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    /* ignorar */
  }
  return null;
}

function writeAuthToStorage(auth) {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
    sessionStorage.setItem('pcv_logged_in', auth.loggedIn ? 'true' : 'false');
    sessionStorage.setItem('pcv_rol', auth.rol || 'cliente');
  } catch (e) {
    /* almacenamiento no disponible */
  }
}

function getBusinessCatalogEntries() {
  try {
    return JSON.parse(localStorage.getItem(BUSINESS_CATALOG_STORAGE_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function getStoredAccounts() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_STORAGE_KEY) || '{"cliente":[],"emprendimiento":[]}');
  } catch (e) {
    return { cliente: [], emprendimiento: [] };
  }
}

function saveStoredAccounts(accounts) {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (e) {
    /* ignorar */
  }
}

function normalizeIdentifier(value) {
  return String(value || '').toLowerCase().trim();
}

function findAccountByEmail(role, email) {
  const accounts = getStoredAccounts();
  return (accounts[role] || []).find(acc => normalizeIdentifier(acc.email) === normalizeIdentifier(email));
}

function registerAccount(role, data) {
  const accounts = getStoredAccounts();
  if (findAccountByEmail(role, data.email)) {
    return { success: false, message: 'Ya existe una cuenta con ese correo.' };
  }

  if (role === 'emprendimiento') {
    const businessExists = (accounts.emprendimiento || []).some(acc => normalizeIdentifier(acc.negocio) === normalizeIdentifier(data.negocio));
    if (businessExists) {
      return { success: false, message: 'Ya existe un emprendimiento con ese nombre.' };
    }
  }

  const id = role === 'emprendimiento'
    ? slugify(data.negocio || data.nombre || data.email || 'perfil')
    : slugify(data.email || data.nombre || 'cliente');

  const account = {
    role,
    id,
    nombre: data.nombre || data.representante || '',
    negocio: data.negocio || '',
    email: data.email || '',
    telefono: data.telefono || '',
    direccion: data.direccion || '',
    categoria: data.categoria || '',
    descripcion: data.descripcion || '',
    logo: data.logo || '',
    imagen: data.imagen || data.cover || '',
    cover: data.cover || data.imagen || '',
    password: data.password || ''
  };

  accounts[role] = [...(accounts[role] || []), account];
  saveStoredAccounts(accounts);
  return { success: true, account };
}

function loginAccount(role, email, password) {
  const account = findAccountByEmail(role, email);
  if (!account) {
    return { success: false, message: 'No se encontró una cuenta registrada con ese correo.' };
  }

  if (account.password !== password) {
    return { success: false, message: 'Contraseña incorrecta.' };
  }

  return { success: true, account };
}

function removeStoredAccount(perfil) {
  if (!perfil) return;
  const role = perfil.rol || getRol();
  const accounts = getStoredAccounts();
  if (!accounts[role]) return;

  const target = normalizeIdentifier(perfil.email || perfil.id || perfil.negocio || perfil.nombre);
  accounts[role] = accounts[role].filter(acc => {
    return normalizeIdentifier(acc.email) !== target && normalizeIdentifier(acc.id) !== target;
  });
  saveStoredAccounts(accounts);
}

function saveBusinessCatalogEntries(entries) {
  try {
    localStorage.setItem(BUSINESS_CATALOG_STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {
    /* ignorar */
  }
}

function upsertBusinessCatalogEntry(entry) {
  const entries = getBusinessCatalogEntries();
  const index = entries.findIndex(item => item.id === entry.id || item.nombre === entry.nombre);
  if (index >= 0) {
    entries[index] = { ...entries[index], ...entry };
  } else {
    entries.push(entry);
  }
  saveBusinessCatalogEntries(entries);
  return entries;
}

function normalizeIdentifier(value) {
  return String(value || '').toLowerCase().trim();
}

function removeBusinessCatalogEntry(identifier) {
  const target = normalizeIdentifier(identifier);
  const entries = getBusinessCatalogEntries();
  const filtered = entries.filter(item => {
    return normalizeIdentifier(item.id) !== target && normalizeIdentifier(item.nombre) !== target;
  });
  saveBusinessCatalogEntries(filtered);
}

function removeCustomMenu(negocioNombre) {
  const customs = getCustomMenus();
  const target = normalizeIdentifier(negocioNombre);
  Object.keys(customs).forEach(key => {
    if (normalizeIdentifier(key) === target) {
      delete customs[key];
    }
  });
  localStorage.setItem(MENUS_STORAGE_KEY, JSON.stringify(customs));
}

function removeBusinessMenu(identifiers) {
  const customs = getCustomMenus();
  const targets = new Set(identifiers.filter(Boolean).map(normalizeIdentifier));
  Object.keys(customs).forEach(key => {
    if (targets.has(normalizeIdentifier(key))) {
      delete customs[key];
    }
  });
  localStorage.setItem(MENUS_STORAGE_KEY, JSON.stringify(customs));
}

function deleteProfile() {
  const perfil = getPerfil();
  const rol = getRol();
  if (rol === 'emprendimiento' && perfil) {
    removeBusinessCatalogEntry(perfil.id);
    removeBusinessCatalogEntry(perfil.negocio);
    removeBusinessCatalogEntry(perfil.nombre);
    removeBusinessMenu([perfil.id, perfil.negocio, perfil.nombre]);
  }
  removeStoredAccount(perfil);
  clearAuth();
}

function syncAuthFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('authdata');
  if (!raw) return;

  const data = decodeAuthData(raw);
  if (!data || !data.loggedIn) return;

  const auth = {
    loggedIn: true,
    rol: data.rol || 'cliente',
    id: data.id || slugify(data.negocio || data.nombre || 'perfil'),
    nombre: data.nombre || '',
    negocio: data.negocio || '',
    email: data.email || '',
    telefono: data.telefono || '',
    direccion: data.direccion || '',
    categoria: data.categoria || '',
    descripcion: data.descripcion || '',
    logo: data.logo || '',
    imagen: data.imagen || data.cover || '',
    cover: data.cover || data.imagen || '',
    rating: data.rating || 5
  };
  writeAuthToStorage(auth);

  if (data.menus && typeof data.menus === 'object') {
    try {
      localStorage.setItem(MENUS_STORAGE_KEY, JSON.stringify(data.menus));
    } catch (e) {
      /* ignorar */
    }
  }

  if (typeof window !== 'undefined' && window.history && window.location) {
    const url = new URL(window.location.href);
    url.searchParams.delete('auth');
    url.searchParams.delete('rol');
    url.searchParams.delete('authdata');
    window.history.replaceState({}, '', url.toString());
  }
}

syncAuthFromUrl();

function getAuthSnapshot() {
  const auth = readAuthFromStorage();
  if (!auth || !auth.loggedIn) return null;

  let menus = {};
  try {
    menus = JSON.parse(localStorage.getItem(MENUS_STORAGE_KEY) || '{}');
  } catch (e) {
    menus = {};
  }

  return { ...auth, menus };
}

function setLoggedIn(rol = 'cliente', perfil = {}) {
  const safeId = perfil.id || slugify(perfil.negocio || perfil.nombre || 'mi-perfil');
  const auth = {
    loggedIn: true,
    rol,
    id: safeId,
    nombre: perfil.nombre || '',
    negocio: perfil.negocio || '',
    email: perfil.email || '',
    telefono: perfil.telefono || '',
    direccion: perfil.direccion || '',
    categoria: perfil.categoria || '',
    descripcion: perfil.descripcion || '',
    logo: perfil.logo || '',
    imagen: perfil.imagen || perfil.cover || '',
    cover: perfil.cover || perfil.imagen || '',
    rating: perfil.rating || 5
  };
  writeAuthToStorage(auth);

  if (rol === 'emprendimiento') {
    upsertBusinessCatalogEntry({
      id: safeId,
      nombre: perfil.negocio || perfil.nombre || 'Mi emprendimiento',
      descripcion: perfil.descripcion || 'Emprendimiento aliado de la plazoleta virtual.',
      rating: perfil.rating || 5,
      imagen: perfil.imagen || perfil.cover || '',
      logo: perfil.logo || '',
      categoria: perfil.categoria || '',
      telefono: perfil.telefono || '',
      direccion: perfil.direccion || '',
      email: perfil.email || '',
      representante: perfil.nombre || '',
      cover: perfil.cover || perfil.imagen || '',
      createdAt: perfil.createdAt || new Date().toISOString()
    });
  }
  return auth;
}

function getPerfil() {
  const auth = readAuthFromStorage();
  if (auth && auth.loggedIn) {
    return {
      id: auth.id || slugify(auth.negocio || auth.nombre || 'mi-perfil'),
      nombre: auth.nombre || '',
      negocio: auth.negocio || '',
      email: auth.email || '',
      telefono: auth.telefono || '',
      direccion: auth.direccion || '',
      categoria: auth.categoria || '',
      descripcion: auth.descripcion || '',
      logo: auth.logo || '',
      imagen: auth.imagen || auth.cover || '',
      cover: auth.cover || auth.imagen || '',
      rating: auth.rating || 5,
      rol: auth.rol || 'cliente'
    };
  }

  const params = new URLSearchParams(window.location.search);
  const snapshot = decodeAuthData(params.get('authdata') || '');
  if (snapshot && snapshot.loggedIn) {
    return {
      id: snapshot.id || slugify(snapshot.negocio || snapshot.nombre || 'mi-perfil'),
      nombre: snapshot.nombre || '',
      negocio: snapshot.negocio || '',
      email: snapshot.email || '',
      telefono: snapshot.telefono || '',
      direccion: snapshot.direccion || '',
      categoria: snapshot.categoria || '',
      descripcion: snapshot.descripcion || '',
      logo: snapshot.logo || '',
      imagen: snapshot.imagen || snapshot.cover || '',
      cover: snapshot.cover || snapshot.imagen || '',
      rating: snapshot.rating || 5,
      rol: snapshot.rol || 'cliente'
    };
  }

  return null;
}

function clearAuth() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem('pcv_logged_in');
    sessionStorage.removeItem('pcv_rol');
  } catch (e) {
    /* ignorar */
  }
}

function isLoggedIn() {
  const auth = readAuthFromStorage();
  if (auth && auth.loggedIn) return true;

  try {
    if (sessionStorage.getItem('pcv_logged_in') === 'true') return true;
  } catch (e) {
    /* ignorar */
  }

  const params = new URLSearchParams(window.location.search);
  return params.get('auth') === '1' || Boolean(params.get('authdata'));
}

function getRol() {
  const auth = readAuthFromStorage();
  if (auth && auth.rol) return auth.rol;

  try {
    const sessionRol = sessionStorage.getItem('pcv_rol');
    if (sessionRol === 'emprendimiento' || sessionRol === 'cliente') return sessionRol;
  } catch (e) {
    /* ignorar */
  }

  const params = new URLSearchParams(window.location.search);
  const rolUrl = params.get('rol');
  if (rolUrl === 'emprendimiento' || rolUrl === 'cliente') return rolUrl;

  const snapshot = decodeAuthData(params.get('authdata') || '');
  if (snapshot && snapshot.rol) return snapshot.rol;

  return 'cliente';
}

function clearAuth() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem('pcv_logged_in');
    sessionStorage.removeItem('pcv_rol');
  } catch (e) {
    /* ignorar */
  }

  if (typeof window !== 'undefined' && window.history && window.location) {
    const url = new URL(window.location.href);
    if (url.searchParams.has('auth') || url.searchParams.has('authdata') || url.searchParams.has('rol')) {
      url.searchParams.delete('auth');
      url.searchParams.delete('authdata');
      url.searchParams.delete('rol');
      window.history.replaceState({}, '', url.toString());
    }
  }
}

function withAuthParam(url) {
  if (!isLoggedIn()) return url;

  const snap = getAuthSnapshot();
  if (!snap) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}auth=1`;
  }

  const rol = snap.rol || getRol();
  const authdata = encodeAuthData(snap);
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}auth=1&rol=${encodeURIComponent(rol)}&authdata=${encodeURIComponent(authdata)}`;
}
