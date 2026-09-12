/* =========================================================
   VARIEDADES KARLENY — VERSION PÓLVORA 💥
   Tienda + Firebase + Cloudinary + PWA + Personalizador 2D
   ========================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, updateDoc, doc, serverTimestamp, onSnapshot } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

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

/* El área editable representa una guía de 30 × 40 cm. */
const EDITOR_WIDTH = 600;
const EDITOR_HEIGHT = 800;
const PRINT_CM_W = 30;
const PRINT_CM_H = 40;
const CM_PER_PX_X = PRINT_CM_W / EDITOR_WIDTH;
const CM_PER_PX_Y = PRINT_CM_H / EDITOR_HEIGHT;
const PRINT_PREVIEW = { x: 145, y: 150, width: 210, height: 300 };
const MAX_FILE_MB = 8;
const MAX_OBJECTS_PER_SIDE = 20;

const COLORES_CAMISA = [
  { nombre: "Blanco", valor: "#ffffff", borde: "#d8d8dc" },
  { nombre: "Negro", valor: "#181818", borde: "#080808" },
  { nombre: "Rojo", valor: "#d62839", borde: "#aa1a29" },
  { nombre: "Azul", valor: "#2463c4", borde: "#174587" },
  { nombre: "Celeste", valor: "#58b8e8", borde: "#3f91b9" },
  { nombre: "Verde", valor: "#2da66f", borde: "#20744f" },
  { nombre: "Amarillo", valor: "#ffd447", borde: "#c4a122" },
  { nombre: "Naranja", valor: "#f28c28", borde: "#c86e19" },
  { nombre: "Rosado", valor: "#ef6cae", borde: "#c24c88" },
  { nombre: "Morado", valor: "#7b4cc6", borde: "#563196" },
  { nombre: "Café", valor: "#8b5e3c", borde: "#68452d" },
  { nombre: "Gris", valor: "#9da3aa", borde: "#747a80" }
];

const PRODUCTOS_ESTATICOS = [
  { id: "static-labial", nombre: "Labial", precio: 15000, descripcion: "Labial de excelente calidad.", imagen: "imagenes/labial.jpg" },
  { id: "static-peluche", nombre: "Peluche", precio: 25000, descripcion: "Bonito peluche para regalar.", imagen: "imagenes/peluche.jpg" },
  { id: "static-24k", nombre: "Jabón 24k", precio: 7000, descripcion: "Jabón 24k.", imagen: "imagenes/karite.jpg" },
  { id: "static-lissia", nombre: "Lissia", precio: 10000, descripcion: "Consulta color.", imagen: "imagenes/lissia.jpg" },
  { id: "static-thyms", nombre: "Thyms", precio: 15000, descripcion: "Consulta color.", imagen: "imagenes/thyms.jpg" },
  { id: "static-posillos", nombre: "Posillos", precio: 5000, descripcion: "Posillos.", imagen: "imagenes/posillo.jpg" },
  { id: "static-globos", nombre: "Globos", precio: 10000, descripcion: "Consulta color y precio.", imagen: "imagenes/globos.jpg" },
  { id: "static-keraton", nombre: "Keraton", precio: 10000, descripcion: "Consulta color.", imagen: "imagenes/keraton.jpg" }
];

let carrito = cargarLocalStorage("karleny_carrito", []);
let productosFirebase = [];
let fabricCanvas = null;
let deferredInstallPrompt = null;
let editorColor = COLORES_CAMISA[0].valor;
let editorColorNombre = COLORES_CAMISA[0].nombre;
let cantidadCamisas = 1;
let tallaBase = "S";
let camisaActual = 0;
let ladoActual = "frente";
let camisas = [];
let historyPast = [];
let historyFuture = [];
let restoring = false;
let unsubscribePedidos = null;
let pedidosInicializados = false;
let pedidosAdmin = [];
let adminPedidosAbierto = false;
let ultimoToastPedido = 0;

const $ = (id) => document.getElementById(id);
const money = (n) => `$${Number(n || 0).toLocaleString("es-CO")}`;
const limitar = (n, min, max) => Math.max(min, Math.min(max, n));
const fechaBonita = (iso) => {
  if (!iso) return "—";
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" });
};
const escapar = (s) => String(s ?? "").replace(/[&<>'"]/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" }[c]));

function cargarLocalStorage(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function guardarLocalStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.warn("No se pudo guardar en localStorage", e); }
}

function mostrarToast(titulo, cuerpo = "", tipo = "info") {
  const cont = $("toastContainer");
  if (!cont) return;
  const el = document.createElement("div");
  el.className = `toast toast-${tipo}`;
  el.innerHTML = `<b>${escapar(titulo)}</b><span>${escapar(cuerpo)}</span>`;
  cont.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 220); }, 4200);
}

/* =========================
   PWA
   ========================= */
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  const b = $("botonInstalarApp");
  if (b) b.hidden = false;
});
window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  const b = $("botonInstalarApp");
  if (b) b.hidden = true;
  mostrarToast("📲 App instalada", "Variedades Karleny ya está en tu dispositivo.", "success");
});
window.instalarApp = async function () {
  if (!deferredInstallPrompt) {
    mostrarToast("Instalación", "Abre el menú del navegador y elige “Instalar app” o “Añadir a pantalla de inicio”.", "info");
    return;
  }
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  const b = $("botonInstalarApp");
  if (b) b.hidden = true;
};
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(console.warn));

/* =========================
   NAVEGACIÓN
   ========================= */
function mostrarSolo(id) {
  ["pantallaInicio", "pantallaProductos", "pantallaPersonalizador"].forEach((x) => { const el = $(x); if (el) el.hidden = x !== id; });
  window.scrollTo({ top: 0, behavior: "instant" });
}
window.mostrarProductos = async function () { mostrarSolo("pantallaProductos"); await cargarProductos(); };
window.volverInicio = function () { mostrarSolo("pantallaInicio"); };

/* =========================
   LOGIN + ADMIN
   ========================= */
window.abrirLogin = function () { $("ventanaLogin").hidden = false; $("mensajeLogin").textContent = ""; setTimeout(() => $("correoLogin")?.focus(), 50); };
window.cerrarLogin = function () { $("ventanaLogin").hidden = true; };
window.iniciarSesion = async function () {
  const correo = $("correoLogin").value.trim();
  const contrasena = $("contrasenaLogin").value;
  const msg = $("mensajeLogin");
  if (!correo || !contrasena) { msg.textContent = "⚠️ Completa correo y contraseña."; return; }
  msg.textContent = "⏳ Iniciando sesión...";
  try {
    const cred = await signInWithEmailAndPassword(auth, correo, contrasena);
    if (cred.user.uid !== UID_DUENO) {
      await signOut(auth);
      throw new Error("Cuenta sin permisos");
    }
    msg.textContent = "✅ Sesión iniciada.";
    cerrarLogin();
    mostrarSolo("pantallaProductos");
    await cargarProductos();
  } catch (e) {
    console.error(e);
    msg.textContent = "❌ Correo, contraseña o permisos incorrectos.";
  }
};
window.cerrarSesion = async function () { try { await signOut(auth); mostrarToast("Sesión cerrada", "Hasta luego 👋", "success"); } catch (e) { console.error(e); } };

