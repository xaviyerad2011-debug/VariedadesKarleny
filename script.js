// ==========================================
// VARIEDADES KARLENY 🛍️
// ==========================================

// ==========================================
// FIREBASE 🔥
// ==========================================

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

const firebaseConfig = {
    apiKey: "AIzaSyBzTvF-Af08z8jsjpa6L2mGEQQ7IxZZqAI",
    authDomain: "variedades-karleny.firebaseapp.com",
    projectId: "variedades-karleny",
    storageBucket: "variedades-karleny.firebasestorage.app",
    messagingSenderId: "117661003844",
    appId: "1:117661003844:web:2ba3db02e3fdf6e6278c11"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// UID DEL DUEÑO
const UID_DUENO = "vKixdwAJz9MfApZV81FPOiPybFr2";

onAuthStateChanged(auth, (usuario) => {

    const panel = document.getElementById("panelAdmin");

    if (usuario && usuario.uid === UID_DUENO) {
        console.log("Dueño conectado:", usuario.uid);

        if (panel) {
            panel.style.display = "block";
        }

    } else {
        console.log("No hay dueño conectado");

        if (panel) {
            panel.style.display = "none";
        }
    }
});


// ==========================================
// CARRITO 🛒
// ==========================================

let carrito = [];
// ==========================================
// LOGIN DEL DUEÑO 🔐
// ==========================================

function abrirLogin() {
    document.getElementById("ventanaLogin").style.display = "flex";
}

function cerrarLogin() {
    document.getElementById("ventanaLogin").style.display = "none";
}

async function iniciarSesion() {
    const correo = document.getElementById("correoLogin").value;
    const contrasena = document.getElementById("contrasenaLogin").value;
    const mensaje = document.getElementById("mensajeLogin");

    if (!correo || !contrasena) {
        mensaje.textContent = "⚠️ Escribe tu correo y contraseña.";
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, correo, contrasena);

        mensaje.textContent = "✅ ¡Bienvenido!";
        cerrarLogin();

        mostrarPanelAdmin();

    } catch (error) {
        console.error(error);
        mensaje.textContent = "❌ Correo o contraseña incorrectos.";
    }
}

function cerrarSesion() {
    signOut(auth);
}

// ------------------------------------------
// IR A LOS PRODUCTOS
// ------------------------------------------

function mostrarMensaje() {

    const productos = document.getElementById("productos");

    if (productos) {

        productos.scrollIntoView({
            behavior: "smooth"
        });

    }

}


// ------------------------------------------
// AGREGAR PRODUCTO AL CARRITO
// ------------------------------------------

