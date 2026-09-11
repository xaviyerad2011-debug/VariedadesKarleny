/* =========================================================
   VARIEDADES KARLENY — APP + TIENDA + PERSONALIZADOR 2D
   ========================================================= */

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
  updateDoc,
  doc,
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   FIREBASE
   ========================================================= */

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

const UID_DUENO = "vKixdwAJz9MfApZV81FPOiPybFr2";

const CLOUDINARY_CLOUD_NAME = "ktxu8h5o";
const CLOUDINARY_UPLOAD_PRESET = "productos";

const WHATSAPP = "573202104423";


/* =========================================================
   CONFIGURACIÓN DEL EDITOR
   ========================================================= */

/*
  Área física de referencia:
  30 cm × 40 cm

  El editor interno utiliza:
  600 × 800 px

  Por lo tanto:
  20 px = 1 cm horizontal
  20 px = 1 cm vertical
*/

const EDITOR_WIDTH = 600;
const EDITOR_HEIGHT = 800;

const CM_PER_EDITOR_PX_X = 30 / EDITOR_WIDTH;
const CM_PER_EDITOR_PX_Y = 40 / EDITOR_HEIGHT;


/* =========================================================
   COLORES DE CAMISA
   ========================================================= */

const COLORES_CAMISA = [
  {
    nombre: "Blanco",
    valor: "#ffffff",
    borde: "#d8d8dc"
  },
  {
    nombre: "Negro",
    valor: "#171717",
    borde: "#090909"
  },
  {
    nombre: "Rojo",
    valor: "#d62839",
    borde: "#a51929"
  },
  {
    nombre: "Azul",
    valor: "#2463c4",
    borde: "#174587"
  },
  {
    nombre: "Celeste",
    valor: "#58b8e8",
    borde: "#3f91b9"
  },
  {
    nombre: "Verde",
    valor: "#2da66f",
    borde: "#20744f"
  },
  {
    nombre: "Amarillo",
    valor: "#ffd447",
    borde: "#c4a122"
  },
  {
    nombre: "Naranja",
    valor: "#f28c28",
    borde: "#c86e19"
  },
  {
    nombre: "Rosado",
    valor: "#ef6cae",
    borde: "#c24c88"
  },
  {
    nombre: "Morado",
    valor: "#7b4cc6",
    borde: "#563196"
  },
  {
    nombre: "Café",
    valor: "#8b5e3c",
    borde: "#68452d"
  },
  {
    nombre: "Gris",
    valor: "#9da3aa",
    borde: "#747a80"
  }
];


/* =========================================================
   ESTADO GLOBAL
   ========================================================= */

let carrito = [];

let productosFirebase = [];

let fabricCanvas = null;
let fabricReadyPromise = null;

let editorColor = COLORES_CAMISA[0].valor;
let editorColorNombre = COLORES_CAMISA[0].nombre;

let cantidadCamisas = 1;

let tallaBase = "S";

let camisaActual = 0;

let camisas = [];

let ladoActual = "frente";

let editorHistoryPast = [];
let editorHistoryFuture = [];

let restaurandoEditor = false;

let ultimaOperacionHistorial = 0;

let pedidosAdmin = [];
let pedidosInicializados = false;

let unsubscribePedidos = null;

let idsPedidosConocidos = new Set();

let deferredInstallPrompt = null;


/* =========================================================
   UTILIDAD DOM
   ========================================================= */

const $ = (id) => document.getElementById(id);


/* =========================================================
   UTILIDADES GENERALES
   ========================================================= */

function formatearPrecio(precio) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(precio) || 0);
}


function escaparHTML(texto) {
  return String(texto ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function mostrarToast(titulo, mensaje, tipo = "normal") {

  const contenedor = $("toastContainer");

  if (!contenedor) return;

  const toast = document.createElement("div");

  toast.className = `toast toast-${tipo}`;

  toast.innerHTML = `
    <strong>${escaparHTML(titulo)}</strong>
    <span>${escaparHTML(mensaje)}</span>
  `;

  contenedor.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("mostrar");
  }, 20);

  setTimeout(() => {

    toast.classList.remove("mostrar");

    setTimeout(() => {
      toast.remove();
    }, 250);

  }, 4800);
}


function fechaBonita(valor) {

  if (!valor) return "—";

  const partes = String(valor).split("-");

  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  if (typeof valor?.toDate === "function") {
    return valor.toDate().toLocaleDateString("es-CO");
  }

  return String(valor);
}


function limitarNumero(valor, min, max) {
  return Math.min(max, Math.max(min, valor));
}


/*
  Clonado seguro.

  No utilizamos structuredClone porque algunos navegadores
  pueden tener problemas con objetos provenientes de Fabric.
*/

function clonarObjetos(objetos) {

  try {

    return JSON.parse(
      JSON.stringify(objetos || [])
    );

  } catch (error) {

    console.warn(
      "No se pudieron clonar los objetos:",
      error
    );

    return [];
  }
}


/* =========================================================
   ESPERAR FABRIC.JS
   ========================================================= */

function esperarFabric() {

  if (fabricReadyPromise) {
    return fabricReadyPromise;
  }

  fabricReadyPromise = new Promise((resolve, reject) => {

    const inicio = Date.now();

    const revisar = () => {

      if (window.fabric?.Canvas) {

        resolve(window.fabric);

        return;
      }

      if (Date.now() - inicio > 15000) {

        reject(
          new Error(
            "No se pudo cargar el editor de camisas."
          )
        );

        return;
      }

      setTimeout(revisar, 100);
    };

    revisar();
  });

  return fabricReadyPromise;
}


/* =========================================================
   NAVEGACIÓN PRINCIPAL
   ========================================================= */

window.mostrarProductos = function () {

  const inicio = $("pantallaInicio");

  if (inicio) {
    inicio.style.display = "none";
  }

  const pantalla = $("pantallaProductos");

  if (pantalla) {

    pantalla.style.display = "block";

    pantalla.classList.add("activa");
  }

  const personalizador = $("pantallaPersonalizador");

  if (personalizador) {
    personalizador.style.display = "none";
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
};


window.volverInicio = function () {

  const productos = $("pantallaProductos");

  if (productos) {

    productos.classList.remove("activa");

    productos.style.display = "none";
  }

  const personalizador = $("pantallaPersonalizador");

  if (personalizador) {
    personalizador.style.display = "none";
  }

  const inicio = $("pantallaInicio");

  if (inicio) {
    inicio.style.display = "flex";
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
};


/* =========================================================
   LOGIN + ADMIN
   ========================================================= */

onAuthStateChanged(auth, (usuario) => {

  const panel = $("panelAdmin");

  const estado = $("estadoAdmin");

  if (!usuario) {

    if (panel) {
      panel.style.display = "none";
    }

    detenerEscuchaPedidos();

    return;
  }

  if (usuario.uid !== UID_DUENO) {

    signOut(auth).catch(console.error);

    if (panel) {
      panel.style.display = "none";
    }

    mostrarToast(
      "Acceso denegado",
      "Esta cuenta no tiene permisos de administrador.",
      "error"
    );

    return;
  }

  if (panel) {
    panel.style.display = "block";
  }

  if (estado) {
    estado.textContent =
      "🟢 Sesión de dueño activa";
  }

  iniciarEscuchaPedidos();
});


window.abrirLogin = function () {

  const ventana = $("ventanaLogin");

  const mensaje = $("mensajeLogin");

  if (mensaje) {
    mensaje.textContent = "";
  }

  if (ventana) {
    ventana.style.display = "flex";
  }

  setTimeout(() => {
    $("correoLogin")?.focus();
  }, 80);
};


window.cerrarLogin = function () {

  const ventana = $("ventanaLogin");

  if (ventana) {
    ventana.style.display = "none";
  }
};


window.iniciarSesion = async function () {

  const correo =
    $("correoLogin")?.value.trim() || "";

  const contrasena =
    $("contrasenaLogin")?.value || "";

  const mensaje = $("mensajeLogin");

  if (!correo || !contrasena) {

    if (mensaje) {
      mensaje.textContent =
        "⚠️ Escribe tu correo y contraseña.";
    }

    return;
  }

  if (mensaje) {
    mensaje.textContent =
      "⏳ Iniciando sesión...";
  }

  try {

    const resultado =
      await signInWithEmailAndPassword(
        auth,
        correo,
        contrasena
      );

    if (resultado.user.uid !== UID_DUENO) {

      await signOut(auth);

      if (mensaje) {
        mensaje.textContent =
          "❌ Esta cuenta no tiene permiso de administrador.";
      }

      return;
    }

    if (mensaje) {
      mensaje.textContent =
        "✅ ¡Bienvenido!";
    }

    mostrarToast(
      "Administrador conectado",
      "Ahora puedes revisar tus pedidos.",
      "success"
    );

    setTimeout(() => {
      window.cerrarLogin();
    }, 500);

    window.mostrarProductos();

  } catch (error) {

    console.error(error);

    if (mensaje) {
      mensaje.textContent =
        "❌ Correo o contraseña incorrectos.";
    }
  }
};


window.cerrarSesion = async function () {

  try {

    await signOut(auth);

    window.ocultarPedidosAdmin();

    mostrarToast(
      "Sesión cerrada",
      "Hasta pronto.",
      "normal"
    );

  } catch (error) {

    console.error(error);
  }
};


/* =========================================================
   CLOUDINARY
   ========================================================= */

async function subirImagenCloudinary(archivo) {

  const datos = new FormData();

  datos.append("file", archivo);

  datos.append(
    "upload_preset",
    CLOUDINARY_UPLOAD_PRESET
  );

  const respuesta = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
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

  return respuesta.json();
}


/* =========================================================
   PRODUCTOS
   ========================================================= */

async function cargarProductosFirebase() {

  try {

    const snapshot =
      await getDocs(
        collection(db, "productos")
      );

    productosFirebase =
      snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data()
      }));

    renderizarProductos();

  } catch (error) {

    console.error(
      "Error cargando productos:",
      error
    );

    mostrarToast(
      "Error",
      "No se pudieron cargar los productos.",
      "error"
    );
  }
}


function renderizarProductos() {

  const contenedor =
    $("contenedorProductos");

  if (!contenedor) return;

  if (!productosFirebase.length) {

    contenedor.innerHTML = `
      <div class="sin-productos">
        <strong>No hay productos todavía.</strong>
      </div>
    `;

    return;
  }

  contenedor.innerHTML =
    productosFirebase.map((producto) => {

      const nombre =
        escaparHTML(
          producto.nombre || "Producto"
        );

      const descripcion =
        escaparHTML(
          producto.descripcion || ""
        );

      const precio =
        formatearPrecio(
          producto.precio
        );

      const imagen =
        escaparHTML(
          producto.imagen || ""
        );

      return `
        <article class="producto-card">

          <div class="imagen-producto">

            ${
              imagen
                ? `<img src="${imagen}" alt="${nombre}" loading="lazy">`
                : `<div class="sin-imagen-producto">📦</div>`
            }

          </div>

          <div class="producto-info">

            <h3>${nombre}</h3>

            ${
              descripcion
                ? `<p>${descripcion}</p>`
                : ""
            }

            <strong class="precio-producto">
              ${precio}
            </strong>

            <button
              class="btn btn-primary"
              onclick="agregarAlCarrito('${producto.id}')"
            >
              🛒 Agregar
            </button>

          </div>

        </article>
      `;

    }).join("");
}


