# Cambios aplicados a ONLY.AIRPODS

## 🔐 Seguridad
- **Login con bcrypt**: `routes/auth.js` ahora compara contra `ADMIN_PASSWORD_HASH`
  (bcrypt) en vez de texto plano. Genera tu hash con:
  ```
  cd backend
  node utils/hashPassword.js "TuContraseñaNueva"
  ```
  Pega el resultado en `.env` (local) y en las variables de entorno de Render
  como `ADMIN_PASSWORD_HASH`. Mientras no lo hagas, sigue funcionando con
  `ADMIN_PASSWORD` en texto plano (modo de compatibilidad).
- **Rate limiting en login**: máximo 8 intentos cada 15 min por IP
  (`express-rate-limit`), para frenar fuerza bruta.
- **CORS restringido**: ya no es `origin: '*'`. Ahora solo permite los
  dominios listados en `FRONTEND_URL` (separados por coma). Actualízalo en
  Render con tu dominio real de Vercel.
- **JWT_SECRET nuevo y fuerte**, ya generado en tu `.env` local — **debes
  copiarlo también a Render** (Environment → JWT_SECRET).
- **Validación real de imágenes**: el modelo `Product` ahora exige que cada
  imagen sea un Data URL de JPG/PNG/WEBP válido y pese menos de ~3MB.

⚠️ **Importante**: como tu `.env` (con la contraseña de MongoDB) quedó
expuesto en este chat, te recomiendo **rotar la contraseña de tu usuario de
base de datos** en MongoDB Atlas (Database Access → Edit → Edit Password) y
actualizar `MONGODB_URI` donde corresponda.

## ⚡ Rendimiento
- **Paginación opcional** en `GET /api/products`: ahora acepta
  `?page=1&limit=20`. Si no envías esos parámetros, se comporta exactamente
  igual que antes (no rompe nada de tu frontend actual).

## 🔎 SEO / Presencia
- Meta `description`, Open Graph (título, descripción, imagen) y
  `canonical` agregados a las 4 páginas (`index`, `productos`,
  `sobre-nosotros`, `soporte`). Esto mejora cómo se ve tu página al
  compartirla en WhatsApp/redes y ayuda a que Google la indexe mejor.
- Favicon (`img/logo.png`) enlazado en las 4 páginas.
- **Pendiente de tu parte**: reemplaza `https://onlyairpods.vercel.app` en
  los `<link rel="canonical">` y `og:image` por tu dominio real una vez lo
  tengas definido.

## No implementado (requiere que tú crees cuentas externas)
- **Migrar imágenes a Cloudinary**: reduciría muchísimo el peso de tu base
  de datos y aceleraría la carga del catálogo. Necesita que crees una cuenta
  gratuita en cloudinary.com y me pases tu `CLOUDINARY_URL`.
- **Google Analytics / Meta Pixel**: para medir visitas y qué productos ven
  más antes de escribir por WhatsApp. Necesita que crees la cuenta y me
  pases el ID de medición.
- **Historial de pedidos en base de datos**: guardaría cada pedido que se
  hace por WhatsApp para que tengas reportes de ventas. Es una funcionalidad
  nueva completa (modelo `Order` + endpoint) — dime si quieres que la arme.

---

## Prompt usado para esta ronda de cambios (referencia / para reusar)

```
Actúa como desarrollador full-stack senior. Tengo un proyecto Node.js/Express
+ MongoDB (backend) y HTML/CSS/JS estático (frontend) para un e-commerce
llamado ONLY.AIRPODS. Sin romper la funcionalidad existente ni cambiar los
contratos de la API que ya consume el frontend, implementa:

1. Seguridad:
   - Reemplaza la comparación de contraseña de admin en texto plano por
     bcrypt (ADMIN_PASSWORD_HASH), manteniendo compatibilidad temporal con
     la variable en texto plano si el hash no está definido.
   - Agrega rate limiting al endpoint de login (máx ~8 intentos/15min/IP).
   - Restringe CORS a una lista de orígenes permitidos desde una variable
     de entorno (en vez de origin: '*').
   - Genera un JWT_SECRET fuerte (32+ bytes aleatorios).
   - Agrega validación de tipo (jpg/png/webp) y tamaño máximo a las
     imágenes en base64 del modelo de producto.

2. Rendimiento:
   - Agrega paginación opcional (?page&limit) al endpoint GET de productos,
     sin romper el comportamiento actual cuando no se envían esos parámetros.

3. SEO:
   - Agrega meta description, Open Graph, canonical y favicon a cada página
     HTML del frontend, con contenido específico por página.

Al final, dame un resumen claro de qué cambiaste, qué variables de entorno
nuevas debo configurar en producción (Render/Vercel), y qué pasos manuales
me faltan (por ejemplo, generar el hash de la contraseña).
```
