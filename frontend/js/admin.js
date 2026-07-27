// --- Lógica del panel /admin.html ---
// El token JWT se guarda en sessionStorage (se borra al cerrar la pestaña,
// un poco más seguro que localStorage para un panel de administración).

const TOKEN_KEY = 'onlyAirpodsAdminToken';

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
    loadProductsTable();
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

// --- CARGAR TABLA DE PRODUCTOS ---
async function loadProductsTable() {
    const tbody = document.getElementById('products-table-body');
    const errorEl = document.getElementById('table-error');
    errorEl.innerText = '';

    try {
        // La lista de productos es pública, no requiere token
        const res = await fetch(`${API_BASE_URL}/products`);
        const products = await res.json();

        tbody.innerHTML = products.map(product => `
            <tr data-id="${product.id}">
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td><input type="number" value="${product.price}" data-field="price"></td>
                <td><input type="number" value="${product.stock}" data-field="stock" class="${product.stock <= 3 ? 'stock-low' : ''}"></td>
                <td>${product.category}</td>
                <td class="table-actions">
                    <button class="btn-small btn-save" onclick="saveProduct('${product.id}')">Guardar</button>
                    <button class="btn-small btn-delete" onclick="deleteProduct('${product.id}')">Eliminar</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        errorEl.innerText = 'No se pudo cargar el inventario.';
    }
}

// --- GUARDAR CAMBIOS (precio / stock) DE UN PRODUCTO ---
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
    const image = document.getElementById('new-image').value.trim();
    const desc = document.getElementById('new-desc').value.trim();
    const box = document.getElementById('new-box').value
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);

    if (!id || !name || !price || stock === undefined || Number.isNaN(price)) {
        errorEl.innerText = 'Completa al menos: id, nombre, precio y stock.';
        return;
    }

    try {
        const res = await authFetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            body: JSON.stringify({ id, name, price, stock, category, image, desc, box }),
        });
        const data = await res.json();

        if (!res.ok) {
            errorEl.innerText = data.message || 'Error al crear el producto.';
            return;
        }

        successEl.innerText = `Producto "${data.name}" creado correctamente.`;
        ['new-id', 'new-name', 'new-price', 'new-stock', 'new-image', 'new-desc', 'new-box'].forEach(fieldId => {
            document.getElementById(fieldId).value = '';
        });
        loadProductsTable();
    } catch (error) {
        errorEl.innerText = error.message || 'Error al crear el producto.';
    }
}

// Permitir iniciar sesión con Enter
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('login-password').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') login();
    });

    // Si ya hay un token guardado en esta pestaña, entra directo al dashboard
    if (getToken()) {
        showDashboard();
    }
});