window.agregarProductoAdmin = async function () {

  const nombre =
    $("nombreProductoAdmin")?.value.trim() || "";

  const descripcion =
    $("descripcionProductoAdmin")?.value.trim() || "";

  const precio =
    Number(
      $("precioProductoAdmin")?.value || 0
    );

  const archivo =
    $("imagenProductoAdmin")?.files?.[0];

  if (!nombre || !precio) {

    mostrarToast(
      "Faltan datos",
      "Escribe el nombre y precio del producto.",
      "error"
    );

    return;
  }

  try {

    let imagen = "";

    if (archivo) {

      mostrarToast(
        "Subiendo imagen",
        "Espera un momento...",
        "normal"
      );

      const resultado =
        await subirImagenCloudinary(
          archivo
        );

      imagen =
        resultado.secure_url || "";
    }

    await addDoc(
      collection(db, "productos"),
      {
        nombre,
        descripcion,
        precio,
        imagen,
        creado: serverTimestamp()
      }
    );

    mostrarToast(
      "Producto agregado",
      "El producto ya está disponible.",
      "success"
    );

    $("nombreProductoAdmin").value = "";
    $("descripcionProductoAdmin").value = "";
    $("precioProductoAdmin").value = "";

    if ($("imagenProductoAdmin")) {
      $("imagenProductoAdmin").value = "";
    }

    await cargarProductosFirebase();

  } catch (error) {

    console.error(error);

    mostrarToast(
      "Error",
      "No se pudo guardar el producto.",
      "error"
    );
  }
};


window.eliminarProductoAdmin = async function (id) {

  if (!id) return;

  const confirmar =
    confirm(
      "¿Seguro que quieres eliminar este producto?"
    );

  if (!confirmar) return;

  try {

    await deleteDoc(
      doc(db, "productos", id)
    );

    mostrarToast(
      "Producto eliminado",
      "Se eliminó correctamente.",
      "success"
    );

    await cargarProductosFirebase();

  } catch (error) {

    console.error(error);

    mostrarToast(
      "Error",
      "No se pudo eliminar el producto.",
      "error"
    );
  }
};


/* =========================================================
   CARRITO
   ========================================================= */

function guardarCarrito() {

  try {

    localStorage.setItem(
      "variedadesKarlenyCarrito",
      JSON.stringify(carrito)
    );

  } catch (error) {

    console.warn(
      "No se pudo guardar el carrito.",
      error
    );
  }
}


function cargarCarrito() {

  try {

    const guardado =
      localStorage.getItem(
        "variedadesKarlenyCarrito"
      );

    carrito =
      guardado
        ? JSON.parse(guardado)
        : [];

  } catch (error) {

    carrito = [];
  }

  renderizarCarrito();
}


window.agregarAlCarrito = function (id) {

  const producto =
    productosFirebase.find(
      (item) => item.id === id
    );

  if (!producto) {

    mostrarToast(
      "Producto no encontrado",
      "Actualiza la página e inténtalo otra vez.",
      "error"
    );

    return;
  }

  const existente =
    carrito.find(
      (item) => item.id === id
    );

  if (existente) {

    existente.cantidad =
      Number(existente.cantidad || 0) + 1;

  } else {

    carrito.push({
      id: producto.id,
      nombre: producto.nombre,
      precio: Number(producto.precio) || 0,
      imagen: producto.imagen || "",
      cantidad: 1
    });
  }

  guardarCarrito();

  renderizarCarrito();

  mostrarToast(
    "Agregado al carrito",
    producto.nombre,
    "success"
  );
};


function renderizarCarrito() {

  const lista =
    $("listaCarrito");

  const vacio =
    $("carritoVacio");

  const resumen =
    $("resumenCarrito");

  const total =
    $("totalCarrito");

  const contador =
    $("contadorCarrito");

  if (!lista) return;

  if (!carrito.length) {

    lista.innerHTML = "";

    if (vacio) {
      vacio.style.display = "block";
    }

    if (resumen) {
      resumen.style.display = "none";
    }

    if (contador) {
      contador.textContent = "0";
    }

    return;
  }

  if (vacio) {
    vacio.style.display = "none";
  }

  lista.innerHTML =
    carrito.map((item, indice) => {

      const subtotal =
        Number(item.precio || 0) *
        Number(item.cantidad || 0);

      return `
        <div class="item-carrito">

          <div class="info-item-carrito">

            <strong>
              ${escaparHTML(item.nombre)}
            </strong>

            <span>
              ${formatearPrecio(item.precio)}
            </span>

            <small>
              Subtotal:
              ${formatearPrecio(subtotal)}
            </small>

          </div>

          <div class="controles-carrito">

            <button
              onclick="cambiarCantidadCarrito(${indice},-1)"
            >
              −
            </button>

            <strong>
              ${item.cantidad}
            </strong>

            <button
              onclick="cambiarCantidadCarrito(${indice},1)"
            >
              +
            </button>

            <button
              class="eliminar-item"
              onclick="eliminarDelCarrito(${indice})"
            >
              🗑️
            </button>

          </div>

        </div>
      `;

    }).join("");

  const totalCalculado =
    carrito.reduce(
      (suma, item) =>
        suma +
        Number(item.precio || 0) *
        Number(item.cantidad || 0),
      0
    );

  if (total) {
    total.textContent =
      formatearPrecio(totalCalculado);
  }

  if (resumen) {
    resumen.style.display = "block";
  }

  if (contador) {

    contador.textContent =
      String(
        carrito.reduce(
          (suma, item) =>
            suma +
            Number(item.cantidad || 0),
          0
        )
      );
  }
}


window.cambiarCantidadCarrito = function (
  indice,
  delta
) {

  if (!carrito[indice]) return;

  carrito[indice].cantidad =
    Number(carrito[indice].cantidad || 0) +
    delta;

  if (carrito[indice].cantidad <= 0) {
    carrito.splice(indice, 1);
  }

  guardarCarrito();

  renderizarCarrito();
};


window.eliminarDelCarrito = function (indice) {

  if (!carrito[indice]) return;

  carrito.splice(indice, 1);

  guardarCarrito();

  renderizarCarrito();
};


window.vaciarCarrito = function () {

  carrito = [];

  guardarCarrito();

  renderizarCarrito();
};


window.abrirCarrito = function () {

  const ventana =
    $("ventanaCarrito");

  if (ventana) {
    ventana.style.display = "flex";
  }

  renderizarCarrito();
};


window.cerrarCarrito = function () {

  const ventana =
    $("ventanaCarrito");

  if (ventana) {
    ventana.style.display = "none";
  }
};


/* =========================================================
   PERSONALIZADOR — DATOS
   ========================================================= */

