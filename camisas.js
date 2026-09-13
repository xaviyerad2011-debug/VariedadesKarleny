const estado = {
  pantalla: "datos",
  nombre: "",
  telefono: "",
  fecha: "",
  talla: "",
  lado: "frente",
  color: "#ffffff",
  lados: {
    frente: { imagen: null, nombreArchivo: "", tamano: 45, altura: 50, x: 50 },
    espalda: { imagen: null, nombreArchivo: "", tamano: 45, altura: 50, x: 50 }
  }
};

const pantallas = {
  datos: document.getElementById("pantallaDatos"),
  talla: document.getElementById("pantallaTalla"),
  editor: document.getElementById("pantallaEditor"),
  resumen: document.getElementById("pantallaResumen")
};

const el = {
  formDatos: document.getElementById("formDatos"),
  nombre: document.getElementById("nombreCliente"),
  telefono: document.getElementById("telefonoCliente"),
  fecha: document.getElementById("fechaEntrega"),
  resumenDatos: document.getElementById("resumenDatos"),
  btnIrEditor: document.getElementById("btnIrEditor"),
  tallas: [...document.querySelectorAll(".talla")],

  btnFrente: document.getElementById("btnFrente"),
  btnEspalda: document.getElementById("btnEspalda"),
  ladoActualTexto: document.getElementById("ladoActualTexto"),
  tituloVista: document.getElementById("tituloVista"),
  colorBtns: [...document.querySelectorAll(".color-btn")],
  inputImagen: document.getElementById("inputImagen"),
  btnQuitarImagen: document.getElementById("btnQuitarImagen"),
  rangoTamano: document.getElementById("rangoTamano"),
  rangoAltura: document.getElementById("rangoAltura"),
  textoTamano: document.getElementById("textoTamano"),
  textoAltura: document.getElementById("textoAltura"),
  btnCentrarImagen: document.getElementById("btnCentrarImagen"),
  camisaCuerpo: document.getElementById("camisaCuerpo"),
  imagenDiseno: document.getElementById("imagenDiseno"),
  marcoSeleccion: document.getElementById("marcoSeleccion"),
  sinDiseno: document.getElementById("sinDiseno"),
  estadoDiseno: document.getElementById("estadoDiseno"),
  workspace: document.getElementById("camisaWorkspace"),

  miniFrente: document.getElementById("miniFrente"),
  miniEspalda: document.getElementById("miniEspalda"),
  datosFinales: document.getElementById("datosFinales"),
  confirmar: document.getElementById("btnConfirmar"),
  confirmacion: document.getElementById("confirmacionExitosa"),
  codigoDemo: document.getElementById("codigoDemo"),
  toast: document.getElementById("toast")
};

