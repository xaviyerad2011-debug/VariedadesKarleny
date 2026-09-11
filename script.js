import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
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


// ======================================================
// FIREBASE
// ======================================================

const firebaseConfig = {
  apiKey: "AIzaSyBzTvF-Af08z8jsjpa6L2mGEQQ7IxZZqAI",
  authDomain: "variedades-karleny.firebaseapp.com",
  projectId: "variedades-karleny",
  storageBucket: "variedades-karleny.firebasestorage.app",
  messagingSenderId: "117661003844",
  appId: "1:117661003844:web:2ba3db02e3fdf6e6278c11",
  measurementId: "G-80VJK2V1FB"
};


const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


// ======================================================
// CONFIGURACIÓN DEL DUEÑO
// ======================================================

const UID_DUENO = "vKixdwAJz9MfApZV81FPOiPybFr2";


// ======================================================
// CONFIGURACIÓN CLOUDINARY
// ======================================================

const CLOUDINARY_CLOUD_NAME = "ktxu8h5o";

const CLOUDINARY_UPLOAD_PRESET = "productos";


// ======================================================
// VARIABLES
// ======================================================

let carrito = [];

let productosFirebase = [];


// ======================================================
// SESIÓN DEL USUARIO
// ======================================================

onAuthStateChanged(auth, (usuario) => {

  const panel = document.getElementById("panelAdmin");

  const estado = document.getElementById("estadoAdmin");

  if (!panel) return;


  if (usuario && usuario.uid === UID_DUENO) {

    panel.style.display = "block";

    if (estado) {
      estado.textContent = "🟢 Sesión de dueño activa";
    }

  } else {

    panel.style.display = "none";

    if (estado) {
      estado.textContent = "";
    }

  }

});


// ======================================================
// LOGIN
// ======================================================

function abrirLogin() {

  const ventana = document.getElementById("ventanaLogin");

  const mensaje = document.getElementById("mensajeLogin");

  if (mensaje) {
    mensaje.textContent = "";
  }

  if (ventana) {
    ventana.style.display = "flex";
  }

}


function cerrarLogin() {

  const ventana = document.getElementById("ventanaLogin");

  if (ventana) {
    ventana.style.display = "none";
  }

}


async function iniciarSesion() {

  const correo = document
    .getElementById("correoLogin")
    .value
    .trim();

  const contrasena = document
    .getElementById("contrasenaLogin")
    .value;

  const mensaje = document.getElementById("mensajeLogin");


  if (!correo || !contrasena) {

    mensaje.textContent =
      "⚠️ Escribe tu correo y contraseña.";

    return;
  }


  mensaje.textContent = "⏳ Iniciando sesión...";


  try {

    const resultado =
      await signInWithEmailAndPassword(
        auth,
        correo,
        contrasena
      );


    if (resultado.user.uid !== UID_DUENO) {

      await signOut(auth);

      mensaje.textContent =
        "❌ Esta cuenta no tiene permiso de administrador.";

      return;
    }


    mensaje.textContent =
      "✅ ¡Bienvenido, dueño!";


    setTimeout(() => {
      cerrarLogin();
    }, 500);


  } catch (error) {

    console.error(error);

    mensaje.textContent =
      "❌ Correo o contraseña incorrectos.";

  }

}


// ======================================================
// CERRAR SESIÓN
// ======================================================

async function cerrarSesion() {

  try {

    await signOut(auth);

  } catch (error) {

    console.error(error);

  }

}


// ======================================================
// VISTA PREVIA DE FOTO
// ======================================================

const fotoProducto =
  document.getElementById("fotoProducto");

if (fotoProducto) {

  fotoProducto.addEventListener("change", () => {

    const archivo = fotoProducto.files[0];

    const preview =
      document.getElementById("vistaPreviaProducto");


    if (!archivo) {

      preview.src = "";

      preview.style.display = "none";

      return;
    }


    preview.src =
      URL.createObjectURL(archivo);

    preview.style.display = "block";

  });

}


// ======================================================
// AGREGAR PRODUCTO
// ======================================================

