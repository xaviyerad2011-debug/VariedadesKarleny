import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

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
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp
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
  appId: "1:117661003844:web:2ba3db02e3df6e6278c11",
  measurementId: "G-80VJK2V1FB"
};


/* =========================================================
   INICIALIZACIÓN
========================================================= */

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


/* =========================================================
   CONFIGURACIÓN
========================================================= */

const UID_DUENO =
  "vKixdwAJz9MfApZV81FPOiPybFr2";

const CLOUDINARY_CLOUD_NAME =
  "ktxu8h5o";

const CLOUDINARY_UPLOAD_PRESET =
  "productos";

const NUMERO_WHATSAPP =
  "573202104423";


let carrito = [];


/* =========================================================
   PEDIDOS / NOTIFICACIONES
========================================================= */

let unsubscribePedidos =
  null;

let pedidosAdmin =
  [];

let pedidosInicializados =
  false;

let cantidadPedidosNuevos =
  0;



/* =========================================================
   PRODUCTOS BASE
========================================================= */

const PRODUCTOS_BASE = [

  {
    id: "base-labial",
    nombre: "Labial",
    precio: 15000,
    descripcion: "Labial para complementar tu estilo.",
    imagen: "imagenes/labial.jpg"
  },

  {
    id: "base-peluche",
    nombre: "Peluche",
    precio: 25000,
    descripcion: "Un detalle bonito para regalar o decorar.",
    imagen: "imagenes/peluche.jpg"
  },

  {
    id: "base-jabon-24k",
    nombre: "Jabón 24k",
    precio: 7000,
    descripcion: "Jabón 24k disponible en nuestra tienda.",
    imagen: "imagenes/karite.jpg"
  },

  {
    id: "base-lissia",
    nombre: "Lissia",
    precio: 10000,
    descripcion: "Producto Lissia disponible.",
    imagen: "imagenes/lissia.jpg"
  },

  {
    id: "base-thyms",
    nombre: "Thyms",
    precio: 15000,
    descripcion: "Producto Thyms disponible.",
    imagen: "imagenes/thyms.jpg"
  },

  {
    id: "base-posillo",
    nombre: "Posillo",
    precio: 5000,
    descripcion: "Posillo disponible en nuestra tienda.",
    imagen: "imagenes/posillo.jpg"
  },

  {
    id: "base-globos",
    nombre: "Globos",
    precio: 10000,
    descripcion: "Globos para tus momentos especiales.",
    imagen: "imagenes/globos.jpg"
  },

  {
    id: "base-keraton",
    nombre: "Keraton",
    precio: 10000,
    descripcion: "Producto Keraton disponible.",
    imagen: "imagenes/keraton.jpg"
  }

];



/* =========================================================
   UTILIDADES
========================================================= */

function usuarioEsAdmin() {

  const usuario =
    auth.currentUser;

  return !!usuario &&
    usuario.uid === UID_DUENO;

}


function escaparTexto(valor) {

  return String(valor ?? "");

}


function formatearPrecio(precio) {

  return new Intl.NumberFormat(
    "es-CO",
    {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }
  ).format(
    Number(precio) || 0
  );

}


function mostrarToast(
  mensaje,
  tipo = "normal"
) {

  const contenedor =
    document.getElementById(
      "contenedorToast"
    );

  if (!contenedor) return;


  const toast =
    document.createElement(
      "div"
    );

  toast.className =
    `toast toast-${tipo}`;


  const icono =
    tipo === "exito"
      ? "✓"
      : tipo === "error"
        ? "!"
        : "i";


  toast.innerHTML = `
    <span class="toast-icono">${icono}</span>
    <span class="toast-texto">${escaparTexto(mensaje)}</span>
    <button class="toast-cerrar">×</button>
  `;


  const botonCerrar =
    toast.querySelector(
      ".toast-cerrar"
    );


  botonCerrar.addEventListener(
    "click",
    () => cerrarToast(toast)
  );


  contenedor.appendChild(
    toast
  );


  requestAnimationFrame(() => {

    toast.classList.add(
      "mostrar"
    );

  });


  setTimeout(() => {

    cerrarToast(toast);

  }, 4000);

}


function cerrarToast(toast) {

  if (!toast) return;

  toast.classList.remove(
    "mostrar"
  );

  setTimeout(() => {

    toast.remove();

  }, 300);

}



/* =========================================================
   CAMBIAR PANTALLA
========================================================= */

window.mostrarProductos =
  function () {

    const inicio =
      document.getElementById(
        "pantallaInicio"
      );

    const productos =
      document.getElementById(
        "pantallaProductos"
      );


    if (inicio) {

      inicio.classList.add(
        "ocultar"
      );


      setTimeout(() => {

        inicio.style.display =
          "none";

      }, 350);

    }


    if (productos) {

      productos.style.display =
        "block";


      requestAnimationFrame(() => {

        productos.classList.add(
          "activa"
        );

      });

    }


    window.scrollTo({

      top: 0,

      behavior: "smooth"

    });

  };


