# ONLY.AIRPODS — Arquitectura Full-Stack (100% gratuita)

## 1. Estructura de carpetas

```
OnlyAirpods-Fullstack/
├── backend/                    # API en Node + Express + Mongoose (Render/Railway)
│   ├── config/
│   │   └── db.js               # conexión a MongoDB Atlas
│   ├── middleware/
│   │   └── auth.js             # protege rutas con JWT
│   ├── models/
│   │   └── Product.js          # esquema de producto (id, precio, stock, etc.)
│   ├── routes/
│   │   ├── auth.js             # POST /api/auth/login
│   │   └── products.js         # GET/POST/PUT/DELETE /api/products
│   ├── .env.example             # plantilla de variables de entorno
│   ├── .gitignore
│   ├── package.json
│   ├── seed.js                  # migra tus 3 productos actuales a MongoDB
│   └── server.js                # punto de entrada de la API
│
└── frontend/                   # Estático (Vercel/GitHub Pages)
    ├── css/
    │   ├── admin.css            # (nuevo) estilos del panel
    │   └── ...                  # tus estilos originales, sin cambios
    ├── js/
    │   ├── admin.js             # (nuevo) lógica del panel de admin
    │   ├── config.js            # (nuevo) URL del backend
    │   ├── main.js              # MODIFICADO: ya no tiene productsDB
    │   └── script.js            # sin uso, no lo tocamos
    ├── admin.html                # (nuevo) panel de administración
    ├── index.html                 # solo se le agregó <script src="js/config.js">
    ├── productos.html             # MODIFICADO: el grid ahora es dinámico
    ├── sobre-nosotros.html        # solo se le agregó config.js
    └── soporte.html                # solo se le agregó config.js
```

**Por qué esta separación:** el backend necesita un entorno con Node.js corriendo
todo el tiempo (Render/Railway), mientras que el frontend es solo HTML/CSS/JS
estático (Vercel/GitHub Pages lo sirven gratis y sin backend). Son dos despliegues
independientes que se comunican por HTTP.

---

## 2. Qué cambió exactamente en tu código

- **`js/main.js`**: se eliminó la constante `productsDB`. Ahora existe
  `fetchProducts()` que hace `fetch(`${API_BASE_URL}/products`)` y guarda el
  resultado en `productsCache`. `openProductModal()` ya no lee de un objeto
  local, lee de `productsCache`.
- **`productos.html`**: los 3 `<div class="product-item">` que tenías escritos
  a mano fueron reemplazados por un solo contenedor vacío
  `<div class="catalog-grid" id="catalog-grid">`. `main.js` lo llena con
  `renderCatalog()` usando los productos que trae del backend. Así, cuando
  agregues/edites/elimines productos desde el admin, se reflejan solos, sin
  tocar el HTML.
- **Barra de búsqueda**: se mantuvo la misma lógica que ya tenías (filtra los
  `.product-item` visibles en el DOM), porque ahora esos elementos ya vienen
  de la base de datos — cumple el requisito sin necesitar una llamada al
  backend por cada letra que se escribe.
- **`index.html`, `sobre-nosotros.html`, `soporte.html`**: sin cambios de lógica,
  solo se agregó `<script src="js/config.js"></script>` antes de `main.js`.

---

## 3. Cómo probarlo localmente (antes de subir nada)

### Paso 1 — Crear tu cluster gratis en MongoDB Atlas
1. Ve a https://www.mongodb.com/cloud/atlas/register y crea una cuenta.
2. Crea un cluster **M0 (Free)**.
3. En "Database Access", crea un usuario con contraseña.
4. En "Network Access", añade `0.0.0.0/0` (permitir desde cualquier IP; luego
   puedes restringirlo).