async function agregarProducto() {

  const usuario = auth.currentUser;


  // Seguridad adicional en la interfaz
  if (!usuario || usuario.uid !== UID_DUENO) {

    alert(
      "❌ No tienes permiso para agregar productos."
    );

    return;
  }


  const foto =
    document.getElementById("fotoProducto").files[0];

  const nombre =
    document
      .getElementById("nombreProducto")
      .value
      .trim();

  const precio =
    Number(
      document
        .getElementById("precioProducto")
        .value
    );

  const descripcion =
    document
      .getElementById("descripcionProducto")
      .value
      .trim();

  const mensaje =
    document.getElementById("mensajeProducto");


  if (!foto) {

    mensaje.textContent =
      "⚠️ Selecciona una foto.";

    return;
  }


  if (!nombre) {

    mensaje.textContent =
      "⚠️ Escribe el nombre del producto.";

    return;
  }


  if (!precio || precio <= 0) {

    mensaje.textContent =
      "⚠️ Escribe un precio válido.";

    return;
  }


  if (!descripcion) {

    mensaje.textContent =
      "⚠️ Escribe una descripción.";

    return;
  }


  mensaje.textContent =
    "⏳ Subiendo imagen...";


  try {

    // ==================================================
    // SUBIR IMAGEN A CLOUDINARY
    // ==================================================

    const datos = new FormData();

    datos.append("file", foto);

    datos.append(
      "upload_preset",
      CLOUDINARY_UPLOAD_PRESET
    );


    const respuesta =
      await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: datos
        }
      );


    if (!respuesta.ok) {

      throw new Error(
        "No se pudo subir la imagen a Cloudinary."
      );

    }


    const imagen =
      await respuesta.json();


    if (!imagen.secure_url) {

      throw new Error(
        "Cloudinary no devolvió la imagen."
      );

    }


    mensaje.textContent =
      "⏳ Guardando producto...";


    // ==================================================
    // GUARDAR PRODUCTO EN FIRESTORE
    // ==================================================

    await addDoc(
      collection(db, "productos"),
      {
        nombre: nombre,
        precio: precio,
        descripcion: descripcion,
        imagen: imagen.secure_url,
        creado: new Date()
      }
    );


    mensaje.textContent =
      "✅ Producto publicado correctamente.";


    // Limpiar formulario

    document.getElementById(
      "fotoProducto"
    ).value = "";

    document.getElementById(
      "nombreProducto"
    ).value = "";

    document.getElementById(
      "precioProducto"
    ).value = "";

    document.getElementById(
      "descripcionProducto"
    ).value = "";


    const preview =
      document.getElementById(
        "vistaPreviaProducto"
      );

    preview.src = "";

    preview.style.display = "none";


    // Actualizar productos

    await cargarProductos();


    setTimeout(() => {

      mensaje.textContent = "";

    }, 4000);


  } catch (error) {

    console.error(error);

    mensaje.textContent =
      "❌ No se pudo publicar el producto.";

  }

}


// ======================================================
// CARGAR PRODUCTOS DE FIRESTORE
// ======================================================

