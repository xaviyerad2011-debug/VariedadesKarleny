// =====================================================
// FIREBASE
// =====================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =====================================================
// CONFIGURACIÓN FIREBASE
// =====================================================

const firebaseConfig = {
  apiKey: "AIzaSyBzTvF-Af08z8jsjpa6L2mGEQQ7IxZZqAI",
  authDomain: "variedades-karleny.firebaseapp.com",
  projectId: "variedades-karleny",
  storageBucket: "variedades-karleny.firebasestorage.app",
  messagingSenderId: "117661003844",
  appId: "1:117661003844:web:2ba3db02e3fdf6e6278c11",
  measurementId: "G-80VJK2V1FB"
};


// =====================================================
// INICIALIZAR FIREBASE
// =====================================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


// =====================================================
// UID DEL DUEÑO
// =====================================================

const UID_DUENO = "vKixdwAJz9MfApZV81FPOiPybFr2";


// =====================================================
// CLOUDINARY
// =====================================================

const CLOUDINARY_CLOUD_NAME = "ktxu8h5o";

const CLOUDINARY_UPLOAD_PRESET = "productos";


// =====================================================
// CARRITO
// =====================================================

let carrito = [];


// =====================================================
// PANTALLA DE INICIO
// =====================================================

window.mostrarProductos = function () {

  const inicio = document.getElementById("pantallaInicio");

  const productos = document.getElementById("pantallaProductos");

  if (inicio) {
    inicio.style.display = "none";
  }

  if (productos) {
    productos.classList.add("activa");
    productos.style.display = "block";
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
};


// =====================================================
// VOLVER AL INICIO
// =====================================================

window.volverInicio = function () {

  const inicio = document.getElementById("pantallaInicio");

  const productos = document.getElementById("pantallaProductos");

  if (productos) {
    productos.classList.remove("activa");
    productos.style.display = "none";
  }

  if (inicio) {
    inicio.style.display = "flex";
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
};


// =====================================================
// ESTADO DE AUTENTICACIÓN
// =====================================================

onAuthStateChanged(auth, async (usuario) => {

  const panelAdmin = document.getElementById("panelAdmin");

  const estadoSesion = document.getElementById("estadoSesion");

  if (!usuario) {

    if (panelAdmin) {
      panelAdmin.style.display = "none";
    }

    actualizarBotonesAdministrador();

    return;
  }


  // ===================================================
  // COMPROBAR QUE SEA EL DUEÑO
  // ===================================================

  if (usuario.uid !== UID_DUENO) {

    await signOut(auth);

    if (panelAdmin) {
      panelAdmin.style.display = "none";
    }

    alert("No tienes permiso para entrar como administrador.");

    return;
  }


  // ===================================================
  // USUARIO ES EL DUEÑO
  // ===================================================

  if (panelAdmin) {
    panelAdmin.style.display = "block";
  }

  if (estadoSesion) {
    estadoSesion.textContent =
      "Sesión iniciada como administrador";
  }

  actualizarBotonesAdministrador();

  // Mostrar productos automáticamente al entrar
  mostrarProductos();

});


// =====================================================
// ABRIR LOGIN
// =====================================================

window.abrirLogin = function () {

  const ventana = document.getElementById("ventanaLogin");

  if (!ventana) return;

  ventana.classList.add("mostrar");

  const correo = document.getElementById("correoLogin");

  if (correo) {
    setTimeout(() => correo.focus(), 100);
  }
};


// =====================================================
// CERRAR LOGIN
// =====================================================

window.cerrarLogin = function () {

  const ventana = document.getElementById("ventanaLogin");

  if (ventana) {
    ventana.classList.remove("mostrar");
  }

  const mensaje = document.getElementById("mensajeLogin");

  if (mensaje) {
    mensaje.textContent = "";
  }
};


// =====================================================
// INICIAR SESIÓN
// =====================================================

window.iniciarSesion = async function () {

  const correo = document.getElementById("correoLogin");

  const password = document.getElementById("passwordLogin");

  const mensaje = document.getElementById("mensajeLogin");


  if (!correo || !password) return;


  const email = correo.value.trim();

  const clave = password.value;


  if (!email || !clave) {

    if (mensaje) {
      mensaje.textContent =
        "Escribe el correo y la contraseña.";
    }

    return;
  }


  try {

    if (mensaje) {
      mensaje.textContent = "Iniciando sesión...";
    }


    const resultado =
      await signInWithEmailAndPassword(
        auth,
        email,
        clave
      );


    // =================================================
    // COMPROBAR UID
    // =================================================

    if (resultado.user.uid !== UID_DUENO) {

      await signOut(auth);

      if (mensaje) {
        mensaje.textContent =
          "Este usuario no tiene permisos de administrador.";
      }

      return;
    }


    if (mensaje) {
      mensaje.textContent =
        "¡Sesión iniciada correctamente!";
    }


    setTimeout(() => {

      cerrarLogin();

    }, 700);


  } catch (error) {

    console.error(error);

    if (mensaje) {

      if (
        error.code ===
        "auth/invalid-credential"
      ) {

        mensaje.textContent =
          "Correo o contraseña incorrectos.";

      } else if (
        error.code ===
        "auth/user-not-found"
      ) {

        mensaje.textContent =
          "No existe una cuenta con ese correo.";

      } else if (
        error.code ===
        "auth/wrong-password"
      ) {

        mensaje.textContent =
          "La contraseña es incorrecta.";

      } else {

        mensaje.textContent =
          "No se pudo iniciar sesión.";
      }
    }
  }
};


// =====================================================
// CERRAR SESIÓN
// =====================================================

window.cerrarSesion = async function () {

  try {

    await signOut(auth);

    alert("Sesión cerrada correctamente.");

    window.volverInicio();

  } catch (error) {

    console.error(error);

    alert("No se pudo cerrar la sesión.");
  }
};


// =====================================================
// VISTA PREVIA DE FOTO
// =====================================================

const inputFoto =
  document.getElementById("fotoProducto");


if (inputFoto) {

  inputFoto.addEventListener("change", function () {

    const archivo = this.files[0];

    const vistaPrevia =
      document.getElementById("vistaPrevia");


    if (!vistaPrevia) return;


    vistaPrevia.innerHTML = "";


    if (!archivo) {
      return;
    }


    if (!archivo.type.startsWith("image/")) {

      alert("Selecciona una imagen válida.");

      this.value = "";

      return;
    }


    const imagen =
      document.createElement("img");

    imagen.src =
      URL.createObjectURL(archivo);

    imagen.alt =
      "Vista previa del producto";


    vistaPrevia.appendChild(imagen);

  });
}


// =====================================================
// SUBIR FOTO A CLOUDINARY
// =====================================================

async function subirImagenCloudinary(archivo) {

  const url =
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;


  const datos =
    new FormData();


  datos.append(
    "file",
    archivo
  );


  datos.append(
    "upload_preset",
    CLOUDINARY_UPLOAD_PRESET
  );


  const respuesta =
    await fetch(
      url,
      {
        method: "POST",
        body: datos
      }
    );


  if (!respuesta.ok) {

    throw new Error(
      "No se pudo subir la imagen."
    );
  }


  const resultado =
    await respuesta.json();


  return resultado.secure_url;
}


// =====================================================
// AGREGAR PRODUCTO
// =====================================================

window.agregarProducto = async function () {

  const usuario =
    auth.currentUser;


  // ===================================================
  // SEGURIDAD
  // ===================================================

  if (
    !usuario ||
    usuario.uid !== UID_DUENO
  ) {

    alert(
      "No tienes permiso para publicar productos."
    );

    return;
  }


  const inputFoto =
    document.getElementById("fotoProducto");

  const inputNombre =
    document.getElementById("nombreProducto");

  const inputPrecio =
    document.getElementById("precioProducto");

  const inputDescripcion =
    document.getElementById("descripcionProducto");


  if (
    !inputFoto ||
    !inputNombre ||
    !inputPrecio ||
    !inputDescripcion
  ) {

    alert(
      "No se encontraron todos los campos."
    );

    return;
  }


  const archivo =
    inputFoto.files[0];

  const nombre =
    inputNombre.value.trim();

  const precio =
    Number(inputPrecio.value);

  const descripcion =
    inputDescripcion.value.trim();


  // ===================================================
  // VALIDACIONES
  // ===================================================

  if (!archivo) {

    alert(
      "Selecciona una foto del producto."
    );

    return;
  }


  if (!nombre) {

    alert(
      "Escribe el nombre del producto."
    );

    return;
  }


  if (
    !Number.isFinite(precio) ||
    precio < 0
  ) {

    alert(
      "Escribe un precio válido."
    );

    return;
  }


  if (!descripcion) {

    alert(
      "Escribe una descripción."
    );

    return;
  }


  const boton =
    document.querySelector(
      ".boton-publicar"
    );


  try {

    if (boton) {

      boton.disabled = true;

      boton.textContent =
        "⏳ Publicando...";
    }


    // =================================================
    // SUBIR IMAGEN
    // =================================================

    const urlImagen =
      await subirImagenCloudinary(
        archivo
      );


    // =================================================
    // GUARDAR EN FIRESTORE
    // =================================================

    await addDoc(
      collection(
        db,
        "productos"
      ),
      {
        nombre: nombre,
        precio: precio,
        descripcion: descripcion,
        imagen: urlImagen,
        creado: new Date()
      }
    );


    // =================================================
    // LIMPIAR FORMULARIO
    // =================================================

    inputFoto.value = "";

    inputNombre.value = "";

    inputPrecio.value = "";

    inputDescripcion.value = "";


    const vistaPrevia =
      document.getElementById(
        "vistaPrevia"
      );


    if (vistaPrevia) {
      vistaPrevia.innerHTML = "";
    }


    alert(
      "✅ Producto publicado correctamente."
    );


    await cargarProductos();


  } catch (error) {

    console.error(
      "Error publicando producto:",
      error
    );


    alert(
      "❌ No se pudo publicar el producto.\n\n" +
      error.message
    );


  } finally {

    if (boton) {

      boton.disabled = false;

      boton.textContent =
        "🚀 Publicar producto";
    }
  }
};


// =====================================================
// CARGAR PRODUCTOS DE FIREBASE
// =====================================================

async function cargarProductos() {

  const contenedor =
    document.getElementById(
      "productosDinamicos"
    );


  if (!contenedor) return;


  contenedor.innerHTML = "";


  try {

    const consulta =
      await getDocs(
        collection(
          db,
          "productos"
        )
      );


    const usuario =
      auth.currentUser;


    consulta.forEach((documento) => {

      const producto =
        documento.data();


      crearTarjetaProducto(
        contenedor,
        documento.id,
        producto,
        usuario
      );

    });


    actualizarBotonesAdministrador();

    aplicarFiltros();


  } catch (error) {

    console.error(
      "Error cargando productos:",
      error
    );


    contenedor.innerHTML =
      `<p class="error-productos">
        No se pudieron cargar los productos.
      </p>`;
  }
}


// =====================================================
// CREAR TARJETA DE PRODUCTO
// =====================================================

function crearTarjetaProducto(
  contenedor,
  id,
  producto,
  usuario
) {

  const tarjeta =
    document.createElement(
      "article"
    );


  tarjeta.className =
    "producto";


  tarjeta.dataset.nombre =
    String(
      producto.nombre || ""
    );


  tarjeta.dataset.precio =
    String(
      Number(producto.precio) || 0
    );


  // ===================================================
  // IMAGEN
  // ===================================================

  const contenedorImagen =
    document.createElement(
      "div"
    );


  contenedorImagen.className =
    "imagen-producto";


  const imagen =
    document.createElement(
      "img"
    );


  imagen.src =
    producto.imagen || "";


  imagen.alt =
    producto.nombre ||
    "Producto";


  imagen.loading =
    "lazy";


  imagen.onerror = function () {

    this.style.display =
      "none";
  };


  contenedorImagen.appendChild(
    imagen
  );


  // ===================================================
  // INFORMACIÓN
  // ===================================================

  const informacion =
    document.createElement(
      "div"
    );


  informacion.className =
    "informacion-producto";


  const titulo =
    document.createElement(
      "h3"
    );


  titulo.textContent =
    producto.nombre ||
    "Producto";


  const descripcion =
    document.createElement(
      "p"
    );


  descripcion.className =
    "descripcion-producto";


  descripcion.textContent =
    producto.descripcion ||
    "";


  const precio =
    document.createElement(
      "p"
    );


  precio.className =
    "precio";


  precio.textContent =
    formatearPrecio(
      Number(producto.precio) || 0
    );


  // ===================================================
  // BOTÓN CARRITO
  // ===================================================

  const botonCarrito =
    document.createElement(
      "button"
    );


  botonCarrito.className =
    "boton-agregar";


  botonCarrito.textContent =
    "🛒 Agregar al carrito";


  botonCarrito.addEventListener(
    "click",
    function () {

      agregarAlCarrito(
        producto.nombre,
        Number(producto.precio) || 0
      );

    }
  );


  informacion.appendChild(
    titulo
  );


  if (
    producto.descripcion
  ) {

    informacion.appendChild(
      descripcion
    );
  }


  informacion.appendChild(
    precio
  );


  informacion.appendChild(
    botonCarrito
  );


  // ===================================================
  // BOTÓN ELIMINAR
  // SOLO PARA EL DUEÑO
  // ===================================================

  if (
    usuario &&
    usuario.uid === UID_DUENO
  ) {

    const botonEliminar =
      document.createElement(
        "button"
      );


    botonEliminar.className =
      "boton-eliminar-producto";


    botonEliminar.textContent =
      "🗑️ Borrar artículo";


    botonEliminar.dataset.productoId =
      id;


    botonEliminar.addEventListener(
      "click",
      function () {

        eliminarProductoFirebase(
          id
        );

      }
    );


    informacion.appendChild(
      botonEliminar
    );
  }


  tarjeta.appendChild(
    contenedorImagen
  );


  tarjeta.appendChild(
    informacion
  );


  contenedor.appendChild(
    tarjeta
  );
}


// =====================================================
// ACTUALIZAR VISIBILIDAD DE BOTONES ADMIN
// =====================================================

function actualizarBotonesAdministrador() {

  const usuario =
    auth.currentUser;


  const botones =
    document.querySelectorAll(
      ".boton-eliminar-producto"
    );


  botones.forEach(
    (boton) => {

      if (
        usuario &&
        usuario.uid === UID_DUENO
      ) {

        boton.style.display =
          "block";

      } else {

        boton.style.display =
          "none";
      }

    }
  );
}


// =====================================================
// ELIMINAR PRODUCTO
// =====================================================

async function eliminarProductoFirebase(
  id
) {

  const usuario =
    auth.currentUser;


  // ===================================================
  // SEGURIDAD
  // ===================================================

  if (
    !usuario ||
    usuario.uid !== UID_DUENO
  ) {

    alert(
      "No tienes permiso para borrar productos."
    );

    return;
  }


  const confirmar =
    confirm(
      "¿Seguro que quieres borrar este artículo?"
    );


  if (!confirmar) {
    return;
  }


  try {

    await deleteDoc(
      doc(
        db,
        "productos",
        id
      )
    );


    alert(
      "🗑️ Producto eliminado correctamente."
    );


    await cargarProductos();


  } catch (error) {

    console.error(
      "Error eliminando producto:",
      error
    );


    alert(
      "❌ No se pudo eliminar el producto."
    );
  }
}


// =====================================================
// FORMATEAR PRECIO
// =====================================================

function formatearPrecio(
  precio
) {

  return new Intl.NumberFormat(
    "es-CO",
    {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }
  ).format(precio);
}


// =====================================================
// FILTROS
// =====================================================

const buscador =
  document.getElementById(
    "buscadorProductos"
  );


const rangoPrecio =
  document.getElementById(
    "rangoPrecio"
  );


const valorPrecio =
  document.getElementById(
    "valorPrecio"
  );


if (buscador) {

  buscador.addEventListener(
    "input",
    aplicarFiltros
  );
}


if (rangoPrecio) {

  rangoPrecio.addEventListener(
    "input",
    function () {

      actualizarTextoPrecio();

      aplicarFiltros();

    }
  );
}


// =====================================================
// ACTUALIZAR TEXTO DEL PRECIO
// =====================================================

function actualizarTextoPrecio() {

  if (
    !rangoPrecio ||
    !valorPrecio
  ) return;


  const valor =
    Number(
      rangoPrecio.value
    );


  if (
    valor >= 100000
  ) {

    valorPrecio.textContent =
      "$100.000+";

    return;
  }


  valorPrecio.textContent =
    formatearPrecio(
      valor
    );
}


// =====================================================
// APLICAR FILTROS
// =====================================================

function aplicarFiltros() {

  const texto =
    buscador
      ? buscador.value
          .trim()
          .toLowerCase()
      : "";


  const maximo =
    rangoPrecio
      ? Number(
          rangoPrecio.value
        )
      : 100000;


  const productos =
    document.querySelectorAll(
      "#contenedorProductos .producto"
    );


  let encontrados = 0;


  productos.forEach(
    (producto) => {

      const nombre =
        (
          producto.dataset.nombre ||
          ""
        ).toLowerCase();


      const precio =
        Number(
          producto.dataset.precio ||
          0
        );


      const coincideNombre =
        !texto ||
        nombre.includes(
          texto
        );


      // =================================================
      // 100.000+ = SIN LÍMITE
      // =================================================

      const coincidePrecio =
        maximo >= 100000
          ? true
          : precio <= maximo;


      if (
        coincideNombre &&
        coincidePrecio
      ) {

        producto.style.display =
          "";

        encontrados++;

      } else {

        producto.style.display =
          "none";
      }

    }
  );


  const sinResultados =
    document.getElementById(
      "sinResultados"
    );


  if (sinResultados) {

    sinResultados.style.display =
      encontrados === 0
        ? "block"
        : "none";
  }
}


// =====================================================
// ABRIR / CERRAR FILTROS
// =====================================================

window.alternarFiltros = function () {

  const panel =
    document.getElementById(
      "panelFiltros"
    );


  if (!panel) return;


  panel.classList.toggle(
    "mostrar"
  );
};


// =====================================================
// LIMPIAR FILTROS
// =====================================================

window.limpiarFiltros = function () {

  if (buscador) {
    buscador.value = "";
  }


  if (rangoPrecio) {
    rangoPrecio.value =
      "100000";
  }


  actualizarTextoPrecio();

  aplicarFiltros();
};


// =====================================================
// CARRITO
// =====================================================

window.agregarAlCarrito = function (
  nombre,
  precio
) {

  const productoExistente =
    carrito.find(
      (producto) =>
        producto.nombre === nombre
    );


  if (productoExistente) {

    productoExistente.cantidad++;

  } else {

    carrito.push({
      nombre: nombre,
      precio: precio,
      cantidad: 1
    });

  }


  actualizarCarrito();

  abrirCarrito();
};


// =====================================================
// ACTUALIZAR CARRITO
// =====================================================

function actualizarCarrito() {

  const lista =
    document.getElementById(
      "listaCarrito"
    );


  const total =
    document.getElementById(
      "totalCarrito"
    );


  const contador =
    document.getElementById(
      "contadorCarrito"
    );


  if (!lista) return;


  lista.innerHTML = "";


  let cantidadTotal = 0;

  let precioTotal = 0;


  // ===================================================
  // CARRITO VACÍO
  // ===================================================

  if (carrito.length === 0) {

    lista.innerHTML =
      `<div class="carrito-vacio">
        <div>🛒</div>
        <p>Tu carrito está vacío.</p>
      </div>`;


    if (total) {
      total.textContent =
        "Total: $0";
    }


    if (contador) {
      contador.textContent =
        "0";
    }


    return;
  }


  // ===================================================
  // PRODUCTOS
  // ===================================================

  carrito.forEach(
    (producto, indice) => {

      const subtotal =
        producto.precio *
        producto.cantidad;


      cantidadTotal +=
        producto.cantidad;


      precioTotal +=
        subtotal;


      const item =
        document.createElement(
          "div"
        );


      item.className =
        "item-carrito";


      const informacion =
        document.createElement(
          "div"
        );


      informacion.className =
        "info-item-carrito";


      const nombre =
        document.createElement(
          "strong"
        );


      nombre.textContent =
        producto.nombre;


      const precio =
        document.createElement(
          "span"
        );


      precio.textContent =
        formatearPrecio(
          producto.precio
        );


      informacion.appendChild(
        nombre
      );


      informacion.appendChild(
        precio
      );


      // =================================================
      // CONTROLES
      // =================================================

      const controles =
        document.createElement(
          "div"
        );


      controles.className =
        "controles-carrito";


      const menos =
        document.createElement(
          "button"
        );


      menos.textContent =
        "−";


      menos.addEventListener(
        "click",
        function () {

          cambiarCantidadCarrito(
            indice,
            -1
          );

        }
      );


      const cantidad =
        document.createElement(
          "span"
        );


      cantidad.textContent =
        producto.cantidad;


      const mas =
        document.createElement(
          "button"
        );


      mas.textContent =
        "+";


      mas.addEventListener(
        "click",
        function () {

          cambiarCantidadCarrito(
            indice,
            1
          );

        }
      );


      const eliminar =
        document.createElement(
          "button"
        );


      eliminar.textContent =
        "🗑️";


      eliminar.className =
        "eliminar-item-carrito";


      eliminar.addEventListener(
        "click",
        function () {

          eliminarDelCarrito(
            indice
          );

        }
      );


      controles.appendChild(
        menos
      );


      controles.appendChild(
        cantidad
      );


      controles.appendChild(
        mas
      );


      controles.appendChild(
        eliminar
      );


      item.appendChild(
        informacion
      );


      item.appendChild(
        controles
      );


      lista.appendChild(
        item
      );

    }
  );


  if (total) {

    total.textContent =
      `Total: ${formatearPrecio(
        precioTotal
      )}`;

  }


  if (contador) {

    contador.textContent =
      String(
        cantidadTotal
      );
  }
}


// =====================================================
// CAMBIAR CANTIDAD
// =====================================================

function cambiarCantidadCarrito(
  indice,
  cambio
) {

  if (
    !carrito[indice]
  ) return;


  carrito[indice].cantidad +=
    cambio;


  if (
    carrito[indice].cantidad <= 0
  ) {

    carrito.splice(
      indice,
      1
    );
  }


  actualizarCarrito();
}


// =====================================================
// ELIMINAR DEL CARRITO
// =====================================================

function eliminarDelCarrito(
  indice
) {

  if (
    !carrito[indice]
  ) return;


  carrito.splice(
    indice,
    1
  );


  actualizarCarrito();
}


// =====================================================
// ABRIR CARRITO
// =====================================================

window.abrirCarrito = function () {

  const ventana =
    document.getElementById(
      "ventanaCarrito"
    );


  if (!ventana) return;


  actualizarCarrito();


  ventana.classList.add(
    "mostrar"
  );
};


// =====================================================
// CERRAR CARRITO
// =====================================================

window.cerrarCarrito = function () {

  const ventana =
    document.getElementById(
      "ventanaCarrito"
    );


  if (ventana) {

    ventana.classList.remove(
      "mostrar"
    );
  }
};


// =====================================================
// COMPRAR POR WHATSAPP
// =====================================================

window.comprarPorWhatsApp = function () {

  if (
    carrito.length === 0
  ) {

    alert(
      "Tu carrito está vacío."
    );

    return;
  }


  const numero =
    "573202104423";


  let mensaje =
    "Hola, quiero realizar este pedido:%0A%0A";


  let total =
    0;


  carrito.forEach(
    (producto) => {

      const subtotal =
        producto.precio *
        producto.cantidad;


      total +=
        subtotal;


      mensaje +=
        `• ${producto.nombre} x${producto.cantidad} - ${formatearPrecio(subtotal)}%0A`;

    }
  );


  mensaje +=
    `%0A*Total: ${formatearPrecio(total)}*`;


  const url =
    `https://wa.me/${numero}?text=${mensaje}`;


  window.open(
    url,
    "_blank"
  );
};


// =====================================================
// CERRAR MODALES AL HACER CLICK AFUERA
// =====================================================

window.addEventListener(
  "click",
  function (event) {

    const login =
      document.getElementById(
        "ventanaLogin"
      );


    const carritoVentana =
      document.getElementById(
        "ventanaCarrito"
      );


    if (
      event.target === login
    ) {

      cerrarLogin();
    }


    if (
      event.target === carritoVentana
    ) {

      cerrarCarrito();
    }

  }
);


// =====================================================
// TECLA ESC
// =====================================================

window.addEventListener(
  "keydown",
  function (event) {

    if (
      event.key === "Escape"
    ) {

      cerrarLogin();

      cerrarCarrito();
    }

  }
);


// =====================================================
// ENTER EN LOGIN
// =====================================================

const passwordLogin =
  document.getElementById(
    "passwordLogin"
  );


if (passwordLogin) {

  passwordLogin.addEventListener(
    "keydown",
    function (event) {

      if (
        event.key === "Enter"
      ) {

        iniciarSesion();
      }

    }
  );
}


// =====================================================
// INICIALIZAR
// =====================================================

actualizarTextoPrecio();

actualizarCarrito();

cargarProductos();
