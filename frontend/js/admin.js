// --- Lógica del panel /admin.html ---
// El token JWT se guarda en sessionStorage (se borra al cerrar la pestaña,
// un poco más seguro que localStorage para un panel de administración).

const TOKEN_KEY = 'onlyAirpodsAdminToken';
const MAX_IMAGES = 4;

function getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
}
function setToken(token) {
    sessionStorage.setItem(TOKEN_KEY, token);
}
function clearToken() {
    sessionStorage.removeItem(TOKEN_KEY);
}

function showDashboard() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('dashboard-screen').style.display = 'block';
    loadCategories();
    loadProductsTable();
    loadOrders();
}
function showLogin() {
    document.getElementById('login-screen').style.display = 'block';
    document.getElementById('dashboard-screen').style.display = 'none';
}

// --- LOGIN ---
async function login() {
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    errorEl.innerText = '';

    if (!password) {
        errorEl.innerText = 'Escribe la contraseña.';
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
        });
        const data = await res.json();

        if (!res.ok) {
            errorEl.innerText = data.message || 'Error al iniciar sesión.';
            return;
        }

        setToken(data.token);
        document.getElementById('login-password').value = '';
        showDashboard();
    } catch (error) {
        errorEl.innerText = 'No se pudo conectar con el servidor.';
    }
}

function logout() {
    clearToken();
    showLogin();
}

// Helper para hacer fetch autenticado y manejar tokens vencidos
async function authFetch(url, options = {}) {
    const token = getToken();
    const headers = {
        ...(options.headers || {}),
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };

    const res = await fetch(url, { ...options, headers });

    if (res.status === 401) {
        clearToken();
        showLogin();
        throw new Error('Sesión expirada. Vuelve a iniciar sesión.');
    }

    return res;
}

// =====================================================================
// SUBIDA DE IMÁGENES (archivo real del dispositivo, no URL)
// Cada imagen se redimensiona/comprime en el navegador con <canvas> antes
// de guardarse, para no llenar la base de datos con fotos pesadas.
// =====================================================================

// Guarda en memoria las imágenes (como Data URL base64) de cada formulario.
const imageState = {
    new: [],
    edit: [],
};

