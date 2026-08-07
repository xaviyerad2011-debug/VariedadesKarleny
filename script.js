// ==========================================
// VARIEDADES KARLENY 🛍️
// ==========================================

// Ir a la sección de productos
function mostrarMensaje() {
    const productos = document.getElementById("productos");

    if (productos) {
        productos.scrollIntoView({
            behavior: "smooth"
        });
    }
}


// Comprar un producto por WhatsApp
function comprarWhatsApp(nombre, precio) {

    const numero = "573202104423";

    const mensaje = encodeURIComponent(
        "Hola 👋, estoy interesado en comprar este producto:\n\n" +
        "🛍️ Producto: " + nombre + "\n" +
        "💰 Precio: $" + precio
    );

    const enlace = "https://wa.me/" + numero + "?text=" + mensaje;

    window.location.href = enlace;
}


// Comprobar que JavaScript cargó correctamente
console.log("✅ Variedades Karleny funcionando correctamente");
