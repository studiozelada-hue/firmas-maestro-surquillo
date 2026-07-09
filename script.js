const KEY = "firmas_maestro_surquillo_v1";

function data(){
  return JSON.parse(localStorage.getItem(KEY) || "[]");
}
function save(items){
  localStorage.setItem(KEY, JSON.stringify(items));
}
function dniValido(dni){
  return /^[0-9]{8}$/.test(dni);
}

const form = document.getElementById("firmaForm");
if(form){
  form.addEventListener("submit", (e)=>{
    e.preventDefault();
    const dni = document.getElementById("dni").value.trim();
    const nombre = document.getElementById("nombre").value.trim();
    const mensaje = document.getElementById("mensaje").value.trim();

    if(!dniValido(dni)){
      document.getElementById("estado").textContent = "El DNI debe tener 8 números.";
      return;
    }

    const items = data();
    if(items.some(x => x.dni === dni)){
      document.getElementById("estado").textContent = "Este DNI ya dejó una firma.";
      return;
    }

    items.push({
      id: Date.now(),
      dni, nombre, mensaje,
      estado: "pendiente",
      fecha: new Date().toLocaleString()
    });
    save(items);
    form.reset();
    document.getElementById("estado").textContent = "Firma enviada. Queda pendiente de aprobación.";
    renderFirmas();
  });
  renderFirmas();
}

function renderFirmas(){
  const cont = document.getElementById("listaFirmas");
  if(!cont) return;
  const aprobadas = data().filter(x => x.estado === "aprobada");
  cont.innerHTML = aprobadas.length ? "" : "<p>Aún no hay firmas aprobadas.</p>";
  aprobadas.forEach(x=>{
    cont.innerHTML += `<div class="card"><b>${escapeHtml(x.nombre)}</b><p>${escapeHtml(x.mensaje)}</p><small>${x.fecha}</small></div>`;
  });
}

function entrarAdmin(){
  const clave = document.getElementById("clave").value;
  if(clave !== "maestro22"){ alert("Clave incorrecta"); return; }
  document.getElementById("login").hidden = true;
  document.getElementById("panelAdmin").hidden = false;
  renderAdmin();
}

function renderAdmin(){
  const items = data();
  const pendientes = document.getElementById("pendientes");
  const aprobadas = document.getElementById("aprobadas");
  pendientes.innerHTML = "";
  aprobadas.innerHTML = "";

  items.filter(x=>x.estado==="pendiente").forEach(x=>{
    pendientes.innerHTML += cardAdmin(x, true);
  });
  items.filter(x=>x.estado==="aprobada").forEach(x=>{
    aprobadas.innerHTML += cardAdmin(x, false);
  });

  if(!pendientes.innerHTML) pendientes.innerHTML = "<p>No hay firmas pendientes.</p>";
  if(!aprobadas.innerHTML) aprobadas.innerHTML = "<p>No hay firmas aprobadas.</p>";
}

function cardAdmin(x, pendiente){
  return `<div class="card">
    <b>${escapeHtml(x.nombre)}</b> <small>DNI: ${escapeHtml(x.dni)} | ${x.fecha}</small>
    <p>${escapeHtml(x.mensaje)}</p>
    <div class="acciones">
      ${pendiente ? `<button onclick="aprobar(${x.id})">Aprobar</button>` : ""}
      <button onclick="eliminar(${x.id})">Eliminar</button>
    </div>
  </div>`;
}

function aprobar(id){
  const items = data().map(x => x.id === id ? {...x, estado:"aprobada"} : x);
  save(items); renderAdmin();
}
function eliminar(id){
  save(data().filter(x => x.id !== id)); renderAdmin();
}

function escapeHtml(text){
  return text.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}
