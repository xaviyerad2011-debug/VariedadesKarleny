// ==========================================
// VARIEDADES KARLENY 🛍️
// ==========================================


// ==========================================
// FIREBASE
// ==========================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";


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
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ==========================================
// CONFIGURACIÓN FIREBASE
// ==========================================

const firebaseConfig = {

    apiKey: "AIzaSyBzTvF-Af08z8jsjpa6L2mGEQQ7IxZZqAI",

    authDomain: "variedades-karleny.firebaseapp.com",

    projectId: "variedades-karleny",

    storageBucket: "variedades-karleny.firebasestorage.app",

    messagingSenderId: "117661003844",

    appId: "1:117661003844:web:2ba3db02e3fdf6e6278c11"

};


// ==========================================
// INICIAR FIREBASE
// ==========================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


// ==========================================
// UID DEL DUEÑO
// ==========================================

const UID_DUENO =
    "vKixdwAJz9MfApZV81FPOiPybFr2";


// ==========================================
// ESTADO DEL USUARIO
// ==========================================

onAuthStateChanged(auth, (usuario) => {

    const panel =
        document.getElementById("panelAdmin");


    if (
        usuario &&
        usuario.uid === UID_DUENO
    ) {

        console.log(
            "Dueño conectado:",
            usuario.uid
        );


        if (panel) {

            panel.style.display = "block";

        }

    } else {

        console.log(
            "No hay dueño conectado"
        );


        if (panel) {

            panel.style.display = "none";

        }

    }

});


// ==========================================
// CARRITO
// ==========================================

let carrito = [];


// ==========================================
// LOGIN
// ==========================================

function abrirLogin() {

    const ventana =
        document.getElementById("ventanaLogin");

    if (ventana) {

        ventana.style.display = "flex";

    }

}


function cerrarLogin() {

    const ventana =
        document.getElementById("ventanaLogin");

    if (ventana) {

        ventana.style.display = "none";

    }

}


async function iniciarSesion() {

    const correo =
        document
            .getElementById("correoLogin")
            .value
            .trim();


    const contrasena =
        document
            .getElementById("contrasenaLogin")
            .value;


    const mensaje =
        document.getElementById("mensajeLogin");


    if (!correo || !contrasena) {

        mensaje.textContent =
            "⚠️ Escribe tu correo y contraseña.";

        return;

    }


    try {

        mensaje.textContent =
            "🔄 Iniciando sesión...";


        const resultado =
            await signInWithEmailAndPassword(
                auth,
                correo,
                contrasena
            );


        if (
            resultado.user.uid !==
            UID_DUENO
        ) {

            await signOut(auth);

            mensaje.textContent =
                "❌ Esta cuenta no es la cuenta del dueño.";

            return;

        }


        mensaje.textContent =
            "✅ ¡Bienvenido!";


        cerrarLogin();


    } catch (error) {

        console.error(
            "Error de inicio de sesión:",
            error
        );


        mensaje.textContent =
            "❌ Correo o contraseña incorrectos.";

    }

}


async function cerrarSesion() {

    try {

        await signOut(auth);

        alert(
            "👋 Sesión cerrada correctamente."
        );

    } catch (error) {

        console.error(error);

    }

}


// ==========================================
// IR A PRODUCTOS
// ==========================================

function mostrarMensaje() {

    const productos =
        document.getElementById("productos");


    if (productos) {

        productos.scrollIntoView({
            behavior: "smooth"
        });

    }

}


// ==========================================
// AGREGAR AL CARRITO
// ==========================================

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

            precio: precio,

            cantidad: 1

        });

    }


    actualizarCarrito();


    alert(
        "🛒 " +
        nombre +
        " agregado al carrito"
    );

}


// ==========================================
// ACTUALIZAR CANTIDAD
// ==========================================

function actualizarCarrito() {

    const contador =
        document.getElementById(
            "cantidadCarrito"
        );


    if (!contador) return;


    let cantidadTotal = 0;


    carrito.forEach(producto => {

        cantidadTotal +=
            producto.cantidad;

    });


    contador.textContent =
        cantidadTotal;

}


// ==========================================
// ABRIR CARRITO
// ==========================================

function abrirCarrito() {

    const ventana =
        document.getElementById(
            "ventanaCarrito"
        );


    if (!ventana) return;


    mostrarProductosCarrito();


    ventana.style.display = "flex";

}


// ==========================================
// CERRAR CARRITO
// ==========================================