function agregarAlCarrito(nombre, precio) {

    const productoExistente = carrito.find(
        producto => producto.nombre === nombre
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

    alert("🛒 " + nombre + " agregado al carrito");

}


// ------------------------------------------
// ACTUALIZAR CANTIDAD DEL ICONO
// ------------------------------------------

function actualizarCarrito() {

    const contador = document.getElementById("cantidadCarrito");

    if (!contador) return;

    let cantidadTotal = 0;

    carrito.forEach(producto => {
        cantidadTotal += producto.cantidad;
    });

    contador.textContent = cantidadTotal;

}


// ------------------------------------------
// ABRIR CARRITO
// ------------------------------------------

function abrirCarrito() {

    let ventana = document.getElementById("ventanaCarrito");

    if (!ventana) {

        crearCarrito();

        ventana = document.getElementById("ventanaCarrito");

    }

    mostrarProductosCarrito();

    ventana.style.display = "flex";

}


// ------------------------------------------
// CERRAR CARRITO
// ------------------------------------------

function cerrarCarrito() {

    const ventana = document.getElementById("ventanaCarrito");

    if (ventana) {

        ventana.style.display = "none";

    }

}


// ------------------------------------------
// CREAR VENTANA DEL CARRITO
// ------------------------------------------

function crearCarrito() {

    const ventana = document.createElement("div");

    ventana.id = "ventanaCarrito";

    ventana.innerHTML = `

        <div class="carrito">

            <div class="carrito-cabeza">

                <h2>🛒 Mi carrito</h2>

                <button onclick="cerrarCarrito()">
                    ✕
                </button>

            </div>

            <div id="listaCarrito"></div>

            <div class="carrito-total">

                <strong>
                    Total:
                </strong>

                <span id="totalCarrito">
                    $0
                </span>

            </div>

            <div class="carrito-botones">

                <button onclick="cerrarCarrito()">
                    🛍️ Seguir comprando
                </button>

                <button onclick="vaciarCarrito()">
                    🗑️ Vaciar carrito
                </button>

                <button
                    class="boton-comprar"
                    onclick="comprarCarritoWhatsApp()">

                    📲 Comprar por WhatsApp

                </button>

            </div>

        </div>

    `;

    document.body.appendChild(ventana);

}


// ------------------------------------------
// MOSTRAR PRODUCTOS
// ------------------------------------------

function mostrarProductosCarrito() {

    const lista = document.getElementById("listaCarrito");

    const totalElemento = document.getElementById("totalCarrito");

    if (!lista) return;


    if (carrito.length === 0) {

        lista.innerHTML = `
            <div class="carrito-vacio">
                🛒 Tu carrito está vacío.
            </div>
        `;

        if (totalElemento) {
            totalElemento.textContent = "$0";
        }

        return;

    }


    lista.innerHTML = "";

    let total = 0;


    carrito.forEach((producto, indice) => {

        const subtotal =
            producto.precio * producto.cantidad;

        total += subtotal;


        const item = document.createElement("div");

        item.className = "item-carrito";


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

                <button onclick="disminuirCantidad(${indice})">
                    −
                </button>

                <span>
                    ${producto.cantidad}
                </span>

                <button onclick="aumentarCantidad(${indice})">
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

    });


    if (totalElemento) {

        totalElemento.textContent =
            "$" + total.toLocaleString("es-CO");

    }

}


// ------------------------------------------
// AUMENTAR CANTIDAD
// ------------------------------------------

function aumentarCantidad(indice) {

    carrito[indice].cantidad++;

    actualizarCarrito();

    mostrarProductosCarrito();

}


// ------------------------------------------
// DISMINUIR CANTIDAD
// ------------------------------------------

function disminuirCantidad(indice) {

    carrito[indice].cantidad--;

    if (carrito[indice].cantidad <= 0) {

        carrito.splice(indice, 1);

    }

    actualizarCarrito();

    mostrarProductosCarrito();

}


// ------------------------------------------
// ELIMINAR PRODUCTO
// ------------------------------------------

function eliminarProducto(indice) {

    carrito.splice(indice, 1);

    actualizarCarrito();

    mostrarProductosCarrito();

}


// ------------------------------------------
// VACIAR CARRITO
// ------------------------------------------

function vaciarCarrito() {

    if (carrito.length === 0) return;


    const confirmar = confirm(
        "¿Seguro que quieres vaciar el carrito?"
    );


    if (confirmar) {

        carrito = [];

        actualizarCarrito();

        mostrarProductosCarrito();

    }

}


// ------------------------------------------
// COMPRAR TODO POR WHATSAPP
// ------------------------------------------

function comprarCarritoWhatsApp() {

    if (carrito.length === 0) {

        alert("🛒 Tu carrito está vacío.");

        return;

    }


    const numero = "573202104423";


    let mensaje =
        "Hola 👋, quiero hacer el siguiente pedido:%0A%0A";


    let total = 0;


    carrito.forEach(producto => {

        const subtotal =
            producto.precio * producto.cantidad;


        total += subtotal;


        mensaje +=
            "🛍️ " +
            producto.nombre +
            " x" +
            producto.cantidad +
            " — $" +
            subtotal.toLocaleString("es-CO") +
            "%0A";

    });


    mensaje +=
        "%0A💰 TOTAL: $" +
        total.toLocaleString("es-CO");


    const enlace =
        "https://wa.me/" +
        numero +
        "?text=" +
        mensaje;


    window.location.href = enlace;

}