window.volverInicio =
  function () {

    const inicio =
      document.getElementById(
        "pantallaInicio"
      );

    const productos =
      document.getElementById(
        "pantallaProductos"
      );


    if (productos) {

      productos.classList.remove(
        "activa"
      );


      setTimeout(() => {

        productos.style.display =
          "none";

      }, 300);

    }


    if (inicio) {

      inicio.style.display =
        "flex";


      requestAnimationFrame(() => {

        inicio.classList.remove(
          "ocultar"
        );

      });

    }


    window.scrollTo({

      top: 0,

      behavior: "smooth"

    });

  };



/* =========================================================
   LOGIN
========================================================= */

window.abrirLogin =
  function () {

    const ventana =
      document.getElementById(
        "ventanaLogin"
      );

    if (!ventana) return;


    ventana.classList.add(
      "mostrar"
    );


    const correo =
      document.getElementById(
        "correoLogin"
      );


    if (correo) {

      setTimeout(() => {

        correo.focus();

      }, 250);

    }

  };


window.cerrarLogin =
  function () {

    const ventana =
      document.getElementById(
        "ventanaLogin"
      );


    if (ventana) {

      ventana.classList.remove(
        "mostrar"
      );

    }


    const mensaje =
      document.getElementById(
        "mensajeLogin"
      );


    if (mensaje) {

      mensaje.textContent =
        "";

    }

  };


window.iniciarSesion =
  async function () {

    const correo =
      document.getElementById(
        "correoLogin"
      );

    const password =
      document.getElementById(
        "passwordLogin"
      );

    const mensaje =
      document.getElementById(
        "mensajeLogin"
      );


    if (!correo || !password)
      return;


    const email =
      correo.value.trim();

    const clave =
      password.value;


    if (!email || !clave) {

      if (mensaje) {

        mensaje.textContent =
          "Escribe el correo y la contraseña.";

      }

      return;

    }


    try {

      if (mensaje) {

        mensaje.textContent =
          "Iniciando sesión...";

      }


      const resultado =
        await signInWithEmailAndPassword(
          auth,
          email,
          clave
        );


      if (
        resultado.user.uid !==
        UID_DUENO
      ) {

        await signOut(auth);


        if (mensaje) {

          mensaje.textContent =
            "Este usuario no tiene permisos de administrador.";

        }

        return;

      }


      if (mensaje) {

        mensaje.textContent =
          "✓ ¡Sesión iniciada!";

      }


      mostrarToast(
        "Sesión iniciada correctamente.",
        "exito"
      );


      setTimeout(() => {

        window.cerrarLogin();

      }, 700);


    } catch (error) {

      console.error(error);


      let texto =
        "No se pudo iniciar sesión.";


      if (
        error.code ===
        "auth/invalid-credential"
      ) {

        texto =
          "Correo o contraseña incorrectos.";

      } else if (
        error.code ===
        "auth/user-not-found"
      ) {

        texto =
          "No existe una cuenta con ese correo.";

      } else if (
        error.code ===
        "auth/wrong-password"
      ) {

        texto =
          "La contraseña es incorrecta.";

      }


      if (mensaje) {

        mensaje.textContent =
          texto;

      }

    }

  };



/* =========================================================
   SESIÓN ADMIN
========================================================= */

window.cerrarSesion =
  async function () {

    try {

      detenerEscuchaPedidos();

      await signOut(auth);


      mostrarToast(
        "Sesión cerrada correctamente.",
        "exito"
      );


      setTimeout(() => {

        window.volverInicio();

      }, 400);


    } catch (error) {

      console.error(error);


      mostrarToast(
        "No se pudo cerrar la sesión.",
        "error"
      );

    }

  };



/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(
  auth,
  async (usuario) => {

    const panelAdmin =
      document.getElementById(
        "panelAdmin"
      );

    const estadoSesion =
      document.getElementById(
        "estadoSesion"
      );

    const estadoMiniAdmin =
      document.getElementById(
        "estadoMiniAdmin"
      );


    if (!usuario) {

      detenerEscuchaPedidos();


      if (panelAdmin) {

        panelAdmin.style.display =
          "none";

      }


      if (estadoMiniAdmin) {

        estadoMiniAdmin.style.display =
          "none";

      }


      cargarProductos();

      return;

    }


    if (
      usuario.uid !==
      UID_DUENO
    ) {

      await signOut(auth);

      detenerEscuchaPedidos();


      if (panelAdmin) {

        panelAdmin.style.display =
          "none";

      }


      mostrarToast(
        "No tienes permisos de administrador.",
        "error"
      );


      return;

    }


    if (panelAdmin) {

      panelAdmin.style.display =
        "block";

    }


    if (estadoSesion) {

      estadoSesion.textContent =
        "Sesión iniciada como administrador";

    }


    if (estadoMiniAdmin) {

      estadoMiniAdmin.style.display =
        "flex";

    }


    actualizarBotonesAdministrador();

    iniciarEscuchaPedidos();

    window.mostrarProductos();

    cargarProductos();

  }
);