function cerrarCarrito() {

    const ventana =
        document.getElementById(
            "ventanaCarrito"
        );


    if (ventana) {

        ventana.style.display = "none";

    }

}


// ==========================================
// MOSTRAR CARRITO
// ==========================================

function mostrarProductosCarrito() {

    const lista =
        document.getElementById(
            "listaCarrito"
        );


    const totalElemento =
        document.getElementById(
            "totalCarrito"
        );


    if (!lista) return;


    if (carrito.length === 0) {

        lista.innerHTML = `
            <div class="carrito-vacio">
                🛒 Tu carrito está vacío.
            </div>
        `;


        if (totalElemento) {

            totalElemento.textContent =
                "$0";

        }


        return;

    }


    lista.innerHTML = "";


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

                <div class="item-info">

                    <strong>
                        ${producto.nombre}
                    </strong>

                    <span>
                        $${producto.precio.toLocaleString("es-CO")}
                    </span>

                </div>


                <div class="cantidad">

                    <button
                        onclick="disminuirCantidad(${indice})">

                        −

                    </button>

                    <span>
                        ${producto.cantidad}
                    </span>

                    <button
                        onclick="aumentarCantidad(${indice})">

                        +

                    </button>

                </div>


                <div class="subtotal">

                    $${subtotal.toLocaleString("es-CO")}

                    <button
                        class="eliminar"
                        onclick="eliminarProducto(${indice})">

                        🗑️

                    </button>

                </div>

            `;


            lista.appendChild(item);

        }
    );


    if (totalElemento) {

        totalElemento.textContent =
            "$" +
            total.toLocaleString("es-CO");

    }

}


// ==========================================
// AUMENTAR
// ==========================================

function aumentarCantidad(indice) {

    if (!carrito[indice]) return;


    carrito[indice].cantidad++;


    actualizarCarrito();


    mostrarProductosCarrito();

}


// ==========================================
// DISMINUIR
// ==========================================

function disminuirCantidad(indice) {

    if (!carrito[indice]) return;


    carrito[indice].cantidad--;


    if (
        carrito[indice].cantidad <= 0
    ) {

        carrito.splice(
            indice,
            1
        );

    }


    actualizarCarrito();


    mostrarProductosCarrito();

}


// ==========================================
// ELIMINAR
// ==========================================

function eliminarProducto(indice) {

    carrito.splice(
        indice,
        1
    );


    actualizarCarrito();


    mostrarProductosCarrito();

}


// ==========================================
// VACIAR CARRITO
// ==========================================

function vaciarCarrito() {

    if (carrito.length === 0) {

        return;

    }


    const confirmar =
        confirm(
            "¿Seguro que quieres vaciar el carrito?"
        );


    if (confirmar) {

        carrito = [];


        actualizarCarrito();


        mostrarProductosCarrito();

    }

}


// ==========================================
// WHATSAPP
// ==========================================

function comprarCarritoWhatsApp() {

    if (carrito.length === 0) {

        alert(
            "🛒 Tu carrito está vacío."
        );

        return;

    }


    const numero =
        "573202104423";


    let mensaje =
        "Hola 👋, quiero hacer el siguiente pedido:\n\n";


    let total = 0;


    carrito.forEach(producto => {

        const subtotal =
            producto.precio *
            producto.cantidad;


        total += subtotal;


        mensaje +=
            "🛍️ " +
            producto.nombre +
            " x" +
            producto.cantidad +
            " — $" +
            subtotal.toLocaleString("es-CO") +
            "\n";

    });


    mensaje +=
        "\n💰 TOTAL: $" +
        total.toLocaleString("es-CO");


    const enlace =
        "https://wa.me/" +
        numero +
        "?text=" +
        encodeURIComponent(mensaje);


    window.location.href =
        enlace;

}


// ==========================================
// AGREGAR PRODUCTO
// ==========================================

async function agregarProducto() {

    const foto =
        document
            .getElementById("fotoProducto")
            .files[0];


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
        document.getElementById(
            "mensajeProducto"
        );


    if (
        !foto ||
        !nombre ||
        !precio
    ) {

        mensaje.textContent =
            "⚠️ Completa la foto, nombre y precio.";

        return;

    }


    if (
        !auth.currentUser ||
        auth.currentUser.uid !== UID_DUENO
    ) {

        mensaje.textContent =
            "❌ No tienes permiso para agregar productos.";

        return;

    }


    try {

        mensaje.textContent =
            "📸 Subiendo imagen...";


        // ==========================================
        // CLOUDINARY
        // ==========================================

        const datos =
            new FormData();


        datos.append(
            "file",
            foto
        );


        datos.append(
            "upload_preset",
            "productos"
        );


        const respuesta =
            await fetch(
                "https://api.cloudinary.com/v1_1/ktxu8h5o/image/upload",
                {
                    method: "POST",
                    body: datos
                }
            );


        if (!respuesta.ok) {

            throw new Error(
                "Cloudinary rechazó la imagen."
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
            "🗄️ Guardando producto...";


        // ==========================================
        // FIRESTORE
        // ==========================================

        await addDoc(
            collection(
                db,
                "productos"
            ),
            {

                nombre: nombre,

                precio: precio,

                descripcion: descripcion,

                imagen: imagen.secure_url,

                creado:
                    new Date()

            }
        );


        mensaje.textContent =
            "✅ ¡Producto agregado correctamente!";


        // ==========================================
        // LIMPIAR FORMULARIO
        // ==========================================

        document
            .getElementById("fotoProducto")
            .value = "";


        document
            .getElementById("nombreProducto")
            .value = "";


        document
            .getElementById("precioProducto")
            .value = "";


        document
            .getElementById("descripcionProducto")
            .value = "";


        // Cargar el nuevo producto
        cargarProductos();


    } catch (error) {

        console.error(
            "Error agregando producto:",
            error
        );


        mensaje.textContent =
            "❌ No se pudo agregar el producto.";

    }

}


// ==========================================
// CARGAR PRODUCTOS DE FIRESTORE
// ==========================================

async function cargarProductos() {

    const seccion =
        document.getElementById(
            "productos"
        );


    if (!seccion) return;


    try {

        const consulta =
            await getDocs(
                collection(
                    db,
                    "productos"
                )
            );


        consulta.forEach(
            documento => {

                const producto =
                    documento.data();


                // Evitar duplicados
                if (
                    document.querySelector(
                        `[data-producto-id="${documento.id}"]`
                    )
                ) {

                    return;

                }


                const tarjeta =
                    document.createElement(
                        "div"
                    );


                tarjeta.className =
                    "producto producto-firebase";


                tarjeta.setAttribute(
                    "data-producto-id",
                    documento.id
                );


                const nombreSeguro =
                    String(
                        producto.nombre || ""
                    );


                const descripcionSegura =
                    String(
                        producto.descripcion || ""
                    );


                const precioSeguro =
                    Number(
                        producto.precio || 0
                    );


                tarjeta.innerHTML = `

                    <img
                        src="${producto.imagen}"
                        alt="${nombreSeguro}">


                    <h3>
                        ${nombreSeguro}
                    </h3>


                    <p class="descripcion-producto">
                        ${descripcionSegura}
                    </p>


                    <p class="precio">
                        $${precioSeguro.toLocaleString("es-CO")}
                    </p>


                    <button
                        onclick="agregarAlCarrito(
                            '${nombreSeguro.replace(/'/g, "\\'")}',
                            ${precioSeguro}
                        )">

                        🛒 Agregar al carrito

                    </button>

                `;


                seccion.appendChild(
                    tarjeta
                );

            }
        );


    } catch (error) {

        console.error(
            "Error cargando productos:",
            error
        );

    }

}


// ==========================================
// HACER FUNCIONES GLOBALES
// ==========================================
// Esto es necesario porque usamos
// <script type="module"> y el HTML utiliza
// onclick="...".

window.abrirLogin =
    abrirLogin;

window.cerrarLogin =
    cerrarLogin;

window.iniciarSesion =
    iniciarSesion;

window.cerrarSesion =
    cerrarSesion;

window.mostrarMensaje =
    mostrarMensaje;

window.agregarAlCarrito =
    agregarAlCarrito;

window.actualizarCarrito =
    actualizarCarrito;

window.abrirCarrito =
    abrirCarrito;

window.cerrarCarrito =
    cerrarCarrito;

window.mostrarProductosCarrito =
    mostrarProductosCarrito;

window.aumentarCantidad =
    aumentarCantidad;

window.disminuirCantidad =
    disminuirCantidad;

window.eliminarProducto =
    eliminarProducto;

window.vaciarCarrito =
    vaciarCarrito;

window.comprarCarritoWhatsApp =
    comprarCarritoWhatsApp;

window.agregarProducto =
    agregarProducto;


// ==========================================
// CARGAR PRODUCTOS AL ABRIR LA PÁGINA
// ==========================================

cargarProductos();
