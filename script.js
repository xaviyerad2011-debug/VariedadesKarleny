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
const MAX_FILE_MB = 8;

const PRODUCTOS_ESTATICOS = [
  { id:"static-labial", nombre:"Labial", precio:15000, descripcion:"Labial de excelente calidad.", imagen:"imagenes/labial.jpg" },
  { id:"static-peluche", nombre:"Peluche", precio:25000, descripcion:"Bonito peluche para regalar.", imagen:"imagenes/peluche.jpg" },
  { id:"static-24k", nombre:"Jabón 24k", precio:7000, descripcion:"Jabón 24k.", imagen:"imagenes/karite.jpg" },
  { id:"static-lissia", nombre:"Lissia", precio:10000, descripcion:"Consulta color.", imagen:"imagenes/lissia.jpg" },
  { id:"static-thyms", nombre:"Thyms", precio:15000, descripcion:"Consulta color.", imagen:"imagenes/thyms.jpg" },
  { id:"static-posillos", nombre:"Posillos", precio:5000, descripcion:"Posillos.", imagen:"imagenes/posillo.jpg" },
  { id:"static-globos", nombre:"Globos", precio:10000, descripcion:"Consulta color y precio.", imagen:"imagenes/globos.jpg" },
  { id:"static-keraton", nombre:"Keraton", precio:10000, descripcion:"Consulta color.", imagen:"imagenes/keraton.jpg" }
];

let carrito = cargarLS("karleny_carrito", []);
let productosFirebase = [];
let unsubscribePedidos = null;
let pedidosInicializados = false;
let pedidosAdmin = [];
let adminPedidosAbierto = false;
let deferredInstallPrompt = null;

const $ = id => document.getElementById(id);
const money = n => `$${Number(n || 0).toLocaleString("es-CO")}`;
const escapar = s => String(s ?? "").replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const normalizar = s => String(s ?? "").toLocaleLowerCase("es-CO").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

function cargarLS(key, fallback){ try{return JSON.parse(localStorage.getItem(key)) ?? fallback}catch{return fallback} }
function guardarLS(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch(e){console.warn(e)}}

function toast(titulo, cuerpo="", tipo="info"){
  const box=$("toastContainer"); if(!box)return;
  const el=document.createElement("div"); el.className=`toast toast-${tipo}`; el.innerHTML=`<b>${escapar(titulo)}</b><span>${escapar(cuerpo)}</span>`; box.appendChild(el);
  requestAnimationFrame(()=>el.classList.add("show")); setTimeout(()=>{el.classList.remove("show");setTimeout(()=>el.remove(),220)},4200);
}

/* PWA */
window.addEventListener("beforeinstallprompt", e=>{e.preventDefault();deferredInstallPrompt=e;$("botonInstalarApp").hidden=false});
window.addEventListener("appinstalled",()=>{deferredInstallPrompt=null;$("botonInstalarApp").hidden=true;toast("📲 App instalada","Ya puedes abrir Karleny desde tu dispositivo.","success")});
window.instalarApp=async function(){if(!deferredInstallPrompt){toast("Instalación","Usa el menú del navegador y elige Instalar app.");return}deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;$("botonInstalarApp").hidden=true};
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(console.warn));