function mostrarPantalla(nombre) {
  Object.values(pantallas).forEach(p => p.classList.remove("activa"));
  pantallas[nombre].classList.add("activa");
  estado.pantalla = nombre;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function mostrarToast(mensaje) {
  el.toast.textContent = mensaje;
  el.toast.classList.add("visible");
  clearTimeout(mostrarToast.timer);
  mostrarToast.timer = setTimeout(() => el.toast.classList.remove("visible"), 2300);
}

function formatearFecha(fecha) {
  if (!fecha) return "No definida";
  const d = new Date(fecha + "T00:00:00");
  return d.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function ladoActual() {
  return estado.lados[estado.lado];
}

function actualizarResumenDatos() {
  el.resumenDatos.innerHTML = `
    <strong>${escapeHtml(estado.nombre)}</strong>
    · ${escapeHtml(estado.telefono)}
    · Entrega: ${formatearFecha(estado.fecha)}
    ${estado.talla ? `· Talla: <strong>${escapeHtml(estado.talla)}</strong>` : ""}
  `;
}

function escapeHtml(texto) {
  return String(texto).replace(/[&<>"']/g, caracter => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[caracter]));
}

el.formDatos.addEventListener("submit", e => {
  e.preventDefault();

  estado.nombre = el.nombre.value.trim();
  estado.telefono = el.telefono.value.trim();
  estado.fecha = el.fecha.value;

  if (!estado.nombre || !estado.telefono || !estado.fecha) {
    mostrarToast("Completa todos los datos primero.");
    return;
  }

  actualizarResumenDatos();
  mostrarPantalla("talla");
});

document.getElementById("btnVolverDatos").addEventListener("click", () => mostrarPantalla("datos"));
document.getElementById("btnSalirDatos").addEventListener("click", () => reiniciarDemo(true));
document.getElementById("btnInicioEditor").addEventListener("click", () => {
  if (confirm("¿Quieres volver al inicio? Se perderá la personalización actual.")) reiniciarDemo(true);
});
document.getElementById("btnInicioResumen").addEventListener("click", () => {
  if (confirm("¿Quieres volver al inicio? Se perderá la personalización actual.")) reiniciarDemo(true);
});
document.getElementById("btnVolverTalla").addEventListener("click", () => mostrarPantalla("talla"));
document.getElementById("btnVolverEditor").addEventListener("click", () => mostrarPantalla("editor"));

el.tallas.forEach(btn => {
  btn.addEventListener("click", () => {
    el.tallas.forEach(b => b.classList.remove("seleccionada"));
    btn.classList.add("seleccionada");
    estado.talla = btn.dataset.talla;
    el.btnIrEditor.disabled = false;
    actualizarResumenDatos();
  });
});

el.btnIrEditor.addEventListener("click", () => {
  if (!estado.talla) return;
  mostrarPantalla("editor");
  actualizarEditor();
});

function actualizarEditor() {
  const lado = ladoActual();

  el.ladoActualTexto.textContent = estado.lado === "frente" ? "Frente" : "Espalda";
  el.tituloVista.textContent = estado.lado === "frente" ? "Frente de la camisa" : "Espalda de la camisa";

  el.btnFrente.classList.toggle("activo", estado.lado === "frente");
  el.btnEspalda.classList.toggle("activo", estado.lado === "espalda");

  el.rangoTamano.value = lado.tamano;
  el.rangoAltura.value = lado.altura;
  el.textoTamano.textContent = `${lado.tamano}%`;
  el.textoAltura.textContent = `${lado.altura}%`;

  aplicarColor();
  mostrarImagenActual();
  marcarColorActual();
}

function aplicarColor() {
  el.camisaCuerpo.style.fill = estado.color;
}

function marcarColorActual() {
  el.colorBtns.forEach(btn => {
    btn.classList.toggle("activo", btn.dataset.color.toLowerCase() === estado.color.toLowerCase());
  });
}

el.btnFrente.addEventListener("click", () => {
  estado.lado = "frente";
  actualizarEditor();
});

el.btnEspalda.addEventListener("click", () => {
  estado.lado = "espalda";
  actualizarEditor();
});

el.colorBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    estado.color = btn.dataset.color;
    aplicarColor();
    marcarColorActual();
  });
});

el.inputImagen.addEventListener("change", e => {
  const archivo = e.target.files?.[0];
  if (!archivo) return;

  if (!archivo.type.startsWith("image/")) {
    mostrarToast("Selecciona una imagen válida.");
    return;
  }

  const lector = new FileReader();

  lector.onload = evento => {
    const lado = ladoActual();
    lado.imagen = evento.target.result;
    lado.nombreArchivo = archivo.name;
    lado.tamano = 45;
    lado.altura = 50;
    lado.x = 50;
    actualizarEditor();
    mostrarToast("Imagen agregada al " + (estado.lado === "frente" ? "frente." : "espalda."));
  };

  lector.readAsDataURL(archivo);
  e.target.value = "";
});

el.btnQuitarImagen.addEventListener("click", () => {
  const lado = ladoActual();

  if (!lado.imagen) {
    mostrarToast("Este lado no tiene ninguna imagen.");
    return;
  }

  lado.imagen = null;
  lado.nombreArchivo = "";
  actualizarEditor();
  mostrarToast("Imagen eliminada.");
});

el.btnCentrarImagen.addEventListener("click", () => {
  const lado = ladoActual();
  if (!lado.imagen) return;

  lado.tamano = 45;
  lado.altura = 50;
  lado.x = 50;
  actualizarEditor();
});