onAuthStateChanged(auth, async (usuario) => {
  const panel = $("panelAdmin");
  const estado = $("estadoAdmin");
  const esAdmin = !!usuario && usuario.uid === UID_DUENO;
  if (panel) panel.hidden = !esAdmin;
  if (estado) estado.textContent = esAdmin ? "🟢 Sesión de dueño activa" : "";
  if (esAdmin) {
    iniciarEscuchaPedidos();
    actualizarContadorPedidos();
  } else detenerEscuchaPedidos();
});

/* =========================
   PRODUCTOS + CARRITO
   ========================= */
window.alternarFiltros = function () { $("panelFiltros").hidden = !$("panelFiltros").hidden; };
window.cerrarFiltros = function () { $("panelFiltros").hidden = true; };
window.limpiarBusqueda = function () { $("buscadorProductos").value = ""; aplicarFiltros(); };
window.limpiarFiltros = function () { $("buscadorProductos").value = ""; $("rangoPrecio").value = "100000"; $("valorPrecioFiltro").textContent = "$100.000+"; aplicarFiltros(); };

function renderProductos() {
  const cont = $("productos");
  if (!cont) return;
  const todos = [...PRODUCTOS_ESTATICOS, ...productosFirebase];
  cont.innerHTML = todos.map((p) => `
    <article class="product-card" data-nombre="${escapar(`${p.nombre} ${p.descripcion || ""}`).toLowerCase()}" data-precio="${Number(p.precio || 0)}">
      <div class="product-image"><img src="${escapar(p.imagen || "")}" alt="${escapar(p.nombre)}" loading="lazy" onerror="this.parentElement.classList.add('image-error');this.style.display='none'"><span class="image-fallback">🛍️</span></div>
      <div class="product-info"><h3>${escapar(p.nombre)}</h3><strong class="price">${money(p.precio)}</strong><p>${escapar(p.descripcion || "")}</p>
      <div class="product-actions"><button class="btn btn-primary btn-small" onclick="agregarAlCarrito(${JSON.stringify(p.nombre)},${Number(p.precio)},${JSON.stringify(p.imagen || "")})">🛒 Agregar</button>${p.id?.startsWith("fb-") || p.id?.startsWith("doc-") ? `<button class="btn btn-icon-danger" title="Eliminar producto" onclick="eliminarProducto('${escapar(p.id.replace('doc-',''))}')">🗑️</button>` : ""}</div></div>
    </article>`).join("");
  aplicarFiltros();
}

async function cargarProductos() {
  try {
    const snap = await getDocs(collection(db, "productos"));
    productosFirebase = snap.docs.map((d) => ({ id: `doc-${d.id}`, ...d.data(), firestoreId: d.id }));
  } catch (e) { console.warn("No se pudieron cargar productos de Firestore:", e); productosFirebase = []; }
  renderProductos();
}

function aplicarFiltros() {
  const q = ($( "buscadorProductos")?.value || "").trim().toLowerCase();
  const max = Number($("rangoPrecio")?.value || 100000);
  if ($("valorPrecioFiltro")) $("valorPrecioFiltro").textContent = max >= 100000 ? "$100.000+" : money(max);
  const cards = [...document.querySelectorAll(".product-card")];
  let visibles = 0;
  cards.forEach((card) => {
    const okQ = !q || card.dataset.nombre.includes(q);
    const okP = Number(card.dataset.precio || 0) <= max || max >= 100000;
    const visible = okQ && okP;
    card.hidden = !visible;
    if (visible) visibles++;
  });
  $("sinResultados").hidden = visibles !== 0;
  $("contadorResultados").textContent = `${visibles} ${visibles === 1 ? "producto encontrado" : "productos encontrados"}`;
}

$("buscadorProductos")?.addEventListener("input", aplicarFiltros);
$("rangoPrecio")?.addEventListener("input", aplicarFiltros);
$("fotoProducto")?.addEventListener("change", () => {
  const f = $("fotoProducto").files?.[0]; const img = $("vistaPreviaProducto");
  if (!f || !img) { if (img) img.removeAttribute("src"); return; }
  if (f.size > MAX_FILE_MB * 1024 * 1024) { mostrarToast("Imagen pesada", `Máximo ${MAX_FILE_MB} MB.`, "error"); $("fotoProducto").value = ""; return; }
  const reader = new FileReader(); reader.onload = () => { img.src = String(reader.result); }; reader.readAsDataURL(f);
});

async function subirCloudinary(fileOrBlob, publicPrefix = "karleny") {
  const form = new FormData();
  form.append("file", fileOrBlob);
  form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  form.append("folder", publicPrefix);
  const r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: form });
  const data = await r.json();
  if (!r.ok || !data.secure_url) throw new Error(data?.error?.message || "Falló la subida a Cloudinary");
  return data.secure_url;
}

window.agregarProducto = async function () {
  const usuario = auth.currentUser;
  if (!usuario || usuario.uid !== UID_DUENO) return mostrarToast("Sin permiso", "Solo el dueño puede publicar productos.", "error");
  const foto = $("fotoProducto").files?.[0];
  const nombre = $("nombreProducto").value.trim();
  const precio = Number($("precioProducto").value);
  const descripcion = $("descripcionProducto").value.trim();
  const msg = $("mensajeProducto");
  if (!foto || !nombre || !Number.isFinite(precio) || precio <= 0) { msg.textContent = "⚠️ Completa foto, nombre y precio."; return; }
  if (foto.size > MAX_FILE_MB * 1024 * 1024) { msg.textContent = `⚠️ La imagen supera ${MAX_FILE_MB} MB.`; return; }
  try {
    msg.textContent = "📸 Subiendo imagen...";
    const url = await subirCloudinary(foto, "karleny/productos");
    msg.textContent = "🗄️ Guardando producto...";
    await addDoc(collection(db, "productos"), { nombre, precio, descripcion, imagen: url, creado: serverTimestamp() });
    msg.textContent = "✅ Producto publicado.";
    ["fotoProducto","nombreProducto","precioProducto","descripcionProducto"].forEach((id) => { const el = $(id); if (el) el.value = ""; });
    $("vistaPreviaProducto")?.removeAttribute("src");
    await cargarProductos();
  } catch (e) { console.error(e); msg.textContent = "❌ No se pudo publicar. Revisa Cloudinary y Firestore."; }
};