/* Navegación */
function mostrarSolo(id){["pantallaInicio","pantallaProductos"].forEach(x=>{const e=$(x);if(e)e.hidden=x!==id});window.scrollTo({top:0,behavior:"instant"})}
window.iniciarPedido=async function(){mostrarSolo("pantallaProductos");await cargarProductos()};
window.mostrarProductos=window.iniciarPedido;
window.volverInicio=function(){mostrarSolo("pantallaInicio")};
window.abrirConsultas=function(){window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Hola 👋, tengo una consulta sobre Variedades Karleny.")}`,"_blank")};

/* Login */
window.abrirLogin=function(){$("ventanaLogin").hidden=false;$("mensajeLogin").textContent="";setTimeout(()=>$ ("correoLogin")?.focus(),50)};
window.cerrarLogin=function(){$("ventanaLogin").hidden=true};
window.iniciarSesion=async function(){
  const correo=$("correoLogin").value.trim(), pass=$("contrasenaLogin").value, msg=$("mensajeLogin");
  if(!correo||!pass){msg.textContent="⚠️ Completa correo y contraseña.";return}
  msg.textContent="⏳ Iniciando sesión...";
  try{
    const cred=await signInWithEmailAndPassword(auth,correo,pass);
    if(cred.user.uid!==UID_DUENO){await signOut(auth);throw new Error("sin permiso")}
    cerrarLogin();mostrarSolo("pantallaProductos");await cargarProductos();toast("👑 Sesión iniciada","Panel del dueño activado.","success");
  }catch(e){console.error(e);msg.textContent="❌ Correo, contraseña o permisos incorrectos."}
};
window.cerrarSesion=async function(){try{await signOut(auth);toast("Sesión cerrada","Hasta luego 👋","success")}catch(e){console.error(e)}};

onAuthStateChanged(auth, async user=>{
  const esAdmin=!!user&&user.uid===UID_DUENO;
  $("panelAdmin").hidden=!esAdmin;
  $("estadoAdmin").textContent=esAdmin?"🟢 Sesión de dueño activa":"";
  if(esAdmin){iniciarEscuchaPedidos();await cargarProductos()}else detenerEscuchaPedidos();
});

/* Productos */
window.alternarFiltros=function(){$("panelFiltros").hidden=!$("panelFiltros").hidden};
window.cerrarFiltros=function(){$("panelFiltros").hidden=true};
window.limpiarBusqueda=function(){$("buscadorProductos").value="";aplicarFiltros()};
window.limpiarFiltros=function(){$("buscadorProductos").value="";$ ("rangoPrecio").value="100000";$ ("valorPrecioFiltro").textContent="$100.000+";aplicarFiltros()};

function renderProductos(){
  const cont=$("productos");if(!cont)return;
  const todos=[...PRODUCTOS_ESTATICOS,...productosFirebase];
  cont.innerHTML=todos.map(p=>{
    const id=String(p.id||"");
    const botonEliminar=id.startsWith("doc-")?`<button class="btn-icon-danger" title="Eliminar producto" onclick="eliminarProducto(${JSON.stringify(id.slice(4))})">🗑️</button>`:"";
    return `<article class="product-card" data-nombre="${escapar(`${p.nombre} ${p.descripcion||""}`)}" data-precio="${Number(p.precio||0)}">
      <div class="product-image"><img src="${escapar(p.imagen||"")}" alt="${escapar(p.nombre)}" loading="lazy" decoding="async" onerror="this.parentElement.classList.add('image-error')"><span class="image-fallback">🛍️</span></div>
      <div class="product-info"><h3>${escapar(p.nombre)}</h3><strong class="price">${money(p.precio)}</strong><p>${escapar(p.descripcion||"")}</p>
      <div class="product-actions"><button class="btn btn-primary btn-small" onclick="agregarAlCarrito(${JSON.stringify(String(p.nombre))},${Number(p.precio||0)},${JSON.stringify(String(p.imagen||""))})">🛒 Agregar</button>${botonEliminar}</div></div>
    </article>`;
  }).join("");
  aplicarFiltros();
}

async function cargarProductos(){
  try{
    const snap=await getDocs(collection(db,"productos"));
    productosFirebase=snap.docs.map(d=>({id:`doc-${d.id}`,...d.data()}));
  }catch(e){console.error("Productos:",e);productosFirebase=[];toast("Productos","No se pudieron cargar los productos de Firebase.","error")}
  renderProductos();
}

function aplicarFiltros(){
  const q=normalizar($("buscadorProductos")?.value||"");
  const max=Number($("rangoPrecio")?.value||100000);
  $("valorPrecioFiltro").textContent=max>=100000?"$100.000+":money(max);
  const cards=[...document.querySelectorAll("#productos .product-card")];let visibles=0;
  cards.forEach(card=>{const texto=normalizar(card.dataset.nombre),precio=Number(card.dataset.precio||0);const ok=(!q||texto.includes(q))&&(max>=100000||precio<=max);card.hidden=!ok;if(ok)visibles++});
  $("sinResultados").hidden=visibles!==0;
  $("contadorResultados").textContent=visibles===1?"🔎 1 producto encontrado":`🔎 ${visibles} productos encontrados`;
}
$("buscadorProductos")?.addEventListener("input",aplicarFiltros);
$("rangoPrecio")?.addEventListener("input",aplicarFiltros);
window.aplicarFiltros=aplicarFiltros;

$("fotoProducto")?.addEventListener("change",()=>{const f=$("fotoProducto").files?.[0],img=$("vistaPreviaProducto");if(!f||!img)return;if(f.size>MAX_FILE_MB*1024*1024){toast("Imagen pesada",`Máximo ${MAX_FILE_MB} MB.`,"error");$("fotoProducto").value="";return}const r=new FileReader();r.onload=()=>img.src=String(r.result);r.readAsDataURL(f)});

async function subirCloudinary(file,folder="karleny/productos"){
  const form=new FormData();form.append("file",file);form.append("upload_preset",CLOUDINARY_UPLOAD_PRESET);form.append("folder",folder);
  const r=await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,{method:"POST",body:form});const data=await r.json();
  if(!r.ok||!data.secure_url)throw new Error(data?.error?.message||"Cloudinary falló");return data.secure_url;
}