5. En "Database" → "Connect" → "Drivers", copia tu connection string. Se ve así:
   `mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
6. Agrégale el nombre de la base de datos antes del `?`, por ejemplo:
   `mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/onlyairpods?retryWrites=true&w=majority`

### Paso 2 — Configurar y correr el backend
```bash
cd backend
npm install
cp .env.example .env
```
Abre `.env` y completa:
- `MONGODB_URI` con la cadena que copiaste de Atlas.
- `ADMIN_PASSWORD` con la contraseña que quieras usar para entrar al panel.
- `JWT_SECRET` con cualquier texto largo y aleatorio.

Luego, migra tus 3 productos actuales a la base de datos (solo una vez):
```bash
npm run seed
```
Deberías ver en consola: `✅ Producto listo: AirPods Pro 2`, etc.

Ahora sí, levanta el servidor:
```bash
npm run dev
```
Si todo está bien verás:
```
✅ Conectado a MongoDB Atlas
🚀 Servidor corriendo en http://localhost:5000
```

Prueba en el navegador: abre `http://localhost:5000/api/products` y deberías
ver el JSON con tus 3 productos.

### Paso 3 — Correr el frontend
El frontend es estático, así que solo necesitas servirlo (no abrirlo con
doble clic como `file://`, porque el `fetch` puede fallar por CORS). La forma
más simple:

- Si usas **VS Code**: instala la extensión "Live Server" y dale clic derecho
  a `frontend/index.html` → "Open with Live Server" (por defecto usa el puerto
  5500, que ya está permitido en el backend).
- O con Python: `cd frontend && python3 -m http.server 5500`

Confirma que `frontend/js/config.js` tenga:
```js
const API_BASE_URL = 'http://localhost:5000/api';
```

Abre `http://localhost:5500/productos.html` — deberías ver tus productos
cargando desde MongoDB (no desde el HTML). Prueba también el buscador y el
carrito, deberían funcionar igual que antes.

### Paso 4 — Probar el panel de administración
1. Abre `http://localhost:5500/admin.html`.
2. Entra con la contraseña que pusiste en `ADMIN_PASSWORD`.
3. Prueba cambiar el precio/stock de un producto y dale "Guardar".
4. Prueba crear un producto nuevo (usa un `id` en minúsculas y sin espacios,
   ej: `airpods-4`).
5. Recarga `productos.html` y confirma que el nuevo producto aparece.
6. Prueba eliminar un producto y confirma que desaparece del catálogo.

---

## 4. Cómo desplegarlo gratis (cuando ya probaste todo local)

1. **MongoDB Atlas**: ya lo tienes desde el Paso 1, no hay que hacer nada más
   (solo asegúrate de que "Network Access" permita conexiones desde Render).
2. **Backend en Render**:
   - Sube la carpeta `backend/` a un repositorio de GitHub (agrega `.env` al
     `.gitignore`, ya viene configurado).
   - En https://render.com, crea un "New Web Service", conéctalo a tu repo.
   - Build command: `npm install` — Start command: `node server.js`.
   - En "Environment", agrega las mismas variables de tu `.env`
     (`MONGODB_URI`, `ADMIN_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRES_IN`,
     `FRONTEND_URL` con la URL real que te dé Vercel/GitHub Pages).
   - Render te dará una URL tipo `https://only-airpods-api.onrender.com`.
3. **Frontend en Vercel o GitHub Pages**:
   - Antes de subir, cambia `frontend/js/config.js` para que apunte a tu URL
     real de Render: `const API_BASE_URL = 'https://only-airpods-api.onrender.com/api';`
   - Sube la carpeta `frontend/` como proyecto de Vercel (o como GitHub Pages).
4. Ya con las dos URLs reales, actualiza `FRONTEND_URL` en Render con la URL
   final de tu frontend, para que CORS no bloquee las peticiones.

**Nota sobre el Free Tier de Render/Railway:** el backend "duerme" tras un
rato sin uso y tarda unos segundos en despertar con la primera petición; es
normal, es parte del plan gratuito.

---

## 5. Notas de seguridad (léelas antes de usarlo con clientes reales)

- El login del admin es intencionalmente sencillo (una sola contraseña
  compartida, tal como pediste). Es suficiente para un proyecto pequeño y
  para que solo tú lo uses, pero no reemplaza un sistema de usuarios real.
- No compartas la URL de `/admin.html` ni la subas a ningún buscador
  (por eso tiene `<meta name="robots" content="noindex, nofollow">`), pero
  ten en cuenta que no está oculta de verdad: cualquiera que adivine la URL
  puede ver la pantalla de login (no podrá entrar sin la contraseña).
- Cambia `ADMIN_PASSWORD` y `JWT_SECRET` por valores que no uses en ningún
  otro lugar.
