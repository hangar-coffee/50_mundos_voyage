let travelData = {
    personas: [],
    destinos: [],
    vuelos: [],
    hospedaje: [],
    actividades: [],
    itinerario: [],
    paquetes: [],
    activityPhotos: {}
};

let showInternalCosts = false;
let geoCache = {};

let mapDestinosObj = null;
let mapRutaObj = null;
let mapClientViewObj = null;

function resetData() {
    travelData = {
        personas: [], destinos: [], vuelos: [],
        hospedaje: [], actividades: [], itinerario: [],
        paquetes: [], activityPhotos: {}
    };
    renderTables();
    buildActivityPhotosUI();
    const badge = document.getElementById('dataStatusBadge');
    if (badge) badge.innerText = 'Sin Datos - Cargar Excel';
    const summary = document.getElementById('uploadSummary');
    if (summary) summary.classList.add('hidden');
}

function toggleCostsVisibility() {
    showInternalCosts = !showInternalCosts;
    const btn = document.getElementById('toggleCostsBtn');
    const icon = document.getElementById('toggleCostsIcon');
    const label = document.getElementById('toggleCostsLabel');
    const badge = document.getElementById('costModeBadge');

    if (showInternalCosts) {
        if (icon) icon.className = "fa-solid fa-eye text-emerald-600";
        if (label) label.innerText = "Modo Agente (Costos 50 Mundos Visibles)";
        if (btn) btn.className = "no-print px-3 py-1.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-300 transition flex items-center gap-1.5 font-semibold shadow-sm";
        if (badge) badge.innerText = "Modo: Interno Agente";
    } else {
        if (icon) icon.className = "fa-solid fa-eye-slash text-voyage-terracotta";
        if (label) label.innerText = "Modo Cliente (Costos Ocultos)";
        if (btn) btn.className = "no-print px-3 py-1.5 text-xs bg-white hover:bg-voyage-paper text-voyage-teal rounded-lg border border-voyage-border transition flex items-center gap-1.5 font-semibold shadow-sm";
        if (badge) badge.innerText = "Modo: Solo Cliente";
    }

    renderTables();
    updateClientProposalView();
}