window.agregarProducto=async function(){
  if(!auth.currentUser||auth.currentUser.uid!==UID_DUENO)return toast("Sin permiso","Solo el dueño puede publicar productos.","error");
  const foto=$("fotoProducto").files?.[0],nombre=$("nombreProducto").value.trim(),precio=Number($("precioProducto").value),descripcion=$("descripcionProducto").value.trim(),msg=$("mensajeProducto");
  if(!foto||!nombre||!Number.isFinite(precio)||precio<=0){msg.textContent="⚠️ Completa foto, nombre y precio.";return}
  if(foto.size>MAX_FILE_MB*1024*1024){msg.textContent=`⚠️ Máximo ${MAX_FILE_MB} MB.`;return}
  try{msg.textContent="📸 Subiendo imagen...";const imagen=await subirCloudinary(foto);msg.textContent="🗄️ Guardando producto...";await addDoc(collection(db,"productos"),{nombre,precio,descripcion,imagen,creado:serverTimestamp()});msg.textContent="✅ Producto publicado.";["fotoProducto","nombreProducto","precioProducto","descripcionProducto"].forEach(id=>$(id).value="");$("vistaPreviaProducto").removeAttribute("src");await cargarProductos();toast("Producto publicado","Ya aparece en la tienda.","success")}catch(e){console.error(e);msg.textContent="❌ No se pudo publicar. Revisa Cloudinary y Firestore."}
};
window.eliminarProducto=async function(id){if(!auth.currentUser||auth.currentUser.uid!==UID_DUENO)return;if(!id||!confirm("¿Eliminar este producto?"))return;try{await deleteDoc(doc(db,"productos",id));await cargarProductos();toast("Producto eliminado","Ya no aparece en la tienda.","success")}catch(e){console.error(e);toast("No se pudo eliminar","Revisa las reglas de Firestore.","error")}};

