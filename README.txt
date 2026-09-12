VARIEDADES KARLENY — NUEVA VERSION

Esta versión elimina por completo el personalizador de camisas.

Flujo:
1. Iniciar pedido -> productos.
2. Agregar productos -> carrito.
3. Enviar pedido -> guarda el pedido en Firestore y avisa al panel del dueño.
4. Consultas -> abre WhatsApp al 320 210 4423.

CONFIGURACIÓN:
- Firebase y Cloudinary están en script.js.
- Reemplaza las reglas de Firestore por firestore.rules.
- Mantén la carpeta imagenes/ con tus fotos locales si las usas.
- Las imágenes de productos de Firestore usan la URL original de Cloudinary y CSS object-fit: contain para evitar recortes/zoom.