/* =========================================================
   NOTIFICACIONES DEL ADMIN
========================================================= */

function actualizarContadorPedidos() {

  const contador =
    document.getElementById(
      "contadorPedidosAdmin"
    );


  if (!contador) return;


  contador.textContent =
    String(
      cantidadPedidosNuevos
    );

}


function mostrarPedidosAdmin() {

  const panel =
    document.getElementById(
      "panelPedidosAdmin"
    );


  if (!panel) return;


  panel.style.display =
    "block";


  renderizarPedidosAdmin();

}


function alternarPedidosAdmin() {

  const panel =
    document.getElementById(
      "panelPedidosAdmin"
    );


  if (!panel) return;


  if (
    panel.style.display ===
    "block"
  ) {

    panel.style.display =
      "none";

  } else {

    mostrarPedidosAdmin();

  }

}


window.mostrarPedidosAdmin =
  mostrarPedidosAdmin;


window.alternarPedidosAdmin =
  alternarPedidosAdmin;


window.cerrarPedidosAdmin =
  function () {

    const panel =
      document.getElementById(
        "panelPedidosAdmin"
      );


    if (panel) {

      panel.style.display =
        "none";

    }

  };


function iniciarEscuchaPedidos() {

  if (
    unsubscribePedidos ||
    !usuarioEsAdmin()
  ) {

    return;

  }


  cantidadPedidosNuevos =
    0;


  actualizarContadorPedidos();


  unsubscribePedidos =
    onSnapshot(
      collection(
        db,
        "pedidos"
      ),
      (snapshot) => {

        const pedidos =
          [];


        snapshot.forEach(
          (documento) => {

            pedidos.push({

              id:
                documento.id,

              ...documento.data()

            });

          }
        );


        pedidos.sort(
          (a, b) => {

            const tiempoA =
              a.creado?.seconds ||
              0;

            const tiempoB =
              b.creado?.seconds ||
              0;

            return tiempoB -
              tiempoA;

          }
        );


        pedidosAdmin =
          pedidos;


        renderizarPedidosAdmin();


        if (
          !pedidosInicializados
        ) {

          pedidosInicializados =
            true;

          return;

        }


        const cambios =
          snapshot.docChanges();


        cambios.forEach(
          (cambio) => {

            if (
              cambio.type !==
              "added"
            ) {

              return;

            }


            const pedido =
              {
                id:
                  cambio.doc.id,

                ...cambio.doc.data()

              };


            cantidadPedidosNuevos++;


            actualizarContadorPedidos();


            mostrarToast(
              `🔔 Nuevo pedido ${pedido.numeroPedido || ""}`,
              `${obtenerResumenPedido(pedido)}`,
              "exito"
            );


            enviarNotificacionNavegador(
              "🔔 Nuevo pedido",
              `${pedido.numeroPedido || "Pedido nuevo"} · ${obtenerResumenPedido(pedido)}`
            );

          }
        );

      },
      (error) => {

        console.error(
          "Error escuchando pedidos:",
          error
        );


        mostrarToast(
          "No se pudieron actualizar los pedidos.",
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

  pedidosAdmin =
    [];

  pedidosInicializados =
    false;

  cantidadPedidosNuevos =
    0;

  actualizarContadorPedidos();

  const panel =
    document.getElementById(
      "panelPedidosAdmin"
    );


  if (panel) {

    panel.style.display =
      "none";

  }

}


function obtenerResumenPedido(
  pedido
) {

  const cantidad =
    Number(
      pedido.cantidadTotal
    ) || 0;


  const total =
    formatearPrecio(
      Number(
        pedido.total
      ) || 0
    );


  return `${cantidad} artículo(s) · ${total}`;

}


function renderizarPedidosAdmin() {

  const contenedor =
    document.getElementById(
      "listaPedidosAdmin"
    );


  if (!contenedor) return;


  if (
    !pedidosAdmin.length
  ) {

    contenedor.innerHTML = `

      <div class="sin-pedidos-admin">

        <div class="sin-pedidos-icono">
          📦
        </div>

        <h3>
          No hay pedidos todavía
        </h3>

        <p>
          Cuando un cliente envíe un pedido aparecerá aquí.
        </p>

      </div>

    `;

    return;

  }


  contenedor.innerHTML =
    "";


  pedidosAdmin.forEach(
    (pedido) => {

      const tarjeta =
        document.createElement(
          "article"
        );


      tarjeta.className =
        "tarjeta-pedido-admin";


      const fecha =
        formatearFechaPedido(
          pedido.creado
        );


      const productos =
        Array.isArray(
          pedido.productos
        )
          ? pedido.productos
          : [];


      const listaProductos =
        productos
          .map(
            (producto) => `
              <div class="producto-pedido-admin">
                <div>
                  <strong>
                    ${escaparTexto(
                      producto.nombre
                    )}
                  </strong>
                  <span>
                    ${producto.cantidad} × ${formatearPrecio(producto.precio)}
                  </span>
                </div>

                <b>
                  ${formatearPrecio(
                    producto.subtotal
                  )}
                </b>
              </div>
            `
          )
          .join("");


      tarjeta.innerHTML = `

        <div class="cabecera-tarjeta-pedido">

          <div>

            <span class="numero-pedido-admin">
              ${escaparTexto(
                pedido.numeroPedido ||
                "PEDIDO"
              )}
            </span>

            <strong>
              Nuevo pedido
            </strong>

          </div>

          <span class="fecha-pedido-admin">
            ${fecha}
          </span>

        </div>


        <div class="lista-productos-pedido-admin">

          ${listaProductos}

        </div>


        <div class="total-pedido-admin">

          <span>
            Total
          </span>

          <strong>
            ${formatearPrecio(
              Number(
                pedido.total
              ) || 0
            )}
          </strong>

        </div>

      `;


      contenedor.appendChild(
        tarjeta
      );

    }
  );

}


function formatearFechaPedido(
  timestamp
) {

  if (
    timestamp &&
    typeof timestamp.toDate ===
      "function"
  ) {

    return timestamp
      .toDate()
      .toLocaleString(
        "es-CO",
        {
          dateStyle:
            "short",
          timeStyle:
            "short"
        }
      );

  }


  return "Ahora";

}


async function activarNotificacionesAdmin() {

  if (!usuarioEsAdmin()) {

    return;

  }


  if (
    !("Notification" in window)
  ) {

    mostrarToast(
      "Tu navegador no permite notificaciones.",
      "error"
    );

    return;

  }


  try {

    const permiso =
      await Notification.requestPermission();


    if (
      permiso ===
      "granted"
    ) {

      mostrarToast(
        "Notificaciones activadas 🔔",
        "exito"
      );


      const boton =
        document.getElementById(
          "botonNotificacionesAdmin"
        );


      if (boton) {

        boton.innerHTML =
          `<span>✅</span> Avisos activados`;

      }

    } else {

      mostrarToast(
        "No se activaron las notificaciones.",
        "error"
      );

    }

  } catch (error) {

    console.error(
      error
    );

    mostrarToast(
      "No se pudieron activar los avisos.",
      "error"
    );

  }

}


window.activarNotificacionesAdmin =
  activarNotificacionesAdmin;


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

    if (
      Notification.permission !==
      "granted"
    ) {

      return;

    }


    new Notification(
      titulo,
      {
        body:
          cuerpo,

        icon:
          "icons/icon-192.png",

        tag:
          "variedades-karleny-pedido"
      }
    );

  } catch (error) {

    console.warn(
      "No se pudo mostrar la notificación:",
      error
    );

  }

}



/* =========================================================
   FOTO PREVIA
========================================================= */

const inputFoto =
  document.getElementById(
    "fotoProducto"
  );


if (inputFoto) {

  inputFoto.addEventListener(
    "change",
    function () {

      const archivo =
        this.files[0];

      const vistaPrevia =
        document.getElementById(
          "vistaPrevia"
        );


      if (!vistaPrevia)
        return;


      vistaPrevia.innerHTML =
        "";


      if (!archivo)
        return;


      if (
        !archivo.type.startsWith(
          "image/"
        )
      ) {

        mostrarToast(
          "Selecciona una imagen válida.",
          "error"
        );


        this.value =
          "";


        return;

      }


      const imagen =
        document.createElement(
          "img"
        );


      imagen.src =
        URL.createObjectURL(
          archivo
        );


      imagen.alt =
        "Vista previa del producto";


      vistaPrevia.appendChild(
        imagen
      );


      vistaPrevia.classList.add(
        "visible"
      );

    }
  );

}



/* =========================================================
   SUBIR CLOUDINARY
========================================================= */

async function subirImagenCloudinary(
  archivo
) {

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
        method:
          "POST",

        body:
          datos
      }
    );


  if (!respuesta.ok) {

    throw new Error(
      "No se pudo subir la imagen."
    );

  }


  const resultado =
    await respuesta.json();


  if (
    !resultado.secure_url
  ) {

    throw new Error(
      "Cloudinary no devolvió la imagen."
    );

  }


  return resultado.secure_url;

}