/* Carrito */
window.agregarAlCarrito=function(nombre,precio,imagen=""){
  precio=Number(precio);if(!nombre||!Number.isFinite(precio)||precio<0)return toast("No se pudo agregar","Producto inválido.","error");
  const existente=carrito.find(p=>p.nombre===nombre);
  if(existente){existente.cantidad=Math.min(99,Number(existente.cantidad||0)+1);if(!existente.imagen&&imagen)existente.imagen=imagen}else carrito.push({nombre:String(nombre),precio,imagen:String(imagen||""),cantidad:1});
  guardarLS("karleny_carrito",carrito);actualizarCarrito();toast("🛒 Agregado al carrito",`${nombre} está en tu pedido.","success");
};
window.abrirCarrito=function(){$("ventanaCarrito").hidden=false;actualizarCarrito()};
window.cerrarCarrito=function(){$("ventanaCarrito").hidden=true};
window.vaciarCarrito=function(){if(!carrito.length)return;if(confirm("¿Vaciar el carrito?")){carrito=[];guardarLS("karleny_carrito",carrito);actualizarCarrito()}};
window.cambiarCantidadCarrito=function(i,delta){if(!carrito[i])return;carrito[i].cantidad=Math.max(1,Math.min(99,Number(carrito[i].cantidad)+delta));guardarLS("karleny_carrito",carrito);actualizarCarrito()};
window.eliminarDelCarrito=function(i){if(!carrito[i])return;carrito.splice(i,1);guardarLS("karleny_carrito",carrito);actualizarCarrito()};
function actualizarCarrito(){
  const items=carrito.reduce((s,p)=>s+Number(p.cantidad||0),0),total=carrito.reduce((s,p)=>s+Number(p.precio||0)*Number(p.cantidad||0),0);$("cantidadCarrito").textContent=String(items);$("totalCarrito").textContent=money(total);
  $("listaCarrito").innerHTML=carrito.map((p,i)=>`<div class="cart-item"><div class="cart-item-info">${p.imagen?`<img class="cart-thumb" src="${escapar(p.imagen)}" alt="" loading="lazy">`:``}<div><b>${escapar(p.nombre)}</b><span>${money(p.precio)} c/u · ${money(p.precio*p.cantidad)}</span></div></div><div class="cart-controls"><button onclick="cambiarCantidadCarrito(${i},-1)">−</button><b>${p.cantidad}</b><button onclick="cambiarCantidadCarrito(${i},1)">+</button><button class="remove" onclick="eliminarDelCarrito(${i})">🗑️</button></div></div>`).join("");
  $("carritoVacio").hidden=carrito.length>0;$("resumenCarrito").hidden=carrito.length===0;
}

/* Enviar pedido -> Firestore. El WhatsApp queda reservado para Consultas. */
window.enviarPedido=async function(){
  if(!carrito.length)return toast("🛒 Carrito vacío","Agrega al menos un producto.","error");
  const nombre=prompt("👤 Escribe tu nombre:")?.trim();if(!nombre||nombre.length<2)return;
  const telefono=prompt("📱 Escribe tu número de teléfono:")?.trim();if(!telefono||telefono.replace(/\D/g,"").length<7)return;
  const items=carrito.map(p=>({nombre:p.nombre,precio:Number(p.precio),cantidad:Number(p.cantidad)}));
  const cantidad=items.reduce((s,p)=>s+p.cantidad,0),total=items.reduce((s,p)=>s+p.precio*p.cantidad,0);
  const numero=`VK-${Date.now().toString().slice(-8)}`;
  try{
    await addDoc(collection(db,"pedidos"),{numeroPedido:numero,tipo:"tienda",estado:"nuevo",cliente:{nombre,telefono},items,cantidad,total,creado:serverTimestamp()});
    carrito=[];guardarLS("karleny_carrito",carrito);actualizarCarrito();cerrarCarrito();toast("📦 ¡Pedido enviado!",`${numero} fue enviado al administrador.","success");
  }catch(e){console.error(e);toast("No se pudo enviar","Revisa tu conexión o las reglas de Firestore.","error")}
};

