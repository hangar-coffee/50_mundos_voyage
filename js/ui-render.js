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
    const countDestinos = document.getElementById('count-destinos');
    const tableDestinos = document.getElementById('table-destinos-body');
    if (countDestinos && travelData.destinos) countDestinos.innerText = travelData.destinos.length;
    if (tableDestinos && travelData.destinos) {
        tableDestinos.innerHTML = travelData.destinos.map(d => `
            <tr class="hover:bg-voyage-paper/60">
                <td class="p-2 font-medium text-voyage-teal">${d.pais || ''}</td>
                <td class="p-2 text-voyage-terracotta font-semibold">${d.ciudad || ''}</td>
                <td class="p-2">${d.llegada || ''}</td>
                <td class="p-2">${d.partida || ''}</td>
                <td class="p-2"><span class="bg-voyage-sand/30 px-2 py-0.5 rounded text-voyage-darkteal font-medium">${d.dias || 0} días</span></td>
            </tr>
        `).join('') || '<tr><td colspan="5" class="p-2 text-slate-400 italic">Sin datos de destinos. Sube tu plantilla Excel.</td></tr>';
    }

    const countPersonas = document.getElementById('count-personas');
    const tablePersonas = document.getElementById('table-personas-body');
    if (countPersonas && travelData.personas) countPersonas.innerText = travelData.personas.length;
    if (tablePersonas && travelData.personas) {
        tablePersonas.innerHTML = travelData.personas.map(p => {
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
                    <div class="font-medium text-voyage-teal">${p.nombre || ''}</div>
                    ${extraInfo}
                </td>
                <td class="p-2">${p.edad || ''}</td>
                <td class="p-2"><span class="bg-voyage-sky text-voyage-teal px-2 py-0.5 rounded text-[10px] font-semibold">${p.categoria || ''}</span></td>
                <td class="p-2">Grupo ${p.grupo || 1}</td>
                <td class="p-2 text-slate-500">${p.nivel || ''}</td>
            </tr>
            `;
        }).join('') || '<tr><td colspan="5" class="p-2 text-slate-400 italic">Sin datos de pasajeros.</td></tr>';
    }

    const countVuelos = document.getElementById('count-vuelos');
    const tableVuelosHead = document.getElementById('table-vuelos-head');
    const tableVuelosBody = document.getElementById('table-vuelos-body');
    if (countVuelos && travelData.vuelos) countVuelos.innerText = travelData.vuelos.length;
    if (tableVuelosHead) {
        tableVuelosHead.innerHTML = `
            <tr>
                <th class="p-2">Terminal / Empresa</th>
                <th class="p-2">Pasajero</th>
                <th class="p-2">Ruta</th>
                <th class="p-2">Horarios (Salida ➔ Llegada)</th>
                <th class="p-2">Equipaje / Escalas</th>
                ${showInternalCosts ? '<th class="p-2 bg-emerald-100 text-emerald-900">Costo 50 Mundos</th>' : ''}
                ${showInternalCosts ? '<th class="p-2 bg-emerald-100 text-emerald-900">Ganancia</th>' : ''}
                <th class="p-2">Precio Cliente</th>
            </tr>
        `;
    }
    if (tableVuelosBody && travelData.vuelos) {
        tableVuelosBody.innerHTML = travelData.vuelos.map(v => {
            const ganancia = Number(v.precioCliente || 0) - Number(v.costoNeto || 0);
            return `
                <tr class="hover:bg-voyage-paper/60">
                    <td class="p-2">
                        <div class="font-medium text-voyage-teal">${v.terminal || ''}</div>
                        <div class="text-[10px] text-slate-500">${v.medioTransporte || ''} ${v.empresa ? '- ' + v.empresa : ''}</div>
                    </td>
                    <td class="p-2 font-medium text-voyage-teal">${v.pasajero || ''}</td>
                    <td class="p-2">${v.salida || ''} ➔ ${v.destino || ''} <span class="text-[10px] text-slate-400">(${v.redondo === 'Sí' ? 'Redondo' : 'Sencillo'})</span></td>
                    <td class="p-2 text-[11px]">
                        <div><b>Sale:</b> ${v.fechaDespegue || ''} ${v.horaDespegue || ''}</div>
                        <div><b>Llega:</b> ${v.fechaAterrizaje || ''} ${v.horaAterrizaje || ''}</div>
                    </td>
                    <td class="p-2 text-slate-500 text-[11px]">${v.equipaje || ''} <br><span class="text-[10px] text-slate-400">${v.escalas || ''}</span></td>
                    ${showInternalCosts ? `<td class="p-2 font-mono text-slate-600 bg-emerald-50/50">$${Number(v.costoNeto || 0).toLocaleString()}</td>` : ''}
                    ${showInternalCosts ? `<td class="p-2 font-mono text-emerald-700 font-bold bg-emerald-50/50">+$${ganancia.toLocaleString()}</td>` : ''}
                    <td class="p-2 font-bold text-voyage-terracotta">$${Number(v.precioCliente || 0).toLocaleString()} MXN</td>
                </tr>
            `;
        }).join('') || `<tr><td colspan="${showInternalCosts ? 8 : 6}" class="p-2 text-slate-400 italic">Sin transportes o vuelos registrados.</td></tr>`;
    }

    const countHospedaje = document.getElementById('count-hospedaje');
    const tableHospedajeHead = document.getElementById('table-hospedaje-head');
    const tableHospedajeBody = document.getElementById('table-hospedaje-body');
    if (countHospedaje && travelData.hospedaje) countHospedaje.innerText = travelData.hospedaje.length;
    if (tableHospedajeHead) {
        tableHospedajeHead.innerHTML = `
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
    }
    if (tableHospedajeBody && travelData.hospedaje) {
        tableHospedajeBody.innerHTML = travelData.hospedaje.map(h => {
            const ganancia = Number(h.precioCliente || 0) - Number(h.costoNeto || 0);
            return `
                <tr class="hover:bg-voyage-paper/60">
                    <td class="p-2 font-medium text-voyage-teal">${h.hotel || ''}</td>
                    <td class="p-2">${h.checkIn || ''}</td>
                    <td class="p-2">${h.noches || 0} noches</td>
                    <td class="p-2 text-voyage-sage font-semibold">${h.todoIncluido || ''}</td>
                    ${showInternalCosts ? `<td class="p-2 font-mono text-slate-600 bg-emerald-50/50">$${Number(h.costoNeto || 0).toLocaleString()}</td>` : ''}
                    ${showInternalCosts ? `<td class="p-2 font-mono text-emerald-700 font-bold bg-emerald-50/50">+$${ganancia.toLocaleString()}</td>` : ''}
                    <td class="p-2 font-bold text-voyage-terracotta">$${Number(h.precioCliente || 0).toLocaleString()} MXN</td>
                </tr>
            `;
        }).join('') || `<tr><td colspan="${showInternalCosts ? 7 : 5}" class="p-2 text-slate-400 italic">Sin hospedaje registrado.</td></tr>`;
    }

    const countActividades = document.getElementById('count-actividades');
    const tableActividadesHead = document.getElementById('table-actividades-head');
    const tableActividadesBody = document.getElementById('table-actividades-body');
    if (countActividades && travelData.actividades) countActividades.innerText = travelData.actividades.length;
    if (tableActividadesHead) {
        tableActividadesHead.innerHTML = `
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
    }
    if (tableActividadesBody && travelData.actividades) {
        tableActividadesBody.innerHTML = travelData.actividades.map(a => {
            const ganancia = Number(a.precioCliente || 0) - Number(a.costoNeto || 0);
            let hLlegada = a.hora_llegada;
            let hSalida = a.hora_salida;
            if (Array.isArray(travelData.itinerario)) {
                const match = travelData.itinerario.find(i => i.actividad === a.actividad && i.fecha === a.fecha);
                if (match) {
                    if (match.hora_llegada) hLlegada = match.hora_llegada;
                    if (match.hora_salida) hSalida = match.hora_salida;
                }
            }

            let displayTime = a.hora || '';
            if (hSalida && hLlegada) {
                displayTime = `<div class="text-[11px] leading-tight"><span class="text-slate-400 font-bold">llegada:</span> ${hLlegada}<br><span class="text-slate-400 font-bold">salida:</span> ${hSalida}</div>`;
            } else if (hSalida) {
                displayTime = `<div class="text-[11px]"><span class="text-slate-400 font-bold">salida:</span> ${hSalida}</div>`;
            } else if (hLlegada) {
                displayTime = `<div class="text-[11px]"><span class="text-slate-400 font-bold">llegada:</span> ${hLlegada}</div>`;
            }

            return `
                <tr class="hover:bg-voyage-paper/60">
                    <td class="p-2 font-medium text-voyage-sage">${a.fecha || ''}</td>
                    <td class="p-2">${displayTime}</td>
                    <td class="p-2 font-semibold text-voyage-teal">${a.actividad || ''}</td>
                    <td class="p-2 text-slate-500">${a.lugar || ''} ${a.destino ? '(' + a.destino + ')' : ''}</td>
                    <td class="p-2">${a.duracion || ''}</td>
                    ${showInternalCosts ? `<td class="p-2 font-mono text-slate-600 bg-emerald-50/50">$${Number(a.costoNeto || 0).toLocaleString()}</td>` : ''}
                    ${showInternalCosts ? `<td class="p-2 font-mono text-emerald-700 font-bold bg-emerald-50/50">+$${ganancia.toLocaleString()}</td>` : ''}
                    <td class="p-2 font-bold text-voyage-terracotta">$${Number(a.precioCliente || 0).toLocaleString()} MXN</td>
                </tr>
            `;
        }).join('') || `<tr><td colspan="${showInternalCosts ? 8 : 6}" class="p-2 text-slate-400 italic">Sin actividades registradas.</td></tr>`;
    }
}

function buildActivityPhotosUI() {
    const container = document.getElementById('activityPhotosList');
    if (!container) return;

    const allActivities = getAllUniqueActivities();
    const allHotels = getAllUniqueHotels();
    const allDestinations = getAllUniqueDestinations();

    // Inicializar el objeto de descripciones si no existe
    travelData.destinoDescriptions = travelData.destinoDescriptions || {};

    let html = '';

    const renderBlock = (type, list, title, icon, photosObj) => {
        let out = `
            <div class="mb-4">
                <h4 class="text-xs font-bold text-voyage-teal uppercase border-b border-voyage-border pb-1 mb-2 flex items-center gap-1.5 font-serif-title">
                    <i class="fa-solid ${icon}"></i> ${title} (${list.length})
                </h4>
        `;
        if (list.length === 0) {
            out += `<p class="text-xs text-slate-400 italic">Sin datos cargados.</p>`;
        } else {
            out += list.map((itemName, i) => {
                const currentPhoto = (photosObj && photosObj[itemName]) ? photosObj[itemName] : '';
                const isBase64 = currentPhoto && currentPhoto.length > 500;
                const displayValue = isBase64 ? '' : currentPhoto.replace(/"/g, '&quot;');
                const placeholder = isBase64 ? 'Imagen cargada desde archivo local' : 'URL de la imagen';
                const encName = encodeURIComponent(itemName);
                const imgThumb = currentPhoto ? `<img src="${currentPhoto}" class="w-9 h-9 rounded-lg object-cover border border-voyage-border shadow-xs flex-shrink-0">` : '';

                // NUEVO: Agregar campo de descripción solo si es un destino
                const currentDesc = (type === 'destino' && travelData.destinoDescriptions[itemName]) ? travelData.destinoDescriptions[itemName] : '';
                const descHtml = type === 'destino' ? `
                    <textarea placeholder="Descripción o detalles del destino..." 
                              onchange="updateDestinoDescription(decodeURIComponent('${encName}'), this.value)" 
                              class="w-full mt-2 bg-white border border-voyage-border rounded p-1.5 text-[11px] text-voyage-darkteal outline-none focus:border-voyage-terracotta" rows="2">${currentDesc}</textarea>
                ` : '';

                return `
                <div class="space-y-1 bg-voyage-cream p-2.5 rounded-xl border border-voyage-border shadow-xs mb-2">
                    <label class="block text-[11px] font-bold text-voyage-teal truncate" title="${itemName.replace(/"/g, '&quot;')}">${i + 1}. ${itemName}</label>
                    <div class="flex flex-col gap-2">
                        <div class="flex gap-2 items-center">
                            <input type="text" placeholder="${placeholder}" value="${displayValue}" onchange="updatePhotoUrl('${type}', decodeURIComponent('${encName}'), this.value)" class="flex-1 bg-white border border-voyage-border rounded p-1 text-[11px] text-voyage-darkteal focus:border-voyage-terracotta outline-none">
                            ${imgThumb}
                        </div>
                        <input type="file" accept="image/*" onchange="handleLocalPhotoUpload(event, '${type}', decodeURIComponent('${encName}'))" class="text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-voyage-teal file:text-white">
                    </div>
                    ${descHtml}
                </div>
                `;
            }).join('');
        }
        out += '</div>';
        return out;
    };

    html += renderBlock('activity', allActivities, 'Imágenes de Actividades y Tours', 'fa-compass', travelData.activityPhotos);
    html += renderBlock('hotel', allHotels, 'Imágenes de Hospedaje / Hoteles', 'fa-hotel', travelData.hotelPhotos);
    // Actualizado el título para indicar que se puede agregar descripción
    html += renderBlock('destino', allDestinations, 'Imágenes y Descripción de Destinos', 'fa-location-dot', travelData.destinoPhotos);

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
    
    if (typeof updateClientProposalView === 'function') {
        updateClientProposalView();
    }
}

function handleLocalPhotoUpload(event, type, itemName) {
    const file = event.target && event.target.files ? event.target.files[0] : null;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const dataUrl = e.target.result;
        updatePhotoUrl(type, itemName, dataUrl);
        if (typeof buildActivityPhotosUI === 'function') buildActivityPhotosUI(); 
    };
    
    reader.readAsDataURL(file);
}

function autoAssignUnsplashPhotos() {
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
    if (document.getElementById('cv-agent-name')) document.getElementById('cv-agent-name').innerText = agentName ? `Atendido por: ${agentName}` : '';
    if (document.getElementById('cv-greeting-text')) document.getElementById('cv-greeting-text').innerText = greeting;
    if (document.getElementById('cv-inclusions-text')) document.getElementById('cv-inclusions-text').innerText = inclusions;
    if (document.getElementById('cv-terms-text')) document.getElementById('cv-terms-text').innerText = terms;
    if (document.getElementById('cv-vigencia')) document.getElementById('cv-vigencia').innerText = vigencia;

    if (document.getElementById('cv-total-pax')) {
        document.getElementById('cv-total-pax').innerText = `${travelData.personas ? travelData.personas.length : 0} Pasajeros`;
    }
    if (document.getElementById('cv-total-destinos') && travelData.destinos) {
        document.getElementById('cv-total-destinos').innerText = travelData.destinos.map(d => d.ciudad).filter(Boolean).join(', ');
    }
    
    const totalDays = travelData.destinos ? travelData.destinos.reduce((sum, d) => sum + Number(d.dias || 0), 0) : 0;
    if (document.getElementById('cv-total-days')) {
        document.getElementById('cv-total-days').innerText = totalDays > 0 ? `${totalDays} Días / ${Math.max(0, totalDays - 1)} Noches` : '';
    }

    // Gran Total del Viaje
    let grandTotal = 0;
    const sumCost = (item) => { grandTotal += Number(item.precioCliente || 0); };

    if (Array.isArray(travelData.vuelos)) travelData.vuelos.forEach(sumCost);
    if (Array.isArray(travelData.hospedaje)) travelData.hospedaje.forEach(sumCost);
    if (Array.isArray(travelData.actividades)) travelData.actividades.forEach(sumCost);

    if (document.getElementById('cv-total-price')) {
        document.getElementById('cv-total-price').innerHTML = `
            <span class="font-bold text-xl text-voyage-terracotta block">$${grandTotal.toLocaleString('es-MX')} MXN</span>
        `;
    }

    // Render Hospedaje por Destino (Optimizado para móvil sin deformar imágenes)
    const hospedajeContainer = document.getElementById('cv-hospedaje-container');
    if (hospedajeContainer) {
        const hospedajeRaw = travelData.hospedaje || [];
        if (hospedajeRaw.length === 0) {
            hospedajeContainer.innerHTML = '';
        } else {
            const hospedajeGrouped = [];
            const destMap = {};

            hospedajeRaw.forEach(h => {
                const destKey = (h.destino || h.ciudad || h.hotel || 'Destino').trim().toLowerCase();
                if (!destMap[destKey]) {
                    destMap[destKey] = {
                        hotel: h.hotel,
                        destino: h.destino || h.ciudad || '',
                        checkIn: h.checkIn,
                        checkOut: h.checkOut,
                        noches: h.noches,
                        habitaciones: Number(h.habitaciones || 1),
                        tipo: h.tipo,
                        todoIncluido: h.todoIncluido
                    };
                    hospedajeGrouped.push(destMap[destKey]);
                } else {
                    destMap[destKey].habitaciones += Number(h.habitaciones || 0);
                }
            });

            const headerHtml = `
                <div class="flex items-center justify-between border-b border-voyage-border pb-2">
                    <h3 class="text-base font-bold text-voyage-teal flex items-center gap-2 font-serif-title">
                        <i class="fa-solid fa-hotel text-voyage-sage"></i> Hospedaje Seleccionado por Destino
                    </h3>
                    <img src="assets/ELEMENTOS-MARCA-02.jpg" class="h-8 w-auto object-contain rounded" onerror="this.style.display='none'">
                </div>
            `;

            const cardsHtml = hospedajeGrouped.map((h, idx) => {
                const photo = (travelData.hotelPhotos && travelData.hotelPhotos[h.hotel]) || (travelData.destinoPhotos && travelData.destinoPhotos[h.destino]) || '';
                // IMAGEN OPTIMIZADA AQUÍ
                const imgHtml = photo ? `<img src="${photo}" class="w-full sm:w-44 h-48 sm:h-auto object-cover object-center flex-shrink-0 rounded-t-xl sm:rounded-tr-none sm:rounded-l-xl">` : '';

                const cardContent = `
                    <div class="bg-voyage-cream border border-voyage-border rounded-xl overflow-hidden flex flex-col sm:flex-row shadow-xs">
                        ${imgHtml}
                        <div class="p-3.5 flex-1 flex flex-col justify-between space-y-1">
                            <div>
                                <div class="flex items-center justify-between gap-2">
                                    <h4 class="font-bold text-voyage-teal text-sm font-serif-title flex items-center gap-1.5">
                                        <i class="fa-solid fa-hotel text-voyage-sage"></i> ${h.hotel || ''}
                                    </h4>
                                    ${h.destino ? `<span class="bg-voyage-paper text-voyage-teal text-[10px] font-bold px-2 py-0.5 rounded border border-voyage-border shrink-0">${h.destino}</span>` : ''}
                                </div>
                                <p class="text-slate-700 text-[11px] mt-1">
                                    Check-in: <b>${h.checkIn || ''}</b> | Check-out: <b>${h.checkOut || ''}</b> ${h.noches ? `(${h.noches} Noches)` : ''}
                                </p>
                                <p class="text-voyage-terracotta font-medium text-[11px] mt-1">
                                    Plan: <b>${h.todoIncluido || ''}</b> | Tipo: ${h.tipo || 'Habitación Standard'} | Habitaciones: ${h.habitaciones || 1}
                                </p>
                            </div>
                            <div class="pt-1.5 border-t border-voyage-border/60 flex items-center justify-between text-[11px]">
                                <span class="text-slate-500">Reserva confirmada para la estancia del grupo</span>
                            </div>
                        </div>
                    </div>
                `;

                return idx === 0 ? `<div class="pdf-avoid-break space-y-3">${headerHtml}${cardContent}</div>` : `<div class="pdf-avoid-break">${cardContent}</div>`;
            }).join('');

            hospedajeContainer.innerHTML = cardsHtml;
        }
    }

    // Render Destinos (Optimizado para móvil sin deformar imágenes)
    const destinosContainer = document.getElementById('cv-destinos-container');
    if (destinosContainer) {
        const allUniqueDestinations = getAllUniqueDestinations();
        
        if (allUniqueDestinations.length === 0) {
            destinosContainer.innerHTML = '';
        } else {
            const headerHtml = `
                <div class="flex items-center justify-between border-b border-voyage-border pb-2 mb-3">
                    <h3 class="text-base font-bold text-voyage-teal flex items-center gap-2 font-serif-title">
                        <i class="fa-solid fa-map-location-dot text-voyage-terracotta"></i> Destinos a Explorar
                    </h3>
                </div>
            `;

            let hasContent = false;
            const cardsHtml = allUniqueDestinations.map((dest, idx) => {
                const photo = (travelData.destinoPhotos && travelData.destinoPhotos[dest]) ? travelData.destinoPhotos[dest] : '';
                const desc = (travelData.destinoDescriptions && travelData.destinoDescriptions[dest]) ? travelData.destinoDescriptions[dest] : '';
                
                if (!photo && !desc) return '';
                hasContent = true;

                // IMAGEN OPTIMIZADA AQUÍ
                const imgHtml = photo ? `<img src="${photo}" class="w-full sm:w-1/3 md:w-48 h-48 sm:h-auto object-cover object-center flex-shrink-0 rounded-t-xl sm:rounded-tr-none sm:rounded-l-xl">` : '';
                
                const cardContent = `
                    <div class="bg-voyage-cream border border-voyage-border rounded-xl overflow-hidden flex flex-col sm:flex-row shadow-xs mb-3">
                        ${imgHtml}
                        <div class="p-4 flex-1 flex flex-col justify-center gap-2">
                            <h4 class="font-bold text-voyage-teal text-base font-serif-title flex items-center gap-1.5">
                                <i class="fa-solid fa-location-dot text-voyage-sage"></i> ${dest}
                            </h4>
                            ${desc ? `<p class="text-slate-700 text-xs leading-relaxed whitespace-pre-line">${desc}</p>` : ''}
                        </div>
                    </div>
                `;

                return idx === 0 ? `<div class="pdf-avoid-break">${cardContent}</div>` : `<div class="pdf-avoid-break">${cardContent}</div>`;
            }).join('');

            destinosContainer.innerHTML = hasContent ? (headerHtml + cardsHtml) : ''; 
        }
    }

    // Render Itinerario 
    renderItineraryByGroups();

    // Render Anexo: Vuelos por Pasajero 
    const vuelosContainer = document.getElementById('cv-vuelos-container');
    // En js/ui-render.js, dentro de updateClientProposalView(), reemplaza el renderizado de vuelos por:
    if (vuelosContainer) {
    const vuelos = travelData.vuelos || [];
    if (vuelos.length === 0) {
        vuelosContainer.innerHTML = '';
    } else {
        const headerHtml = `
            <div class="flex items-center justify-between border-b border-voyage-border pb-2 pdf-avoid-break">
                <h3 class="text-base font-bold text-voyage-teal flex items-center gap-2 font-serif-title">
                    <i class="fa-solid fa-paperclip text-voyage-terracotta"></i> ANEXO: Itinerario de vuelos por pasajero
                </h3>
                <img src="assets/ELEMENTOS-MARCA-06.png" class="h-8 w-auto object-contain" onerror="this.style.display='none'">
            </div>
        `;

        const cardsHtml = vuelos.map((v) => {
            const transporteTexto = (v.medioTransporte || v.empresa) ? `${v.medioTransporte || ''} ${v.empresa || ''}`.trim() : '';
            const transporteTag = transporteTexto ? `<span class="bg-voyage-teal text-white text-[10px] font-bold px-2 py-0.5 rounded">${transporteTexto}</span>` : '';
            const redondoTag = v.redondo ? `<span class="text-slate-500 text-[11px]">(${v.redondo === 'Sí' ? 'Viaje Redondo' : 'Sencillo'})</span>` : '';
            const terminalText = v.terminal ? `<b>Terminal:</b> ${v.terminal} | ` : '';
            const salidaText = (v.fechaDespegue || v.horaDespegue) ? `<i class="fa-solid fa-plane-departure text-voyage-terracotta mr-1"></i><b>Salida:</b> ${v.fechaDespegue || ''} ${v.horaDespegue || ''} ` : '';
            const llegadaText = (v.fechaAterrizaje || v.horaAterrizaje) ? `<i class="fa-solid fa-plane-arrival text-voyage-sage ml-2 mr-1"></i><b>Llegada:</b> ${v.fechaAterrizaje || ''} ${v.horaAterrizaje || ''}` : '';
            const equipajeText = v.equipaje ? `<p class="text-slate-500 text-[11px]">Equipaje: ${v.equipaje} ${v.escalas ? '| Escalas: ' + v.escalas : ''}</p>` : '';

            return `
                <div class="pdf-avoid-break bg-voyage-cream border border-voyage-border rounded-xl p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shadow-xs">
                    <div class="space-y-1">
                        <div class="flex items-center gap-2 flex-wrap">
                            ${transporteTag}
                            <span class="font-bold text-voyage-teal text-sm">${v.salida || ''} ➔ ${v.destino || ''}</span>
                            ${redondoTag}
                        </div>
                        <p class="text-slate-700 text-[11px]">${terminalText}Pasajero: <b>${v.pasajero || ''}</b></p>
                        <p class="text-slate-600 text-[11px]">${salidaText}${llegadaText}</p>
                        ${equipajeText}
                    </div>
                </div>
            `;
        }).join('');

        vuelosContainer.innerHTML = `<div class="space-y-3">${headerHtml}${cardsHtml}</div>`;
    }
    }
}
function updateDestinoDescription(itemName, text) {
    travelData.destinoDescriptions = travelData.destinoDescriptions || {};
    travelData.destinoDescriptions[itemName] = text;
    if (typeof updateClientProposalView === 'function') {
        updateClientProposalView();
    }
}

function renderItineraryByGroups() {
    const container = document.getElementById('cv-itinerario-container');
    if (!container) return;

    const groupPassengersMap = {};
    if (Array.isArray(travelData.personas)) {
        travelData.personas.forEach(p => {
            const gKey = String(p.grupo || 1).trim();
            if (!groupPassengersMap[gKey]) groupPassengersMap[gKey] = [];
            groupPassengersMap[gKey].push(p);
        });
    }

    const actividadCatalog = {};
    if (Array.isArray(travelData.actividades)) {
        travelData.actividades.forEach(a => {
            if (!a || !a.actividad) return;
            const normName = a.actividad.trim().toLowerCase();
            if (!actividadCatalog[normName]) {
                actividadCatalog[normName] = a;
            }
        });
    }

    const combinedMap = {};
    const hasItinerarioData = Array.isArray(travelData.itinerario) && travelData.itinerario.length > 0;

    if (hasItinerarioData) {
        travelData.itinerario.forEach(i => {
            if (!i || !i.actividad) return;
            const actName = i.actividad.trim();
            const normName = actName.toLowerCase();
            const gKey = String(i.grupo || 1).trim();
            const catalogItem = actividadCatalog[normName] || {};

            const fecha = i.fecha || catalogItem.fecha || '';
            const key = normName + '|' + fecha.trim() + '|' + gKey;

            if (!combinedMap[key]) {
                combinedMap[key] = {
                    actividad: actName,
                    fecha: fecha,
                    hora: i.hora || catalogItem.hora || '',
                    hora_llegada: i.hora_llegada || catalogItem.hora_llegada || null,
                    hora_salida: i.hora_salida || catalogItem.hora_salida || null,
                    lugar: i.lugar || catalogItem.lugar || '',
                    destino: i.destino || catalogItem.destino || '',
                    duracion: catalogItem.duracion || i.duracion || '',
                    grupo: gKey,
                    pasajerosSet: new Set(),
                    isAll: false
                };
            } else {
                if (i.hora_llegada) combinedMap[key].hora_llegada = i.hora_llegada;
                if (i.hora_salida) combinedMap[key].hora_salida = i.hora_salida;
                if (i.hora && !combinedMap[key].hora) combinedMap[key].hora = i.hora;
                if (i.lugar && !combinedMap[key].lugar) combinedMap[key].lugar = i.lugar;
                if (i.destino && !combinedMap[key].destino) combinedMap[key].destino = i.destino;
            }

            if (i.pasajeros) {
                const rawPas = String(i.pasajeros).trim();
                const normPas = rawPas.toLowerCase();
                if (normPas === 'todos los asignados' || normPas === 'grupo completo' || normPas === 'todos') {
                    combinedMap[key].isAll = true;
                } else {
                    rawPas.split(',').forEach(pName => {
                        const cleanName = pName.trim();
                        if (cleanName) combinedMap[key].pasajerosSet.add(cleanName);
                    });
                }
            }
        });
    } else if (Array.isArray(travelData.actividades) && travelData.actividades.length > 0) {
        travelData.actividades.forEach(a => {
            if (!a || !a.actividad) return;
            const actName = a.actividad.trim();
            const normName = actName.toLowerCase();
            const gKey = String(a.grupo || 1).trim();
            const key = normName + '|' + (a.fecha || '').trim() + '|' + gKey;

            if (!combinedMap[key]) {
                combinedMap[key] = {
                    actividad: actName,
                    fecha: a.fecha || '',
                    hora: a.hora || '',
                    hora_llegada: a.hora_llegada || null,
                    hora_salida: a.hora_salida || null,
                    lugar: a.lugar || '',
                    destino: a.destino || '',
                    duracion: a.duracion || '',
                    grupo: gKey,
                    pasajerosSet: new Set(),
                    isAll: true
                };
            }
        });
    }

    const allGroupKeysSet = new Set([
        ...Object.keys(groupPassengersMap),
        ...Object.values(combinedMap).map(item => item.grupo)
    ]);

    const allGroupKeys = Array.from(allGroupKeysSet).sort((a, b) => {
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
    });

    if (allGroupKeys.length === 0) {
        container.innerHTML = '';
        return;
    }

    const activitiesByGroup = {};
    Object.values(combinedMap).forEach(item => {
        const gKey = item.grupo;
        if (!activitiesByGroup[gKey]) activitiesByGroup[gKey] = [];
        activitiesByGroup[gKey].push(item);
    });

    const mainHeaderHtml = `
        <div class="flex items-center justify-between border-b border-voyage-border pb-2">
            <h3 class="text-base font-bold text-voyage-teal flex items-center gap-2 font-serif-title">
                <i class="fa-solid fa-compass text-voyage-terracotta"></i> Itinerario de Experiencias y Actividades
            </h3>
            <img src="assets/ELEMENTOS-MARCA-07.png" class="h-10 w-auto object-contain" onerror="this.style.display='none'">
        </div>
    `;

    container.innerHTML = allGroupKeys.map((gKey, groupIdx) => {
        const groupActivities = activitiesByGroup[gKey] || [];
        const passengersList = groupPassengersMap[gKey] || [];
        const totalPaxInGroup = passengersList.length;

        const passengersHtml = passengersList.map(p => {
            if (typeof p === 'string') return `<div>• ${p}</div>`;
            return `<div class="whitespace-nowrap truncate text-xs text-slate-700 mt-0.5">• <b>${p.nombre || ''}</b></div>`;
        }).join('');

        const activitiesHtml = groupActivities.length > 0 ? groupActivities.map((a) => {
            const photo = (travelData.activityPhotos && travelData.activityPhotos[a.actividad]) ? travelData.activityPhotos[a.actividad] : '';
            // IMAGEN OPTIMIZADA AQUÍ
            const imgHtml = photo ? `<img src="${photo}" class="w-full sm:w-44 h-48 sm:h-auto object-cover object-center flex-shrink-0 rounded-t-xl sm:rounded-tr-none sm:rounded-l-xl">` : '';

            let asignadosTexto = '';
            const assignedArray = Array.from(a.pasajerosSet);

            if (a.isAll || assignedArray.length === 0 || (totalPaxInGroup > 0 && assignedArray.length >= totalPaxInGroup)) {
                asignadosTexto = 'Todos';
            } else {
                asignadosTexto = assignedArray.join(', ');
            }

            let displayTime = a.hora || '';
            if (a.hora_salida && a.hora_llegada) {
                displayTime = `Salida: ${a.hora_salida} | Llegada: ${a.hora_llegada}`;
            } else if (a.hora_salida) {
                displayTime = `Salida: ${a.hora_salida}`;
            } else if (a.hora_llegada) {
                displayTime = `Llegada: ${a.hora_llegada}`;
            }

            return `
                <div class="bg-white border border-voyage-border rounded-xl overflow-hidden flex flex-col sm:flex-row shadow-xs pdf-avoid-break">
                    ${imgHtml}
                    <div class="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                        <div>
                            <div class="flex items-center justify-between gap-2">
                                <span class="text-voyage-terracotta font-bold text-[11px]"><i class="fa-regular fa-clock mr-1"></i>${a.fecha || ''} ${displayTime ? '- ' + displayTime : ''}</span>
                                ${a.duracion ? `<span class="bg-voyage-cream text-voyage-teal text-[10px] px-2 py-0.5 rounded font-semibold border border-voyage-border shrink-0">${a.duracion}</span>` : ''}
                            </div>
                            <h5 class="font-bold text-voyage-teal text-sm mt-1 font-serif-title">${a.actividad || ''}</h5>
                            <p class="text-slate-600 text-[11px] mt-1"><i class="fa-solid fa-users text-voyage-terracotta mr-1"></i> Asignados: <b>${asignadosTexto}</b></p>
                            ${(a.lugar || a.destino) ? `<p class="text-slate-600 text-[11px] mt-0.5"><i class="fa-solid fa-location-dot text-voyage-terracotta mr-1"></i>${a.lugar || ''} ${a.destino ? '(' + a.destino + ')' : ''}</p>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('') : '<p class="text-slate-500 italic text-xs">Sin actividades programadas para este grupo.</p>';

        const groupHeaderHtml = `
            <div class="flex flex-col sm:flex-row sm:items-start justify-between pb-3 border-b border-voyage-border gap-3">
                <div class="flex items-center gap-2">
                    <span class="bg-voyage-terracotta text-white font-bold text-xs px-2.5 py-1 rounded-lg">Grupo ${gKey}</span>
                    <h4 class="font-bold text-voyage-teal text-sm">Itinerario Programado</h4>
                </div>
                
                ${passengersHtml ? `
                <div class="bg-white px-3 py-2 rounded-xl border border-voyage-border shadow-xs min-w-[220px]">
                    <div class="flex items-center gap-1.5 mb-1 text-voyage-sage border-b border-voyage-border pb-1">
                        <i class="fa-solid fa-id-card"></i> <span class="font-bold uppercase text-[10px] tracking-wide">Ficha de Pasajeros</span>
                    </div>
                    <div class="flex flex-col">
                        ${passengersHtml}
                    </div>
                </div>` : ''}
            </div>
        `;

        if (groupIdx === 0) {
            return `
                <div class="space-y-4">
                    <div class="pdf-avoid-break space-y-3">
                        ${mainHeaderHtml}
                        <div class="bg-voyage-cream/60 border border-voyage-border rounded-2xl p-4 shadow-xs">
                            ${groupHeaderHtml}
                        </div>
                    </div>
                    <div class="space-y-3">
                        ${activitiesHtml}
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="space-y-3 pt-2">
                    <div class="bg-voyage-cream/60 border border-voyage-border rounded-2xl p-4 shadow-xs pdf-avoid-break">
                        ${groupHeaderHtml}
                    </div>
                    <div class="space-y-3">
                        ${activitiesHtml}
                    </div>
                </div>
            `;
        }
    }).join('');
}