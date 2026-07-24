function getAllUniqueActivities() {
    const list = [];
    if (travelData && Array.isArray(travelData.actividades)) {
        travelData.actividades.forEach(a => {
            if (a && a.actividad && !list.includes(a.actividad)) list.push(a.actividad);
        });
    }
    if (travelData && Array.isArray(travelData.itinerario)) {
        travelData.itinerario.forEach(i => {
            if (i && i.actividad && !list.includes(i.actividad)) list.push(i.actividad);
        });
    }
    return list;
}

function getAllUniqueHotels() {
    const list = [];
    if (travelData && Array.isArray(travelData.hospedaje)) {
        travelData.hospedaje.forEach(h => {
            if (h && h.hotel && !list.includes(h.hotel)) list.push(h.hotel);
        });
    }
    return list;
}

function getAllUniqueDestinations() {
    const list = [];
    if (travelData && Array.isArray(travelData.destinos)) {
        travelData.destinos.forEach(d => {
            const name = d.ciudad || d.destino || d.pais;
            if (name && !list.includes(name)) list.push(name);
        });
    }
    return list;
}

function renderTables() {
    // Destinos
    document.getElementById('count-destinos').innerText = travelData.destinos.length;
    document.getElementById('table-destinos-body').innerHTML = travelData.destinos.map(d => `
        <tr class="hover:bg-voyage-paper/60">
            <td class="p-2 font-medium text-voyage-teal">${d.pais}</td>
            <td class="p-2 text-voyage-terracotta font-semibold">${d.ciudad}</td>
            <td class="p-2">${d.llegada}</td>
            <td class="p-2">${d.partida}</td>
            <td class="p-2"><span class="bg-voyage-sand/30 px-2 py-0.5 rounded text-voyage-darkteal font-medium">${d.dias} días</span></td>
        </tr>
    `).join('') || '<tr><td colspan="5" class="p-2 text-slate-400 italic">Sin datos de destinos. Sube tu plantilla Excel.</td></tr>';

    // Personas
    document.getElementById('count-personas').innerText = travelData.personas.length;
    document.getElementById('table-personas-body').innerHTML = travelData.personas.map(p => {
        // Lógica Modo Agente: Construir etiquetas visuales si showInternalCosts es true
        let extraInfo = '';
        if (typeof showInternalCosts !== 'undefined' && showInternalCosts) {
            let tags = [];
            if (p.genero) tags.push(`<span class="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded shadow-xs"><i class="fa-solid fa-venus-mars"></i> ${p.genero}</span>`);
            if (p.contacto) tags.push(`<span class="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded shadow-xs"><i class="fa-solid fa-phone"></i> ${p.contacto}</span>`);
            if (p.alergias && p.alergias.toLowerCase() !== 'ninguna' && p.alergias.toLowerCase() !== 'n/a') {
                tags.push(`<span class="bg-red-50 text-red-600 font-bold px-1.5 py-0.5 rounded shadow-xs"><i class="fa-solid fa-notes-medical"></i> ${p.alergias}</span>`);
            }
            if (tags.length > 0) {
                extraInfo = `<div class="flex gap-1.5 mt-1.5 text-[10px]">${tags.join('')}</div>`;
            }
        }
        
        return `
        <tr class="hover:bg-voyage-paper/60">
            <td class="p-2">
                <div class="font-medium text-voyage-teal">${p.nombre}</div>
                ${extraInfo}
            </td>
            <td class="p-2">${p.edad} años</td>
            <td class="p-2"><span class="bg-voyage-sky text-voyage-teal px-2 py-0.5 rounded text-[10px] font-semibold">${p.categoria}</span></td>
            <td class="p-2">Grupo ${p.grupo}</td>
            <td class="p-2 text-slate-500">${p.nivel}</td>
        </tr>
        `;
    }).join('') || '<tr><td colspan="5" class="p-2 text-slate-400 italic">Sin datos de pasajeros.</td></tr>';

    // Vuelos
    document.getElementById('count-vuelos').innerText = travelData.vuelos.length;
    document.getElementById('table-vuelos-head').innerHTML = `
        <tr>
            <th class="p-2">Pasajero</th>
            <th class="p-2">Ruta</th>
            <th class="p-2">Aerolínea</th>
            <th class="p-2">Equipaje</th>
            ${showInternalCosts ? '<th class="p-2 bg-emerald-100 text-emerald-900">Costo 50 Mundos</th>' : ''}
            ${showInternalCosts ? '<th class="p-2 bg-emerald-100 text-emerald-900">Ganancia</th>' : ''}
            <th class="p-2">Precio Cliente</th>
        </tr>
    `;

    document.getElementById('table-vuelos-body').innerHTML = travelData.vuelos.map(v => {
        const ganancia = Number(v.precioCliente || 0) - Number(v.costoNeto || 0);
        return `
            <tr class="hover:bg-voyage-paper/60">
                <td class="p-2 font-medium text-voyage-teal">${v.pasajero}</td>
                <td class="p-2">${v.salida} ➔ ${v.destino}</td>
                <td class="p-2">${v.aerolinea}</td>
                <td class="p-2 text-slate-500">${v.equipaje}</td>
                ${showInternalCosts ? `<td class="p-2 font-mono text-slate-600 bg-emerald-50/50">$${Number(v.costoNeto).toLocaleString()}</td>` : ''}
                ${showInternalCosts ? `<td class="p-2 font-mono text-emerald-700 font-bold bg-emerald-50/50">+$${ganancia.toLocaleString()}</td>` : ''}
                <td class="p-2 font-bold text-voyage-terracotta">$${Number(v.precioCliente).toLocaleString()} MXN</td>
            </tr>
        `;
    }).join('') || `<tr><td colspan="${showInternalCosts ? 7 : 5}" class="p-2 text-slate-400 italic">Sin vuelos registrados.</td></tr>`;

    // Hospedaje
    document.getElementById('count-hospedaje').innerText = travelData.hospedaje.length;
    document.getElementById('table-hospedaje-head').innerHTML = `
        <tr>
            <th class="p-2">Hotel</th>
            <th class="p-2">CheckIn</th>
            <th class="p-2">Noches</th>
            <th class="p-2">Plan</th>
            ${showInternalCosts ? '<th class="p-2 bg-emerald-100 text-emerald-900">Costo 50 Mundos</th>' : ''}
            ${showInternalCosts ? '<th class="p-2 bg-emerald-100 text-emerald-900">Ganancia</th>' : ''}
            <th class="p-2">Precio Cliente</th>
        </tr>
    `;

    document.getElementById('table-hospedaje-body').innerHTML = travelData.hospedaje.map(h => {
        const ganancia = Number(h.precioCliente || 0) - Number(h.costoNeto || 0);
        return `
            <tr class="hover:bg-voyage-paper/60">
                <td class="p-2 font-medium text-voyage-teal">${h.hotel}</td>
                <td class="p-2">${h.checkIn}</td>
                <td class="p-2">${h.noches} noches</td>
                <td class="p-2 text-voyage-sage font-semibold">${h.todoIncluido}</td>
                ${showInternalCosts ? `<td class="p-2 font-mono text-slate-600 bg-emerald-50/50">$${Number(h.costoNeto).toLocaleString()}</td>` : ''}
                ${showInternalCosts ? `<td class="p-2 font-mono text-emerald-700 font-bold bg-emerald-50/50">+$${ganancia.toLocaleString()}</td>` : ''}
                <td class="p-2 font-bold text-voyage-terracotta">$${Number(h.precioCliente).toLocaleString()} MXN</td>
            </tr>
        `;
    }).join('') || `<tr><td colspan="${showInternalCosts ? 7 : 5}" class="p-2 text-slate-400 italic">Sin hospedaje registrado.</td></tr>`;

// Actividades
    document.getElementById('count-actividades').innerText = travelData.actividades.length;
    document.getElementById('table-actividades-head').innerHTML = `
        <tr>
            <th class="p-2">Fecha</th>
            <th class="p-2">Horario</th>
            <th class="p-2">Actividad</th>
            <th class="p-2">Lugar / Destino</th>
            <th class="p-2">Duración</th>
            ${showInternalCosts ? '<th class="p-2 bg-emerald-100 text-emerald-900">Costo 50 Mundos</th>' : ''}
            ${showInternalCosts ? '<th class="p-2 bg-emerald-100 text-emerald-900">Ganancia</th>' : ''}
            <th class="p-2">Precio Cliente</th>
        </tr>
    `;

    document.getElementById('table-actividades-body').innerHTML = travelData.actividades.map(a => {
        const ganancia = Number(a.precioCliente || 0) - Number(a.costoNeto || 0);
        
        // Cruzamos la data con itinerario por si ahí se detallaron las horas de salida/llegada
        let hLlegada = a.hora_llegada;
        let hSalida = a.hora_salida;
        if (Array.isArray(travelData.itinerario)) {
            const match = travelData.itinerario.find(i => i.actividad === a.actividad && i.fecha === a.fecha);
            if (match) {
                if (match.hora_llegada && match.hora_llegada !== '09:00') hLlegada = match.hora_llegada;
                if (match.hora_salida && match.hora_salida !== '09:00') hSalida = match.hora_salida;
            }
        }

        // Lógica de visualización de horas para la tabla
        let displayTime = a.hora;
        if (hSalida && hLlegada && hSalida !== '09:00' && hLlegada !== '09:00') {
            displayTime = `<div class="text-[11px] leading-tight"><span class="text-slate-400 font-bold">llegada:</span> ${hLlegada}<br><span class="text-slate-400 font-bold">salida:</span> ${hSalida}</div>`;
        } else if (hSalida && hSalida !== '09:00') {
            displayTime = `<div class="text-[11px]"><span class="text-slate-400 font-bold">salida:</span> ${hSalida}</div>`;
        } else if (hLlegada && hLlegada !== '09:00') {
            displayTime = `<div class="text-[11px]"><span class="text-slate-400 font-bold">llegada:</span> ${hLlegada}</div>`;
        }

        return `
            <tr class="hover:bg-voyage-paper/60">
                <td class="p-2 font-medium text-voyage-sage">${a.fecha}</td>
                <td class="p-2">${displayTime}</td>
                <td class="p-2 font-semibold text-voyage-teal">${a.actividad}</td>
                <td class="p-2 text-slate-500">${a.lugar} (${a.destino})</td>
                <td class="p-2">${a.duracion}</td>
                ${showInternalCosts ? `<td class="p-2 font-mono text-slate-600 bg-emerald-50/50">$${Number(a.costoNeto).toLocaleString()}</td>` : ''}
                ${showInternalCosts ? `<td class="p-2 font-mono text-emerald-700 font-bold bg-emerald-50/50">+$${ganancia.toLocaleString()}</td>` : ''}
                <td class="p-2 font-bold text-voyage-terracotta">$${Number(a.precioCliente).toLocaleString()} MXN</td>
            </tr>
        `;
    }).join('') || `<tr><td colspan="${showInternalCosts ? 8 : 6}" class="p-2 text-slate-400 italic">Sin actividades registradas.</td></tr>`;
}

