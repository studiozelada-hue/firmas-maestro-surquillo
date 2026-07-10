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

  if (!res.ok) {
    throw new Error(await res.text());
  }

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
        estado: "pendiente",
        likes: 0
      });

      estado.textContent = "Firma enviada. Espera aprobación.";
      form.reset();
    } catch (error) {
      estado.textContent = "Error al enviar la firma.";
      console.error(error);
    }
  });
}

function yaDioLike(id) {
  return localStorage.getItem(`firma_like_${id}`) === "1";
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
      ? firmas.map((f) => {
          const desactivado = yaDioLike(f.id);
          return `
            <div class="firma">
              <strong>${f.nombre}</strong>
              <p>${f.mensaje}</p>
              <button
                type="button"
                onclick="darLike(${f.id}, ${f.likes || 0})"
                ${desactivado ? "disabled" : ""}
              >
                ${desactivado ? "❤️ Ya te gusta" : "❤️ Me gusta"} (${f.likes || 0})
              </button>
            </div>
          `;
        }).join("")
      : "<p>Aún no hay firmas aprobadas.</p>";
  } catch (error) {
    contenedor.innerHTML = "<p>Error al cargar firmas aprobadas.</p>";
    console.error(error);
  }
}

async function darLike(id, likesActuales) {
  if (yaDioLike(id)) {
    alert("Ya diste Me gusta a esta firma.");
    return;
  }

  try {
    await supabaseRequest(
      "PATCH",
      { likes: Number(likesActuales || 0) + 1 },
      `?id=eq.${id}`
    );

    localStorage.setItem(`firma_like_${id}`, "1");
    await cargarFirmas();
  } catch (error) {
    console.error(error);
    alert("No se pudo registrar el Me gusta.");
  }
}

async function cargarAdmin() {
  const pendientes = document.getElementById("pendientes");
  const aprobadas = document.getElementById("aprobadas");
  if (!pendientes || !aprobadas) return;

  try {
    const firmas = await supabaseRequest(
      "GET",
      null,
      "?select=*&order=created_at.desc"
    );

    pendientes.innerHTML =
      firmas
        .filter((f) => f.estado === "pendiente")
        .map((f) => `
          <div class="firma">
            <strong>${f.nombre}</strong>
            <p>${f.mensaje}</p>
            <button type="button" onclick="aprobarFirma(${f.id})">
              Aprobar
            </button>
          </div>
        `).join("") || "<p>No hay firmas pendientes.</p>";

    aprobadas.innerHTML =
      firmas
        .filter((f) => f.estado === "aprobado")
        .map((f) => `
          <div class="firma">
            <strong>${f.nombre}</strong>
            <p>${f.mensaje}</p>
            <p>❤️ Me gusta: ${f.likes || 0}</p>
            <button
              type="button"
              onclick='editarFirma(${f.id}, ${JSON.stringify(f.mensaje)})'
            >
              Editar
            </button>
            <button type="button" onclick="eliminarFirma(${f.id})">
              Eliminar
            </button>
          </div>
        `).join("") || "<p>No hay firmas aprobadas.</p>";
  } catch (error) {
    pendientes.innerHTML = "<p>Error al cargar firmas pendientes.</p>";
    aprobadas.innerHTML = "<p>Error al cargar firmas aprobadas.</p>";
    console.error(error);
  }
}

async function aprobarFirma(id) {
  try {
    await supabaseRequest(
      "PATCH",
      { estado: "aprobado" },
      `?id=eq.${id}`
    );

    await cargarAdmin();
    await cargarFirmas();
  } catch (error) {
    console.error(error);
    alert("No se pudo aprobar la firma.");
  }
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

async function eliminarFirma(id) {
  if (!confirm("¿Eliminar esta firma?")) return;

  try {
    await supabaseRequest("DELETE", null, `?id=eq.${id}`);
    await cargarFirmas();
    await cargarAdmin();
  } catch (error) {
    console.error(error);
    alert("No se pudo eliminar la firma.");
  }
}

async function editarFirma(id, mensajeActual) {
  const nuevo = prompt("Editar mensaje:", mensajeActual);
  if (nuevo === null) return;

  const mensajeLimpio = nuevo.trim();
  if (!mensajeLimpio) {
    alert("El mensaje no puede quedar vacío.");
    return;
  }

  try {
    await supabaseRequest(
      "PATCH",
      { mensaje: mensajeLimpio },
      `?id=eq.${id}`
    );

    await cargarFirmas();
    await cargarAdmin();
  } catch (error) {
    console.error(error);
    alert("No se pudo editar la firma.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  cargarFirmas();
});
