const URL_API = "https://api.jolpi.ca/ergast/f1/current/driverstandings.json";
const COLOR_POR_DEFECTO = "#E9002D";


const COLORES = {
  red_bull: "#3671C6",
  ferrari: "#E8002D",
  mercedes: "#27F4D2",
  mclaren: "#FF8000",
  aston_martin: "#229971",
  alpine: "#FF87BC",
  williams: "#64C4FF",
  rb: "#6692FF",
  haas: "#B6BABD",
  sauber: "#52E252",
  audi: "#F50537",
  cadillac: "#C0C0C0"
};

let pilotos = [];

function colorDe(piloto) {
  const id = piloto.Constructors[0].constructorId;
  if (!COLORES[id]) console.log("Equipo sin color definido:", id);
  return COLORES[id] || COLOR_POR_DEFECTO;
}

async function cargarPilotos() {
  const estado = document.getElementById("estado");
  try {
    const respuesta = await fetch(URL_API);
    if (!respuesta.ok) throw new Error("Error HTTP " + respuesta.status);
    const datos = await respuesta.json();
    pilotos = datos.MRData.StandingsTable.StandingsLists[0].DriverStandings;

    estado.textContent = "";

    llenarFiltro();
    mostrar(pilotos);
  } catch (error) {
    estado.textContent = "No se pudieron cargar los datos. Revisa tu conexión y recarga la página.";
    console.error(error);
  }
}
function crearBoton(texto,id) {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "btn btn-outline-light";
  boton.textContent = texto;
  boton.addEventListener("click",() => elegirEquipo(id, boton));
  return boton;
}

function llenarFiltro() {
  const contenedor = document.getElementById("filtro");


  const equipos = new Map();
  pilotos.forEach(p => equipos.set(p.Constructors[0].constructorId, p.Constructors[0].name));

  const botontodos = crearBoton("todos","");
  marcarActivo(botontodos);
  contenedor.appendChild(botontodos);

  [...equipos].sort((a, b) => a[1].localeCompare(b[1])).forEach(([id, nombre]) => {
    contenedor.appendChild(crearBoton(nombre,id))
  });
}
function marcarActivo(boton) {
  document.querySelectorAll("#filtro .btn").forEach(b => b.classList.remove("activo"));
  boton.classList.add("activo")
}

function elegirEquipo(id, boton) {
  marcarActivo(boton);
  document.documentElement.style.setProperty("--acento", COLORES[id] || COLOR_POR_DEFECTO);
  mostrar(id ? pilotos.filter(p => p.Constructors[0].constructorId === id) : pilotos);
}
// 3. RADIO CHECK con audios propios ------------------------------------------
// Pon tus grabaciones en la carpeta "audio", junto a index.html:
//   audio/VER.mp3, audio/HAM.mp3, ...   -> un audio por piloto (código de 3 letras)
//   audio/radio-check.mp3               -> audio de respaldo para quien no tenga el suyo
const CARPETA_AUDIO = "audio/";
const AUDIO_RESPALDO = CARPETA_AUDIO + "radio-check.mp3";

let audioActual = null;
let botonActual = null;

function alternarAudio(codigo, boton) {
  if (audioActual && botonActual === boton) {
    detenerAudio();
    return;
  }
  detenerAudio();
  reproducir(CARPETA_AUDIO + codigo + ".mp3", boton, true);
}


function reproducir(ruta, boton, permitirRespaldo) {
  const audio = new Audio(ruta);
  audioActual = audio;
  botonActual = boton;
  boton.textContent = "Detener";
  boton.classList.add("sonando");


  audio.addEventListener("ended", detenerAudio);


  audio.addEventListener("error", () => {
    if (audioActual !== audio) return; // ya no es el audio vigente
    if (permitirRespaldo) {
      reproducir(AUDIO_RESPALDO, boton, false);
    } else {
      detenerAudio();
      boton.textContent = "Sin audio";
    }
  });


  audio.play().catch(error => console.warn("No se pudo reproducir:", error.message));
}

function detenerAudio() {
  if (audioActual) audioActual.pause();
  if (botonActual) {
    botonActual.textContent = "Radio check";
    botonActual.classList.remove("sonando");
  }
  audioActual = null;
  botonActual = null;
}

function mostrar(lista) {
  detenerAudio();
  const contenedor = document.getElementById("lista");
  contenedor.innerHTML = "";

  lista.forEach(p => {
    const tarjeta = document.createElement("div");
    tarjeta.className = "piloto";
    tarjeta.style.setProperty("--acento", colorDe(p));
    tarjeta.innerHTML = `
      <span class="pos">${p.position}</span>
      <h2>${p.Driver.givenName} ${p.Driver.familyName}</h2>
      <p>${p.Constructors[0].name}</p>
      <p>${p.points} puntos · ${p.wins} victorias</p>
      <p>${p.Driver.nationality}</p>
      <button class="radio" type="button">Radio check</button>`;

    const boton = tarjeta.querySelector(".radio");
    boton.addEventListener("click", () => alternarAudio(p.Driver.code, boton));
    contenedor.appendChild(tarjeta);
  });
}

cargarPilotos();