function mostrarSolo(id) {

  const pantallas = [
    "pantallaInicio",
    "pantallaProductos",
    "pantallaPersonalizador"
  ];

  pantallas.forEach((pantallaId) => {

    const elemento =
      $(pantallaId);

    if (!elemento) return;

    elemento.style.display =
      pantallaId === id
        ? (pantallaId === "pantallaInicio"
            ? "flex"
            : "block")
        : "none";
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


function mostrarPasoPersonalizador(paso) {

  const pasos = {
    datos:
      "pasoDatosPersonalizacion",

    cantidad:
      "pasoCantidadPersonalizacion",

    editor:
      "pasoEditorPersonalizacion",

    revision:
      "pasoRevisionPersonalizacion",

    final:
      "pasoFinalPersonalizacion"
  };

  Object.entries(pasos).forEach(
    ([nombre, id]) => {

      const elemento = $(id);

      if (!elemento) return;

      const activo =
        nombre === paso;

      elemento.hidden = !activo;

      elemento.classList.toggle(
        "paso-activo",
        activo
      );
    }
  );
}


function crearCamisa(
  talla = tallaBase,
  copia = null
) {

  return {

    talla,

    color:
      copia?.color ||
      COLORES_CAMISA[0].valor,

    colorNombre:
      copia?.colorNombre ||
      COLORES_CAMISA[0].nombre,

    frenteObjects:
      copia
        ? clonarObjetos(
            copia.frenteObjects || []
          )
        : [],

    espaldaObjects:
      copia
        ? clonarObjetos(
            copia.espaldaObjects || []
          )
        : [],

    previewFrente:
      copia?.previewFrente || "",

    previewEspalda:
      copia?.previewEspalda || ""
  };
}


function inicializarCamisas() {

  camisas =
    Array.from(
      {
        length: cantidadCamisas
      },
      () => crearCamisa()
    );
}


function resetPersonalizador() {

  cantidadCamisas = 1;

  tallaBase = "S";

  camisaActual = 0;

  ladoActual = "frente";

  editorColor =
    COLORES_CAMISA[0].valor;

  editorColorNombre =
    COLORES_CAMISA[0].nombre;

  camisas = [];

  editorHistoryPast = [];

  editorHistoryFuture = [];

  restaurandoEditor = false;

  ultimaOperacionHistorial = 0;

  const nombre =
    $("clienteNombre");

  const telefono =
    $("clienteTelefono");

  const fecha =
    $("fechaEntrega");

  if (nombre) {
    nombre.value = "";
  }

  if (telefono) {
    telefono.value = "";
  }

  if (fecha) {
    fecha.value = "";
  }

  const tallaButtons =
    document.querySelectorAll(
      "#tallasBase button"
    );

  tallaButtons.forEach((boton) => {

    boton.classList.toggle(
      "selected",
      boton.dataset.talla === "S"
    );
  });

  actualizarCantidadUI();

  mostrarPasoPersonalizador(
    "datos"
  );

  actualizarPaletaColores();

  if (fabricCanvas) {

    fabricCanvas.clear();

    fabricCanvas.backgroundColor =
      "transparent";

    fabricCanvas.renderAll();
  }
}


window.abrirPersonalizador =
  function () {

    mostrarSolo(
      "pantallaPersonalizador"
    );

    resetPersonalizador();

    const min =
      new Date();

    min.setDate(
      min.getDate() + 1
    );

    const fecha =
      $("fechaEntrega");

    if (fecha) {

      fecha.min =
        min.toISOString()
          .slice(0, 10);
    }

    validarDatosPersonalizacion();
  };


function validarDatosPersonalizacion() {

  const nombre =
    $("clienteNombre")?.value.trim() || "";

  const telefono =
    $("clienteTelefono")?.value.trim() || "";

  const fecha =
    $("fechaEntrega")?.value || "";

  const boton =
    $("btnIniciarPersonalizacion");

  const valido =
    Boolean(
      nombre &&
      telefono &&
      fecha &&
      tallaBase
    );

  if (boton) {
    boton.disabled = !valido;
  }

  return valido;
}


window.iniciarPersonalizacion =
  function () {

    if (!validarDatosPersonalizacion()) {

      mostrarToast(
        "Faltan datos",
        "Completa tu nombre, teléfono, fecha y talla.",
        "error"
      );

      return;
    }

    cantidadCamisas = 1;

    inicializarCamisas();

    actualizarCantidadUI();

    mostrarPasoPersonalizador(
      "cantidad"
    );
  };


/* =========================================================
   TALLAS
   ========================================================= */

document.addEventListener(
  "click",
  (evento) => {

    const boton =
      evento.target.closest(
        "#tallasBase button"
      );

    if (!boton) return;

    tallaBase =
      boton.dataset.talla || "S";

    document
      .querySelectorAll(
        "#tallasBase button"
      )
      .forEach((item) => {

        item.classList.toggle(
          "selected",
          item === boton
        );
      });

    validarDatosPersonalizacion();
  }
);


/* =========================================================
   CANTIDAD DE CAMISAS
   ========================================================= */

window.cambiarCantidadCamisas =
  function (delta) {

    cantidadCamisas =
      limitarNumero(
        cantidadCamisas + delta,
        1,
        20
      );

    while (
      camisas.length <
      cantidadCamisas
    ) {

      camisas.push(
        crearCamisa()
      );
    }

    if (
      camisas.length >
      cantidadCamisas
    ) {

      camisas.length =
        cantidadCamisas;
    }

    actualizarCantidadUI();
  };


function actualizarCantidadUI() {

  const cantidad =
    $("cantidadCamisas");

  const texto =
    $("textoCantidadCamisas");

  if (cantidad) {
    cantidad.textContent =
      String(cantidadCamisas);
  }

  if (texto) {

    texto.textContent =
      cantidadCamisas === 1
        ? "1 camisa"
        : `${cantidadCamisas} camisas`;
  }
}


/* =========================================================
   PREPARAR EDITOR — CORREGIDO
   ========================================================= */

/*
  IMPORTANTE:

  Antes el editor intentaba crear Fabric mientras el paso
  estaba oculto con hidden.

  Ahora:
  1. Se muestra el editor.
  2. El navegador calcula sus dimensiones.
  3. Se crea Fabric.
  4. Se recalcula el offset.

  Esto evita que el canvas aparezca vacío o no responda.
*/

async function prepararEditor() {

  if (fabricCanvas) {

    fabricCanvas.calcOffset();

    fabricCanvas.renderAll();

    return fabricCanvas;
  }

  const fabric =
    await esperarFabric();

  const canvasElement =
    $("canvasCamisa");

  if (!canvasElement) {

    throw new Error(
      "No existe #canvasCamisa en la página."
    );
  }

  try {

    canvasElement.width =
      EDITOR_WIDTH;

    canvasElement.height =
      EDITOR_HEIGHT;

    const nuevoCanvas =
      new fabric.Canvas(
        canvasElement,
        {
          width: EDITOR_WIDTH,
          height: EDITOR_HEIGHT,

          preserveObjectStacking: true,

          selection: true,

          uniformScaling: true,

          allowTouchScrolling: false,

          stopContextMenu: true,

          fireRightClick: false,

          backgroundColor:
            "transparent"
        }
      );

    fabricCanvas =
      nuevoCanvas;


    /* -------------------------
       SELECCIÓN
       ------------------------- */

    fabricCanvas.on(
      "selection:created",
      actualizarMedidasSeleccion
    );

    fabricCanvas.on(
      "selection:updated",
      actualizarMedidasSeleccion
    );

    fabricCanvas.on(
      "selection:cleared",
      actualizarMedidasSeleccion
    );


    /* -------------------------
       MOVIMIENTO
       ------------------------- */

    fabricCanvas.on(
      "object:moving",
      (evento) => {

        mantenerDentroDelArea(
          evento.target
        );

        evento.target.setCoords();

        actualizarMedidasSeleccion();
      }
    );


    /* -------------------------
       ESCALADO
       ------------------------- */

    fabricCanvas.on(
      "object:scaling",
      (evento) => {

        mantenerDentroDelArea(
          evento.target
        );

        evento.target.setCoords();

        actualizarMedidasSeleccion();
      }
    );


    /* -------------------------
       MODIFICADO
       ------------------------- */

    fabricCanvas.on(
      "object:modified",
      () => {

        actualizarMedidasSeleccion();

        registrarHistoria();
      }
    );


    /* -------------------------
       AGREGADO
       ------------------------- */

    fabricCanvas.on(
      "object:added",
      () => {

        if (!restaurandoEditor) {

          registrarHistoria();
        }
      }
    );


    /* -------------------------
       ELIMINADO
       ------------------------- */

    fabricCanvas.on(
      "object:removed",
      () => {

        if (!restaurandoEditor) {

          registrarHistoria();
        }
      }
    );


    canvasElement.setAttribute(
      "aria-label",
      "Área de diseño de la camisa"
    );


    /*
      Como el elemento ya está visible,
      calculamos correctamente el offset.
    */

    fabricCanvas.calcOffset();

    fabricCanvas.renderAll();

    return fabricCanvas;

  } catch (error) {

    /*
      Si Fabric falla, dejamos fabricCanvas
      en null para poder intentar nuevamente.
    */

    fabricCanvas = null;

    console.error(
      "Error creando Fabric:",
      error
    );

    throw error;
  }
}


/* =========================================================
   CONTINUAR AL EDITOR — CORREGIDO
   ========================================================= */

window.continuarAlEditor =
  async function () {

    /*
      Garantizamos que exista una estructura
      para todas las camisas.
    */

    if (!camisas.length) {

      camisas = [
        crearCamisa()
      ];
    }

    while (
      camisas.length <
      cantidadCamisas
    ) {

      camisas.push(
        crearCamisa()
      );
    }

    camisaActual = 0;

    ladoActual = "frente";


    /*
      🔥 SOLUCIÓN PRINCIPAL

      PRIMERO mostramos el editor.
      DESPUÉS inicializamos Fabric.
    */

    mostrarPasoPersonalizador(
      "editor"
    );


    try {

      /*
        Esperamos dos frames para que el navegador
        tenga tiempo de calcular correctamente
        el tamaño del contenedor visible.
      */

      await new Promise(
        (resolve) => {

          requestAnimationFrame(
            () => {

              requestAnimationFrame(
                resolve
              );

            }
          );

        }
      );


      await prepararEditor();


      if (!fabricCanvas) {

        throw new Error(
          "El lienzo de diseño no pudo inicializarse."
        );
      }


      await cargarCamisaEnEditor(
        0
      );


      fabricCanvas.calcOffset();

      fabricCanvas.renderAll();


    } catch (error) {

      console.error(
        "Error al abrir el editor:",
        error
      );


      /*
        En vez de dejar la pantalla en blanco,
        regresamos al selector de cantidad.
      */

      mostrarPasoPersonalizador(
        "cantidad"
      );


      mostrarToast(
        "No se pudo abrir el diseñador",
        "Recarga la página e inténtalo otra vez.",
        "error"
      );
    }
  };


/* =========================================================
   PALETA DE COLORES
   ========================================================= */

function actualizarPaletaColores() {

  const paleta =
    $("paletaColoresCamisa");

  if (!paleta) return;

  paleta.innerHTML =
    COLORES_CAMISA.map(
      (color, indice) => {

        const seleccionado =
          color.valor.toLowerCase() ===
          String(editorColor).toLowerCase();

        return `
          <button
            type="button"
            class="color-camisa ${seleccionado ? "seleccionada" : ""}"
            data-color-indice="${indice}"
            title="${escaparHTML(color.nombre)}"
            aria-label="Color ${escaparHTML(color.nombre)}"
            style="
              background:${color.valor};
              border-color:${seleccionado ? color.borde : "transparent"};
            "
          ></button>
        `;

      }
    ).join("");
}


document.addEventListener(
  "click",
  (evento) => {

    const boton =
      evento.target.closest(
        "#paletaColoresCamisa .color-camisa"
      );

    if (!boton) return;

    const indice =
      Number(
        boton.dataset.colorIndice
      );

    const color =
      COLORES_CAMISA[indice];

    if (!color) return;

    editorColor =
      color.valor;

    editorColorNombre =
      color.nombre;

    const camisa =
      camisas[camisaActual];

    if (camisa) {

      camisa.color =
        color.valor;

      camisa.colorNombre =
        color.nombre;
    }

    actualizarPaletaColores();

    actualizarColorVisualCamisa();
  }
);


/* =========================================================
   COLOR VISUAL DE LA CAMISA
   ========================================================= */

function actualizarColorVisualCamisa() {

  const silueta =
    $("siluetaCamisa");

  if (!silueta) return;

  silueta.setAttribute(
    "fill",
    editorColor
  );


  const nombre =
    $("nombreColorCamisa");

  if (nombre) {

    nombre.textContent =
      editorColorNombre;
  }
}


/* =========================================================
   CARGAR CAMISA EN EDITOR
   ========================================================= */

async function cargarCamisaEnEditor(
  indice
) {

  if (!fabricCanvas) {
    return;
  }

  if (!camisas[indice]) {
    return;
  }

  camisaActual =
    indice;

  const camisa =
    camisas[indice];


  editorColor =
    camisa.color ||
    COLORES_CAMISA[0].valor;

  editorColorNombre =
    camisa.colorNombre ||
    "Blanco";


  actualizarPaletaColores();

  actualizarColorVisualCamisa();


  restaurandoEditor = true;

  fabricCanvas.clear();

  fabricCanvas.backgroundColor =
    "transparent";


  const objetos =
    ladoActual === "frente"
      ? camisa.frenteObjects
      : camisa.espaldaObjects;


  try {

    if (
      objetos &&
      objetos.length
    ) {

      await fabricCanvas.loadFromJSON(
        {
          version:
            fabricCanvas.version,
          objects:
            clonarObjetos(objetos)
        }
      );

      fabricCanvas.getObjects()
        .forEach((objeto) => {

          objeto.set({
            selectable: true,
            evented: true
          });

          objeto.setCoords();
        });
    }

  } catch (error) {

    console.error(
      "Error cargando diseño:",
      error
    );

  } finally {

    restaurandoEditor = false;
  }


  fabricCanvas.discardActiveObject();

  fabricCanvas.calcOffset();

  fabricCanvas.renderAll();


  actualizarMedidasSeleccion();

  actualizarEstadoLadoUI();
}


/* =========================================================
   GUARDAR DISEÑO ACTUAL
   ========================================================= */

function guardarCamisaActual() {

  if (!fabricCanvas) {
    return;
  }

  const camisa =
    camisas[camisaActual];

  if (!camisa) {
    return;
  }


  const objetos =
    fabricCanvas.getObjects();


  const datos =
    objetos.map((objeto) => {

      const salida =
        objeto.toObject([
          "id",
          "left",
          "top",
          "scaleX",
          "scaleY",
          "width",
          "height",
          "angle",
          "originX",
          "originY",
          "flipX",
          "flipY",
          "type",
          "src"
        ]);

      return salida;
    });


  if (ladoActual === "frente") {

    camisa.frenteObjects =
      clonarObjetos(datos);

  } else {

    camisa.espaldaObjects =
      clonarObjetos(datos);
  }


  actualizarPreviewCamisaActual();
}


/* =========================================================
   CAMBIAR FRENTE / ESPALDA
   ========================================================= */

window.cambiarLadoCamisa =
  async function (lado) {

    if (
      lado !== "frente" &&
      lado !== "espalda"
    ) {

      return;
    }

    if (
      lado === ladoActual
    ) {

      actualizarEstadoLadoUI();

      return;
    }


    /*
      Antes de cambiar de lado,
      guardamos exactamente lo que hay.
    */

    guardarCamisaActual();


    ladoActual =
      lado;


    await cargarCamisaEnEditor(
      camisaActual
    );
  };


function actualizarEstadoLadoUI() {

  const frente =
    $("btnLadoFrente");

  const espalda =
    $("btnLadoEspalda");


  if (frente) {

    frente.classList.toggle(
      "selected",
      ladoActual === "frente"
    );

    frente.classList.toggle(
      "activo",
      ladoActual === "frente"
    );
  }


  if (espalda) {

    espalda.classList.toggle(
      "selected",
      ladoActual === "espalda"
    );

    espalda.classList.toggle(
      "activo",
      ladoActual === "espalda"
    );
  }


  const indicador =
    $("estadoLadoCamisa");

  if (indicador) {

    indicador.textContent =
      ladoActual === "frente"
        ? "Frente"
        : "Espalda";
  }
}


/* =========================================================
   MANTENER OBJETOS DENTRO DEL ÁREA
   ========================================================= */

function mantenerDentroDelArea(
  objeto
) {

  if (!objeto) return;


  objeto.setCoords();


  const mitadAncho =
    objeto.getScaledWidth() / 2;

  const mitadAlto =
    objeto.getScaledHeight() / 2;


  const minX =
    mitadAncho;

  const maxX =
    EDITOR_WIDTH -
    mitadAncho;


  const minY =
    mitadAlto;

  const maxY =
    EDITOR_HEIGHT -
    mitadAlto;


  objeto.left =
    limitarNumero(
      Number(objeto.left) || 0,
      minX,
      maxX
    );


  objeto.top =
    limitarNumero(
      Number(objeto.top) || 0,
      minY,
      maxY
    );


  objeto.setCoords();
}


/* =========================================================
   MEDIDAS EN CM
   ========================================================= */

function obtenerMedidasObjeto(
  objeto
) {

  if (!objeto) {

    return {
      ancho: 0,
      alto: 0,
      x: 0,
      y: 0
    };
  }


  const anchoPx =
    objeto.getScaledWidth();

  const altoPx =
    objeto.getScaledHeight();


  const xPx =
    Number(objeto.left) || 0;

  const yPx =
    Number(objeto.top) || 0;


  return {

    ancho:
      anchoPx *
      CM_PER_EDITOR_PX_X,

    alto:
      altoPx *
      CM_PER_EDITOR_PX_Y,

    x:
      xPx *
      CM_PER_EDITOR_PX_X,

    y:
      yPx *
      CM_PER_EDITOR_PX_Y
  };
}


function formatoCM(valor) {

  return `${Number(valor || 0)
    .toFixed(1)
    .replace(".", ",")} cm`;
}


function actualizarMedidasSeleccion() {

  const activo =
    fabricCanvas?.getActiveObject();


  const ancho =
    $("medidaAncho");

  const alto =
    $("medidaAlto");

  const x =
    $("medidaX");

  const y =
    $("medidaY");

  const estado =
    $("estadoSeleccion");


  if (!activo) {

    if (ancho) {
      ancho.textContent = "0,0 cm";
    }

    if (alto) {
      alto.textContent = "0,0 cm";
    }

    if (x) {
      x.textContent = "0,0 cm";
    }

    if (y) {
      y.textContent = "0,0 cm";
    }

    if (estado) {
      estado.textContent =
        "Selecciona una imagen";
    }

    return;
  }


  const medidas =
    obtenerMedidasObjeto(
      activo
    );


  if (ancho) {
    ancho.textContent =
      formatoCM(medidas.ancho);
  }

  if (alto) {
    alto.textContent =
      formatoCM(medidas.alto);
  }

  if (x) {
    x.textContent =
      formatoCM(medidas.x);
  }

  if (y) {
    y.textContent =
      formatoCM(medidas.y);
  }


  if (estado) {

    estado.textContent =
      "Imagen seleccionada";
  }
}


/* =========================================================
   ESCALAR SELECCIÓN
   ========================================================= */

window.escalarSeleccion =
  function (factor) {

    if (!fabricCanvas) return;

    const objeto =
      fabricCanvas.getActiveObject();

    if (!objeto) {

      mostrarToast(
        "Selecciona una imagen",
        "Primero toca una imagen del diseño.",
        "error"
      );

      return;
    }


    const escalaX =
      Number(objeto.scaleX) ||
      1;

    const escalaY =
      Number(objeto.scaleY) ||
      1;


    objeto.set({
      scaleX:
        escalaX * factor,

      scaleY:
        escalaY * factor
    });


    mantenerDentroDelArea(
      objeto
    );


    fabricCanvas.renderAll();

    actualizarMedidasSeleccion();

    registrarHistoria();
  };


/* =========================================================
   CENTRAR SELECCIÓN
   ========================================================= */

window.centrarSeleccion =
  function () {

    if (!fabricCanvas) return;

    const objeto =
      fabricCanvas.getActiveObject();

    if (!objeto) {

      mostrarToast(
        "Selecciona una imagen",
        "Primero toca una imagen del diseño.",
        "error"
      );

      return;
    }


    objeto.set({
      left:
        EDITOR_WIDTH / 2,

      top:
        EDITOR_HEIGHT / 2,

      originX: "center",

      originY: "center"
    });


    mantenerDentroDelArea(
      objeto
    );


    fabricCanvas.renderAll();

    actualizarMedidasSeleccion();

    registrarHistoria();
  };


/* =========================================================
   ELIMINAR SELECCIÓN
   ========================================================= */

window.eliminarSeleccion =
  function () {

    if (!fabricCanvas) return;

    const objeto =
      fabricCanvas.getActiveObject();

    if (!objeto) {

      mostrarToast(
        "Nada seleccionado",
        "Selecciona una imagen para eliminarla.",
        "error"
      );

      return;
    }


    fabricCanvas.remove(
      objeto
    );

    fabricCanvas.discardActiveObject();

    fabricCanvas.renderAll();

    actualizarMedidasSeleccion();

    registrarHistoria();
  };


/* =========================================================
   IMÁGENES
   ========================================================= */

$("inputImagenCamisa")
  ?.addEventListener(
    "change",
    async (evento) => {

      const archivos =
        Array.from(
          evento.target.files || []
        );


      if (!archivos.length) {
        return;
      }


      if (!fabricCanvas) {

        mostrarToast(
          "Editor no listo",
          "Espera un momento y vuelve a intentarlo.",
          "error"
        );

        evento.target.value = "";

        return;
      }


      const cantidadActual =
        fabricCanvas.getObjects().length;


      const disponibles =
        Math.max(
          0,
          12 - cantidadActual
        );


      if (disponibles <= 0) {

        mostrarToast(
          "Límite alcanzado",
          "Puedes colocar hasta 12 imágenes por lado.",
          "error"
        );

        evento.target.value = "";

        return;
      }


      const archivosAProcesar =
        archivos.slice(
          0,
          disponibles
        );


      if (
        archivos.length >
        disponibles
      ) {

        mostrarToast(
          "Algunas imágenes no se agregaron",
          "Hay un máximo de 12 imágenes por lado.",
          "error"
        );
      }


      for (
        const archivo
        of archivosAProcesar
      ) {

        try {

          await agregarImagenAlCanvas(
            archivo
          );

        } catch (error) {

          console.error(
            "Error agregando imagen:",
            error
          );

          mostrarToast(
            "Error con una imagen",
            "No se pudo agregar esa imagen.",
            "error"
          );
        }
      }


      evento.target.value = "";
    }
  );


async function agregarImagenAlCanvas(
  archivo
) {

  const fabric =
    await esperarFabric();


  if (!fabricCanvas) {
    throw new Error(
      "Canvas no disponible."
    );
  }


  if (
    !archivo.type.startsWith(
      "image/"
    )
  ) {

    throw new Error(
      "El archivo no es una imagen."
    );
  }


  const url =
    await leerArchivoComoDataURL(
      archivo
    );


  return new Promise(
    (resolve, reject) => {

      fabric.Image.fromURL(
        url,
        (imagen) => {

          if (!imagen) {

            reject(
              new Error(
                "No se pudo crear la imagen."
              )
            );

            return;
          }


          /*
            Tamaño inicial razonable.

            La imagen se adapta para entrar
            dentro del área de impresión.
          */

          const maxWidth = 300;

          const maxHeight = 300;


          const escalaX =
            maxWidth /
            (imagen.width || maxWidth);

          const escalaY =
            maxHeight /
            (imagen.height || maxHeight);


          const escala =
            Math.min(
              escalaX,
              escalaY,
              1
            );


          imagen.set({

            left:
              EDITOR_WIDTH / 2,

            top:
              EDITOR_HEIGHT / 2,

            originX:
              "center",

            originY:
              "center",

            scaleX:
              escala,

            scaleY:
              escala,

            selectable:
              true,

            evented:
              true
          });


          mantenerDentroDelArea(
            imagen
          );


          fabricCanvas.add(
            imagen
          );


          fabricCanvas.setActiveObject(
            imagen
          );


          fabricCanvas.renderAll();


          actualizarMedidasSeleccion();

          registrarHistoria();


          resolve(imagen);

        },
        {
          crossOrigin: "anonymous"
        }
      );

    }
  );
}


function leerArchivoComoDataURL(
  archivo
) {

  return new Promise(
    (resolve, reject) => {

      const lector =
        new FileReader();


      lector.onload =
        () => resolve(
          lector.result
        );


      lector.onerror =
        () => reject(
          lector.error
        );


      lector.readAsDataURL(
        archivo
      );
    }
  );
}


/* =========================================================
   HISTORIAL — DESHACER / REHACER
   ========================================================= */

function obtenerEstadoCanvas() {

  if (!fabricCanvas) {
    return null;
  }

  return JSON.stringify(
    fabricCanvas.toJSON([
      "id",
      "src"
    ])
  );
}


function registrarHistoria() {

  if (
    restaurandoEditor ||
    !fabricCanvas
  ) {
    return;
  }


  const ahora =
    Date.now();


  /*
    Evita llenar el historial con demasiadas
    operaciones consecutivas.
  */

  if (
    ahora -
    ultimaOperacionHistorial <
    80
  ) {

    return;
  }


  ultimaOperacionHistorial =
    ahora;


  const estado =
    obtenerEstadoCanvas();


  if (!estado) return;


  const ultimo =
    editorHistoryPast[
      editorHistoryPast.length - 1
    ];


  if (ultimo === estado) {
    return;
  }


  editorHistoryPast.push(
    estado
  );


  /*
    Conservamos un historial razonable.
  */

  if (
    editorHistoryPast.length >
    50
  ) {

    editorHistoryPast.shift();
  }


  editorHistoryFuture = [];
}


async function restaurarEstado(
  estado
) {

  if (!fabricCanvas) {
    return;
  }


  restaurandoEditor = true;


  try {

    fabricCanvas.clear();

    fabricCanvas.backgroundColor =
      "transparent";


    if (estado) {

      await fabricCanvas.loadFromJSON(
        JSON.parse(estado)
      );
    }


    fabricCanvas.renderAll();

    actualizarMedidasSeleccion();

  } catch (error) {

    console.error(
      "Error restaurando historial:",
      error
    );

  } finally {

    restaurandoEditor = false;
  }
}


window.deshacerEditor =
  async function () {

    if (
      editorHistoryPast.length <
      2
    ) {
      return;
    }


    const actual =
      editorHistoryPast.pop();


    editorHistoryFuture.push(
      actual
    );


    const anterior =
      editorHistoryPast[
        editorHistoryPast.length - 1
      ];


    await restaurarEstado(
      anterior
    );


    guardarCamisaActual();
  };


window.rehacerEditor =
  async function () {

    if (
      !editorHistoryFuture.length
    ) {
      return;
    }


    const siguiente =
      editorHistoryFuture.pop();


    editorHistoryPast.push(
      siguiente
    );


    await restaurarEstado(
      siguiente
    );


    guardarCamisaActual();
  };


/* =========================================================
   PREVIEW
   ========================================================= */

async function crearPreviewCanvas(
  objetos,
  color
) {

  /*
    Esta función crea una miniatura independiente
    para que el administrador pueda ver exactamente
    el diseño del cliente.
  */

  const fabric =
    await esperarFabric();


  const elemento =
    document.createElement(
      "canvas"
    );


  elemento.width =
    EDITOR_WIDTH;

  elemento.height =
    EDITOR_HEIGHT;


  const canvas =
    new fabric.StaticCanvas(
      elemento,
      {
        width:
          EDITOR_WIDTH,

        height:
          EDITOR_HEIGHT,

        backgroundColor:
          "transparent"
      }
    );


  try {

    if (
      objetos &&
      objetos.length
    ) {

      await canvas.loadFromJSON({
        version:
          canvas.version,

        objects:
          clonarObjetos(objetos)
      });
    }


    canvas.renderAll();


    /*
      Exportamos únicamente el área de diseño.
    */

    return canvas.toDataURL({
      format: "png",
      multiplier: 1
    });

  } finally {

    canvas.dispose();
  }
}


async function actualizarPreviewCamisaActual() {

  const camisa =
    camisas[camisaActual];

  if (!camisa) return;


  try {

    camisa.previewFrente =
      await crearPreviewCanvas(
        camisa.frenteObjects,
        camisa.color
      );


    camisa.previewEspalda =
      await crearPreviewCanvas(
        camisa.espaldaObjects,
        camisa.color
      );

  } catch (error) {

    console.error(
      "Error creando preview:",
      error
    );
  }
}


/* =========================================================
   CAMBIAR CAMISA
   ========================================================= */

window.siguienteCamisa =
  async function () {

    guardarCamisaActual();

    await actualizarPreviewCamisaActual();


    if (
      camisaActual <
      camisas.length - 1
    ) {

      camisaActual++;

      ladoActual =
        "frente";

      await cargarCamisaEnEditor(
        camisaActual
      );

      actualizarNumeroCamisaUI();

      return;
    }


    /*
      Última camisa:
      vamos a revisión.
    */

    await prepararRevision();

    mostrarPasoPersonalizador(
      "revision"
    );
  };


function actualizarNumeroCamisaUI() {

  const numero =
    $("numeroCamisaActual");

  if (numero) {

    numero.textContent =
      `Camisa ${camisaActual + 1} de ${camisas.length}`;
  }
}


/* =========================================================
   COPIAR DISEÑO
   ========================================================= */

window.copiarDisenoCamisa =
  function () {

    if (
      !camisas[camisaActual]
    ) {
      return;
    }


    guardarCamisaActual();


    const origen =
      camisas[camisaActual];


    const destino =
      camisas[
        camisaActual + 1
      ];


    if (!destino) {

      mostrarToast(
        "Última camisa",
        "No hay otra camisa para copiar.",
        "error"
      );

      return;
    }


    destino.color =
      origen.color;

    destino.colorNombre =
      origen.colorNombre;

    destino.frenteObjects =
      clonarObjetos(
        origen.frenteObjects
      );

    destino.espaldaObjects =
      clonarObjetos(
        origen.espaldaObjects
      );


    mostrarToast(
      "Diseño copiado",
      "La siguiente camisa recibió el mismo diseño.",
      "success"
    );
  };


/* =========================================================
   TALLA INDIVIDUAL
   ========================================================= */

function actualizarTallaCamisaActual(
  valor
) {

  const camisa =
    camisas[camisaActual];

  if (!camisa) return;

  if (
    !["XS", "S", "L"]
      .includes(valor)
  ) {
    return;
  }

  camisa.talla =
    valor;
}


document.addEventListener(
  "change",
  (evento) => {

    const select =
      evento.target.closest(
        "#tallaCamisaActual"
      );

    if (!select) return;

    actualizarTallaCamisaActual(
      select.value
    );
  }
);


/* =========================================================
   TERMINAR / SALIR
   ========================================================= */

window.terminarPersonalizacion =
  function () {

    const confirmar =
      confirm(
        "¿Quieres salir del personalizador? Se perderá el diseño que no hayas enviado."
      );

    if (!confirmar) {
      return;
    }

    mostrarSolo(
      "pantallaInicio"
    );
  };


/* =========================================================
   INICIALIZACIÓN
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    cargarCarrito();

    cargarProductosFirebase();

    validarDatosPersonalizacion();

    actualizarPaletaColores();

    actualizarColorVisualCamisa();

    actualizarCantidadUI();

  }
);
/* =========================================================
   VISTA PREVIA FINAL — CAMISA + DISEÑO
   ========================================================= */

function construirSVGCamisa(color, lado = "frente") {

  const borde =
    COLORES_CAMISA.find(
      (c) => c.valor === color
    )?.borde || "#d0d0d6";

  return `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="500"
      height="600"
      viewBox="0 0 500 600"
    >

      <path
        d="
          M175 50
          L112 75
          L35 155
          L83 225
          L128 188
          L128 525
          Q128 548 151 548
          L349 548
          Q372 548 372 525
          L372 188
          L417 225
          L465 155
          L388 75
          L325 50
          Q303 102 250 102
          Q197 102 175 50
          Z
        "
        fill="${color}"
        stroke="${borde}"
        stroke-width="4"
        stroke-linejoin="round"
      />

      ${
        lado === "frente"
          ? `
            <path
              d="
                M175 50
                Q197 102 250 102
                Q303 102 325 50
              "
              fill="none"
              stroke="${borde}"
              stroke-width="5"
            />
          `
          : `
            <path
              d="
                M184 58
                Q210 80 250 80
                Q290 80 316 58
              "
              fill="none"
              stroke="${borde}"
              stroke-width="4"
            />
          `
      }

    </svg>
  `;
}


async function generarVistaPreviaDesdeDatos(
  datosCamisa,
  lado = "frente",
  indice = 0
) {

  const fabric =
    await esperarFabric();

  const salida =
    document.createElement("canvas");

  salida.width = 600;
  salida.height = 700;

  const ctx =
    salida.getContext("2d");

  ctx.clearRect(
    0,
    0,
    salida.width,
    salida.height
  );


  const fondo =
    new Image();

  fondo.src =
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      construirSVGCamisa(
        datosCamisa.color || "#ffffff",
        lado
      )
    )}`;

  await esperarImagen(fondo);

  ctx.drawImage(
    fondo,
    50,
    20,
    500,
    600
  );


  const objetos =
    datosCamisa[
      lado === "frente"
        ? "frenteObjects"
        : "espaldaObjects"
    ] || [];


  if (objetos.length) {

    const canvasTemporal =
      document.createElement(
        "canvas"
      );

    canvasTemporal.width =
      EDITOR_WIDTH;

    canvasTemporal.height =
      EDITOR_HEIGHT;


    const staticCanvas =
      new fabric.StaticCanvas(
        canvasTemporal,
        {
          width:
            EDITOR_WIDTH,

          height:
            EDITOR_HEIGHT,

          backgroundColor:
            "transparent"
        }
      );


    restaurandoEditor = true;

    try {

      await staticCanvas.loadFromJSON({
        version:
          fabric.version,

        objects:
          clonarObjetos(objetos)
      });


      staticCanvas.renderAll();


      const diseño =
        staticCanvas.toDataURL({
          format: "png",
          multiplier: 1
        });


      const imagenDiseno =
        new Image();

      imagenDiseno.src =
        diseño;

      await esperarImagen(
        imagenDiseno
      );


      ctx.drawImage(
        imagenDiseno,
        145,
        120,
        210,
        330
      );

    } finally {

      restaurandoEditor = false;

      staticCanvas.dispose();
    }
  }


  ctx.font =
    "800 17px Arial";

  ctx.fillStyle =
    "#333333";

  ctx.textAlign =
    "center";

  ctx.fillText(
    `Camisa ${indice + 1} · ${
      lado === "frente"
        ? "Frente"
        : "Espalda"
    }`,
    300,
    665
  );


  return salida.toDataURL(
    "image/jpeg",
    0.78
  );
}


function esperarImagen(imagen) {

  return new Promise(
    (resolve, reject) => {

      if (
        imagen.complete &&
        imagen.naturalWidth
      ) {

        resolve();

        return;
      }


      imagen.onload =
        () => resolve();

      imagen.onerror =
        reject;
    }
  );
}


/* =========================================================
   CAMBIAR FRENTE / ESPALDA
   ========================================================= */

async function cambiarLadoCamisaInterno(
  nuevoLado
) {

  if (
    !fabricCanvas ||
    nuevoLado === ladoActual
  ) {
    return;
  }


  await guardarCamisaActualEnMemoria();


  ladoActual =
    nuevoLado;


  await cargarCamisaEnEditor(
    camisaActual
  );
}


window.cambiarLadoCamisa =
  async function (lado) {

    if (!camisas.length) {
      return;
    }

    try {

      await cambiarLadoCamisaInterno(
        lado === "espalda"
          ? "espalda"
          : "frente"
      );

    } catch (error) {

      console.error(error);

      mostrarToast(
        "No se pudo cambiar de lado",
        "Inténtalo otra vez.",
        "error"
      );
    }
  };


/* =========================================================
   COPIAR DISEÑO ANTERIOR
   ========================================================= */

window.copiarDisenoAnterior =
  async function () {

    if (
      camisaActual <= 0 ||
      !camisas[camisaActual - 1]
    ) {
      return;
    }


    const anterior =
      camisas[
        camisaActual - 1
      ];


    camisas[camisaActual].color =
      anterior.color ||
      "#ffffff";

    camisas[camisaActual].colorNombre =
      anterior.colorNombre ||
      "Blanco";


    camisas[camisaActual].frenteObjects =
      clonarObjetos(
        anterior.frenteObjects || []
      );


    camisas[camisaActual].espaldaObjects =
      clonarObjetos(
        anterior.espaldaObjects || []
      );


    camisas[camisaActual].previewFrente =
      "";

    camisas[camisaActual].previewEspalda =
      "";


    ladoActual =
      "frente";


    await cargarCamisaEnEditor(
      camisaActual
    );


    mostrarToast(
      "Diseño copiado",
      "Ahora puedes cambiar talla, color o imágenes.",
      "success"
    );
  };


/* =========================================================
   GUARDAR Y CONTINUAR CAMISA
   ========================================================= */

window.guardarYContinuarCamisa =
  async function () {

    const boton =
      $("btnSiguienteCamisa");


    if (boton) {

      boton.disabled = true;

      boton.textContent =
        "⏳ Guardando...";
    }


    try {

      await guardarCamisaActualEnMemoria();


      if (
        camisaActual <
        cantidadCamisas - 1
      ) {

        camisaActual++;


        const anterior =
          camisas[
            camisaActual - 1
          ];


        /*
          Si la siguiente camisa está vacía
          y la anterior tiene diseño,
          copiamos automáticamente el diseño.
        */

        if (
          !camisas[camisaActual]
            .frenteObjects.length &&
          !camisas[camisaActual]
            .espaldaObjects.length &&
          (
            anterior?.frenteObjects?.length ||
            anterior?.espaldaObjects?.length
          )
        ) {

          camisas[
            camisaActual
          ].frenteObjects =
            clonarObjetos(
              anterior.frenteObjects || []
            );


          camisas[
            camisaActual
          ].espaldaObjects =
            clonarObjetos(
              anterior.espaldaObjects || []
            );


          camisas[
            camisaActual
          ].color =
            anterior.color;


          camisas[
            camisaActual
          ].colorNombre =
            anterior.colorNombre;


          camisas[
            camisaActual
          ].talla =
            anterior.talla;


          camisas[
            camisaActual
          ].previewFrente = "";


          camisas[
            camisaActual
          ].previewEspalda = "";
        }


        ladoActual =
          "frente";


        await cargarCamisaEnEditor(
          camisaActual
        );


      } else {

        await prepararRevisionPedido();

        mostrarPasoPersonalizador(
          "revision"
        );
      }


    } catch (error) {

      console.error(error);

      mostrarToast(
        "No se pudo guardar",
        "Inténtalo nuevamente.",
        "error"
      );

    } finally {

      if (boton) {

        boton.disabled = false;

        boton.textContent =
          camisaActual <
          cantidadCamisas - 1

            ? "Guardar y continuar →"

            : "✅ Revisar pedido";
      }
    }
  };


/* =========================================================
   PREPARAR REVISIÓN DEL PEDIDO
   ========================================================= */

async function prepararRevisionPedido() {

  await guardarCamisaActualEnMemoria();


  if ($("revisionNombre")) {

    $("revisionNombre").textContent =
      $("clienteNombre")
        ?.value
        .trim() || "—";
  }


  if ($("revisionTelefono")) {

    $("revisionTelefono").textContent =
      $("clienteTelefono")
        ?.value
        .trim() || "—";
  }


  if ($("revisionEntrega")) {

    $("revisionEntrega").textContent =
      fechaBonita(
        $("fechaEntrega")
          ?.value || ""
      );
  }


  if ($("revisionCantidad")) {

    $("revisionCantidad").textContent =
      cantidadCamisas === 1
        ? "1 camisa"
        : `${cantidadCamisas} camisas`;
  }


  const lista =
    $("listaRevisionCamisas");


  if (!lista) {
    return;
  }


  /*
    Generamos las dos vistas de cada camisa.
  */

  for (
    let i = 0;
    i < camisas.length;
    i++
  ) {

    if (
      !camisas[i].previewFrente
    ) {

      camisas[i].previewFrente =
        await generarVistaPreviaDesdeDatos(
          camisas[i],
          "frente",
          i
        );
    }


    if (
      !camisas[i].previewEspalda
    ) {

      camisas[i].previewEspalda =
        await generarVistaPreviaDesdeDatos(
          camisas[i],
          "espalda",
          i
        );
    }
  }


  lista.innerHTML = "";


  camisas.forEach(
    (camisa, indice) => {

      const tarjeta =
        document.createElement(
          "article"
        );


      tarjeta.className =
        "revision-camisa-card";


      tarjeta.innerHTML = `

        <div class="revision-preview-grid">

          <div class="revision-preview">

            <span class="revision-side-label">
              FRENTE
            </span>

            ${
              camisa.previewFrente

                ? `
                  <img
                    src="${camisa.previewFrente}"
                    alt="Frente camisa ${
                      indice + 1
                    }"
                  >
                `

                : `
                  <div class="sin-preview">
                    Sin diseño
                  </div>
                `
            }

          </div>


          <div class="revision-preview">

            <span class="revision-side-label">
              ESPALDA
            </span>

            ${
              camisa.previewEspalda

                ? `
                  <img
                    src="${camisa.previewEspalda}"
                    alt="Espalda camisa ${
                      indice + 1
                    }"
                  >
                `

                : `
                  <div class="sin-preview">
                    Sin diseño
                  </div>
                `
            }

          </div>

        </div>


        <div class="revision-info">

          <div class="revision-cabecera">

            <span>
              CAMISA ${indice + 1}
            </span>

            <strong>
              ${escaparHTML(
                camisa.talla || "—"
              )}
            </strong>

          </div>


          <p>

            <span
              class="punto-color"
              style="
                background:${escaparHTML(
                  camisa.color ||
                  "#fff"
                )}
              "
            ></span>

            Color:

            <strong>
              ${escaparHTML(
                camisa.colorNombre ||
                "—"
              )}
            </strong>

          </p>


          ${renderResumenObjetos(
            camisa.frenteObjects || [],
            "Frente"
          )}


          ${renderResumenObjetos(
            camisa.espaldaObjects || [],
            "Espalda"
          )}

        </div>
      `;


      lista.appendChild(
        tarjeta
      );
    }
  );
}


/* =========================================================
   RESUMEN DE IMÁGENES
   ========================================================= */

function renderResumenObjetos(
  objects,
  lado = ""
) {

  if (!objects.length) {

    return `
      <div class="sin-imagenes">
        ${escaparHTML(lado)}:
        ⚪ Sin imágenes agregadas.
      </div>
    `;
  }


  const filas =
    objects.map(
      (obj, i) => {

        const ancho =
          (
            Number(
              obj.width || 0
            ) *
            Number(
              obj.scaleX || 1
            ) *
            CM_PER_EDITOR_PX_X
          )
            .toFixed(1)
            .replace(
              ".",
              ","
            );


        const alto =
          (
            Number(
              obj.height || 0
            ) *
            Number(
              obj.scaleY || 1
            ) *
            CM_PER_EDITOR_PX_Y
          )
            .toFixed(1)
            .replace(
              ".",
              ","
            );


        const x =
          (
            (
              Number(
                obj.left || 0
              ) +
              (
                Number(
                  obj.width || 0
                ) *
                Number(
                  obj.scaleX || 1
                ) /
                2
              )
            ) *
            CM_PER_EDITOR_PX_X
          )
            .toFixed(1)
            .replace(
              ".",
              ","
            );


        const y =
          (
            (
              Number(
                obj.top || 0
              ) +
              (
                Number(
                  obj.height || 0
                ) *
                Number(
                  obj.scaleY || 1
                ) /
                2
              )
            ) *
            CM_PER_EDITOR_PX_Y
          )
            .toFixed(1)
            .replace(
              ".",
              ","
            );


        return `
          <div class="fila-medida-admin">

            <span>
              Imagen ${i + 1}
            </span>

            <strong>
              ${alto} cm alto ×
              ${ancho} cm ancho
            </strong>

            <small>
              Centro X:
              ${x} cm ·
              Y:
              ${y} cm
            </small>

          </div>
        `;
      }
    )
    .join("");


  return `

    <div class="resumen-objetos">

      <strong>
        📐 ${escaparHTML(lado)}
      </strong>

      ${filas}

    </div>

  `;
}


/* =========================================================
   PREVIEW COMPLETO DE CAMISA
   ========================================================= */

async function crearPreviewPedidoCamisa(
  camisa,
  indice
) {

  const ancho = 760;
  const alto = 450;


  const salida =
    document.createElement(
      "canvas"
    );


  salida.width =
    ancho;

  salida.height =
    alto;


  const ctx =
    salida.getContext("2d");


  ctx.fillStyle =
    "#f5f3f6";


  ctx.fillRect(
    0,
    0,
    ancho,
    alto
  );


  const lados = [

    {
      nombre: "FRENTE",
      src:
        camisa.previewFrente || ""
    },

    {
      nombre: "ESPALDA",
      src:
        camisa.previewEspalda || ""
    }

  ];


  for (
    let i = 0;
    i < lados.length;
    i++
  ) {

    const x =
      i === 0
        ? 18
        : 392;


    ctx.fillStyle =
      "#ffffff";


    ctx.beginPath();

    ctx.roundRect(
      x,
      38,
      350,
      374,
      18
    );

    ctx.fill();


    ctx.strokeStyle =
      "#e4dfe6";

    ctx.stroke();


    ctx.fillStyle =
      "#6f6a73";


    ctx.font =
      "800 12px Arial";


    ctx.textAlign =
      "center";


    ctx.fillText(
      lados[i].nombre,
      x + 175,
      24
    );


    if (
      lados[i].src
    ) {

      const img =
        new Image();

      img.src =
        lados[i].src;


      await esperarImagen(
        img
      );


      const scale =
        Math.min(
          320 /
            img.naturalWidth,

          340 /
            img.naturalHeight
        );


      const w =
        img.naturalWidth *
        scale;


      const h =
        img.naturalHeight *
        scale;


      ctx.drawImage(
        img,
        x +
          (350 - w) / 2,
        55 +
          (340 - h) / 2,
        w,
        h
      );


    } else {

      ctx.fillStyle =
        "#9a959e";


      ctx.font =
        "600 13px Arial";


      ctx.fillText(
        "Sin diseño",
        x + 175,
        225
      );
    }
  }


  return salida.toDataURL(
    "image/jpeg",
    0.54
  );
}


/* =========================================================
   CONFIRMAR PEDIDO
   ========================================================= */

window.confirmarPedidoPersonalizado =
  async function () {

    const boton =
      $("btnConfirmarPedido");


    if (
      !camisas.length ||
      camisas.some(
        (c) => !c?.talla
      )
    ) {

      mostrarToast(
        "Falta información",
        "Revisa las tallas antes de continuar.",
        "error"
      );

      return;
    }


    if (boton) {

      boton.disabled = true;

      boton.textContent =
        "⏳ Enviando pedido...";
    }


    try {

      const nombre =
        $("clienteNombre")
          ?.value
          .trim() || "";


      const telefono =
        $("clienteTelefono")
          ?.value
          .trim() || "";


      const fechaEntrega =
        $("fechaEntrega")
          ?.value || "";


      const numeroPedido =
        `VK-${Date.now()
          .toString()
          .slice(-7)}`;


      const camisasPedido = [];


      for (
        let indice = 0;
        indice < camisas.length;
        indice++
      ) {

        const camisa =
          camisas[indice];


        if (
          !camisa.previewFrente
        ) {

          camisa.previewFrente =
            await generarVistaPreviaDesdeDatos(
              camisa,
              "frente",
              indice
            );
        }


        if (
          !camisa.previewEspalda
        ) {

          camisa.previewEspalda =
            await generarVistaPreviaDesdeDatos(
              camisa,
              "espalda",
              indice
            );
        }


        camisasPedido.push({

          numero:
            indice + 1,

          talla:
            camisa.talla,

          color:
            camisa.color,

          colorNombre:
            camisa.colorNombre,

          previewPedido:
            await crearPreviewPedidoCamisa(
              camisa,
              indice
            ),


          objetosFrente:
            (camisa.frenteObjects || [])
              .map(
                (obj, i) => ({

                  imagen:
                    i + 1,

                  nombreArchivo:
                    obj.nombreArchivo ||
                    `Imagen ${i + 1}`,

                  anchoCm:
                    Number(
                      (
                        (
                          obj.width || 0
                        ) *
                        (
                          obj.scaleX || 1
                        ) *
                        CM_PER_EDITOR_PX_X
                      ).toFixed(1)
                    ),

                  altoCm:
                    Number(
                      (
                        (
                          obj.height || 0
                        ) *
                        (
                          obj.scaleY || 1
                        ) *
                        CM_PER_EDITOR_PX_Y
                      ).toFixed(1)
                    ),

                  centroXcm:
                    Number(
                      (
                        (
                          (obj.left || 0) +
                          (
                            (obj.width || 0) *
                            (obj.scaleX || 1) /
                            2
                          )
                        ) *
                        CM_PER_EDITOR_PX_X
                      ).toFixed(1)
                    ),

                  centroYcm:
                    Number(
                      (
                        (
                          (obj.top || 0) +
                          (
                            (obj.height || 0) *
                            (obj.scaleY || 1) /
                            2
                          )
                        ) *
                        CM_PER_EDITOR_PX_Y
                      ).toFixed(1)
                    )
                })
              ),


          objetosEspalda:
            (camisa.espaldaObjects || [])
              .map(
                (obj, i) => ({

                  imagen:
                    i + 1,

                  nombreArchivo:
                    obj.nombreArchivo ||
                    `Imagen ${i + 1}`,

                  anchoCm:
                    Number(
                      (
                        (
                          obj.width || 0
                        ) *
                        (
                          obj.scaleX || 1
                        ) *
                        CM_PER_EDITOR_PX_X
                      ).toFixed(1)
                    ),

                  altoCm:
                    Number(
                      (
                        (
                          obj.height || 0
                        ) *
                        (
                          obj.scaleY || 1
                        ) *
                        CM_PER_EDITOR_PX_Y
                      ).toFixed(1)
                    ),

                  centroXcm:
                    Number(
                      (
                        (
                          (obj.left || 0) +
                          (
                            (obj.width || 0) *
                            (obj.scaleX || 1) /
                            2
                          )
                        ) *
                        CM_PER_EDITOR_PX_X
                      ).toFixed(1)
                    ),

                  centroYcm:
                    Number(
                      (
                        (
                          (obj.top || 0) +
                          (
                            (obj.height || 0) *
                            (obj.scaleY || 1) /
                            2
                          )
                        ) *
                        CM_PER_EDITOR_PX_Y
                      ).toFixed(1)
                    )
                })
              )

        });
      }


      const pedido = {

        numeroPedido,

        tipo:
          "personalizado",

        estado:
          "nuevo",

        cliente: {
          nombre,
          telefono
        },

        fechaEntrega,

        cantidad:
          cantidadCamisas,

        camisas:
          camisasPedido,

        creado:
          serverTimestamp()
      };


      await addDoc(
        collection(
          db,
          "pedidos"
        ),
        pedido
      );


      const mensajeWhatsApp =
        construirMensajeWhatsAppPedido(
          pedido
        );


      const salida =
        $("mensajeFinalPedido");


      if (salida) {

        salida.style.display =
          "block";


        salida.innerHTML = `

          <div class="check-final">
            ✓
          </div>

          <h2>
            ¡Pedido recibido!
          </h2>

          <p>
            Tu número de pedido es
            <strong>
              ${escaparHTML(
                numeroPedido
              )}
            </strong>.
          </p>

          <small>
            También puedes enviarlo por WhatsApp
            para confirmar los detalles.
          </small>

          <button
            onclick="abrirWhatsAppPedido('${encodeURIComponent(
              mensajeWhatsApp
            )}')"
          >
            💬 Enviar a WhatsApp
          </button>

          <button
            class="secundario"
            onclick="salirPersonalizadorDespuesPedido()"
          >
            Volver al inicio
          </button>

        `;
      }


      mostrarPasoPersonalizador(
        "revision"
      );


      $("pasoRevisionPersonalizacion")
        ?.classList
        .add(
          "oculto-tras-envio"
        );


      mostrarToast(
        "Pedido enviado",
        "El administrador podrá verlo en su panel.",
        "success"
      );


    } catch (error) {

      console.error(
        "Error guardando pedido:",
        error
      );


      mostrarToast(
        "No se pudo enviar",
        "Revisa tu conexión e inténtalo otra vez.",
        "error"
      );


      if (boton) {

        boton.disabled =
          false;

        boton.textContent =
          "✅ Confirmar y enviar pedido";
      }
    }
  };


/* =========================================================
   WHATSAPP
   ========================================================= */

function construirMensajeWhatsAppPedido(
  pedido
) {

  let mensaje =
    `Hola 👋, acabo de realizar el pedido ${
      pedido.numeroPedido
    }.\n\n`;


  mensaje +=
    `Cliente: ${
      pedido.cliente.nombre
    }\n`;


  mensaje +=
    `Teléfono: ${
      pedido.cliente.telefono
    }\n`;


  mensaje +=
    `Entrega: ${
      fechaBonita(
        pedido.fechaEntrega
      )
    }\n`;


  mensaje +=
    `Cantidad: ${
      pedido.cantidad
    } camisa(s)\n\n`;


  pedido.camisas.forEach(
    (camisa) => {

      mensaje +=
        `Camisa ${camisa.numero}: talla ${
          camisa.talla
        }, color ${
          camisa.colorNombre
        }.\n`;


      (
        camisa.objetosFrente ||
        []
      ).forEach(
        (obj) => {

          mensaje +=
            `Frente · imagen ${
              obj.imagen
            }: ${
              obj.altoCm
            } cm alto × ${
              obj.anchoCm
            } cm ancho.\n`;
        }
      );


      (
        camisa.objetosEspalda ||
        []
      ).forEach(
        (obj) => {

          mensaje +=
            `Espalda · imagen ${
              obj.imagen
            }: ${
              obj.altoCm
            } cm alto × ${
              obj.anchoCm
            } cm ancho.\n`;
        }
      );


      mensaje +=
        "\n";
    }
  );


  return mensaje;
}


window.abrirWhatsAppPedido =
  function (
    textoCodificado
  ) {

    const texto =
      decodeURIComponent(
        textoCodificado || ""
      );


    window.open(
      `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
        texto
      )}`,
      "_blank"
    );
  };


window.salirPersonalizadorDespuesPedido =
  function () {

    reiniciarPersonalizador();


    if (
      $("pantallaPersonalizador")
    ) {

      $("pantallaPersonalizador")
        .style
        .display = "none";
    }


    if (
      $("pantallaInicio")
    ) {

      $("pantallaInicio")
        .style
        .display = "flex";
    }


    const mensaje =
      $("mensajeFinalPedido");


    if (mensaje) {

      mensaje.style.display =
        "none";
    }
  };


/* =========================================================
   NOTIFICACIONES ADMIN
   ========================================================= */

window.activarNotificacionesAdmin =
  async function () {

    if (
      auth.currentUser?.uid !==
      UID_DUENO
    ) {

      mostrarToast(
        "Acceso restringido",
        "Solo el administrador puede activar notificaciones.",
        "error"
      );

      return;
    }


    if (
      !("Notification" in window)
    ) {

      mostrarToast(
        "No compatible",
        "Este navegador no admite notificaciones.",
        "error"
      );

      return;
    }


    try {

      const permiso =
        await Notification.requestPermission();


      if (
        permiso === "granted"
      ) {

        mostrarToast(
          "🔔 Notificaciones activadas",
          "Te avisaremos cuando llegue un pedido nuevo.",
          "success"
        );

      } else {

        mostrarToast(
          "Notificaciones desactivadas",
          "Puedes permitirlas desde los ajustes del navegador.",
          "error"
        );
      }

    } catch (error) {

      console.warn(error);
    }
  };


/* =========================================================
   INSTALACIÓN PWA
   ========================================================= */

window.addEventListener(
  "beforeinstallprompt",
  (evento) => {

    evento.preventDefault();

    deferredInstallPrompt =
      evento;


    const boton =
      $("botonInstalarApp");


    if (boton) {
      boton.hidden = false;
    }
  }
);


window.addEventListener(
  "appinstalled",
  () => {

    deferredInstallPrompt =
      null;


    const boton =
      $("botonInstalarApp");


    if (boton) {
      boton.hidden = true;
    }


    mostrarToast(
      "📲 App instalada",
      "Variedades Karleny ya está en tu dispositivo.",
      "success"
    );
  }
);


window.instalarApp =
  async function () {

    if (
      !deferredInstallPrompt
    ) {

      mostrarToast(
        "Instalación",
        "Usa el menú del navegador y elige “Instalar app” o “Añadir a pantalla de inicio”.",
        "error"
      );

      return;
    }


    deferredInstallPrompt.prompt();


    await deferredInstallPrompt
      .userChoice;


    deferredInstallPrompt =
      null;


    const boton =
      $("botonInstalarApp");


    if (boton) {
      boton.hidden = true;
    }
  };


/* =========================================================
   ADMIN — PEDIDOS EN TIEMPO REAL
   ========================================================= */

function iniciarEscuchaPedidos() {

  if (
    unsubscribePedidos ||
    !auth.currentUser ||
    auth.currentUser.uid !==
      UID_DUENO
  ) {
    return;
  }


  unsubscribePedidos =
    onSnapshot(
      collection(
        db,
        "pedidos"
      ),

      (snap) => {

        const nuevos = [];


        snap.docChanges()
          .forEach(
            (cambio) => {

              if (
                cambio.type ===
                "added"
              ) {

                if (
                  pedidosInicializados
                ) {

                  nuevos.push({
                    id:
                      cambio.doc.id,

                    ...cambio.doc.data()
                  });
                }


                idsPedidosConocidos.add(
                  cambio.doc.id
                );
              }
            }
          );


        pedidosInicializados =
          true;


        if (nuevos.length) {

          nuevos.forEach(
            (pedido) => {

              const numero =
                pedido.numeroPedido ||
                "nuevo";


              mostrarToast(
                "🔔 Nuevo pedido",
                `${numero} de ${
                  pedido.cliente
                    ?.nombre ||
                  "cliente"
                }`,
                "pedido"
              );


              enviarNotificacionNavegador(
                "Nuevo pedido en Variedades Karleny",

                `${numero} · ${
                  pedido.cliente
                    ?.nombre ||
                  "Cliente"
                } · ${
                  pedido.cantidad ||
                  1
                } camisa(s)`
              );
            }
          );
        }


        pedidosAdmin =
          snap.docs.map(
            (d) => ({
              id: d.id,
              ...d.data()
            })
          );


        pedidosAdmin.sort(
          (a, b) => {

            const ta =
              a.creado
                ?.seconds || 0;

            const tb =
              b.creado
                ?.seconds || 0;

            return tb - ta;
          }
        );


        renderPedidosAdmin();
      },

      (error) => {

        console.error(
          "Escucha de pedidos:",
          error
        );


        mostrarToast(
          "Pedidos",
          "No se pudo actualizar la bandeja.",
          "error"
        );
      }
    );
}


function detenerEscuchaPedidos() {

  if (
    unsubscribePedidos
  ) {

    unsubscribePedidos();
  }


  unsubscribePedidos =
    null;


  pedidosInicializados =
    false;


  idsPedidosConocidos.clear();


  pedidosAdmin = [];


  actualizarContadorPedidos();
}


/* =========================================================
   NOTIFICACIÓN DEL NAVEGADOR
   ========================================================= */

async function enviarNotificacionNavegador(
  titulo,
  cuerpo
) {

  if (
    !("Notification" in window)
  ) {
    return;
  }


  try {

    let permiso =
      Notification.permission;


    if (
      permiso === "default"
    ) {

      permiso =
        await Notification.requestPermission();
    }


    if (
      permiso === "granted"
    ) {

      new Notification(
        titulo,
        {
          body: cuerpo,

          icon:
            "icons/icon-192.png",

          badge:
            "icons/icon-192.png",

          tag:
            "karleny-pedido"
        }
      );
    }

  } catch (error) {

    console.warn(
      "Notificación de navegador no disponible:",
      error
    );
  }
}


/* =========================================================
   PANEL DE PEDIDOS ADMIN
   ========================================================= */

window.mostrarPedidosAdmin =
  function () {

    if (
      auth.currentUser?.uid !==
      UID_DUENO
    ) {

      mostrarToast(
        "Acceso restringido",
        "Solo el administrador puede ver los pedidos.",
        "error"
      );

      return;
    }


    if (
      $("panelPedidosAdmin")
    ) {

      $("panelPedidosAdmin")
        .style
        .display = "block";
    }


    renderPedidosAdmin();
  };


window.ocultarPedidosAdmin =
  function () {

    if (
      $("panelPedidosAdmin")
    ) {

      $("panelPedidosAdmin")
        .style
        .display = "none";
    }
  };


function actualizarContadorPedidos() {

  const nuevos =
    pedidosAdmin.filter(
      (p) =>
        (p.estado || "nuevo") ===
        "nuevo"
    ).length;


  if (
    $("contadorPedidosAdmin")
  ) {

    $("contadorPedidosAdmin")
      .textContent =
      nuevos;
  }
}


/* =========================================================
   RENDERIZAR PEDIDOS
   ========================================================= */

function renderPedidosAdmin() {

  const lista =
    $("listaPedidosAdmin");


  if (!lista) {
    return;
  }


  actualizarContadorPedidos();


  if (!pedidosAdmin.length) {

    lista.innerHTML = `

      <div class="sin-pedidos-admin">

        <div>
          📦
        </div>

        <strong>
          Aún no hay pedidos.
        </strong>

        <span>
          Cuando alguien confirme
          una camisa, aparecerá aquí.
        </span>

      </div>

    `;

    return;
  }


  lista.innerHTML = "";


  pedidosAdmin.forEach(
    (pedido) => {

      const estado =
        pedido.estado ||
        "nuevo";


      const tarjeta =
        document.createElement(
          "article"
        );


      tarjeta.className =
        `pedido-admin-card estado-${estado}`;


      tarjeta.innerHTML = `

        <div class="pedido-admin-top">

          <div>

            <span class="numero-pedido">
              ${escaparHTML(
                pedido.numeroPedido ||
                pedido.id
              )}
            </span>

            <small>
              📦 ${
                fechaBonita(
                  pedido.fechaEntrega
                )
              }
            </small>

          </div>


          <select
            class="estado-pedido"
            data-id="${escaparHTML(
              pedido.id
            )}"
          >

            <option
              value="nuevo"
              ${
                estado === "nuevo"
                  ? "selected"
                  : ""
              }
            >
              🆕 Nuevo
            </option>

            <option
              value="visto"
              ${
                estado === "visto"
                  ? "selected"
                  : ""
              }
            >
              👀 Visto
            </option>

            <option
              value="preparando"
              ${
                estado === "preparando"
                  ? "selected"
                  : ""
              }
            >
              🧵 Preparando
            </option>

            <option
              value="entregado"
              ${
                estado === "entregado"
                  ? "selected"
                  : ""
              }
            >
              ✅ Entregado
            </option>

            <option
              value="cancelado"
              ${
                estado === "cancelado"
                  ? "selected"
                  : ""
              }
            >
              ❌ Cancelado
            </option>

          </select>

        </div>


        <div class="pedido-cliente-admin">

          <div>

            <span>
              👤 Cliente
            </span>

            <strong>
              ${escaparHTML(
                pedido.cliente
                  ?.nombre ||
                "—"
              )}
            </strong>

          </div>


          <div>

            <span>
              📱 Teléfono
            </span>

            <strong>
              ${escaparHTML(
                pedido.cliente
                  ?.telefono ||
                "—"
              )}
            </strong>

          </div>


          <div>

            <span>
              👕 Cantidad
            </span>

            <strong>
              ${escaparHTML(
                String(
                  pedido.cantidad ||
                  0
                )
              )}
              camisa(s)
            </strong>

          </div>

        </div>


        <div
          class="camisas-admin-list"
        ></div>

      `;


      const contenedorCamisas =
        tarjeta.querySelector(
          ".camisas-admin-list"
        );


      (
        pedido.camisas ||
        []
      ).forEach(
        (camisa) => {

          const bloque =
            document.createElement(
              "div"
            );


          bloque.className =
            "camisa-admin-bloque";


          bloque.innerHTML = `

            <div
              class="camisa-admin-cabecera"
            >

              <strong>
                👕 Camisa ${
                  camisa.numero
                }
              </strong>

              <span>
                ${
                  escaparHTML(
                    camisa.colorNombre ||
                    "—"
                  )
                }
                · Talla
                ${
                  escaparHTML(
                    camisa.talla ||
                    "—"
                  )
                }
              </span>

            </div>


            <div
              class="camisa-admin-contenido"
            >

              <div
                class="camisa-admin-previews"
              >

                <div
                  class="
                    camisa-admin-preview
                    camisa-admin-preview-combinada
                  "
                >

                  ${
                    camisa.previewPedido

                      ? `
                        <img
                          src="${
                            camisa.previewPedido
                          }"
                          alt="
                            Frente y espalda
                            de camisa ${
                              camisa.numero
                            }
                          "
                        >
                      `

                      : `
                        <span>
                          Sin vista previa
                        </span>
                      `
                  }

                </div>

              </div>


              <div
                class="camisa-admin-datos"
              >

                ${
                  camisa.objetosFrente
                    ?.length

                    ? renderObjetosPedidoAdmin(
                        camisa.objetosFrente,
                        "Frente"
                      )

                    : `
                      <div class="sin-imagenes">
                        Frente:
                        no se agregaron imágenes.
                      </div>
                    `
                }


                ${
                  camisa.objetosEspalda
                    ?.length

                    ? renderObjetosPedidoAdmin(
                        camisa.objetosEspalda,
                        "Espalda"
                      )

                    : `
                      <div
                        class="sin-imagenes"
                        style="margin-top:8px"
                      >
                        Espalda:
                        no se agregaron imágenes.
                      </div>
                    `
                }

              </div>

            </div>

          `;


          contenedorCamisas.appendChild(
            bloque
          );
        }
      );


      const select =
        tarjeta.querySelector(
          ".estado-pedido"
        );


      select.addEventListener(
        "change",
        () => {

          actualizarEstadoPedido(
            pedido.id,
            select.value
          );
        }
      );


      lista.appendChild(
        tarjeta
      );
    }
  );
}


/* =========================================================
   DATOS DE IMÁGENES EN ADMIN
   ========================================================= */

function renderObjetosPedidoAdmin(
  objetos,
  lado = "Frente"
) {

  return `

    <div
      class="objeto-admin-list"
    >

      <strong>
        📐 ${escaparHTML(lado)}
        · Medidas exactas registradas
      </strong>


      ${
        objetos
          .map(
            (obj) => `

              <div>

                <span>
                  Imagen ${
                    obj.imagen
                  }
                </span>

                <strong>
                  ${
                    obj.altoCm
                  } cm alto ×
                  ${
                    obj.anchoCm
                  } cm ancho
                </strong>

                <small>
                  Centro X
                  ${
                    obj.centroXcm
                  } cm · Y
                  ${
                    obj.centroYcm
                  } cm
                </small>

              </div>

            `
          )
          .join("")
      }

    </div>

  `;
}


/* =========================================================
   ACTUALIZAR ESTADO DEL PEDIDO
   ========================================================= */

async function actualizarEstadoPedido(
  id,
  estado
) {

  if (
    auth.currentUser?.uid !==
    UID_DUENO
  ) {
    return;
  }


  try {

    await updateDoc(
      doc(
        db,
        "pedidos",
        id
      ),
      {
        estado,
        actualizado:
          serverTimestamp()
      }
    );


    mostrarToast(
      "Pedido actualizado",
      `Estado: ${estado}`,
      "success"
    );

  } catch (error) {

    console.error(error);

    mostrarToast(
      "No se pudo actualizar",
      "Revisa las reglas de Firebase.",
      "error"
    );
  }
}


/* =========================================================
   TECLADO / MODALES / INICIO
   ========================================================= */

window.addEventListener(
  "click",
  (evento) => {

    if (
      evento.target ===
      $("ventanaLogin")
    ) {

      window.cerrarLogin();
    }


    if (
      evento.target ===
      $("ventanaCarrito")
    ) {

      cerrarCarrito();
    }
  }
);


window.addEventListener(
  "keydown",
  (evento) => {

    if (
      evento.key ===
      "Escape"
    ) {

      window.cerrarLogin();

      cerrarCarrito();
    }


    if (
      evento.key === "Delete" &&
      fabricCanvas &&
      document.activeElement
        ?.tagName !== "INPUT" &&
      document.activeElement
        ?.tagName !== "TEXTAREA"
    ) {

      window.eliminarSeleccion();
    }
  }
);


$("contrasenaLogin")
  ?.addEventListener(
    "keydown",
    (evento) => {

      if (
        evento.key === "Enter"
      ) {

        window.iniciarSesion();
      }
    }
  );


/* =========================================================
   INICIAR INTERFAZ
   ========================================================= */

construirPaletaColores();

actualizarCarrito();

cargarProductos();

aplicarFiltros();


/* =========================================================
   PWA — SERVICE WORKER
   ========================================================= */

if (
  "serviceWorker" in navigator
) {

  window.addEventListener(
    "load",
    () => {

      navigator.serviceWorker
        .register("sw.js")
        .catch(
          (error) => {

            console.warn(
              "Service Worker no disponible:",
              error
            );
          }
        );
    }
  );
}