function compressImage(file, maxDimension = 1000, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
        reader.onload = () => {
            const img = new Image();
            img.onerror = () => reject(new Error('Archivo de imagen inválido.'));
            img.onload = () => {
                let { width, height } = img;
                if (width > height && width > maxDimension) {
                    height = Math.round(height * (maxDimension / width));
                    width = maxDimension;
                } else if (height > maxDimension) {
                    width = Math.round(width * (maxDimension / height));
                    height = maxDimension;
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
}

function renderImageGrid(key) {
    const grid = document.getElementById(`${key}-image-grid`);
    if (!grid) return;
    const images = imageState[key];

    let html = images.map((src, index) => `
        <div class="image-slot filled">
            <img src="${src}" alt="Foto ${index + 1}">
            ${index === 0 ? '<span class="image-slot-tag">Principal</span>' : ''}
            <button type="button" class="image-slot-remove" onclick="removeImage('${key}', ${index})" title="Quitar foto">✕</button>
        </div>
    `).join('');

    if (images.length < MAX_IMAGES) {
        html += `
            <label class="image-slot add-slot">
                <input type="file" accept="image/*" multiple onchange="handleImageSelect('${key}', event)" hidden>
                <span>+ Añadir foto</span>
            </label>
        `;
    }

    grid.innerHTML = html;
}

async function handleImageSelect(key, event) {
    const files = Array.from(event.target.files || []);
    event.target.value = ''; // permite volver a seleccionar el mismo archivo después

    for (const file of files) {
        if (imageState[key].length >= MAX_IMAGES) break;
        try {
            const dataUrl = await compressImage(file);
            imageState[key].push(dataUrl);
        } catch (error) {
            alert('No se pudo procesar una de las imágenes. Intenta con otra foto.');
        }
    }
    renderImageGrid(key);
}

function removeImage(key, index) {
    imageState[key].splice(index, 1);
    renderImageGrid(key);
}

// =====================================================================
// COLORES (variantes de un mismo producto: nombre + código hex + foto)
// =====================================================================

// Guarda en memoria los colores de cada formulario (new / edit), igual que imageState.
const colorState = {
    new: [],
    edit: [],
};

// Guarda la foto ya comprimida que el usuario seleccionó para el color que
// está a punto de añadir (antes de darle clic a "Añadir color").
const pendingColorPhoto = {
    new: null,
    edit: null,
};

function toggleColorsSection(key) {
    const checked = document.getElementById(`${key}-has-colors`).checked;
    document.getElementById(`${key}-colors-section`).style.display = checked ? 'block' : 'none';
}

async function handleColorPhotoSelect(key, event) {
    const file = event.target.files && event.target.files[0];
    event.target.value = ''; // permite volver a elegir el mismo archivo después
    if (!file) return;

    const errorEl = document.getElementById(`${key}-color-error`);
    try {
        pendingColorPhoto[key] = await compressImage(file);
        const label = document.getElementById(`${key}-color-photo-label`);
        if (label) label.classList.add('has-photo');
        if (errorEl) errorEl.innerText = '';
    } catch (error) {
        if (errorEl) errorEl.innerText = 'No se pudo procesar la foto de ese color.';
    }
}

function addColorVariant(key) {
    const errorEl = document.getElementById(`${key}-color-error`);
    errorEl.innerText = '';

    const nameInput = document.getElementById(`${key}-color-name`);
    const hexInput = document.getElementById(`${key}-color-hex`);
    const name = nameInput.value.trim();
    const hex = hexInput.value;
    const image = pendingColorPhoto[key];

    if (!name) {
        errorEl.innerText = 'Escribe el nombre del color (ej: Azul).';
        return;
    }
    if (!image) {
        errorEl.innerText = 'Sube una foto del producto en ese color.';
        return;
    }
    if (colorState[key].length >= 8) {
        errorEl.innerText = 'Máximo 8 colores por producto.';
        return;
    }

    colorState[key].push({ name, hex, image });

    // Limpia el mini-formulario para el siguiente color
    nameInput.value = '';
    hexInput.value = '#1d4ed8';
    pendingColorPhoto[key] = null;
    const label = document.getElementById(`${key}-color-photo-label`);
    if (label) label.classList.remove('has-photo');

    renderColorList(key);
}

function removeColorVariant(key, index) {
    colorState[key].splice(index, 1);
    renderColorList(key);
}

function renderColorList(key) {
    const container = document.getElementById(`${key}-color-list`);
    if (!container) return;
    const colors = colorState[key];

    if (colors.length === 0) {
        container.innerHTML = '<p class="admin-hint" style="margin-bottom:10px;">Aún no has añadido colores para este producto.</p>';
        return;
    }

    container.innerHTML = colors.map((c, index) => `
        <div class="color-chip">
            <span class="color-chip-dot" style="background-color:${c.hex};"></span>
            <img class="color-chip-thumb" src="${c.image}" alt="${c.name}">
            <span class="color-chip-name">${c.name}</span>
            <button type="button" class="image-slot-remove" onclick="removeColorVariant('${key}', ${index})" title="Quitar color">✕</button>
        </div>
    `).join('');
}

// =====================================================================
// CATEGORÍAS
// =====================================================================

let categoriesCache = [];

async function loadCategories() {
    try {
        const res = await fetch(`${API_BASE_URL}/categories`);
        categoriesCache = await res.json();
        renderCategorySelects();
        renderCategoryChips();
    } catch (error) {
        document.getElementById('category-error').innerText = 'No se pudieron cargar las categorías.';
    }
}

function renderCategorySelects() {
    const optionsHtml = categoriesCache.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');

    ['new-category', 'edit-category'].forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        const previousValue = select.value;
        select.innerHTML = optionsHtml;
        if (previousValue && categoriesCache.some(c => c.id === previousValue)) {
            select.value = previousValue;
        }
    });
}

function renderCategoryChips() {
    const container = document.getElementById('category-chip-list');
    if (!container) return;

    if (categoriesCache.length === 0) {
        container.innerHTML = '<p class="admin-hint">Aún no has creado categorías.</p>';
        return;
    }

    container.innerHTML = categoriesCache.map(cat => `
        <span class="category-chip">
            ${cat.name}
            <button type="button" onclick="deleteCategory('${cat.id}', '${cat.name.replace(/'/g, "\\'")}')" title="Eliminar categoría">✕</button>
        </span>
    `).join('');
}

async function createCategory() {
    const input = document.getElementById('new-category-name');
    const errorEl = document.getElementById('category-error');
    const successEl = document.getElementById('category-success');
    errorEl.innerText = '';
    successEl.innerText = '';

    const name = input.value.trim();
    if (!name) {
        errorEl.innerText = 'Escribe un nombre para la categoría.';
        return;
    }

    try {
        const res = await authFetch(`${API_BASE_URL}/categories`, {
            method: 'POST',
            body: JSON.stringify({ name }),
        });
        const data = await res.json();

        if (!res.ok) {
            errorEl.innerText = data.message || 'Error al crear la categoría.';
            return;
        }

        successEl.innerText = `Categoría "${data.name}" creada.`;
        input.value = '';
        await loadCategories();
    } catch (error) {
        errorEl.innerText = error.message || 'Error al crear la categoría.';
    }
}

async function deleteCategory(id, name) {
    if (!confirm(`¿Eliminar la categoría "${name}"? Solo se puede borrar si ningún producto la está usando.`)) return;

    const errorEl = document.getElementById('category-error');
    errorEl.innerText = '';

    try {
        const res = await authFetch(`${API_BASE_URL}/categories/${id}`, { method: 'DELETE' });
        const data = await res.json();

        if (!res.ok) {
            errorEl.innerText = data.message || 'Error al eliminar la categoría.';
            return;
        }

        await loadCategories();
    } catch (error) {
        errorEl.innerText = error.message || 'Error al eliminar la categoría.';
    }
}

// =====================================================================
// PRODUCTOS — TABLA
// =====================================================================

let productsCache = [];

async function loadProductsTable() {
    const tbody = document.getElementById('products-table-body');
    const errorEl = document.getElementById('table-error');
    errorEl.innerText = '';

    try {
        // ?all=true trae también los productos desactivados, para poder reactivarlos
        const res = await fetch(`${API_BASE_URL}/products?all=true`);
        productsCache = await res.json();

        tbody.innerHTML = productsCache.map(product => `
            <tr data-id="${product.id}" style="${product.active ? '' : 'opacity:0.5;'}">
                <td>
                    <div class="table-thumb">
                        ${product.images && product.images[0] ? `<img src="${product.images[0]}" alt="${product.name}">` : '—'}
                    </div>
                </td>
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td><input type="number" value="${product.price}" data-field="price"></td>
                <td><input type="number" value="${product.stock}" data-field="stock" class="${product.stock <= 3 ? 'stock-low' : ''}"></td>
                <td>${(categoriesCache.find(c => c.id === product.category) || {}).name || product.category}</td>
                <td>
                    ${product.hasColors && product.colors && product.colors.length > 0
                        ? `<div class="table-color-dots">${product.colors.map(c => `<span class="table-color-dot" style="background-color:${c.hex};" title="${c.name}"></span>`).join('')}</div>`
                        : '—'}
                </td>
                <td style="text-align:center;">
                    <input type="checkbox" ${product.featured ? 'checked' : ''} onchange="toggleFeatured('${product.id}', this.checked)">
                </td>
                <td style="text-align:center;">
                    <input type="checkbox" ${product.active ? 'checked' : ''} onchange="toggleActive('${product.id}', this.checked)">
                </td>
                <td class="table-actions">
                    <button class="btn-small btn-save" onclick="saveProduct('${product.id}')">Guardar</button>
                    <button class="btn-small" style="background:var(--border-color); color:var(--text-color);" onclick="openEditModal('${product.id}')">Editar</button>
                    <button class="btn-small btn-delete" onclick="deleteProduct('${product.id}')">Eliminar</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        errorEl.innerText = 'No se pudo cargar el inventario.';
    }
}

// --- GUARDAR CAMBIOS RÁPIDOS (precio / stock) DE UN PRODUCTO ---
async function saveProduct(id) {
    const row = document.querySelector(`tr[data-id="${id}"]`);
    const price = Number(row.querySelector('[data-field="price"]').value);
    const stock = Number(row.querySelector('[data-field="stock"]').value);
    const errorEl = document.getElementById('table-error');
    errorEl.innerText = '';

    try {
        const res = await authFetch(`${API_BASE_URL}/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ price, stock }),
        });
        const data = await res.json();

        if (!res.ok) {
            errorEl.innerText = data.message || 'Error al guardar.';
            return;
        }

        loadProductsTable();
    } catch (error) {
        errorEl.innerText = error.message || 'Error al guardar los cambios.';
    }
}