window.eliminarProducto = async function (firestoreId) {
  if (!auth.currentUser || auth.currentUser.uid !== UID_DUENO) return;
  if (!firestoreId || !confirm("¿Eliminar este producto de la tienda?")) return;
  try { await deleteDoc(doc(db, "productos", firestoreId)); await cargarProductos(); mostrarToast("Producto eliminado", "Ya no aparecerá en la tienda.", "success"); }
  catch (e) { console.error(e); mostrarToast("No se pudo eliminar", "Revisa las reglas de Firestore.", "error"); }
};

window.agregarAlCarrito = function (nombre, precio, imagen = "") {
  const existente = carrito.find((p) => p.nombre === nombre);
  if (existente) existente.cantidad += 1; else carrito.push({ nombre, precio: Number(precio), imagen, cantidad: 1 });
  guardarLocalStorage("karleny_carrito", carrito); actualizarCarrito(); mostrarToast("🛒 Añadido", `${nombre} está en tu carrito.`, "success");
};
window.abrirCarrito = function () { $("ventanaCarrito").hidden = false; actualizarCarrito(); };
window.cerrarCarrito = function () { $("ventanaCarrito").hidden = true; };
window.vaciarCarrito = function () { if (!carrito.length || !confirm("¿Vaciar el carrito?")) return; carrito = []; guardarLocalStorage("karleny_carrito", carrito); actualizarCarrito(); };
window.cambiarCantidadCarrito = function (indice, delta) { if (!carrito[indice]) return; carrito[indice].cantidad = limitar(carrito[indice].cantidad + delta, 1, 99); guardarLocalStorage("karleny_carrito", carrito); actualizarCarrito(); };
window.eliminarDelCarrito = function (indice) { carrito.splice(indice, 1); guardarLocalStorage("karleny_carrito", carrito); actualizarCarrito(); };
function actualizarCarrito() {
  const totalItems = carrito.reduce((s, p) => s + p.cantidad, 0); const total = carrito.reduce((s, p) => s + p.precio * p.cantidad, 0);
  if ($("cantidadCarrito")) $("cantidadCarrito").textContent = String(totalItems);
  const lista = $("listaCarrito"); const vacio = $("carritoVacio"); const resumen = $("resumenCarrito");
  if (!lista) return;
  lista.innerHTML = carrito.map((p, i) => `<div class="cart-item"><div><b>${escapar(p.nombre)}</b><span>${money(p.precio)} c/u</span></div><div class="cart-controls"><button onclick="cambiarCantidadCarrito(${i},-1)">−</button><b>${p.cantidad}</b><button onclick="cambiarCantidadCarrito(${i},1)">+</button><button class="remove" onclick="eliminarDelCarrito(${i})">🗑️</button></div></div>`).join("");
  if (vacio) vacio.hidden = carrito.length > 0; if (resumen) resumen.hidden = carrito.length === 0; if ($("totalCarrito")) $("totalCarrito").textContent = money(total);
}
window.comprarCarritoWhatsApp = function () {
  if (!carrito.length) return;
  let text = "Hola 👋, quiero hacer este pedido en Variedades Karleny:\n\n";
  carrito.forEach((p) => { text += `🛍️ ${p.nombre} x${p.cantidad} — ${money(p.precio * p.cantidad)}\n`; });
  text += `\n💰 TOTAL: ${money(carrito.reduce((s,p)=>s+p.precio*p.cantidad,0))}`;
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, "_blank");
};

/* =========================
   PERSONALIZADOR
   ========================= */
window.abrirPersonalizador = function () {
  mostrarSolo("pantallaPersonalizador");
  resetPersonalizador();
  const min = new Date(); min.setDate(min.getDate() + 1);
  $("fechaEntrega").min = min.toISOString().slice(0,10);
  validarDatosPersonalizacion();
};
window.terminarPersonalizacion = function () {
  const activo = ["pasoCantidadPersonalizacion","pasoEditorPersonalizacion","pasoRevisionPersonalizacion"].some((id)=>!$(id).hidden);
  if (activo && !confirm("¿Salir? Los cambios de este pedido se perderán.")) return;
  mostrarSolo("pantallaInicio"); resetPersonalizador();
};
function resetPersonalizador() {
  camisas = []; cantidadCamisas = 1; camisaActual = 0; ladoActual = "frente"; historyPast = []; historyFuture = []; editorColor = "#fff"; editorColorNombre = "Blanco";
  ["pasoDatosPersonalizacion","pasoCantidadPersonalizacion","pasoEditorPersonalizacion","pasoRevisionPersonalizacion"].forEach((id,i)=>{ const el=$(id); if(el) el.hidden=i!==0; el?.classList.toggle("active",i===0); });
  const final=$("mensajeFinalPedido"); if(final){ final.hidden=true; final.innerHTML=""; }
  $("clienteNombre").value=""; $("clienteTelefono").value=""; $("fechaEntrega").value=""; $("cantidadCamisas").textContent="1"; $("textoCantidadCamisas").textContent="1 camisa";
  document.querySelectorAll("#tallasBase button").forEach((b)=>b.classList.toggle("selected",b.dataset.talla==="S")); tallaBase="S";
}
function mostrarPasoPersonalizador(nombre) {
  const map = { datos:"pasoDatosPersonalizacion", cantidad:"pasoCantidadPersonalizacion", editor:"pasoEditorPersonalizacion", revision:"pasoRevisionPersonalizacion" };
  const target = map[nombre]; if (!target) return;
  Object.values(map).forEach((id)=>{const el=$(id); if(el){el.hidden=id!==target; el.classList.toggle("active",id===target);}});
  const final=$("mensajeFinalPedido"); if(final && nombre!=="revision") final.hidden=true;
  window.scrollTo({top:0,behavior:"smooth"});
}
function validarDatosPersonalizacion() {
  const ok = $("clienteNombre").value.trim().length >= 2 && $("clienteTelefono").value.replace(/\D/g,"").length >= 7 && !!$("fechaEntrega").value && !!tallaBase;
  $("btnIniciarPersonalizacion").disabled = !ok;
}
["clienteNombre","clienteTelefono","fechaEntrega"].forEach((id)=>$(id)?.addEventListener("input",validarDatosPersonalizacion));
$("tallasBase")?.addEventListener("click",(e)=>{const b=e.target.closest("button[data-talla]"); if(!b)return; tallaBase=b.dataset.talla; document.querySelectorAll("#tallasBase button").forEach(x=>x.classList.toggle("selected",x===b)); validarDatosPersonalizacion();});

