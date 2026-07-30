// URL base de tu API. Cámbiala cuando despliegues el backend en Render/Railway.
// Ejemplo en producción: 'https://only-airpods-api.onrender.com/api'
const API_URL = "http://localhost:5000";
// Asegúrate de que usa API_URL
const response = await fetch(`${API_URL}/api/products`);