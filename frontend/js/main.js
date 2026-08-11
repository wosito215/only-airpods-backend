// --- MODO CLARO / OSCURO ---
const themeToggleBtn = document.getElementById('theme-toggle');
let currentTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', currentTheme);

if(themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', currentTheme);
        localStorage.setItem('theme', currentTheme);
    });
}

// --- MENÚ MÓVIL (HAMBURGUESA) ---
const menuToggleBtn = document.getElementById('menu-toggle');
const navLinksEl = document.getElementById('nav-links');
if (menuToggleBtn && navLinksEl) {
    menuToggleBtn.addEventListener('click', () => {
        navLinksEl.classList.toggle('open');
    });
    // Cierra el menú al tocar un enlace
    navLinksEl.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => navLinksEl.classList.remove('open'));
    });
}

// --- PRODUCTOS: AHORA VIENEN DEL BACKEND (MongoDB), YA NO HAY productsDB LOCAL ---
// productsCache guarda en memoria la última lista de productos que trajo el backend,
// para no tener que volver a pedirla cada vez que se abre un modal o se filtra la búsqueda.
let productsCache = [];

async function fetchProducts() {
    try {
        const response = await fetch(`${API_URL}/api/products`);
        if (!response.ok) throw new Error(`Error del servidor: ${response.status}`);
        const products = await response.json();
        productsCache = products;
        return products;
    } catch (error) {
        console.error('No se pudieron cargar los productos:', error);
        return null; // null indica "falló la conexión", distinto de [] ("no hay productos")
    }
}

// Pinta el catálogo dentro de #catalog-grid (solo existe en productos.html)
function renderCatalog(products) {
    const grid = document.getElementById('catalog-grid');
    if (!grid) return;

    if (!products || products.length === 0) {
        grid.innerHTML = `<p class="catalog-empty">No hay productos disponibles en este momento.</p>`;
        return;
    }

    grid.innerHTML = products.map(product => {
        const mainImage = product.images && product.images.length > 0 ? product.images[0] : '';
        return `
        <div class="product-item" data-category="${product.category}" onclick="openProductModal('${product.id}')">
            <div class="img-placeholder">
                ${mainImage ? `<img src="${mainImage}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;">` : 'FOTO PRODUCTO'}
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p>${product.desc || ''}</p>
                <span class="price">$${product.price.toLocaleString()}</span>
                ${product.stock <= 0 ? '<span class="stock-badge" style="display:block;color:#e0245e;font-size:0.85rem;margin-top:5px;">Agotado</span>' : ''}
            </div>
        </div>
        `;
    }).join('');
}

// --- FILTROS DE CATEGORÍA DINÁMICOS ---
// Antes eran botones fijos (Todos/AirPods/Cases). Ahora se generan según las
// categorías creadas desde el admin, para que nuevas líneas de producto
// (ej. cámaras, relojes) aparezcan solas en el catálogo.
async function initCategoryFilters() {
    const container = document.getElementById('category-filters');
    if (!container) return;

    try {
        const response = await fetch(`${API_URL}/api/categories`);
        if (!response.ok) return;
        const categories = await response.json();

        const buttonsHtml = categories.map(cat =>
            `<button class="filter-btn" onclick="filterCategory('${cat.id}')">${cat.name}</button>`
        ).join('');

        container.innerHTML = `<button class="filter-btn active" onclick="filterCategory('todos')">Todos</button>${buttonsHtml}`;
    } catch (error) {
        console.error('No se pudieron cargar las categorías:', error);
    }
}