window.iniciarPersonalizacion = function () { validarDatosPersonalizacion(); if($("btnIniciarPersonalizacion").disabled)return; cantidadCamisas=1; inicializarCamisas(); actualizarCantidadUI(); mostrarPasoPersonalizador("cantidad"); };
function crearCamisa(talla = tallaBase, copia = null) {
  return {
    talla,
    color: copia?.color || "#ffffff",
    colorNombre: copia?.colorNombre || "Blanco",
    frenteObjects: copia ? clonarObjetos(copia.frenteObjects || []) : [],
    espaldaObjects: copia ? clonarObjetos(copia.espaldaObjects || []) : [],
    previewFrente: "", previewEspalda: ""
  };
}
function inicializarCamisas() { camisas = Array.from({length:cantidadCamisas},()=>crearCamisa()); }
window.cambiarCantidadCamisas = function (delta) {
  cantidadCamisas=limitar(cantidadCamisas+delta,1,20);
  while(camisas.length<cantidadCamisas) camisas.push(crearCamisa());
  if(camisas.length>cantidadCamisas) camisas.length=cantidadCamisas;
  actualizarCantidadUI();
};
function actualizarCantidadUI(){ $("cantidadCamisas").textContent=String(cantidadCamisas); $("textoCantidadCamisas").textContent=cantidadCamisas===1?"1 camisa":`${cantidadCamisas} camisas`; }
window.continuarAlEditor = async function () { if(!camisas.length) inicializarCamisas(); camisaActual=0; ladoActual="frente"; await prepararEditor(); mostrarPasoPersonalizador("editor"); await cargarCamisaEnEditor(0); };

function construirPaleta(){
  const p=$("paletaColoresCamisa"); if(!p)return; p.innerHTML="";
  COLORES_CAMISA.forEach((c)=>{ const b=document.createElement("button"); b.type="button"; b.className="color-chip"; b.dataset.color=c.valor; b.title=c.nombre; b.setAttribute("aria-label",`Camisa ${c.nombre}`); b.style.background=c.valor; if(c.valor==="#fff"||c.valor==="#ffffff") b.style.borderColor=c.borde; b.onclick=()=>seleccionarColor(c); p.appendChild(b); });
}
function seleccionarColor(c){ editorColor=c.valor; editorColorNombre=c.nombre; if(camisas[camisaActual]){camisas[camisaActual].color=c.valor;camisas[camisaActual].colorNombre=c.nombre;} actualizarCamisaSVG(); seleccionarChip(c.valor); }
function seleccionarChip(color){ document.querySelectorAll(".color-chip").forEach((b)=>b.classList.toggle("selected",b.dataset.color===color)); if($("nombreColorCamisa")) $("nombreColorCamisa").textContent=COLORES_CAMISA.find(c=>c.valor===color)?.nombre||"Blanco"; }
function actualizarCamisaSVG(){ const s=$("siluetaCamisa"); if(!s)return; s.setAttribute("fill",editorColor); s.setAttribute("stroke",COLORES_CAMISA.find(c=>c.valor===editorColor)?.borde||"#d8d8dc"); }

async function esperarFabric(){
  if(window.fabric) return window.fabric;
  await new Promise((resolve,reject)=>{const start=Date.now(); const timer=setInterval(()=>{if(window.fabric){clearInterval(timer);resolve();} else if(Date.now()-start>10000){clearInterval(timer);reject(new Error("Fabric no cargó"));}},50);});
  return window.fabric;
}
async function prepararEditor(){
  if(fabricCanvas)return;
  const fabric=await esperarFabric(); const canvasEl=$("canvasCamisa");
  fabricCanvas=new fabric.Canvas(canvasEl,{width:EDITOR_WIDTH,height:EDITOR_HEIGHT,preserveObjectStacking:true,selection:true,uniformScaling:true,backgroundColor:"transparent"});
  fabricCanvas.setDimensions({width:210,height:300},{cssOnly:true});
  fabricCanvas.on("selection:created",actualizarMedidasSeleccion); fabricCanvas.on("selection:updated",actualizarMedidasSeleccion); fabricCanvas.on("selection:cleared",actualizarMedidasSeleccion);
  fabricCanvas.on("object:moving",(e)=>{mantenerDentroDelArea(e.target);actualizarMedidasSeleccion();});
  fabricCanvas.on("object:scaling",(e)=>{mantenerDentroDelArea(e.target);actualizarMedidasSeleccion();});
  fabricCanvas.on("object:modified",()=>{actualizarMedidasSeleccion();registrarHistoria();});
  fabricCanvas.on("object:added",()=>{if(!restoring)registrarHistoria();}); fabricCanvas.on("object:removed",()=>{if(!restoring)registrarHistoria();});
  construirPaleta();
}
function prepararObjeto(obj,nombre="Imagen"){
  obj.set({nombreArchivo:nombre,tipo:"imagenDiseño",lockRotation:true,hasRotatingPoint:false,cornerColor:"#d90070",cornerStrokeColor:"#fff",transparentCorners:false,padding:5,borderColor:"#d90070",cornerSize:13,originX:obj.originX||"left",originY:obj.originY||"top"});
  obj.setControlsVisibility({mtr:false}); obj.setCoords();
}
function limpiarCanvas(){if(!fabricCanvas)return;restoring=true;fabricCanvas.clear();fabricCanvas.backgroundColor="transparent";restoring=false;}
async function cargarCamisaEnEditor(indice){
  await prepararEditor(); camisaActual=indice; const c=camisas[indice]||crearCamisa();
  editorColor=c.color||"#ffffff"; editorColorNombre=c.colorNombre||"Blanco"; actualizarCamisaSVG(); seleccionarChip(editorColor); limpiarCanvas(); historyPast=[]; historyFuture=[];
  const objs= c[ladoActual === "frente" ? "frenteObjects":"espaldaObjects"] || [];
  if(objs.length){ restoring=true; try{await fabricCanvas.loadFromJSON({version:window.fabric.version,objects:objs}); fabricCanvas.getObjects().forEach((o)=>prepararObjeto(o,o.nombreArchivo||"Imagen"));} finally{restoring=false;} }
  actualizarEditorMeta(); actualizarTallaUI(); registrarHistoriaInicial(); fabricCanvas.renderAll(); actualizarMedidasSeleccion();
}
function serializarActual(){ return fabricCanvas ? fabricCanvas.toJSON(["nombreArchivo","tipo"]).objects||[]:[]; }
function clonarObjetos(objs){ return JSON.parse(JSON.stringify(objs||[])); }
async function guardarCamisaActual(){
  if(!fabricCanvas||!camisas[camisaActual])return;
  const key=ladoActual === "frente" ? "frenteObjects":"espaldaObjects";
  const previewKey=ladoActual === "frente" ? "previewFrente":"previewEspalda";
  camisas[camisaActual][key]=serializarActual();
  camisas[camisaActual].color=editorColor; camisas[camisaActual].colorNombre=editorColorNombre; camisas[camisaActual].talla=$("tallaCamisaActual").value||tallaBase;
  camisas[camisaActual][previewKey]=await generarPreviewCamisa(camisas[camisaActual],ladoActual,camisaActual+1);
}
function actualizarEditorMeta(){
  const objs=camisas[camisaActual]?.[ladoActual==="frente"?"frenteObjects":"espaldaObjects"]||[];
  $("indiceCamisaActual").textContent=`CAMISA ${camisaActual+1} DE ${cantidadCamisas}`; $("tituloCamisaActual").textContent=objs.length?"Diseño en progreso":"Diseño de camisa";
  $("btnLadoFrente")?.classList.toggle("selected",ladoActual==="frente"); $("btnLadoEspalda")?.classList.toggle("selected",ladoActual==="espalda");
  const copy=$("btnCopiarDisenoAnterior"); if(copy) copy.style.display=camisaActual>0&&!objs.length?"inline-flex":"none";
}
function actualizarTallaUI(){ $("tallaCamisaActual").value=camisas[camisaActual]?.talla||tallaBase; }
window.cambiarTallaCamisaActual=function(v){if(camisas[camisaActual])camisas[camisaActual].talla=v;};