/* Pedidos del dueño */
function iniciarEscuchaPedidos(){if(unsubscribePedidos||!auth.currentUser||auth.currentUser.uid!==UID_DUENO)return;unsubscribePedidos=onSnapshot(collection(db,"pedidos"),snap=>{const nuevos=[];snap.docChanges().forEach(c=>{if(c.type==="added"&&pedidosInicializados)nuevos.push({id:c.doc.id,...c.doc.data()})});pedidosInicializados=true;for(const p of nuevos){toast("🔔 Nuevo pedido",`${p.numeroPedido||"Pedido"} · ${p.cliente?.nombre||"Cliente"}`,"pedido");enviarNotificacionNavegador("Nuevo pedido en Variedades Karleny",`${p.numeroPedido||"Pedido"} · ${p.cliente?.nombre||"Cliente"}`)}pedidosAdmin=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.creado?.seconds||0)-(a.creado?.seconds||0));actualizarContadorPedidos();if(adminPedidosAbierto)renderPedidosAdmin()},e=>{console.error(e);toast("Pedidos","No se pudo actualizar la bandeja.","error")})}
function detenerEscuchaPedidos(){if(unsubscribePedidos)unsubscribePedidos();unsubscribePedidos=null;pedidosInicializados=false;pedidosAdmin=[];actualizarContadorPedidos()}
async function enviarNotificacionNavegador(titulo,cuerpo){if(!("Notification" in window))return;try{let permiso=Notification.permission;if(permiso==="default")permiso=await Notification.requestPermission();if(permiso==="granted")new Notification(titulo,{body:cuerpo,icon:"icons/icon-192.png",tag:"karleny-pedido"})}catch(e){console.warn(e)}}
window.activarNotificacionesAdmin=async function(){if(!auth.currentUser||auth.currentUser.uid!==UID_DUENO)return;try{if(!("Notification" in window))throw new Error("no soportado");const p=await Notification.requestPermission();toast(p==="granted"?"🔔 Notificaciones activadas":"Notificaciones no permitidas",p==="granted"?"Te avisaremos de nuevos pedidos mientras el panel esté abierto.":"Puedes permitirlas desde el navegador.",p==="granted"?"success":"error")}catch(e){toast("Notificaciones","Este navegador no las permite.","error")}};
window.mostrarPedidosAdmin=function(){adminPedidosAbierto=true;$("panelPedidosAdmin").hidden=false;renderPedidosAdmin()};
window.ocultarPedidosAdmin=function(){adminPedidosAbierto=false;$("panelPedidosAdmin").hidden=true};
function actualizarContadorPedidos(){const n=pedidosAdmin.filter(p=>(p.estado||"nuevo")==="nuevo").length;if($("contadorPedidosAdmin"))$("contadorPedidosAdmin").textContent=String(n)}
function renderPedidosAdmin(){
  const list=$("listaPedidosAdmin");if(!list)return;if(!pedidosAdmin.length){list.innerHTML=`<div class="empty-state compact"><div>📦</div><h3>Aún no hay pedidos</h3><p>Los pedidos enviados desde el carrito aparecerán aquí.</p></div>`;return}
  list.innerHTML=pedidosAdmin.map(p=>{const total=Number(p.total||0);return `<article class="order-card"><div class="order-head"><div><span class="order-number">${escapar(p.numeroPedido||p.id)}</span><small>${escapar(p.estado||"nuevo")}</small></div><select onchange="actualizarEstadoPedido(${JSON.stringify(p.id)},this.value)"><option value="nuevo" ${p.estado==="nuevo"?"selected":""}>Nuevo</option><option value="preparando" ${p.estado==="preparando"?"selected":""}>Preparando</option><option value="listo" ${p.estado==="listo"?"selected":""}>Listo</option><option value="entregado" ${p.estado==="entregado"?"selected":""}>Entregado</option></select></div><div class="order-client"><div><span>👤 Cliente</span><b>${escapar(p.cliente?.nombre||"—")}</b></div><div><span>📱 Teléfono</span><b>${escapar(p.cliente?.telefono||"—")}</b></div><div><span>📦 Cantidad</span><b>${Number(p.cantidad||0)}</b></div></div><div class="order-items">${(p.items||[]).map(i=>`<div class="order-product"><div><b>${escapar(i.nombre)}</b><span> · ${Number(i.cantidad||0)} unidad(es)</span></div><b>${money(Number(i.precio||0)*Number(i.cantidad||0))}</b></div>`).join("")}</div><div class="order-total"><span>Total</span><b>${money(total)}</b></div><button class="btn btn-small btn-danger" style="margin-top:12px" onclick="eliminarPedidoAdmin(${JSON.stringify(p.id)})">🗑️ Eliminar pedido</button></article>`}).join("")
}
window.actualizarEstadoPedido=async function(id,estado){if(!auth.currentUser||auth.currentUser.uid!==UID_DUENO)return;try{await updateDoc(doc(db,"pedidos",id),{estado,actualizado:serverTimestamp()});toast("Estado actualizado",estado,"success")}catch(e){console.error(e);toast("No se pudo actualizar","Revisa Firestore.","error")}};
window.eliminarPedidoAdmin=async function(id){if(!auth.currentUser||auth.currentUser.uid!==UID_DUENO)return;if(!confirm("¿Eliminar este pedido?"))return;try{await deleteDoc(doc(db,"pedidos",id));toast("Pedido eliminado","Se quitó de la bandeja.","success")}catch(e){console.error(e);toast("No se pudo eliminar","Revisa Firestore.","error")}};

actualizarCarrito();