async function cargarProductos() {

  const contenedor =
    document.getElementById(
      "productosDinamicos"
    );


  if (!contenedor) return;


  try {

    const consulta =
      await getDocs(
        collection(db, "productos")
      );


    productosFirebase = [];


    contenedor.innerHTML = "";


    consulta.forEach((documento) => {

      const producto =
        documento.data();


      const productoCompleto = {

        id: documento.id,

        nombre:
          producto.nombre || "Producto",

        precio:
          Number(producto.precio) || 0,

        descripcion:
          producto.descripcion || "",

        imagen:
          producto.imagen || ""

      };


      productosFirebase.push(
        productoCompleto
      );


      const tarjeta =
        document.createElement("div");

      tarjeta.className =
        "producto producto-firebase";


      tarjeta.dataset.nombre =
        `${productoCompleto.nombre} ${productoCompleto.descripcion}`
          .toLowerCase();


      tarjeta.dataset.precio =
        productoCompleto.precio;


      // Imagen

      const imagen =
        document.createElement("img");

      imagen.src =
        productoCompleto.imagen;

      imagen.alt =
        productoCompleto.nombre;

      imagen.loading = "lazy";


      // Nombre

      const titulo =
        document.createElement("h3");

      titulo.textContent =
        productoCompleto.nombre;


      // Precio

      const precio =
        document.createElement("p");

      precio.className = "precio";

      precio.textContent =
        formatearPrecio(
          productoCompleto.precio
        );


      // Descripción

      const descripcion =
        document.createElement("p");

      descripcion.textContent =
        productoCompleto.descripcion;


      // Contenedor botones

      const botones =
        document.createElement("div");

      botones.className =
        "botones-producto";


      // Botón carrito

      const botonCarrito =
        document.createElement("button");

      botonCarrito.className =
        "boton-carrito-producto";

      botonCarrito.textContent =
        "🛒 Agregar al carrito";


      botonCarrito.addEventListener(
        "click",
        () => {

          agregarAlCarrito(
            productoCompleto.nombre,
            productoCompleto.precio
          );

        }
      );


      botones.appendChild(
        botonCarrito
      );


      // =================================================
      // BOTÓN BORRAR
      // =================================================

      const botonEliminar =
        document.createElement("button");

      botonEliminar.className =
        "boton-eliminar-producto";

      botonEliminar.textContent =
        "🗑️ Borrar";


      botonEliminar.title =
        "Eliminar producto";


      botonEliminar.addEventListener(
        "click",
        () => {

          eliminarProductoFirebase(
            productoCompleto.id,
            productoCompleto.nombre
          );

        }
      );


      botones.appendChild(
        botonEliminar
      );


      tarjeta.appendChild(imagen);

      tarjeta.appendChild(titulo);

      tarjeta.appendChild(precio);

      tarjeta.appendChild(descripcion);

      tarjeta.appendChild(botones);


      contenedor.appendChild(
        tarjeta
      );

    });


    aplicarFiltros();


  } catch (error) {

    console.error(
      "Error cargando productos:",
      error
    );

  }

}


// ======================================================
// BORRAR PRODUCTO
// ======================================================

async function eliminarProductoFirebase(
  id,
  nombre
) {

  const usuario = auth.currentUser;


  // Comprobar dueño

  if (!usuario || usuario.uid !== UID_DUENO) {

    alert(
      "❌ No tienes permiso para borrar productos."
    );

    return;
  }


  const confirmar =
    confirm(
      `¿Seguro que quieres borrar "${nombre}"?`
    );


  if (!confirmar) return;


  try {

    await deleteDoc(
      doc(
        db,
        "productos",
        id
      )
    );


    alert(
      "✅ Producto eliminado."
    );


    await cargarProductos();


  } catch (error) {

    console.error(error);

    alert(
      "❌ No se pudo eliminar el producto."
    );

  }

}


// ======================================================
// BUSCADOR
// ======================================================

const buscador =
  document.getElementById(
    "buscadorProductos"
  );


if (buscador) {

  buscador.addEventListener(
    "input",
    aplicarFiltros
  );

}


// ======================================================
// FILTROS DE PRECIO
// ======================================================

const precioMinimo =
  document.getElementById(
    "precioMinimo"
  );

const precioMaximo =
  document.getElementById(
    "precioMaximo"
  );


if (precioMinimo) {

  precioMinimo.addEventListener(
    "input",
    aplicarFiltros
  );

}


if (precioMaximo) {

  precioMaximo.addEventListener(
    "input",
    aplicarFiltros
  );

}


// ======================================================
// APLICAR FILTROS
// ======================================================

function aplicarFiltros() {

  const texto =
    (
      document.getElementById(
        "buscadorProductos"
      )?.value || ""
    )
      .trim()
      .toLowerCase();


  const minimo =
    Number(
      document.getElementById(
        "precioMinimo"
      )?.value || 0
    );


  const valorMaximo =
    document.getElementById(
      "precioMaximo"
    )?.value;


  const maximo =
    valorMaximo === ""
      ? Infinity
      : Number(valorMaximo);


  const productos =
    document.querySelectorAll(
      ".producto"
    );


  let encontrados = 0;


  productos.forEach((producto) => {

    const nombre =
      (
        producto.dataset.nombre || ""
      ).toLowerCase();


    const precio =
      Number(
        producto.dataset.precio || 0
      );


    const coincideTexto =
      texto === "" ||
      nombre.includes(texto);


    const coincidePrecio =
      precio >= minimo &&
      precio <= maximo;


    if (
      coincideTexto &&
      coincidePrecio
    ) {

      producto.style.display =
        "flex";

      encontrados++;

    } else {

      producto.style.display =
        "none";

    }

  });


  const sinResultados =
    document.getElementById(
      "sinResultados"
    );


  if (encontrados === 0) {

    if (sinResultados) {

      sinResultados.style.display =
        "flex";

    }

  } else {

    if (sinResultados) {

      sinResultados.style.display =
        "none";

    }

  }


  const contador =
    document.getElementById(
      "contadorResultados"
    );


  if (contador) {

    if (encontrados === 1) {

      contador.textContent =
        "🔎 1 producto encontrado";

    } else {

      contador.textContent =
        `🔎 ${encontrados} productos encontrados`;

    }

  }

}