el.rangoTamano.addEventListener("input", () => {
  ladoActual().tamano = Number(el.rangoTamano.value);
  pintarImagen();
});

el.rangoAltura.addEventListener("input", () => {
  ladoActual().altura = Number(el.rangoAltura.value);
  pintarImagen();
});

function mostrarImagenActual() {
  const lado = ladoActual();

  if (!lado.imagen) {
    el.imagenDiseno.removeAttribute("src");
    el.imagenDiseno.classList.remove("visible");
    el.marcoSeleccion.classList.remove("visible");
    el.sinDiseno.style.display = "block";
    el.estadoDiseno.textContent = "Sin diseño";
    el.estadoDiseno.classList.remove("ok");
    return;
  }

  el.imagenDiseno.src = lado.imagen;
  el.imagenDiseno.classList.add("visible");
  el.marcoSeleccion.classList.add("visible");
  el.sinDiseno.style.display = "none";
  el.estadoDiseno.textContent = "Diseño cargado";
  el.estadoDiseno.classList.add("ok");
  pintarImagen();
}

function pintarImagen() {
  const lado = ladoActual();

  if (!lado.imagen) return;

  const tamano = lado.tamano;
  const top = lado.altura;
  const left = lado.x;

  el.imagenDiseno.style.width = `${tamano}%`;
  el.imagenDiseno.style.left = `${left}%`;
  el.imagenDiseno.style.top = `${top}%`;

  el.marcoSeleccion.style.width = `${tamano}%`;
  el.marcoSeleccion.style.left = `${left}%`;
  el.marcoSeleccion.style.top = `${top}%`;

  el.textoTamano.textContent = `${tamano}%`;
  el.textoAltura.textContent = `${top}%`;
}

let arrastre = null;

el.imagenDiseno.addEventListener("pointerdown", e => {
  if (!ladoActual().imagen) return;

  e.preventDefault();
  el.imagenDiseno.classList.add("arrastrando");
  el.imagenDiseno.setPointerCapture(e.pointerId);

  const rect = el.workspace.getBoundingClientRect();

  arrastre = {
    inicioX: e.clientX,
    inicioY: e.clientY,
    xOriginal: ladoActual().x,
    alturaOriginal: ladoActual().altura,
    anchoWorkspace: rect.width,
    altoWorkspace: rect.height
  };
});

el.imagenDiseno.addEventListener("pointermove", e => {
  if (!arrastre) return;

  const dx = e.clientX - arrastre.inicioX;
  const dy = e.clientY - arrastre.inicioY;

  const deltaX = (dx / arrastre.anchoWorkspace) * 100;
  const deltaY = (dy / arrastre.altoWorkspace) * 100;

  ladoActual().x = Math.max(-120, Math.min(220, arrastre.xOriginal + deltaX));
  ladoActual().altura = Math.max(-120, Math.min(220, arrastre.alturaOriginal + deltaY));

  pintarImagen();
});

function terminarArrastre() {
  if (!arrastre) return;
  el.imagenDiseno.classList.remove("arrastrando");
  arrastre = null;
}

el.imagenDiseno.addEventListener("pointerup", terminarArrastre);
el.imagenDiseno.addEventListener("pointercancel", terminarArrastre);

document.getElementById("btnTerminar").addEventListener("click", () => {
  prepararResumen();
  mostrarPantalla("resumen");
});