window.cambiarLadoCamisa=async function(lado){ const nuevo=lado==="espalda"?"espalda":"frente"; if(nuevo===ladoActual)return; await guardarCamisaActual(); ladoActual=nuevo; await cargarCamisaEnEditor(camisaActual); };

function actualizarMedidasSeleccion(){
  const o=fabricCanvas?.getActiveObject(); const ids=["medidaAncho","medidaAlto","medidaX","medidaY"];
  if(!o){$("estadoSeleccion").textContent="Selecciona una imagen";ids.forEach(id=>$(id).textContent="0,0 cm");return;}
  const w=o.getScaledWidth()*CM_PER_PX_X; const h=o.getScaledHeight()*CM_PER_PX_Y; const x=(o.left||0)*CM_PER_PX_X; const y=(o.top||0)*CM_PER_PX_Y;
  $("estadoSeleccion").textContent=o.nombreArchivo||"Imagen seleccionada"; $("medidaAncho").textContent=`${w.toFixed(1).replace(".",",")} cm`; $("medidaAlto").textContent=`${h.toFixed(1).replace(".",",")} cm`; $("medidaX").textContent=`${x.toFixed(1).replace(".",",")} cm`; $("medidaY").textContent=`${y.toFixed(1).replace(".",",")} cm`;
}
function mantenerDentroDelArea(o){ if(!o)return; const w=o.getScaledWidth(),h=o.getScaledHeight(); o.left=limitar(o.left||0,0,Math.max(0,EDITOR_WIDTH-w)); o.top=limitar(o.top||0,0,Math.max(0,EDITOR_HEIGHT-h)); o.setCoords(); }

$("inputImagenCamisa")?.addEventListener("change",async(e)=>{
  const files=Array.from(e.target.files||[]); if(!files.length)return; if(!fabricCanvas){e.target.value="";return;}
  const actuales=fabricCanvas.getObjects().length; if(actuales+files.length>MAX_OBJECTS_PER_SIDE){mostrarToast("Demasiadas imágenes",`Máximo ${MAX_OBJECTS_PER_SIDE} por lado.`,"error");e.target.value="";return;}
  for(const f of files){
    if(!f.type.startsWith("image/"))continue; if(f.size>MAX_FILE_MB*1024*1024){mostrarToast("Imagen omitida",`${f.name}: máximo ${MAX_FILE_MB} MB.`,"error");continue;}
    try{const data=await leerDataURL(f);await agregarImagenCanvas(data,f.name);}catch(err){console.error(err);mostrarToast("No se pudo agregar",f.name,"error");}
  }
  e.target.value="";
});
function leerDataURL(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result));r.onerror=rej;r.readAsDataURL(file);});}
function agregarImagenCanvas(dataUrl,nombre){return new Promise((resolve,reject)=>{
  window.fabric.Image.fromURL(dataUrl,(o)=>{if(!o)return reject(new Error("Imagen inválida")); prepararObjeto(o,nombre); const w=o.width||1,h=o.height||1; const scale=Math.min(240/w,240/h,1); o.scale(scale); o.set({left:(EDITOR_WIDTH-o.getScaledWidth())/2,top:(EDITOR_HEIGHT-o.getScaledHeight())/2,originX:"left",originY:"top"}); fabricCanvas.add(o);fabricCanvas.setActiveObject(o);fabricCanvas.renderAll();actualizarMedidasSeleccion();resolve();},{crossOrigin:"anonymous"});
});}
window.escalarSeleccion=function(factor){const o=fabricCanvas?.getActiveObject();if(!o||o.type==="activeSelection")return mostrarToast("Selecciona una imagen","Toca una imagen primero.","error");o.set({scaleX:limitar((o.scaleX||1)*factor,.03,8),scaleY:limitar((o.scaleY||1)*factor,.03,8)});mantenerDentroDelArea(o);fabricCanvas.renderAll();actualizarMedidasSeleccion();registrarHistoria();};
window.centrarSeleccion=function(){const o=fabricCanvas?.getActiveObject();if(!o)return mostrarToast("Selecciona una imagen","Toca una imagen primero.","error");o.set({left:(EDITOR_WIDTH-o.getScaledWidth())/2,top:(EDITOR_HEIGHT-o.getScaledHeight())/2});mantenerDentroDelArea(o);fabricCanvas.renderAll();actualizarMedidasSeleccion();registrarHistoria();};
window.eliminarSeleccion=function(){const o=fabricCanvas?.getActiveObject();if(!o)return mostrarToast("Nada seleccionado","Selecciona una imagen para eliminarla.","error");fabricCanvas.remove(o);fabricCanvas.discardActiveObject();fabricCanvas.renderAll();actualizarMedidasSeleccion();registrarHistoria();};

/* Deshacer / rehacer sin rotación. */
function snapshot(){return JSON.stringify(serializarActual());}
function registrarHistoriaInicial(){historyPast=[snapshot()];historyFuture=[];}
function registrarHistoria(){if(!fabricCanvas||restoring)return;const s=snapshot();if(historyPast.at(-1)!==s){historyPast.push(s);if(historyPast.length>40)historyPast.shift();historyFuture=[];}}
async function restaurarSnapshot(s){restoring=true;try{await fabricCanvas.loadFromJSON({version:window.fabric.version,objects:JSON.parse(s)});fabricCanvas.getObjects().forEach(o=>prepararObjeto(o,o.nombreArchivo||"Imagen"));fabricCanvas.renderAll();}finally{restoring=false;}actualizarMedidasSeleccion();}
window.deshacerEditor=async function(){if(historyPast.length<=1)return;historyFuture.push(historyPast.pop());await restaurarSnapshot(historyPast.at(-1));};
window.rehacerEditor=async function(){if(!historyFuture.length)return;const s=historyFuture.pop();historyPast.push(s);await restaurarSnapshot(s);};

