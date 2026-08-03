// URL base de tu API. Cámbiala cuando despliegues el backend en Render/Railway.
// Ejemplo en producción: 'https://only-airpods-api.onrender.com/api'

const API_URL = "https://only-airpods-backend.onrender.com";

// admin.js llama a las rutas del backend usando este prefijo (coincide con
// app.use('/api/products', ...) y app.use('/api/auth', ...) en server.js).
const API_BASE_URL = `${API_URL}/api`;