async function toggleFeatured(id, featured) {
    try {
        await authFetch(`${API_BASE_URL}/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ featured }),
        });
    } catch (error) {
        document.getElementById('table-error').innerText = 'No se pudo actualizar el destacado.';
        loadProductsTable();
    }
}

async function toggleActive(id, active) {
    try {
        await authFetch(`${API_BASE_URL}/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ active }),
        });
        loadProductsTable();
    } catch (error) {
        document.getElementById('table-error').innerText = 'No se pudo actualizar el estado.';
    }
}

// --- ELIMINAR PRODUCTO ---
async function deleteProduct(id) {
    if (!confirm(`¿Seguro que quieres eliminar "${id}"? Esta acción no se puede deshacer.`)) return;

    const errorEl = document.getElementById('table-error');
    errorEl.innerText = '';

    try {
        const res = await authFetch(`${API_BASE_URL}/products/${id}`, { method: 'DELETE' });
        const data = await res.json();

        if (!res.ok) {
            errorEl.innerText = data.message || 'Error al eliminar.';
            return;
        }

        loadProductsTable();
    } catch (error) {
        errorEl.innerText = error.message || 'Error al eliminar el producto.';
    }
}

// --- CREAR PRODUCTO NUEVO ---
async function createProduct() {
    const errorEl = document.getElementById('create-error');
    const successEl = document.getElementById('create-success');
    errorEl.innerText = '';
    successEl.innerText = '';

    const id = document.getElementById('new-id').value.trim().toLowerCase();
    const name = document.getElementById('new-name').value.trim();
    const price = Number(document.getElementById('new-price').value);
    const stock = Number(document.getElementById('new-stock').value);
    const category = document.getElementById('new-category').value;
    const featured = document.getElementById('new-featured').checked;
    const desc = document.getElementById('new-desc').value.trim();
    const box = document.getElementById('new-box').value
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
    const images = imageState.new;
    const hasColors = document.getElementById('new-has-colors').checked;
    const colors = colorState.new;

    if (!id || !name || !price || stock === undefined || Number.isNaN(price)) {
        errorEl.innerText = 'Completa al menos: id, nombre, precio y stock.';
        return;
    }
    if (!category) {
        errorEl.innerText = 'Crea al menos una categoría antes de añadir productos.';
        return;
    }
    if (hasColors && colors.length === 0) {
        errorEl.innerText = 'Marcaste que tiene varios colores: añade al menos un color, o desmarca la casilla.';
        return;
    }

    try {
        const res = await authFetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            body: JSON.stringify({ id, name, price, stock, category, featured, desc, box, images, hasColors, colors: hasColors ? colors : [] }),
        });
        const data = await res.json();

        if (!res.ok) {
            errorEl.innerText = data.message || 'Error al crear el producto.';
            return;
        }

        successEl.innerText = `Producto "${data.name}" creado correctamente.`;
        ['new-id', 'new-name', 'new-price', 'new-stock', 'new-desc', 'new-box'].forEach(fieldId => {
            document.getElementById(fieldId).value = '';
        });
        document.getElementById('new-featured').checked = false;
        imageState.new = [];
        renderImageGrid('new');
        document.getElementById('new-has-colors').checked = false;
        colorState.new = [];
        pendingColorPhoto.new = null;
        renderColorList('new');
        toggleColorsSection('new');
        loadProductsTable();
    } catch (error) {
        errorEl.innerText = error.message || 'Error al crear el producto.';
    }
}