window.copiarDisenoAnterior=function(){
  if(camisaActual<=0||!camisas[camisaActual-1])return;
  const prev=camisas[camisaActual-1]; const current=camisas[camisaActual]; current.color=prev.color;current.colorNombre=prev.colorNombre; current.frenteObjects=clonarObjetos(prev.frenteObjects);current.espaldaObjects=clonarObjetos(prev.espaldaObjects); current.previewFrente=prev.previewFrente;current.previewEspalda=prev.previewEspalda; cargarCamisaEnEditor(camisaActual);
  mostrarToast("Diseño copiado", "Ahora puedes cambiar tamaño, posición o imágenes.", "success");
};

window.guardarYContinuarCamisa=async function(){
  try{
    await guardarCamisaActual();
    if(camisaActual< cantidadCamisas-1){camisaActual++;ladoActual="frente";await cargarCamisaEnEditor(camisaActual);}
    else await prepararRevision();
  }catch(e){console.error(e);mostrarToast("No se pudo guardar",e.message||"Inténtalo otra vez.","error");}
};
async function prepararRevision(){
  for(let i=0;i<camisas.length;i++){
    if(!camisas[i].previewFrente)camisas[i].previewFrente=await generarPreviewCamisa(camisas[i],"frente",i+1);
    if(!camisas[i].previewEspalda)camisas[i].previewEspalda=await generarPreviewCamisa(camisas[i],"espalda",i+1);
  }
  $("revisionNombre").textContent=$("clienteNombre").value.trim(); $("revisionTelefono").textContent=$("clienteTelefono").value.trim(); $("revisionEntrega").textContent=fechaBonita($("fechaEntrega").value); $("revisionCantidad").textContent=`${cantidadCamisas} camisa${cantidadCamisas===1?"":"s"}`;
  renderRevision(); mostrarPasoPersonalizador("revision");
}

function construirSVGCamisa(color,lado="frente"){
  const c=COLORES_CAMISA.find(x=>x.valor===color)||COLORES_CAMISA[0];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="600" viewBox="0 0 500 600"><defs><filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-opacity=".15"/></filter></defs><path filter="url(#shadow)" d="M175 50 L112 75 L35 155 L83 225 L128 188 L128 525 Q128 548 151 548 L349 548 Q372 548 372 525 L372 188 L417 225 L465 155 L388 75 L325 50 Q303 102 250 102 Q197 102 175 50 Z" fill="${color}" stroke="${c.borde}" stroke-width="4" stroke-linejoin="round"/><path d="M175 50 Q197 102 250 102 Q303 102 325 50" fill="none" stroke="${c.borde}" stroke-width="5"/></svg>`;
}

async function generarPreviewCamisa(camisa,lado="frente",numero=1){
  const salida=document.createElement("canvas"); salida.width=600;salida.height=700; const ctx=salida.getContext("2d"); ctx.clearRect(0,0,600,700); ctx.fillStyle="#f4f2f5";ctx.fillRect(0,0,600,700);
  const shirt=new Image();shirt.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(construirSVGCamisa(camisa.color||"#fff",lado))}`;await esperarImagen(shirt);ctx.drawImage(shirt,50,20,500,600);
  const objs=camisa[lado==="frente"?"frenteObjects":"espaldaObjects"]||[];
  for(const o of objs){
    if(!o.src)continue; try{
      const img=new Image();img.src=o.src;await esperarImagen(img);
      const sx=Number(o.left||0)/EDITOR_WIDTH*PRINT_PREVIEW.width+PRINT_PREVIEW.x;
      const sy=Number(o.top||0)/EDITOR_HEIGHT*PRINT_PREVIEW.height+PRINT_PREVIEW.y;
      const sw=Number(o.width||img.naturalWidth||1)*Number(o.scaleX||1)/EDITOR_WIDTH*PRINT_PREVIEW.width;
      const sh=Number(o.height||img.naturalHeight||1)*Number(o.scaleY||1)/EDITOR_HEIGHT*PRINT_PREVIEW.height;
      ctx.drawImage(img,sx,sy,sw,sh);
    }catch(e){console.warn("Preview image",e);}
  }
  ctx.fillStyle="#3c3740";ctx.font="800 17px Arial";ctx.textAlign="center";ctx.fillText(`Camisa ${numero} · ${lado==="frente"?"Frente":"Espalda"}`,300,665);
  return salida.toDataURL("image/jpeg",0.84);
}
function esperarImagen(img){return new Promise((res,rej)=>{if(img.complete&&img.naturalWidth){res();return;}img.onload=()=>res();img.onerror=()=>rej(new Error("No cargó imagen"));});}

function objetoDetalle(obj,idx){
  const w=(Number(obj.width||0)*Number(obj.scaleX||1))*CM_PER_PX_X;const h=(Number(obj.height||0)*Number(obj.scaleY||1))*CM_PER_PX_Y;const x=Number(obj.left||0)*CM_PER_PX_X;const y=Number(obj.top||0)*CM_PER_PX_Y;
  return {imagen:idx+1,nombreArchivo:obj.nombreArchivo||`Imagen ${idx+1}`,anchoCm:Number(w.toFixed(1)),altoCm:Number(h.toFixed(1)),posXcm:Number(x.toFixed(1)),posYcm:Number(y.toFixed(1))};
}
function renderResumenObjetos(objs,lado){
  if(!objs.length)return `<div class="no-images">○ Sin imágenes en ${lado.toLowerCase()}.</div>`;
  return `<div class="detail-block"><b>📐 ${lado} · ${objs.length} imagen${objs.length===1?"":"es"}</b>${objs.map((o,i)=>{const d=objetoDetalle(o,i);return `<div class="detail-row"><span>Imagen ${d.imagen}</span><strong>${d.altoCm} cm alto × ${d.anchoCm} cm ancho</strong><small>${escapar(d.nombreArchivo)} · X ${d.posXcm} cm · Y ${d.posYcm} cm</small></div>`;}).join("")}</div>`;
}
function renderRevision(){
  const lista=$("listaRevisionCamisas"); if(!lista)return; lista.innerHTML=camisas.map((c,i)=>`<article class="review-card"><div class="review-visuals"><div><span>FRENTE</span><img src="${c.previewFrente}" alt="Frente camisa ${i+1}"></div><div><span>ESPALDA</span><img src="${c.previewEspalda}" alt="Espalda camisa ${i+1}"></div></div><div class="review-data"><div class="review-title"><b>CAMISA ${i+1}</b><strong>${escapar(c.talla)}</strong></div><p><i style="background:${escapar(c.color)}"></i> Color: <b>${escapar(c.colorNombre)}</b></p><div class="review-count">🖼️ ${(c.frenteObjects||[]).length+(c.espaldaObjects||[]).length} imágenes en total</div>${renderResumenObjetos(c.frenteObjects||[],"Frente")}${renderResumenObjetos(c.espaldaObjects||[],"Espalda")}</div></article>`).join("");
}
window.volverAEditarUltimaCamisa=async function(){mostrarPasoPersonalizador("editor");await cargarCamisaEnEditor(Math.min(camisaActual,cantidadCamisas-1));};

