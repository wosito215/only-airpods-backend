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

    grid.innerHTML = products.map(product => `
        <div class="product-item" data-category="${product.category}" onclick="openProductModal('${product.id}')">
            <div class="img-placeholder">
                ${product.image ? `<img src="${product.image}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;">` : 'FOTO PRODUCTO'}
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p>${product.desc || ''}</p>
                <span class="price">$${product.price.toLocaleString()}</span>
                ${product.stock <= 0 ? '<span class="stock-badge" style="display:block;color:#e0245e;font-size:0.85rem;margin-top:5px;">Agotado</span>' : ''}
            </div>
        </div>
    `).join('');
}

// Carga inicial del catálogo (solo hace algo si la página tiene #catalog-grid)
async function initCatalog() {
    const grid = document.getElementById('catalog-grid');
    if (!grid) return;

    grid.innerHTML = `<p class="catalog-empty">Cargando productos...</p>`;
    const products = await fetchProducts();

    if (products === null) {
        grid.innerHTML = `<p class="catalog-empty">No pudimos conectar con la tienda. Intenta recargar la página.</p>`;
        return;
    }
    renderCatalog(products);
}

// --- LOGICA DEL MODAL DEL CATÁLOGO ---
function openProductModal(productId) {
    const product = productsCache.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('modal-title').innerText = product.name;
    document.getElementById('modal-price').innerText = `$${product.price.toLocaleString()}`;
    document.getElementById('modal-desc').innerText = product.desc;

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
        addBtn.onclick = function() { addToCart(product.name, product.price); closeModal(); };
    }

    document.getElementById('product-modal').classList.add('active');
}
function closeModal() { document.getElementById('product-modal').classList.remove('active'); }

// --- CARRITO DE COMPRAS AVANZADO ---
let cart = JSON.parse(localStorage.getItem('onlyAirpodsCart')) || [];

function saveCart() { localStorage.setItem('onlyAirpodsCart', JSON.stringify(cart)); }
function toggleCart() { document.getElementById('cart-panel').classList.toggle('open'); }

function addToCart(productName, price) {
    let existingItem = cart.find(item => item.name === productName);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name: productName, price: price, quantity: 1 });
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
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    
    // Opcional: Vaciar el carrito después de enviar
    // cart = []; saveCart(); updateCartUI(); 
    closeCheckoutModal();
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
document.addEventListener('DOMContentLoaded', () => {
    const searchInputs = document.querySelectorAll('.search-box input');

    searchInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            
            // Si estamos en la página de catálogo, filtramos los elementos visuales
            const productItems = document.querySelectorAll('.product-item');
            if (productItems.length > 0) {
                productItems.forEach(item => {
                    const title = item.querySelector('h3').innerText.toLowerCase();
                    const desc = item.querySelector('p').innerText.toLowerCase();
                    
                    if (title.includes(query) || desc.includes(query)) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                });
            } else if (query.length > 0) {
                // Si escriben desde el Inicio u otra página, los redirigimos al catálogo con la búsqueda
                // (Opcional avanzado, por ahora filtra el catálogo localmente)
            }
        });
    });
});

// --- INICIALIZACIÓN DEL CATÁLOGO (fetch al backend) ---
document.addEventListener('DOMContentLoaded', initCatalog);

const response = await fetch(`${API_URL}/api/products`);