function crearMiniCamisa(ladoNombre) {
  const lado = estado.lados[ladoNombre];
  const color = estado.color;

  const contenedor = document.createElement("div");
  contenedor.innerHTML = `
    <svg viewBox="0 0 600 650" preserveAspectRatio="xMidYMid meet">
      <path d="M214 92 132 124 58 188l78 72 38-38v264h252V222l38 38 78-72-74-64-82-32c-15 31-40 48-86 48s-71-17-86-48Z"
            fill="${color}" stroke="#39343a" stroke-width="5" stroke-linejoin="round"/>
      <path d="M214 92c15 31 40 48 86 48s71-17 86-48"
            fill="none" stroke="#aaa0aa" stroke-width="5"/>
      <path d="M136 260 136 620M464 260 464 620"
            fill="none" stroke="rgba(90,80,90,.22)" stroke-width="2" stroke-dasharray="8 8"/>
    </svg>
    <div class="mini-design-zone"></div>
  `;

  const zona = contenedor.querySelector(".mini-design-zone");

  if (lado.imagen) {
    const img = document.createElement("img");
    img.src = lado.imagen;
    img.alt = "Diseño " + ladoNombre;

    // Use exactly the same percentage values as the editor.
    // 100% here means the image width equals the design zone width;
    // values above 100% intentionally allow very large prints.
    img.style.width = `${lado.tamano}%`;
    img.style.left = `${lado.x}%`;
    img.style.top = `${lado.altura}%`;

    zona.appendChild(img);
  }

  return contenedor;
}

function prepararResumen() {
  el.miniFrente.innerHTML = "";
  el.miniEspalda.innerHTML = "";

  const frente = crearMiniCamisa("frente");
  const espalda = crearMiniCamisa("espalda");

  while (frente.firstChild) el.miniFrente.appendChild(frente.firstChild);
  while (espalda.firstChild) el.miniEspalda.appendChild(espalda.firstChild);

  const hayFrente = !!estado.lados.frente.imagen;
  const hayEspalda = !!estado.lados.espalda.imagen;

  el.datosFinales.innerHTML = `
    <div class="dato-fila"><span>Cliente</span><strong>${escapeHtml(estado.nombre)}</strong></div>
    <div class="dato-fila"><span>Teléfono</span><strong>${escapeHtml(estado.telefono)}</strong></div>
    <div class="dato-fila"><span>Entrega</span><strong>${formatearFecha(estado.fecha)}</strong></div>
    <div class="dato-fila"><span>Talla</span><strong>${escapeHtml(estado.talla)}</strong></div>
    <div class="dato-fila"><span>Color</span><strong>${escapeHtml(nombreColor(estado.color))}</strong></div>
    <div class="dato-fila"><span>Frente</span><strong>${hayFrente ? "Con diseño" : "Sin diseño"}</strong></div>
    <div class="dato-fila"><span>Espalda</span><strong>${hayEspalda ? "Con diseño" : "Sin diseño"}</strong></div>
  `;

  el.confirmacion.classList.add("oculto");
  el.confirmar.style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function nombreColor(hex) {
  const colores = {
    "#ffffff": "Blanco",
    "#f3f4f6": "Gris claro",
    "#111111": "Negro",
    "#ef4444": "Rojo",
    "#f97316": "Naranja",
    "#facc15": "Amarillo",
    "#16a34a": "Verde",
    "#2563eb": "Azul",
    "#8b5cf6": "Morado"
  };
  return colores[hex.toLowerCase()] || hex;
}

el.confirmar.addEventListener("click", () => {
  const codigo = "CAM-" + Math.random().toString(36).substring(2, 8).toUpperCase();

  el.codigoDemo.textContent = "Código de prueba: " + codigo;
  el.confirmar.style.display = "none";
  el.confirmacion.classList.remove("oculto");

  mostrarToast("Camisa confirmada correctamente.");
});

document.getElementById("btnReiniciar").addEventListener("click", () => reiniciarDemo(false));

function reiniciarDemo(inicio) {
  estado.nombre = "";
  estado.telefono = "";
  estado.fecha = "";
  estado.talla = "";
  estado.lado = "frente";
  estado.color = "#ffffff";
  estado.lados = {
    frente: { imagen: null, nombreArchivo: "", tamano: 45, altura: 50, x: 50 },
    espalda: { imagen: null, nombreArchivo: "", tamano: 45, altura: 50, x: 50 }
  };

  el.formDatos.reset();
  el.tallas.forEach(b => b.classList.remove("seleccionada"));
  el.btnIrEditor.disabled = true;
  el.confirmacion.classList.add("oculto");
  el.confirmar.style.display = "block";
  actualizarEditor();

  mostrarPantalla(inicio ? "datos" : "datos");
}

actualizarEditor();