/* =========================================================
   CREAR PRODUCTO
========================================================= */

window.agregarProducto =
  async function () {

    if (!usuarioEsAdmin()) {

      mostrarToast(
        "No tienes permiso para publicar productos.",
        "error"
      );

      return;

    }


    const inputFoto =
      document.getElementById(
        "fotoProducto"
      );

    const inputNombre =
      document.getElementById(
        "nombreProducto"
      );

    const inputPrecio =
      document.getElementById(
        "precioProducto"
      );

    const inputDescripcion =
      document.getElementById(
        "descripcionProducto"
      );


    if (
      !inputFoto ||
      !inputNombre ||
      !inputPrecio ||
      !inputDescripcion
    ) {

      mostrarToast(
        "No se encontraron todos los campos.",
        "error"
      );

      return;

    }


    const archivo =
      inputFoto.files[0];

    const nombre =
      inputNombre.value.trim();

    const precio =
      Number(
        inputPrecio.value
      );

    const descripcion =
      inputDescripcion.value.trim();


    if (!archivo) {

      mostrarToast(
        "Selecciona una foto del producto.",
        "error"
      );

      return;

    }


    if (!nombre) {

      mostrarToast(
        "Escribe el nombre del producto.",
        "error"
      );

      return;

    }


    if (
      !Number.isFinite(precio) ||
      precio < 0
    ) {

      mostrarToast(
        "Escribe un precio válido.",
        "error"
      );

      return;

    }


    if (!descripcion) {

      mostrarToast(
        "Escribe una descripción.",
        "error"
      );

      return;

    }


    const boton =
      document.querySelector(
        ".boton-publicar"
      );


    try {

      if (boton) {

        boton.disabled =
          true;

        boton.innerHTML =
          `<span class="spinner"></span> Publicando...`;

      }


      const urlImagen =
        await subirImagenCloudinary(
          archivo
        );


      await addDoc(
        collection(
          db,
          "productos"
        ),
        {
          nombre:
            nombre,

          precio:
            precio,

          descripcion:
            descripcion,

          imagen:
            urlImagen,

          tipo:
            "creado",

          creado:
            new Date()
        }
      );


      inputFoto.value =
        "";

      inputNombre.value =
        "";

      inputPrecio.value =
        "";

      inputDescripcion.value =
        "";


      const vistaPrevia =
        document.getElementById(
          "vistaPrevia"
        );


      if (vistaPrevia) {

        vistaPrevia.innerHTML =
          "";

        vistaPrevia.classList.remove(
          "visible"
        );

      }


      mostrarToast(
        "Producto publicado correctamente.",
        "exito"
      );


      await cargarProductos();


    } catch (error) {

      console.error(
        "Error publicando:",
        error
      );


      mostrarToast(
        "No se pudo publicar el producto.",
        "error"
      );


    } finally {

      if (boton) {

        boton.disabled =
          false;

        boton.innerHTML =
          `<span>🚀</span> Publicar producto`;

      }

    }

  };



