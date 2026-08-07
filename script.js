// Ir a la sección de productos
function mostrarMensaje() {
    const productos = document.getElementById("productos");

    productos.scrollIntoView({
        behavior: "smooth"
    });
}

console.log("✅ Variedades Karleny funcionando correctamente");
function comprarWhatsApp(nombre, precio) {

    const numero = "573202104423";

    const mensaje =
        "Hola 👋, estoy interesado en comprar este producto:%0A%0A" +
        "🛍️ Producto: " + nombre + "%0A" +
        "💰 Precio: $" + precio;

    const enlace = "https://wa.me/" + numero + "?text=" + mensaje;

    window.open(enlace, "_blank");
}