// ======================================================
// ESTABLECER PRECIO RÁPIDO
// ======================================================

function establecerPrecio(
  minimo,
  maximo
) {

  document.getElementById(
    "precioMinimo"
  ).value = minimo;


  const campoMaximo =
    document.getElementById(
      "precioMaximo"
    );


  if (maximo === null) {

    campoMaximo.value = "";

  } else {

    campoMaximo.value = maximo;

  }


  aplicarFiltros();

}


// ======================================================
// LIMPIAR BÚSQUEDA
// ======================================================

function limpiarBusqueda() {

  const buscador =
    document.getElementById(
      "buscadorProductos"
    );


  if (buscador) {

    buscador.value = "";

  }


  aplicarFiltros();

}


// ======================================================
// LIMPIAR TODOS LOS FILTROS
// ======================================================

function limpiarFiltros() {

  const buscador =
    document.getElementById(
      "buscadorProductos"
    );

  const minimo =
    document.getElementById(
      "precioMinimo"
    );

  const maximo =
    document.getElementById(
      "precioMaximo"
    );


  if (buscador) {

    buscador.value = "";

  }


  if (minimo) {

    minimo.value = "0";

  }


  if (maximo) {

    maximo.value = "";

  }


  aplicarFiltros();

}


// ======================================================
// MOSTRAR PRODUCTOS
// ======================================================

function mostrarMensaje() {

  const seccion =
    document.getElementById(
      "seccionProductos"
    );


  if (seccion) {

    seccion.scrollIntoView({
      behavior: "smooth"
    });

  }

}


// ======================================================
// CARRITO
// ======================================================

function agregarAlCarrito(
  nombre,
  precio
) {

  const productoExistente =
    carrito.find(
      producto =>
        producto.nombre === nombre
    );


  if (productoExistente) {

    productoExistente.cantidad++;

  } else {

    carrito.push({

      nombre: nombre,

      precio: Number(precio),

      cantidad: 1

    });

  }


  actualizarCarrito();

  mostrarProductosCarrito();

}


function actualizarCarrito() {

  const cantidad =
    carrito.reduce(
      (total, producto) =>
        total + producto.cantidad,
      0
    );


  const elemento =
    document.getElementById(
      "cantidadCarrito"
    );


  if (elemento) {

    elemento.textContent =
      cantidad;

  }

}


function abrirCarrito() {

  const ventana =
    document.getElementById(
      "ventanaCarrito"
    );


  if (!ventana) return;


  ventana.style.display =
    "flex";


  mostrarProductosCarrito();

}


function cerrarCarrito() {

  const ventana =
    document.getElementById(
      "ventanaCarrito"
    );


  if (ventana) {

    ventana.style.display =
      "none";

  }

}


// ======================================================
// MOSTRAR CARRITO
// ======================================================

function mostrarProductosCarrito() {

  const lista =
    document.getElementById(
      "listaCarrito"
    );

  const carritoVacio =
    document.getElementById(
      "carritoVacio"
    );

  const resumen =
    document.getElementById(
      "resumenCarrito"
    );

  const totalElemento =
    document.getElementById(
      "totalCarrito"
    );


  if (!lista) return;


  lista.innerHTML = "";


  if (carrito.length === 0) {

    carritoVacio.style.display =
      "block";

    resumen.style.display =
      "none";

    return;

  }


  carritoVacio.style.display =
    "none";

  resumen.style.display =
    "block";


  let total = 0;


  carrito.forEach(
    (producto, indice) => {

      const subtotal =
        producto.precio *
        producto.cantidad;


      total += subtotal;


      const item =
        document.createElement(
          "div"
        );


      item.className =
        "item-carrito";


      item.innerHTML = `

        <div class="info-item-carrito">

          <strong>
            ${escaparHTML(producto.nombre)}
          </strong>

          <span>
            ${formatearPrecio(producto.precio)}
          </span>

        </div>


        <div class="controles-carrito">

          <button
            onclick="disminuirCantidad(${indice})"
          >
            −
          </button>

          <span>
            ${producto.cantidad}
          </span>

          <button
            onclick="aumentarCantidad(${indice})"
          >
            +
          </button>

          <button
            class="eliminar-item"
            onclick="eliminarProductoCarrito(${indice})"
          >
            🗑️
          </button>

        </div>

      `;


      lista.appendChild(item);

    }
  );


  totalElemento.textContent =
    formatearPrecio(total);

}