/* =========================================================
   ASEGURAR PRODUCTOS BASE
========================================================= */

async function asegurarProductosBase() {

  for (
    const producto of PRODUCTOS_BASE
  ) {

    try {

      const referencia =
        doc(
          db,
          "productos",
          producto.id
        );


      const existe =
        await getDoc(
          referencia
        );


      if (
        !existe.exists()
      ) {

        await setDoc(
          referencia,
          {
            nombre:
              producto.nombre,

            precio:
              producto.precio,

            descripcion:
              producto.descripcion,

            imagen:
              producto.imagen,

            tipo:
              "base",

            codigoBase:
              producto.id,

            creado:
              new Date()
          }
        );

      }

    } catch (error) {

      console.error(
        "Error creando producto base:",
        error
      );

    }

  }

}



/* =========================================================
   CARGAR PRODUCTOS
========================================================= */

async function cargarProductos() {

  const contenedor =
    document.getElementById(
      "productosDinamicos"
    );


  if (!contenedor)
    return;


  contenedor.innerHTML = `

    <div class="cargando-productos">

      <div class="spinner-grande"></div>

      <p>
        Cargando productos...
      </p>

    </div>

  `;


  try {

    await asegurarProductosBase();


    const consulta =
      await getDocs(
        collection(
          db,
          "productos"
        )
      );


    contenedor.innerHTML =
      "";


    const productos =
      [];


    consulta.forEach(
      (documento) => {

        const producto =
          documento.data();


        productos.push({

          id:
            documento.id,

          ...producto

        });

      }
    );


    productos.sort(
      (a, b) => {

        if (
          a.tipo === "base" &&
          b.tipo !== "base"
        ) {

          return -1;

        }

        if (
          a.tipo !== "base" &&
          b.tipo === "base"
        ) {

          return 1;

        }


        return String(
          a.nombre || ""
        ).localeCompare(
          String(
            b.nombre || ""
          )
        );

      }
    );


    if (
      productos.length === 0
    ) {

      actualizarTextoResultados(
        0
      );

      aplicarFiltros();

      return;

    }


    productos.forEach(
      (
        producto,
        indice
      ) => {

        crearTarjetaProducto(
          contenedor,
          producto.id,
          producto,
          indice
        );

      }
    );


    actualizarBotonesAdministrador();

    aplicarFiltros();


  } catch (error) {

    console.error(
      "Error cargando productos:",
      error
    );


    contenedor.innerHTML = `

      <div class="error-productos">

        <div>
          ⚠️
        </div>

        <h3>
          No se pudieron cargar los productos
        </h3>

        <p>
          Revisa tu conexión e inténtalo nuevamente.
        </p>

        <button onclick="cargarProductos()">
          Reintentar
        </button>

      </div>

    `;

  }

}



