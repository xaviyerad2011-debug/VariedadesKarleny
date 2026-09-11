VARIEDADES KARLENY — VERSION PÓLVORA

Archivos principales:
- index.html
- style.css
- script.js
- manifest.json
- sw.js
- firestore.rules
- icons/icon-192.png
- icons/icon-512.png

IMPORTANTE
1. Conserva tu carpeta imagenes/ con las fotos actuales de los productos.
2. Sube todos estos archivos a tu hosting/servidor HTTPS manteniendo las carpetas.
3. En Firebase > Firestore > Rules, pega firestore.rules.
4. En Cloudinary conserva el upload preset unsigned "productos".
5. La app no necesita contraseña en el código: el acceso del dueño usa Firebase Authentication.
6. El personalizador usa Fabric.js desde CDN, así que el editor necesita internet para cargar esa librería.
7. Las notificaciones de administrador de esta versión funcionan en primer plano cuando el panel del dueño está abierto y tiene permiso del navegador. Las notificaciones push con la app cerrada requieren una capa de envío servidor/FCM adicional.
8. El área del editor es una REFERENCIA de 30 × 40 cm. Sirve para guardar medidas consistentes de diseño; la medida física final debe verificarse en el proceso de impresión.