/* =========================
   PEDIDO — SE SUBEN PREVIEWS E IMÁGENES, NO DATA URLs A FIRESTORE
   ========================= */
async function dataUrlABlob(dataUrl){const r=await fetch(dataUrl);return r.blob();}
async function prepararCamisaParaPedido(camisa,index){
  const previewFrenteUrl=await subirCloudinary(await dataUrlABlob(camisa.previewFrente),`karleny/pedidos/${index+1}`);
  const previewEspaldaUrl=await subirCloudinary(await dataUrlABlob(camisa.previewEspalda),`karleny/pedidos/${index+1}`);
  const lados=["frenteObjects","espaldaObjects"]; const salida={numero:index+1,talla:camisa.talla,color:camisa.color,colorNombre:camisa.colorNombre,previewFrenteUrl,previewEspaldaUrl,imagenesFrente:[],imagenesEspalda:[]};
  for(const lado of lados){
    const destino=lado==="frenteObjects"?salida.imagenesFrente:salida.imagenesEspalda;
    for(let i=0;i<(camisa[lado]||[]).length;i++){
      const o=camisa[lado][i]; const detalle=objetoDetalle(o,i); let url="";
      if(o.src?.startsWith("data:")){ try{url=await subirCloudinary(await dataUrlABlob(o.src),`karleny/pedidos/${index+1}/imagenes`);}catch(e){console.warn("Imagen individual no subida",e); } }
      destino.push({...detalle,imagenUrl:url});
    }
  }
  return salida;
}
function numeroPedido(){return `VK-${new Date().getFullYear()}-${String(Date.now()).slice(-7)}`;}
window.confirmarPedidoPersonalizado=async function(){
  const btn=$("btnConfirmarPedido"); btn.disabled=true; btn.textContent="⏳ Enviando pedido...";
  try{
    const nombre=$("clienteNombre").value.trim(),telefono=$("clienteTelefono").value.trim(),fecha=$("fechaEntrega").value;
    if(!nombre||!telefono||!fecha||!camisas.length)throw new Error("Faltan datos del pedido");
    const num=numeroPedido(); const camisasPedido=[];
    for(let i=0;i<camisas.length;i++)camisasPedido.push(await prepararCamisaParaPedido(camisas[i],i));
    const pedido={numeroPedido:num,tipo:"personalizado",estado:"nuevo",cliente:{nombre,telefono},fechaEntrega:fecha,cantidad:camisas.length,camisas:camisasPedido,creado:serverTimestamp()};
    await addDoc(collection(db,"pedidos"),pedido);
    const mensaje=construirMensajeWhatsAppPedido(pedido); const final=$("mensajeFinalPedido");
    final.hidden=false; final.innerHTML=`<div class="final-ok">✓</div><h2>¡Pedido recibido!</h2><p>Tu número de pedido es <b>${escapar(num)}</b>.</p><small>El administrador ya puede ver el diseño y las medidas.</small><div class="final-actions"><button class="btn btn-whatsapp" onclick="abrirWhatsAppPedido(${JSON.stringify(mensaje)})">💬 Confirmar por WhatsApp</button><button class="btn btn-outline" onclick="salirPersonalizadorDespuesPedido()">Volver al inicio</button></div>`;
    $("btnConfirmarPedido").hidden=true; mostrarToast("✅ Pedido enviado",num,"success");
  }catch(e){console.error(e);mostrarToast("No se pudo enviar",e.message||"Revisa la conexión y prueba otra vez.","error");btn.disabled=false;btn.textContent="✅ Confirmar y enviar pedido";}
};
function construirMensajeWhatsAppPedido(pedido){let t=`Hola 👋, acabo de realizar el pedido ${pedido.numeroPedido}.\n\nCliente: ${pedido.cliente.nombre}\nTeléfono: ${pedido.cliente.telefono}\nEntrega: ${fechaBonita(pedido.fechaEntrega)}\nCantidad: ${pedido.cantidad} camisa(s).\n\n`;pedido.camisas.forEach(c=>{t+=`👕 Camisa ${c.numero}: talla ${c.talla}, color ${c.colorNombre}.\n`;(c.imagenesFrente||[]).forEach(o=>t+=`Frente · imagen ${o.imagen}: ${o.altoCm} cm alto × ${o.anchoCm} cm ancho.\n`);(c.imagenesEspalda||[]).forEach(o=>t+=`Espalda · imagen ${o.imagen}: ${o.altoCm} cm alto × ${o.anchoCm} cm ancho.\n`);t+="\n";});return t;}
window.abrirWhatsAppPedido=function(texto){window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto||"")}`,"_blank");};
window.salirPersonalizadorDespuesPedido=function(){resetPersonalizador();mostrarSolo("pantallaInicio");};

/* =========================
   ADMIN — PEDIDOS + NOTIFICACIÓN EN PRIMER PLANO
   ========================= */
function iniciarEscuchaPedidos(){
  if(unsubscribePedidos||!auth.currentUser||auth.currentUser.uid!==UID_DUENO)return;
  unsubscribePedidos=onSnapshot(collection(db,"pedidos"),(snap)=>{
    const nuevos=[]; snap.docChanges().forEach((c)=>{if(c.type==="added"&&pedidosInicializados)nuevos.push({id:c.doc.id,...c.doc.data()});}); pedidosInicializados=true;
    if(nuevos.length){const ahora=Date.now(); if(ahora-ultimoToastPedido>1000){nuevos.forEach((p)=>{mostrarToast("🔔 Nuevo pedido",`${p.numeroPedido||p.id} · ${p.cliente?.nombre||"Cliente"}`,"pedido");enviarNotificacionNavegador("Nuevo pedido en Variedades Karleny",`${p.numeroPedido||"Pedido"} · ${p.cliente?.nombre||"Cliente"}`);});ultimoToastPedido=ahora;}}
    pedidosAdmin=snap.docs.map((d)=>({id:d.id,...d.data()})).sort((a,b)=>(b.creado?.seconds||0)-(a.creado?.seconds||0)); actualizarContadorPedidos(); if(adminPedidosAbierto)renderPedidosAdmin();
  },(e)=>{console.error(e);mostrarToast("Pedidos","No se pudo actualizar la bandeja.","error");});
}
function detenerEscuchaPedidos(){if(unsubscribePedidos)unsubscribePedidos();unsubscribePedidos=null;pedidosInicializados=false;pedidosAdmin=[];actualizarContadorPedidos();}
async function enviarNotificacionNavegador(titulo,cuerpo){if(!(window.Notification))return;try{let p=Notification.permission;if(p==="default")p=await Notification.requestPermission();if(p==="granted")new Notification(titulo,{body:cuerpo,icon:"icons/icon-192.png",tag:"karleny-pedido"});}catch(e){console.warn(e);}}
window.activarNotificacionesAdmin=async function(){if(!auth.currentUser||auth.currentUser.uid!==UID_DUENO)return mostrarToast("Sin permiso","Inicia sesión como dueño.","error");if(!(window.Notification))return mostrarToast("No disponible","Este navegador no soporta notificaciones.","error");const p=await Notification.requestPermission();mostrarToast(p==="granted"?"🔔 Notificaciones activadas":"Notificaciones no activadas",p==="granted"?"Te avisaremos mientras el panel esté abierto.":"El navegador no dio permiso.",p==="granted"?"success":"error");};
window.mostrarPedidosAdmin=function(){if(!auth.currentUser||auth.currentUser.uid!==UID_DUENO)return;adminPedidosAbierto=true;$("panelPedidosAdmin").hidden=false;renderPedidosAdmin();};
window.ocultarPedidosAdmin=function(){adminPedidosAbierto=false;$("panelPedidosAdmin").hidden=true;};
function actualizarContadorPedidos(){const n=pedidosAdmin.filter(p=>(p.estado||"nuevo")==="nuevo").length;if($("contadorPedidosAdmin"))$("contadorPedidosAdmin").textContent=String(n);}
function renderPedidosAdmin(){
  const lista=$("listaPedidosAdmin");if(!lista)return;
  if(!pedidosAdmin.length){lista.innerHTML=`<div class="empty-state compact"><div>📦</div><h3>Aún no hay pedidos</h3><p>Cuando alguien confirme una camisa aparecerá aquí.</p></div>`;return;}
  lista.innerHTML=pedidosAdmin.map((p)=>{
    const estado=p.estado||"nuevo";
    return `<article class="order-card"><div class="order-head"><div><span class="order-number">${escapar(p.numeroPedido||p.id)}</span><small>📦 ${escapar(fechaBonita(p.fechaEntrega))}</small></div><select onchange="actualizarEstadoPedido('${escapar(p.id)}',this.value)"><option value="nuevo" ${estado==="nuevo"?"selected":""}>Nuevo</option><option value="en_proceso" ${estado==="en_proceso"?"selected":""}>En proceso</option><option value="listo" ${estado==="listo"?"selected":""}>Listo</option><option value="entregado" ${estado==="entregado"?"selected":""}>Entregado</option></select></div><div class="order-client"><div><span>👤 Cliente</span><b>${escapar(p.cliente?.nombre||"—")}</b></div><div><span>📱 Teléfono</span><b>${escapar(p.cliente?.telefono||"—")}</b></div><div><span>👕 Cantidad</span><b>${Number(p.cantidad||0)} camisa(s)</b></div></div><div class="order-shirts">${(p.camisas||[]).map(renderAdminCamisa).join("")}</div><button class="btn btn-danger btn-small order-delete" onclick="eliminarPedidoAdmin('${escapar(p.id)}')">🗑️ Eliminar pedido</button></article>`;
  }).join("");
}
function renderAdminCamisa(c){
  const total=(c.imagenesFrente||[]).length+(c.imagenesEspalda||[]).length;
  return `<section class="admin-shirt"><div class="admin-shirt-head"><div><span>CAMISA ${Number(c.numero||1)}</span><h4>${escapar(c.colorNombre||"Color")} · Talla ${escapar(c.talla||"—")}</h4></div><strong>🖼️ ${total} imagen${total===1?"":"es"}</strong></div><div class="admin-previews"><figure><img src="${escapar(c.previewFrenteUrl||"")}" alt="Vista exacta frente"><figcaption>Frente</figcaption></figure><figure><img src="${escapar(c.previewEspaldaUrl||"")}" alt="Vista exacta espalda"><figcaption>Espalda</figcaption></figure></div><div class="admin-color-line"><i style="background:${escapar(c.color||"#fff")}"></i> Color: <b>${escapar(c.colorNombre||"—")}</b></div>${renderAdminDetails(c.imagenesFrente||[],"Frente")}${renderAdminDetails(c.imagenesEspalda||[],"Espalda")}</section>`;
}
function renderAdminDetails(arr,lado){if(!arr.length)return `<div class="admin-detail muted">○ Sin imágenes en ${lado.toLowerCase()}.</div>`;return `<div class="admin-detail"><b>📐 ${lado}</b>${arr.map((o)=>`<div><span>Imagen ${Number(o.imagen)} · ${escapar(o.nombreArchivo||"")}</span><strong>${Number(o.altoCm).toFixed(1)} cm alto × ${Number(o.anchoCm).toFixed(1)} cm ancho</strong><small>Posición X ${Number(o.posXcm).toFixed(1)} cm · Y ${Number(o.posYcm).toFixed(1)} cm${o.imagenUrl?` · <a href="${escapar(o.imagenUrl)}" target="_blank" rel="noopener">ver original</a>`:""}</small></div>`).join("")}</div>`;}
window.actualizarEstadoPedido=async function(id,estado){if(!auth.currentUser||auth.currentUser.uid!==UID_DUENO)return;try{await updateDoc(doc(db,"pedidos",id),{estado,actualizado:serverTimestamp()});mostrarToast("Estado actualizado",estado,"success");}catch(e){console.error(e);mostrarToast("No se pudo actualizar","Revisa Firestore.","error");}};
window.eliminarPedidoAdmin=async function(id){if(!auth.currentUser||auth.currentUser.uid!==UID_DUENO)return;if(!confirm("¿Eliminar este pedido del panel?"))return;try{await deleteDoc(doc(db,"pedidos",id));mostrarToast("Pedido eliminado","Se quitó de la bandeja.","success");}catch(e){console.error(e);mostrarToast("No se pudo eliminar","Revisa las reglas de Firestore.","error");}};

/* Cerrar modales tocando fuera */
["ventanaLogin","ventanaCarrito"].forEach((id)=>$(id)?.addEventListener("click",(e)=>{if(e.target.id===id)$(id).hidden=true;}));

document.addEventListener("keydown",(e)=>{if(e.key==="Escape"){if(!$("ventanaLogin").hidden)cerrarLogin();if(!$("ventanaCarrito").hidden)cerrarCarrito();}});

/* Inicio */
actualizarCarrito(); cargarProductos();