// =====================================================================
// PEDIDOS (historial de ventas)
// =====================================================================

const ORDER_STATUSES = ['pendiente', 'confirmado', 'enviado', 'entregado', 'cancelado'];

function formatOrderDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
}

async function loadOrders() {
    const tbody = document.getElementById('orders-table-body');
    const errorEl = document.getElementById('orders-error');
    const emptyEl = document.getElementById('orders-empty');
    errorEl.innerText = '';

    const statusFilter = document.getElementById('orders-status-filter').value;
    const url = statusFilter
        ? `${API_BASE_URL}/orders?status=${encodeURIComponent(statusFilter)}`
        : `${API_BASE_URL}/orders`;

    try {
        const res = await authFetch(url);
        const orders = await res.json();

        if (!res.ok) {
            errorEl.innerText = orders.message || 'No se pudieron cargar los pedidos.';
            return;
        }

        emptyEl.style.display = orders.length === 0 ? 'block' : 'none';

        tbody.innerHTML = orders.map(order => {
            const productsSummary = order.items
                .map(item => `${item.quantity}x ${item.name}`)
                .join('<br>');

            const statusOptions = ORDER_STATUSES.map(status =>
                `<option value="${status}" ${order.status === status ? 'selected' : ''}>${status.charAt(0).toUpperCase() + status.slice(1)}</option>`
            ).join('');

            return `
                <tr data-order-id="${order._id}">
                    <td>${formatOrderDate(order.createdAt)}</td>
                    <td>${order.customerName || '—'}</td>
                    <td>${order.customerPhone || '—'}</td>
                    <td>${productsSummary}</td>
                    <td>$${Number(order.total).toLocaleString()}</td>
                    <td>
                        <select class="form-control-admin" onchange="updateOrderStatus('${order._id}', this.value)">
                            ${statusOptions}
                        </select>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        errorEl.innerText = error.message || 'No se pudieron cargar los pedidos.';
    }
}

async function updateOrderStatus(orderId, status) {
    const errorEl = document.getElementById('orders-error');
    errorEl.innerText = '';

    try {
        const res = await authFetch(`${API_BASE_URL}/orders/${orderId}`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
        const data = await res.json();

        if (!res.ok) {
            errorEl.innerText = data.message || 'No se pudo actualizar el estado del pedido.';
            loadOrders();
        }
    } catch (error) {
        errorEl.innerText = error.message || 'No se pudo actualizar el estado del pedido.';
        loadOrders();
    }
}

// =====================================================================
// EDITAR PRODUCTO (modal completo: nombre, categoría, fotos, caja...)
// =====================================================================

function openEditModal(id) {
    const product = productsCache.find(p => p.id === id);
    if (!product) return;

    document.getElementById('edit-id').value = product.id;
    document.getElementById('edit-name').value = product.name;
    document.getElementById('edit-price').value = product.price;
    document.getElementById('edit-stock').value = product.stock;
    document.getElementById('edit-desc').value = product.desc || '';
    document.getElementById('edit-box').value = (product.box || []).join(', ');
    document.getElementById('edit-featured').checked = !!product.featured;

    renderCategorySelects();
    document.getElementById('edit-category').value = product.category;

    imageState.edit = [...(product.images || [])];
    renderImageGrid('edit');

    document.getElementById('edit-has-colors').checked = !!product.hasColors;
    colorState.edit = (product.colors || []).map(c => ({ ...c }));
    pendingColorPhoto.edit = null;
    renderColorList('edit');
    toggleColorsSection('edit');
    document.getElementById('edit-color-error').innerText = '';

    document.getElementById('edit-error').innerText = '';
    document.getElementById('edit-modal').classList.add('active');
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.remove('active');
}

async function saveProductFull() {
    const errorEl = document.getElementById('edit-error');
    errorEl.innerText = '';

    const id = document.getElementById('edit-id').value;
    const name = document.getElementById('edit-name').value.trim();
    const price = Number(document.getElementById('edit-price').value);
    const stock = Number(document.getElementById('edit-stock').value);
    const category = document.getElementById('edit-category').value;
    const featured = document.getElementById('edit-featured').checked;
    const desc = document.getElementById('edit-desc').value.trim();
    const box = document.getElementById('edit-box').value
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
    const images = imageState.edit;
    const hasColors = document.getElementById('edit-has-colors').checked;
    const colors = colorState.edit;

    if (!name || !price || Number.isNaN(price)) {
        errorEl.innerText = 'Completa al menos: nombre y precio.';
        return;
    }
    if (hasColors && colors.length === 0) {
        errorEl.innerText = 'Marcaste que tiene varios colores: añade al menos un color, o desmarca la casilla.';
        return;
    }

    try {
        const res = await authFetch(`${API_BASE_URL}/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ name, price, stock, category, featured, desc, box, images, hasColors, colors: hasColors ? colors : [] }),
        });
        const data = await res.json();

        if (!res.ok) {
            errorEl.innerText = data.message || 'Error al guardar los cambios.';
            return;
        }

        closeEditModal();
        loadProductsTable();
    } catch (error) {
        errorEl.innerText = error.message || 'Error al guardar los cambios.';
    }
}

// --- Permitir iniciar sesión con Enter + estado inicial ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('login-password').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') login();
    });

    renderImageGrid('new');
    renderImageGrid('edit');
    renderColorList('new');
    renderColorList('edit');

    // Si ya hay un token guardado en esta pestaña, entra directo al dashboard
    if (getToken()) {
        showDashboard();
    }
});