// --- DESTACADOS DE LA PANTALLA PRINCIPAL ---
// Se administran marcando productos como "Destacado" desde el panel de admin.
// Si todavía no hay ninguno marcado, se deja el contenido ilustrativo por defecto.
async function initFeatured() {
    const grid = document.getElementById('featured-grid');
    if (!grid) return;

    const products = productsCache.length > 0 ? productsCache : await fetchProducts();
    if (!products) return;

    const featured = products.filter(p => p.featured).slice(0, 4);
    if (featured.length === 0) return; // deja el contenido ilustrativo original

    grid.innerHTML = featured.map(product => {
        const mainImage = product.images && product.images.length > 0 ? product.images[0] : '';
        return `
        <div class="featured-card">
            <div class="featured-img-placeholder">
                ${mainImage
                    ? `<img src="${mainImage}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;border-radius:16px;">`
                    : `<svg class="icon-illustration" viewBox="0 0 120 120" aria-hidden="true"><ellipse cx="60" cy="38" rx="20" ry="24" fill="none" stroke="currentColor" stroke-width="3"></ellipse><rect x="52" y="40" width="16" height="56" rx="8" fill="none" stroke="currentColor" stroke-width="3"></rect></svg>`
                }
            </div>
            <h3>${product.name}</h3>
            <p>${product.desc || ''}</p>
            <a href="productos.html?search=${encodeURIComponent(product.name)}" class="btn">Ver Detalles</a>
        </div>
        `;
    }).join('');
}

// Carga inicial del catálogo (solo hace algo si la página tiene #catalog-grid)
async function initCatalog() {
    const grid = document.getElementById('catalog-grid');
    if (!grid) return;

    grid.innerHTML = `<p class="catalog-empty">Cargando productos...</p>`;
    initCategoryFilters();
    const products = await fetchProducts();

    if (products === null) {
        grid.innerHTML = `<p class="catalog-empty">No pudimos conectar con la tienda. Intenta recargar la página.</p>`;
        return;
    }
    renderCatalog(products);

    // Si llegamos desde otra página con ?search=algo en la URL, filtramos automáticamente
    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get('search');
    if (initialQuery) {
        applySearchFilter(initialQuery);
    }
}

// --- LOGICA DEL MODAL DEL CATÁLOGO ---
function openProductModal(productId) {
    const product = productsCache.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('modal-title').innerText = product.name;
    document.getElementById('modal-price').innerText = `$${product.price.toLocaleString()}`;
    document.getElementById('modal-desc').innerText = product.desc;

    renderModalGallery(product.images || []);

    const boxList = document.getElementById('modal-box-list');
    if (boxList) {
        boxList.innerHTML = (product.box || []).map(item => `<li>${item}</li>`).join('');
    }

    const addBtn = document.getElementById('modal-add-btn');
    if (product.stock <= 0) {
        addBtn.innerText = 'Agotado';
        addBtn.disabled = true;
        addBtn.onclick = null;
    } else {
        addBtn.innerText = 'Añadir al Carrito';
        addBtn.disabled = false;
        addBtn.onclick = function() { addToCart(product.id, product.name, product.price); closeModal(); };
    }

    document.getElementById('product-modal').classList.add('active');
}
function closeModal() { document.getElementById('product-modal').classList.remove('active'); }

// Pinta la foto principal + miniaturas del modal con las imágenes reales del
// producto (subidas desde el admin). Si no hay fotos, muestra el placeholder.
function renderModalGallery(images) {
    const mainImgEl = document.getElementById('modal-main-img');
    const thumbsEl = document.getElementById('modal-thumbnails');
    if (!mainImgEl || !thumbsEl) return;

    function setMainImage(src) {
        mainImgEl.innerHTML = src
            ? `<img src="${src}" alt="Foto del producto" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">`
            : 'FOTO PRINCIPAL';
    }

    if (!images || images.length === 0) {
        setMainImage('');
        thumbsEl.innerHTML = '';
        return;
    }

    setMainImage(images[0]);

    thumbsEl.innerHTML = images.map((src, index) => `
        <div class="img-placeholder modal-thumb ${index === 0 ? 'active' : ''}" onclick="setModalMainImage('${index}')">
            <img src="${src}" alt="Foto ${index + 1}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">
        </div>
    `).join('');

    // Guarda las imágenes actuales para poder cambiarlas al hacer clic en una miniatura
    window.__currentModalImages = images;
}