function buildActivityPhotosUI() {
    const container = document.getElementById('activityPhotosList');
    if (!container) return;

    const allActivities = getAllUniqueActivities();
    const allHotels = getAllUniqueHotels();
    const allDestinations = getAllUniqueDestinations();

    let html = '';

    // SECCIÓN 1: ACTIVIDADES
    html += `
        <div class="mb-4">
            <h4 class="text-xs font-bold text-voyage-terracotta uppercase border-b border-voyage-border pb-1 mb-2 flex items-center gap-1.5 font-serif-title">
                <i class="fa-solid fa-compass"></i> Imágenes de Actividades y Tours (${allActivities.length})
            </h4>
    `;
    if (allActivities.length === 0) {
        html += '<p class="text-xs text-slate-400 italic">Sin actividades cargadas.</p>';
    } else {
        html += allActivities.map((name, i) => {
            const currentPhoto = (travelData.activityPhotos && travelData.activityPhotos[name]) ? 
                travelData.activityPhotos[name] : 
                (window.samplePhotos ? window.samplePhotos[i % window.samplePhotos.length] : '');
            const safeName = name.replace(/'/g, "\\'");

            return `
               <div class="space-y-1 bg-voyage-cream p-2.5 rounded-xl border border-voyage-border shadow-xs mb-2">
                    <label class="block text-[11px] font-bold text-voyage-teal truncate" title="${name}">${i + 1}. ${name}</label>
                    <div class="flex flex-col gap-2">
                        <div class="flex gap-2 items-center">
                          <input type="text" placeholder="URL de la imagen" value="${currentPhoto}" onchange="updatePhotoUrl('activity', '${safeName}', this.value)" class="flex-1 bg-white border border-voyage-border rounded p-1 text-[11px] text-voyage-darkteal focus:border-voyage-terracotta outline-none">
                          <img src="${currentPhoto}" class="w-9 h-9 rounded-lg object-cover border border-voyage-border shadow-xs" onerror="this.src='${window.samplePhotos ? window.samplePhotos[0] : ''}'">
                        </div>
                        <input type="file" accept="image/*" onchange="handleLocalPhotoUpload(event, 'activity', '${safeName}')" class="text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-voyage-teal      file:text-white">
                    </div>
               </div>
            `;
        }).join('');
    }
    html += '</div>';

    // SECCIÓN 2: HOTELES
    html += `
        <div class="mb-4">
            <h4 class="text-xs font-bold text-voyage-teal uppercase border-b border-voyage-border pb-1 mb-2 flex items-center gap-1.5 font-serif-title">
                <i class="fa-solid fa-hotel"></i> Imágenes de Hospedaje / Hoteles (${allHotels.length})
            </h4>
    `;
    if (allHotels.length === 0) {
        html += '<p class="text-xs text-slate-400 italic">Sin hoteles cargados.</p>';
    } else {
        html += allHotels.map((hotelName, i) => {
            const currentPhoto = (travelData.hotelPhotos && travelData.hotelPhotos[hotelName]) ? 
                travelData.hotelPhotos[hotelName] : 
                (window.samplePhotos ? window.samplePhotos[(i + 1) % window.samplePhotos.length] : '');
            const safeName = hotelName.replace(/'/g, "\\'");

            return `
                <div class="space-y-1 bg-voyage-cream p-2.5 rounded-xl border border-voyage-border shadow-xs mb-2">
                    <label class="block text-[11px] font-bold text-voyage-teal truncate" title="${hotelName}">${i + 1}. ${hotelName}</label>
                    <div class="flex gap-2 items-center">
                        <input type="text" value="${currentPhoto}" onchange="updatePhotoUrl('hotel', '${safeName}', this.value)" class="flex-1 bg-white border border-voyage-border rounded p-1 text-[11px] text-voyage-darkteal focus:border-voyage-terracotta outline-none">
                        <img src="${currentPhoto}" class="w-9 h-9 rounded-lg object-cover border border-voyage-border shadow-xs" onerror="this.src='${window.samplePhotos ? window.samplePhotos[0] : ''}'">
                    </div>
                </div>
            `;
        }).join('');
    }
    html += '</div>';

    // SECCIÓN 3: DESTINOS
    html += `
        <div>
            <h4 class="text-xs font-bold text-voyage-sage uppercase border-b border-voyage-border pb-1 mb-2 flex items-center gap-1.5 font-serif-title">
                <i class="fa-solid fa-location-dot"></i> Imágenes de Destinos (${allDestinations.length})
            </h4>
    `;
    if (allDestinations.length === 0) {
        html += '<p class="text-xs text-slate-400 italic">Sin destinos cargados.</p>';
    } else {
        html += allDestinations.map((destName, i) => {
            const currentPhoto = (travelData.destinoPhotos && travelData.destinoPhotos[destName]) ? 
                travelData.destinoPhotos[destName] : 
                (window.samplePhotos ? window.samplePhotos[(i + 2) % window.samplePhotos.length] : '');
            const safeName = destName.replace(/'/g, "\\'");

            return `
                <div class="space-y-1 bg-voyage-cream p-2.5 rounded-xl border border-voyage-border shadow-xs mb-2">
                    <label class="block text-[11px] font-bold text-voyage-teal truncate" title="${destName}">${i + 1}. ${destName}</label>
                    <div class="flex gap-2 items-center">
                        <input type="text" value="${currentPhoto}" onchange="updatePhotoUrl('destino', '${safeName}', this.value)" class="flex-1 bg-white border border-voyage-border rounded p-1 text-[11px] text-voyage-darkteal focus:border-voyage-terracotta outline-none">
                        <img src="${currentPhoto}" class="w-9 h-9 rounded-lg object-cover border border-voyage-border shadow-xs" onerror="this.src='${window.samplePhotos ? window.samplePhotos[0] : ''}'">
                    </div>
                </div>
            `;
        }).join('');
    }
    html += '</div>';

    container.innerHTML = html;
}

function updatePhotoUrl(type, itemName, url) {
    if (type === 'hotel') {
        travelData.hotelPhotos = travelData.hotelPhotos || {};
        travelData.hotelPhotos[itemName] = url;
    } else if (type === 'destino') {
        travelData.destinoPhotos = travelData.destinoPhotos || {};
        travelData.destinoPhotos[itemName] = url;
    } else {
        travelData.activityPhotos = travelData.activityPhotos || {};
        travelData.activityPhotos[itemName] = url;
    }
}
function handleLocalPhotoUpload(event, type, itemName) {
    const file = event.target && event.target.files ? event.target.files[0] : null;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const dataUrl = e.target.result;
        updatePhotoUrl(type, itemName, dataUrl);
        // Refrescamos la UI para que se muestre la nueva imagen inmediatamente
        if (typeof buildActivityPhotosUI === 'function') buildActivityPhotosUI(); 
    };
    reader.readAsDataURL(file);
}

function autoAssignUnsplashPhotos() {
    travelData.activityPhotos = travelData.activityPhotos || {};
    travelData.hotelPhotos = travelData.hotelPhotos || {};
    travelData.destinoPhotos = travelData.destinoPhotos || {};

    const samples = window.samplePhotos || [];
    getAllUniqueActivities().forEach((act, i) => {
        travelData.activityPhotos[act] = samples[i % samples.length];
    });

    getAllUniqueHotels().forEach((hotel, i) => {
        travelData.hotelPhotos[hotel] = samples[(i + 1) % samples.length];
    });

    getAllUniqueDestinations().forEach((dest, i) => {
        travelData.destinoPhotos[dest] = samples[(i + 2) % samples.length];
    });

    buildActivityPhotosUI();
}

function updateClientProposalView() {
    const clientNameEl = document.getElementById('agentClientName');
    const agentNameEl = document.getElementById('agentName');
    const greetingEl = document.getElementById('agentGreeting');
    const inclusionsEl = document.getElementById('agentInclusions');
    const termsEl = document.getElementById('agentTerms');
    const vigenciaEl = document.getElementById('agentVigencia');

    const clientName = clientNameEl ? clientNameEl.value : '';
    const agentName = agentNameEl ? agentNameEl.value : '';
    const greeting = greetingEl ? greetingEl.value : '';
    const inclusions = inclusionsEl ? inclusionsEl.value : '';
    const terms = termsEl ? termsEl.value : '';
    const vigencia = vigenciaEl ? vigenciaEl.value : '';

    if (document.getElementById('cv-client-name')) document.getElementById('cv-client-name').innerText = clientName;
    if (document.getElementById('cv-agent-name')) document.getElementById('cv-agent-name').innerText = `Atendido por: ${agentName}`;
    if (document.getElementById('cv-greeting-text')) document.getElementById('cv-greeting-text').innerText = greeting;
    if (document.getElementById('cv-inclusions-text')) document.getElementById('cv-inclusions-text').innerText = inclusions;
    if (document.getElementById('cv-terms-text')) document.getElementById('cv-terms-text').innerText = terms;
    if (document.getElementById('cv-vigencia')) document.getElementById('cv-vigencia').innerText = vigencia;

    if (document.getElementById('cv-total-pax')) {
        document.getElementById('cv-total-pax').innerText = `${travelData.personas.length || 0} Pasajeros`;
    }
    if (document.getElementById('cv-total-destinos')) {
        document.getElementById('cv-total-destinos').innerText = travelData.destinos.map(d => d.ciudad).join(', ') || 'Sin Destino';
    }
    
    const totalDays = travelData.destinos.reduce((sum, d) => sum + Number(d.dias || 0), 0) || 0;
    if (document.getElementById('cv-total-days')) {
        document.getElementById('cv-total-days').innerText = `${totalDays} Días / ${Math.max(0, totalDays - 1)} Noches`;
    }

    let subtotals = {};
    let grandTotal = 0;

    const sumCost = (item) => {
        const grp = item.grupo || 1;
        const price = Number(item.precioCliente || 0);
        if (!subtotals[grp]) subtotals[grp] = 0;
        subtotals[grp] += price;
        grandTotal += price;
    };

    if (Array.isArray(travelData.vuelos)) travelData.vuelos.forEach(sumCost);
    if (Array.isArray(travelData.hospedaje)) travelData.hospedaje.forEach(sumCost);
    if (Array.isArray(travelData.actividades)) travelData.actividades.forEach(sumCost);

    if (document.getElementById('cv-total-price')) {
        let subtotalsHtml = Object.keys(subtotals).map(g => 
            `<span class="text-sm text-slate-600 block">Subtotal Grupo ${g}: $${subtotals[g].toLocaleString('es-MX')} MXN</span>`
        ).join('');
        
        document.getElementById('cv-total-price').innerHTML = `
            ${subtotalsHtml}
            <span class="font-bold text-lg text-voyage-teal block mt-1">Total Final: $${grandTotal.toLocaleString('es-MX')} MXN</span>
        `;
    }

    // Vuelos
    const vuelosContainer = document.getElementById('cv-vuelos-container');
    if (vuelosContainer) {
        vuelosContainer.innerHTML = (travelData.vuelos || []).map(v => `
            <div class="bg-voyage-cream border border-voyage-border rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-xs">
                <div class="space-y-1">
                    <div class="flex items-center gap-2">
                        <span class="bg-voyage-teal text-white text-[10px] font-bold px-2 py-0.5 rounded">${v.aerolinea}</span>
                        <span class="font-bold text-voyage-teal text-sm">${v.salida} ➔ ${v.destino}</span>
                        <span class="text-slate-500 text-[11px]">(${v.redondo === 'Sí' ? 'Vuelo Redondo' : 'Sencillo'})</span>
                    </div>
                    <p class="text-slate-700 text-[11px]">Pasajero: <b>${v.pasajero}</b> | Despegue: ${v.fechaDespegue} ${v.horaDespegue}</p>
                    <p class="text-slate-500 text-[11px]">Equipaje incluido: ${v.equipaje}</p>
                </div>
                <div class="text-right sm:border-l sm:border-voyage-border sm:pl-4">
                    <p class="text-[10px] uppercase text-slate-500 font-semibold">Incluido en paquete</p>
                    <p class="font-bold text-voyage-teal text-sm">$${Number(v.precioCliente).toLocaleString()} MXN</p>
                </div>
            </div>
        `).join('') || '<p class="text-slate-500 italic">No hay vuelos registrados en la cotización.</p>';
    }

    // Hospedaje con fotos
    const hospedajeContainer = document.getElementById('cv-hospedaje-container');
    if (hospedajeContainer) {
        hospedajeContainer.innerHTML = (travelData.hospedaje || []).map((h, idx) => {
            const photo = (travelData.hotelPhotos && travelData.hotelPhotos[h.hotel]) ? 
                travelData.hotelPhotos[h.hotel] : 
                (window.samplePhotos ? window.samplePhotos[(idx + 1) % window.samplePhotos.length] : '');

            return `
                <div class="bg-voyage-cream border border-voyage-border rounded-xl overflow-hidden flex flex-col sm:flex-row shadow-xs">
                    <img src="${photo}" class="w-full sm:w-44 h-32 object-cover" onerror="this.src='${window.samplePhotos ? window.samplePhotos[0] : ''}'">
                    <div class="p-3.5 flex-1 flex flex-col justify-between space-y-1">
                        <div>
                            <h4 class="font-bold text-voyage-teal text-sm font-serif-title flex items-center gap-1.5">
                                <i class="fa-solid fa-hotel text-voyage-sage"></i> ${h.hotel}
                            </h4>
                            <p class="text-slate-700 text-[11px] mt-1">
                                Check-in: <b>${h.checkIn}</b> | Check-out: <b>${h.checkOut}</b> (${h.noches} Noches)
                            </p>
                            <p class="text-voyage-terracotta font-medium text-[11px]">
                                Plan: <b>${h.todoIncluido}</b> | Tipo: ${h.tipo} | Habs: ${h.habitaciones}
                            </p>
                        </div>
                        <div class="pt-1.5 border-t border-voyage-border/60 flex items-center justify-between text-[11px]">
                            <span class="text-slate-500">Titular: ${h.titular || 'Cliente'}</span>
                            <span class="font-bold text-voyage-teal">$${Number(h.precioCliente).toLocaleString()} MXN</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('') || '<p class="text-slate-500 italic">No hay hospedaje registrado en la cotización.</p>';
    }

    // Itinerario por grupos y pasajeros
    renderItineraryByGroups();
}

function renderItineraryByGroups() {
    const container = document.getElementById('cv-itinerario-container');
    if (!container) return;

    const combinedMap = {};
    
    if (Array.isArray(travelData.actividades)) {
        travelData.actividades.forEach(a => {
            const key = a.actividad.trim() + '|' + a.fecha;
            combinedMap[key] = {
                actividad: a.actividad,
                fecha: a.fecha,
                hora: a.hora,
                hora_llegada: a.hora_llegada,
                hora_salida: a.hora_salida,
                lugar: a.lugar,
                destino: a.destino,
                duracion: a.duracion,
                grupo: String(a.grupo || 1),
                precioCliente: a.precioCliente,
                pasajerosSet: new Set()
            };
        });
    }

    if (Array.isArray(travelData.itinerario)) {
        travelData.itinerario.forEach(i => {
            const key = i.actividad.trim() + '|' + i.fecha;
            
            if (!combinedMap[key]) {
                combinedMap[key] = {
                    actividad: i.actividad,
                    fecha: i.fecha,
                    hora: i.hora,
                    hora_llegada: i.hora_llegada,
                    hora_salida: i.hora_salida,
                    lugar: i.lugar,
                    destino: i.destino,
                    duracion: 'Por definir',
                    grupo: String(i.grupo || 1),
                    precioCliente: 0,
                    pasajerosSet: new Set()
                };
            } else {
                // Ya no bloqueamos las horas, si traen un valor válido las inyectamos
                if (i.hora_llegada) combinedMap[key].hora_llegada = i.hora_llegada;
                if (i.hora_salida) combinedMap[key].hora_salida = i.hora_salida;
                if (i.hora) combinedMap[key].hora = i.hora;
            }

            if (i.pasajeros && i.pasajeros !== 'Todos los asignados' && i.pasajeros !== 'Grupo Completo') {
                combinedMap[key].pasajerosSet.add(i.pasajeros.trim());
            }
        });
    }

    const combinedList = Object.values(combinedMap).map(item => {
        const pasList = Array.from(item.pasajerosSet);
        return {
            ...item,
            pasajeros: pasList.length > 0 ? pasList.join(', ') : 'Grupo Completo'
        };
    });

    if (combinedList.length === 0) {
        container.innerHTML = '<p class="text-slate-500 italic">No hay actividades o itinerario registrados en la cotización.</p>';
        return;
    }

    const groupPassengersMap = {};
    if (Array.isArray(travelData.personas)) {
        travelData.personas.forEach(p => {
            const gKey = String(p.grupo || 1);
            if (!groupPassengersMap[gKey]) groupPassengersMap[gKey] = [];
            groupPassengersMap[gKey].push(p); 
        });
    }

    const activitiesByGroup = {};
    combinedList.forEach(item => {
        const gKey = String(item.grupo || 1);
        if (!activitiesByGroup[gKey]) activitiesByGroup[gKey] = [];
        activitiesByGroup[gKey].push(item);
    });

    const groupKeys = Object.keys(activitiesByGroup);

    container.innerHTML = groupKeys.map((gKey) => {
        const groupActivities = activitiesByGroup[gKey];
        const passengersList = groupPassengersMap[gKey] || [];

        const passengersHtml = passengersList.map(p => {
            if (typeof p === 'string') return `<div>• ${p}</div>`;
            
            let extraTags = '';
            if (typeof showInternalCosts !== 'undefined' && showInternalCosts) {
                let tags = [];
                if (p.genero && p.genero !== 'N/A') tags.push(p.genero);
                if (p.contacto && p.contacto !== 'N/A') tags.push(`<i class="fa-solid fa-phone"></i> ${p.contacto}`);
                if (p.alergias && p.alergias.toLowerCase() !== 'ninguna' && p.alergias.toLowerCase() !== 'n/a') {
                    tags.push(`<span class="text-red-500 font-bold"><i class="fa-solid fa-notes-medical"></i> ${p.alergias}</span>`);
                }
                if (tags.length > 0) {
                    extraTags = `<span class="text-[9px] text-slate-500 ml-1.5 font-normal border-l border-slate-300 pl-1.5">${tags.join(' | ')}</span>`;
                }
            }
            return `<div class="whitespace-nowrap truncate text-xs text-slate-700 mt-0.5">• <b>${p.nombre}</b> ${extraTags}</div>`;
        }).join('');

        const activitiesHtml = groupActivities.map((a, idx) => {
            const photo = (travelData.activityPhotos && travelData.activityPhotos[a.actividad]) ? 
                travelData.activityPhotos[a.actividad] : 
                (window.samplePhotos ? window.samplePhotos[idx % window.samplePhotos.length] : '');

            const priceLabel = a.precioCliente > 0 ? `$${Number(a.precioCliente).toLocaleString()} MXN` : 'Incluido';

            // LÓGICA DE HORAS LIMPIA Y SIN BLOQUEOS
            let displayTime = a.hora;
            if (a.hora_salida && a.hora_llegada) {
                displayTime = `Salida: ${a.hora_salida} | Llegada: ${a.hora_llegada}`;
            } else if (a.hora_salida) {
                displayTime = `Salida: ${a.hora_salida}`;
            } else if (a.hora_llegada) {
                displayTime = `Llegada: ${a.hora_llegada}`;
            }

            return `
                <div class="bg-white border border-voyage-border rounded-xl overflow-hidden flex flex-col sm:flex-row shadow-xs">
                    <img src="${photo}" class="w-full sm:w-44 h-32 object-cover" onerror="this.src='${window.samplePhotos ? window.samplePhotos[0] : ''}'">
                    <div class="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                        <div>
                            <div class="flex items-center justify-between">
                                <span class="text-voyage-terracotta font-bold text-[11px]"><i class="fa-regular fa-clock mr-1"></i>${a.fecha} - ${displayTime}</span>
                                <span class="bg-voyage-cream text-voyage-teal text-[10px] px-2 py-0.5 rounded font-semibold border border-voyage-border">${a.duracion}</span>
                            </div>
                            <h5 class="font-bold text-voyage-teal text-sm mt-1 font-serif-title">${a.actividad}</h5>
                            <p class="text-slate-600 text-[11px] mt-1">
                               <i class="fa-solid fa-users text-voyage-terracotta mr-1"></i> Asignados: <b>${a.pasajeros}</b>
                            </p>
                            <p class="text-slate-600 text-[11px] mt-0.5"><i class="fa-solid fa-location-dot text-voyage-terracotta mr-1"></i>${a.lugar} (${a.destino})</p>
                        </div>
                        <div class="pt-1.5 border-t border-voyage-border/60 flex items-center justify-between text-[11px]">
                            <span class="font-bold text-voyage-teal">${priceLabel}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="bg-voyage-cream/60 border border-voyage-border rounded-2xl p-4 space-y-3 shadow-xs">
                <div class="flex flex-col sm:flex-row sm:items-start justify-between pb-3 border-b border-voyage-border gap-3">
                    <div class="flex items-center gap-2">
                        <span class="bg-voyage-terracotta text-white font-bold text-xs px-2.5 py-1 rounded-lg">Grupo ${gKey}</span>
                        <h4 class="font-bold text-voyage-teal text-sm">Itinerario Programado</h4>
                    </div>
                    
                    <div class="bg-white px-3 py-2 rounded-xl border border-voyage-border shadow-xs min-w-[220px]">
                        <div class="flex items-center gap-1.5 mb-1 text-voyage-sage border-b border-voyage-border pb-1">
                            <i class="fa-solid fa-id-card"></i> <span class="font-bold uppercase text-[10px] tracking-wide">Ficha de Pasajeros</span>
                        </div>
                        <div class="flex flex-col">
                            ${passengersHtml || '<i class="text-xs text-slate-400">Sin asignar</i>'}
                        </div>
                    </div>
                </div>
                <div class="space-y-3">
                    ${activitiesHtml}
                </div>
            </div>
        `;
    }).join('');
}