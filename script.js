const SUPABASE_URL = "https://hpmrihkklttdwpafimgs.supabase.co";
const SUPABASE_KEY = "sb_publishable_t8kJ3wlEJNCviX1woDkNPg_mX7QcQ8A";
const TABLE = "firmas-maestro-surquillo";

async function supabaseRequest(method, body = null, query = "") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}${query}`, {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: body ? JSON.stringify(body) : null
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

function dniValido(dni) {
  return /^[0-9]{8}$/.test(dni);
}

const form = document.getElementById("firmaForm");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const dni = document.getElementById("dni").value.trim();
    const nombre = document.getElementById("nombre").value.trim();
    const mensaje = document.getElementById("mensaje").value.trim();
    const estado = document.getElementById("estado");

    try {
      if (!dniValido(dni)) {
        estado.textContent = "Ingresa un DNI válido de 8 dígitos.";
        return;
      }

      await supabaseRequest("POST", {
        dni,
        nombre,
        mensaje,
        estado: "pendiente"
      });

      estado.textContent = "Firma enviada. Espera aprobación.";
      form.reset();
    } catch (error) {
      estado.textContent = "Error al enviar la firma.";
      console.error(error);
    }
  });
}

async function cargarFirmas() {
  const contenedor = document.getElementById("listaFirmas");
  if (!contenedor) return;

  try {
    const firmas = await supabaseRequest(
      "GET",
      null,
      "?select=*&estado=eq.aprobado&order=created_at.desc"
    );

    contenedor.innerHTML = firmas.length
      ? firmas.map(f => `
          <div class="firma">
            <strong>${f.nombre}</strong>
            <p>${f.mensaje}</p>
          </div>
        `).join("")
      : "<p>Aún no hay firmas aprobadas.</p>";
  } catch (error) {
    contenedor.innerHTML = "<p>Error al cargar firmas aprobadas.</p>";
    console.error(error);
  }
}

async function cargarAdmin() {
  const pendientes = document.getElementById("pendientes");
  const aprobadas = document.getElementById("aprobadas");
  if (!pendientes || !aprobadas) return;

  const firmas = await supabaseRequest("GET", null, "?select=*&order=created_at.desc");

  pendientes.innerHTML = firmas.filter(f => f.estado === "pendiente").map(f => `
    <div class="firma">
      <strong>${f.nombre}</strong>
      <p>${f.mensaje}</p>
      <button onclick="aprobarFirma(${f.id})">Aprobar</button>
    </div>
  `).join("") || "<p>No hay firmas pendientes.</p>";

  aprobadas.innerHTML = firmas.filter(f => f.estado === "aprobado").map(f => `
    <div class="firma">
      <strong>${f.nombre}</strong>
      <p>${f.mensaje}</p>
      
  <button onclick="editarFirma(${f.id}, '${f.mensaje}')">Editar</button>
  <button onclick="eliminarFirma(${f.id})">Eliminar</button>
</div>
  `).join("") || "<p>No hay firmas aprobadas.</p>";
}

async function aprobarFirma(id) {
  await supabaseRequest("PATCH", { estado: "aprobado" }, `?id=eq.${id}`);
  cargarAdmin();
}

function entrarAdmin() {
  const clave = document.getElementById("clave").value.trim();

  if (clave !== "maestro22") {
    alert("Clave incorrecta");
    return;
  }

  document.getElementById("login").hidden = true;
  document.getElementById("panelAdmin").hidden = false;
  cargarAdmin();
}

document.addEventListener("DOMContentLoaded", () => {
  cargarFirmas();
  cargarAdmin();
});
async function eliminarFirma(id) {
  if (!confirm("¿Eliminar esta firma?")) return;

  await supabaseRequest("DELETE", null, `?id=eq.${id}`);
  cargarFirmas();
  cargarAdmin();
}

async function editarFirma(id, mensajeActual) {
  const nuevo = prompt("Editar mensaje:", mensajeActual);
  if (!nuevo) return;

  await supabaseRequest("PATCH",
    { mensaje: nuevo },
    `?id=eq.${id}`
  );

  cargarFirmas();
  cargarAdmin();
}