function setModalMainImage(index) {
    const images = window.__currentModalImages || [];
    const src = images[index];
    if (!src) return;

    document.getElementById('modal-main-img').innerHTML =
        `<img src="${src}" alt="Foto del producto" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">`;

    document.querySelectorAll('#modal-thumbnails .modal-thumb').forEach((el, i) => {
        el.classList.toggle('active', i === Number(index));
    });
}

// --- CARRITO DE COMPRAS AVANZADO ---
let cart = JSON.parse(localStorage.getItem('onlyAirpodsCart')) || [];

function saveCart() { localStorage.setItem('onlyAirpodsCart', JSON.stringify(cart)); }
function toggleCart() { document.getElementById('cart-panel').classList.toggle('open'); }

function addToCart(productId, productName, price) {
    let existingItem = cart.find(item => item.name === productName);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id: productId, name: productName, price: price, quantity: 1 });
    }
    saveCart(); 
    updateCartUI();
    document.getElementById('cart-panel').classList.add('open');
}

function changeQuantity(index, amount) {
    cart[index].quantity += amount;
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    saveCart();
    updateCartUI();
}

function removeItem(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartUI();
}

function updateCartUI() {
    const list = document.getElementById('cart-items-list');
    const totalDisplay = document.getElementById('cart-total');
    const badges = document.querySelectorAll('.cart-badge');
    
    if (!list) return;
    list.innerHTML = '';
    
    let total = 0;
    let totalItems = 0;

    cart.forEach((item, index) => {
        let itemTotal = item.price * item.quantity;
        total += itemTotal;
        totalItems += item.quantity;

        list.innerHTML += `
            <li>
                <div class="cart-item-header">
                    <span>${item.name}</span>
                    <span>$${itemTotal.toLocaleString()}</span>
                </div>
                <div class="cart-item-actions">
                    <div class="qty-controls">
                        <button class="qty-btn" onclick="changeQuantity(${index}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" onclick="changeQuantity(${index}, 1)">+</button>
                    </div>
                    <button class="remove-btn" onclick="removeItem(${index})">Eliminar</button>
                </div>
            </li>
        `;
    });

    totalDisplay.innerText = total.toLocaleString();
    badges.forEach(badge => badge.innerText = totalItems);
}
document.addEventListener('DOMContentLoaded', updateCartUI);

// --- FORMULARIO DE CHECKOUT Y ENVÍO A WHATSAPP ---
function openCheckoutModal() {
    if (cart.length === 0) return alert("Tu carrito está vacío. Añade productos para continuar.");
    document.getElementById('cart-panel').classList.remove('open'); // Cierra carrito
    document.getElementById('checkout-modal').classList.add('active'); // Abre formulario
}

function closeCheckoutModal() {
    document.getElementById('checkout-modal').classList.remove('active');
}

function processOrder(e) {
    e.preventDefault();
    
    const name = document.getElementById('order-name').value;
    const phone = document.getElementById('order-phone').value;
    const address = document.getElementById('order-address').value;
    const payment = document.getElementById('order-payment').value;
    
    let message = `Quiero realizar mi pedido:\n`;
    message += `Nombre completo: ${name}\n`;
    message += `Número de contacto: ${phone}\n`;
    message += `Dirección: ${address}\n`;
    message += `Producto elegido:\n`;
    
    let totalOrder = 0;
    cart.forEach(item => {
        let itemTotal = item.price * item.quantity;
        totalOrder += itemTotal;
        message += `▪️ ${item.quantity}x ${item.name}\n`;
    });
    
    message += `\n*Total a pagar: $${totalOrder.toLocaleString()}*\n`;
    message += `Métodos de pago:\n${payment}`;
    
    const phoneNumber = "573189461172"; 

    // Registra el pedido en el backend (para historial de ventas) y luego
    // abre WhatsApp. Si el registro falla (sin internet, backend caído),
    // igual dejamos que el pedido se envíe por WhatsApp para no perder la venta.
    const orderPayload = {
        items: cart.map(item => ({
            productId: item.id || item.name,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
        })),
        total: totalOrder,
        customerName: name,
        customerPhone: phone,
        notes: `Dirección: ${address} | Pago: ${payment}`,
    };

    fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
    }).catch(err => console.error('No se pudo registrar el pedido en el historial:', err));

    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    
    // Vacía el carrito después de enviar el pedido.
    cart = []; saveCart(); updateCartUI();
    closeCheckoutModal();
}