/* =========================================================
   CREAR TARJETA
========================================================= */

function crearTarjetaProducto(
  contenedor,
  id,
  producto,
  indice
) {

  const tarjeta =
    document.createElement(
      "article"
    );


  tarjeta.className =
    "producto tarjeta-entrada";


  tarjeta.style.setProperty(
    "--delay",
    `${Math.min(
      indice * 0.06,
      0.4
    )}s`
  );


  tarjeta.dataset.nombre =
    escaparTexto(
      producto.nombre
    );


  tarjeta.dataset.precio =
    String(
      Number(
        producto.precio
      ) || 0
    );


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


  imagen.addEventListener(
    "click",
    () => {

      if (
        producto.imagen
      ) {

        abrirVisorImagen(
          producto.imagen,
          producto.nombre
        );

      }

    }
  );


  imagen.addEventListener(
    "error",
    function () {

      this.style.display =
        "none";


      contenedorImagen.classList.add(
        "imagen-error"
      );


      contenedorImagen.insertAdjacentHTML(
        "beforeend",
        `<span>🖼️</span>`
      );

    }
  );


  contenedorImagen.appendChild(
    imagen
  );


  const etiqueta =
    document.createElement(
      "span"
    );


  etiqueta.className =
    "etiqueta-producto";


  etiqueta.textContent =
    producto.tipo === "base"
      ? "Disponible"
      : "Nuevo";


  contenedorImagen.appendChild(
    etiqueta
  );


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
    "Producto disponible en nuestra tienda.";


  const precio =
    document.createElement(
      "p"
    );


  precio.className =
    "precio";


  precio.textContent =
    formatearPrecio(
      Number(
        producto.precio
      ) || 0
    );


  const botonCarrito =
    document.createElement(
      "button"
    );


  botonCarrito.className =
    "boton-agregar";


  botonCarrito.innerHTML =
    `<span>🛒</span> Agregar al carrito`;


  botonCarrito.addEventListener(
    "click",
    () => {

      window.agregarAlCarrito(
        producto.nombre,
        Number(
          producto.precio
        ) || 0
      );

    }
  );


  informacion.appendChild(
    titulo
  );

  informacion.appendChild(
    descripcion
  );

  informacion.appendChild(
    precio
  );

  informacion.appendChild(
    botonCarrito
  );


  if (
    usuarioEsAdmin()
  ) {

    const botonEliminar =
      document.createElement(
        "button"
      );


    botonEliminar.className =
      "boton-eliminar-producto";


    botonEliminar.innerHTML =
      `<span>🗑️</span> Borrar artículo`;


    botonEliminar.dataset.productoId =
      id;


    botonEliminar.addEventListener(
      "click",
      () => {

        eliminarProductoFirebase(
          id,
          producto.nombre
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



/* =========================================================
   MOSTRAR/OCULTAR BORRAR
========================================================= */

function actualizarBotonesAdministrador() {

  const esAdmin =
    usuarioEsAdmin();


  const botones =
    document.querySelectorAll(
      ".boton-eliminar-producto"
    );


  botones.forEach(
    (boton) => {

      boton.style.display =
        esAdmin
          ? "flex"
          : "none";

    }
  );

}



/* =========================================================
   ELIMINAR PRODUCTO
========================================================= */

async function eliminarProductoFirebase(
  id,
  nombre = "este artículo"
) {

  if (!usuarioEsAdmin()) {

    mostrarToast(
      "No tienes permiso para borrar productos.",
      "error"
    );

    return;

  }


  const confirmar =
    window.confirm(
      `¿Seguro que quieres borrar "${nombre}"?`
    );


  if (!confirmar)
    return;


  try {

    await deleteDoc(
      doc(
        db,
        "productos",
        id
      )
    );


    mostrarToast(
      "Artículo eliminado correctamente.",
      "exito"
    );


    await cargarProductos();


  } catch (error) {

    console.error(
      "Error eliminando producto:",
      error
    );


    mostrarToast(
      "No se pudo eliminar el artículo.",
      "error"
    );

  }

}



/* =========================================================
   FILTROS
========================================================= */

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


function actualizarTextoPrecio() {

  if (
    !rangoPrecio ||
    !valorPrecio
  ) {

    return;

  }


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


  let encontrados =
    0;


  productos.forEach(
    (producto) => {

      const nombre =
        (
          producto.dataset.nombre ||
          ""
        )
        .toLowerCase();


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


  actualizarTextoResultados(
    encontrados
  );

}


function actualizarTextoResultados(
  cantidad
) {

  const contador =
    document.getElementById(
      "contadorResultados"
    );


  if (!contador)
    return;


  if (
    cantidad === 0
  ) {

    contador.textContent =
      "Sin productos";

    return;

  }


  contador.textContent =
    cantidad === 1
      ? "1 producto disponible"
      : `${cantidad} productos disponibles`;

}


window.alternarFiltros =
  function () {

    const panel =
      document.getElementById(
        "panelFiltros"
      );


    const icono =
      document.getElementById(
        "iconoFiltros"
      );


    if (!panel)
      return;


    panel.classList.toggle(
      "mostrar"
    );


    if (icono) {

      icono.classList.toggle(
        "abierto"
      );

    }

  };


window.limpiarFiltros =
  function () {

    if (buscador) {

      buscador.value =
        "";

    }


    if (rangoPrecio) {

      rangoPrecio.value =
        "100000";

    }


    actualizarTextoPrecio();

    aplicarFiltros();

  };


window.limpiarBusqueda =
  function () {

    if (buscador) {

      buscador.value =
        "";

      buscador.focus();

    }


    aplicarFiltros();

  };



/* =========================================================
   CARRITO
========================================================= */

window.agregarAlCarrito =
  function (
    nombre,
    precio
  ) {

    const productoExistente =
      carrito.find(
        producto =>
          producto.nombre ===
          nombre
      );


    if (
      productoExistente
    ) {

      productoExistente.cantidad++;

    } else {

      carrito.push({

        nombre:
          nombre,

        precio:
          Number(
            precio
          ) || 0,

        cantidad:
          1

      });

    }


    actualizarCarrito();


    mostrarToast(
      `${nombre} agregado al carrito.`,
      "exito"
    );


    setTimeout(() => {

      abrirCarrito();

    }, 180);

  };


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


  const botonEnviar =
    document.getElementById(
      "botonEnviarPedido"
    );


  const botonWhatsApp =
    document.querySelector(
      ".boton-whatsapp"
    );


  if (!lista)
    return;


  lista.innerHTML =
    "";


  let cantidadTotal =
    0;


  let precioTotal =
    0;


  if (
    carrito.length === 0
  ) {

    lista.innerHTML = `

      <div class="carrito-vacio">

        <div class="carrito-vacio-icono">
          🛒
        </div>

        <h3>
          Tu carrito está vacío
        </h3>

        <p>
          Agrega algunos productos
          para comenzar tu pedido.
        </p>

        <button
          onclick="cerrarCarrito()"
        >
          Seguir comprando
        </button>

      </div>

    `;


    if (total) {

      total.textContent =
        "Total: $0";

    }


    if (contador) {

      contador.textContent =
        "0";

    }


    if (botonEnviar) {

      botonEnviar.style.display =
        "none";

    }


    if (botonWhatsApp) {

      botonWhatsApp.style.display =
        "none";

    }


    return;

  }


  if (botonEnviar) {

    botonEnviar.style.display =
      "block";

  }


  if (botonWhatsApp) {

    botonWhatsApp.style.display =
      "block";

  }


  carrito.forEach(
    (
      producto,
      indice
    ) => {

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
        () => {

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
        () => {

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
        () => {

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


function cambiarCantidadCarrito(
  indice,
  cambio
) {

  if (!carrito[indice])
    return;


  carrito[indice].cantidad +=
    cambio;


  if (
    carrito[indice].cantidad <=
    0
  ) {

    carrito.splice(
      indice,
      1
    );

  }


  actualizarCarrito();

}


function eliminarDelCarrito(
  indice
) {

  if (!carrito[indice])
    return;


  carrito.splice(
    indice,
    1
  );


  actualizarCarrito();

}


window.abrirCarrito =
  function () {

    const ventana =
      document.getElementById(
        "ventanaCarrito"
      );


    if (!ventana)
      return;


    actualizarCarrito();


    ventana.classList.add(
      "mostrar"
    );

  };


window.cerrarCarrito =
  function () {

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



/* =========================================================
   ENVIAR PEDIDO A FIRESTORE
========================================================= */

window.enviarPedido =
  async function () {

    if (
      carrito.length === 0
    ) {

      mostrarToast(
        "Tu carrito está vacío.",
        "error"
      );

      return;

    }


    const boton =
      document.getElementById(
        "botonEnviarPedido"
      );


    if (boton) {

      boton.disabled =
        true;

      boton.innerHTML =
        `<span class="spinner"></span> Enviando pedido...`;

    }


    try {

      let total =
        0;


      let cantidadTotal =
        0;


      const productos =
        carrito.map(
          (producto) => {

            const subtotal =
              Number(
                producto.precio
              ) *
              Number(
                producto.cantidad
              );


            total +=
              subtotal;


            cantidadTotal +=
              Number(
                producto.cantidad
              );


            return {

              nombre:
                producto.nombre,

              precio:
                Number(
                  producto.precio
                ),

              cantidad:
                Number(
                  producto.cantidad
                ),

              subtotal:
                subtotal

            };

          }
        );


      const numeroPedido =
        `VK-${Date.now()
          .toString()
          .slice(-8)}`;


      await addDoc(
        collection(
          db,
          "pedidos"
        ),
        {

          numeroPedido:
            numeroPedido,

          productos:
            productos,

          cantidadTotal:
            cantidadTotal,

          total:
            total,

          estado:
            "pendiente",

          creado:
            serverTimestamp()

        }
      );


      carrito = [];


      actualizarCarrito();


      mostrarToast(
        `Pedido ${numeroPedido} enviado correctamente.`,
        "exito"
      );


      setTimeout(() => {

        cerrarCarrito();

      }, 1000);


    } catch (error) {

      console.error(
        "Error enviando pedido:",
        error
      );


      mostrarToast(
        "No se pudo enviar el pedido. Intenta nuevamente.",
        "error"
      );


    } finally {

      if (boton) {

        boton.disabled =
          false;

        boton.innerHTML =
          `<span>📦</span> Enviar pedido`;

      }

    }

  };



/* =========================================================
   WHATSAPP — CONSULTAR
========================================================= */

window.consultarPorWhatsApp =
  function () {

    let mensaje =
      "Hola 👋, quisiera consultar sobre algunos productos de Variedades Karleny.";


    if (
      carrito.length > 0
    ) {

      mensaje +=
        "\n\nTengo estos productos en mi carrito:";


      carrito.forEach(
        (producto) => {

          mensaje +=
            `\n• ${producto.nombre} x${producto.cantidad}`;

        }
      );

    }


    const url =
      `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(
        mensaje
      )}`;


    window.open(
      url,
      "_blank"
    );

  };


/* Mantener compatibilidad */
window.comprarPorWhatsApp =
  window.consultarPorWhatsApp;



/* =========================================================
   VISOR DE IMÁGENES
========================================================= */

window.abrirVisorImagen =
  function (
    url,
    nombre = "Producto"
  ) {

    const visor =
      document.getElementById(
        "visorImagen"
      );


    const imagen =
      document.getElementById(
        "imagenGrande"
      );


    if (
      !visor ||
      !imagen
    )
      return;


    imagen.src =
      url;


    imagen.alt =
      nombre;


    visor.classList.add(
      "mostrar"
    );


    document.body.classList.add(
      "sin-scroll"
    );

  };


window.cerrarVisorImagen =
  function () {

    const visor =
      document.getElementById(
        "visorImagen"
      );


    if (visor) {

      visor.classList.remove(
        "mostrar"
      );

    }


    document.body.classList.remove(
      "sin-scroll"
    );

  };



/* =========================================================
   CERRAR MODALES
========================================================= */

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
      event.target ===
      login
    ) {

      cerrarLogin();

    }


    if (
      event.target ===
      carritoVentana
    ) {

      cerrarCarrito();

    }

  }
);



/* =========================================================
   ESC
========================================================= */

window.addEventListener(
  "keydown",
  function (event) {

    if (
      event.key ===
      "Escape"
    ) {

      cerrarLogin();

      cerrarCarrito();

      cerrarVisorImagen();

    }

  }
);



/* =========================================================
   ENTER LOGIN
========================================================= */

const passwordLogin =
  document.getElementById(
    "passwordLogin"
  );


if (passwordLogin) {

  passwordLogin.addEventListener(
    "keydown",
    function (event) {

      if (
        event.key ===
        "Enter"
      ) {

        iniciarSesion();

      }

    }
  );

}



/* =========================================================
   INICIO
========================================================= */

actualizarTextoPrecio();

actualizarCarrito();

cargarProductos();