// ======================================================
// AUMENTAR CANTIDAD
// ======================================================

function aumentarCantidad(indice) {

  carrito[indice].cantidad++;

  actualizarCarrito();

  mostrarProductosCarrito();

}


// ======================================================
// DISMINUIR CANTIDAD
// ======================================================

function disminuirCantidad(indice) {

  if (
    carrito[indice].cantidad > 1
  ) {

    carrito[indice].cantidad--;

  } else {

    carrito.splice(
      indice,
      1
    );

  }


  actualizarCarrito();

  mostrarProductosCarrito();

}


// ======================================================
// ELIMINAR PRODUCTO DEL CARRITO
// ======================================================

function eliminarProductoCarrito(
  indice
) {

  carrito.splice(
    indice,
    1
  );


  actualizarCarrito();

  mostrarProductosCarrito();

}


// ======================================================
// VACIAR CARRITO
// ======================================================

function vaciarCarrito() {

  if (carrito.length === 0) return;


  const confirmar =
    confirm(
      "¿Quieres vaciar todo el carrito?"
    );


  if (!confirmar) return;


  carrito = [];


  actualizarCarrito();

  mostrarProductosCarrito();

}


// ======================================================
// COMPRAR POR WHATSAPP
// ======================================================

function comprarCarritoWhatsApp() {

  if (carrito.length === 0) {

    alert(
      "🛒 El carrito está vacío."
    );

    return;

  }


  const numeroWhatsApp =
    "573202104423";


  let mensaje =
    "Hola, quiero comprar estos productos:%0A%0A";


  let total = 0;


  carrito.forEach(
    producto => {

      const subtotal =
        producto.precio *
        producto.cantidad;


      total += subtotal;


      mensaje +=
        `• ${producto.nombre} x${producto.cantidad} - ${formatearPrecio(subtotal)}%0A`;

    }
  );


  mensaje +=
    `%0A💰 Total: ${formatearPrecio(total)}`;


  const enlace =
    `https://wa.me/${numeroWhatsApp}?text=${mensaje}`;


  window.location.href =
    enlace;

}


// ======================================================
// FORMATEAR PRECIOS
// ======================================================

function formatearPrecio(precio) {

  return new Intl.NumberFormat(
    "es-CO",
    {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0
    }
  ).format(precio);

}


// ======================================================
// EVITAR HTML INDESEADO
// ======================================================

function escaparHTML(texto) {

  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


// ======================================================
// HACER FUNCIONES DISPONIBLES PARA LOS BOTONES HTML
// ======================================================

window.abrirLogin =
  abrirLogin;

window.cerrarLogin =
  cerrarLogin;

window.iniciarSesion =
  iniciarSesion;

window.cerrarSesion =
  cerrarSesion;

window.agregarProducto =
  agregarProducto;

window.eliminarProductoFirebase =
  eliminarProductoFirebase;

window.mostrarMensaje =
  mostrarMensaje;

window.agregarAlCarrito =
  agregarAlCarrito;

window.abrirCarrito =
  abrirCarrito;

window.cerrarCarrito =
  cerrarCarrito;

window.aumentarCantidad =
  aumentarCantidad;

window.disminuirCantidad =
  disminuirCantidad;

window.eliminarProductoCarrito =
  eliminarProductoCarrito;

window.vaciarCarrito =
  vaciarCarrito;

window.comprarCarritoWhatsApp =
  comprarCarritoWhatsApp;

window.limpiarBusqueda =
  limpiarBusqueda;

window.limpiarFiltros =
  limpiarFiltros;

window.establecerPrecio =
  establecerPrecio;


// ======================================================
// INICIAR
// ======================================================

cargarProductos();

actualizarCarrito();