// --- FORMULARIO DE SOPORTE -> WHATSAPP ---
// Antes el botón "Enviar" no hacía nada (el formulario no tenía JS asociado).
// Ahora arma el mensaje con el nombre y el texto escrito, y lo abre en WhatsApp.
function sendSupportMessage(e) {
    e.preventDefault();

    const name = document.getElementById('support-name').value.trim();
    const messageText = document.getElementById('support-message').value.trim();

    if (!name || !messageText) return;

    const message = `Hola, soy ${name}.\n\n${messageText}`;
    const phoneNumber = "573189461172";
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');

    document.getElementById('support-name').value = '';
    document.getElementById('support-message').value = '';
}

// Filtros de Catálogo
function filterCategory(category) {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    const products = document.querySelectorAll('.product-item');
    products.forEach(product => {
        product.style.display = (category === 'todos' || product.getAttribute('data-category') === category) ? 'block' : 'none';
    });
}


// --- BARRA DE BÚSQUEDA DINÁMICA ---
// Filtra sobre los productos ya cargados desde el backend (productsCache),
// sin necesidad de volver a golpear la base de datos en cada tecla.

// Aplica el filtro de búsqueda sobre las tarjetas ya pintadas en #catalog-grid
function applySearchFilter(query) {
    const grid = document.getElementById('catalog-grid');
    if (!grid) return;

    const q = query.toLowerCase().trim();
    const productItems = grid.querySelectorAll('.product-item');
    let anyVisible = false;

    productItems.forEach(item => {
        const title = item.querySelector('h3')?.innerText.toLowerCase() || '';
        const desc = item.querySelector('p')?.innerText.toLowerCase() || '';
        const matches = q === '' || title.includes(q) || desc.includes(q);
        item.style.display = matches ? 'block' : 'none';
        if (matches) anyVisible = true;
    });

    // Mensaje de "sin resultados" cuando la búsqueda no encuentra nada
    let emptyMsg = grid.querySelector('.search-empty-msg');
    if (!anyVisible && q !== '' && productItems.length > 0) {
        if (!emptyMsg) {
            emptyMsg = document.createElement('p');
            emptyMsg.className = 'catalog-empty search-empty-msg';
            grid.appendChild(emptyMsg);
        }
        emptyMsg.textContent = `No encontramos productos para "${query}".`;
    } else if (emptyMsg) {
        emptyMsg.remove();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const searchInputs = document.querySelectorAll('.search-box input');
    const onCatalogPage = document.getElementById('catalog-grid') !== null;

    // Si venimos de otra página con ?search=, precargamos el término en el buscador
    const urlParams = new URLSearchParams(window.location.search);
    const incomingQuery = urlParams.get('search');
    if (incomingQuery) {
        searchInputs.forEach(input => { input.value = incomingQuery; });
    }

    searchInputs.forEach(input => {
        // Mientras se escribe: si ya estamos en el catálogo, filtra en vivo
        input.addEventListener('input', (e) => {
            if (onCatalogPage) {
                applySearchFilter(e.target.value);
            }
        });

        // Al presionar Enter: si NO estamos en el catálogo, redirige con la búsqueda
        input.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            const query = e.target.value.trim();
            if (onCatalogPage) {
                applySearchFilter(query);
            } else if (query.length > 0) {
                window.location.href = `productos.html?search=${encodeURIComponent(query)}`;
            } else {
                window.location.href = 'productos.html';
            }
        });
    });
});

// --- INICIALIZACIÓN DEL CATÁLOGO (fetch al backend) ---
document.addEventListener('DOMContentLoaded', initCatalog);

// --- INICIALIZACIÓN DE DESTACADOS (solo hace algo si existe #featured-grid) ---
document.addEventListener('DOMContentLoaded', initFeatured);

