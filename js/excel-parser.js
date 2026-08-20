function handleFileUpload(event) {
    const file = (event && event.target && event.target.files && event.target.files.length > 0) ? event.target.files[0] : null;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            if (!window.XLSX) {
                throw new Error("La librería SheetJS (XLSX) no está cargada en la página.");
            }

            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array', cellDates: true });

            if (!workbook || !workbook.SheetNames || !Array.isArray(workbook.SheetNames) || workbook.SheetNames.length === 0) {
                throw new Error("El archivo de Excel no contiene hojas de trabajo válidas.");
            }

            parseWorkbookData(workbook);

            const summary = document.getElementById('uploadSummary');
            if (summary) summary.classList.remove('hidden');

            const fileNameEl = document.getElementById('loadedFileName');
            if (fileNameEl) fileNameEl.innerText = `Archivo subido: ${file.name}`;

            const sheetsCountEl = document.getElementById('loadedSheetsCount');
            if (sheetsCountEl) sheetsCountEl.innerText = `Pestañas procesadas: ${workbook.SheetNames.join(', ')}`;

            const statusBadge = document.getElementById('dataStatusBadge');
            if (statusBadge) statusBadge.innerText = 'Datos de Excel Cargados';

            try {
                if (typeof renderTables === 'function') renderTables();
                if (typeof switchTab === 'function') switchTab('data');
            } catch (uiErr) {
                console.warn("Advertencia al actualizar la vista:", uiErr);
            }
        } catch (err) {
            console.error("Error procesando Excel:", err);
            alert("Error al leer la plantilla Excel: " + (err.message || err));
        } finally {
            if (event && event.target) event.target.value = '';
        }
    };
    reader.readAsArrayBuffer(file);
}

function normalizeText(str) {
    if (str === null || str === undefined) return '';
    return String(str).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Limpia formatos de moneda de celular ("$49,998.00") a número puro
function parseNumeric(val) {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    
    const cleanStr = String(val).replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
}

function parseWorkbookData(workbook) {
    if (typeof travelData !== 'undefined') {
        travelData.personas = [];
        travelData.destinos = [];
        travelData.vuelos = [];
        travelData.hospedaje = [];
        travelData.actividades = [];
        travelData.itinerario = [];
        travelData.paquetes = [];
        travelData.activityPhotos = {};
        travelData.hotelPhotos = {};
        travelData.destinoPhotos = {};
    }

    try {
        localStorage.clear();
    } catch(e) {
        console.warn("No se pudo limpiar el localStorage", e);
    }

    if (typeof resetData === 'function') {
        resetData();
    }

    if (!workbook || !workbook.SheetNames || !Array.isArray(workbook.SheetNames)) return;

    workbook.SheetNames.forEach(sheetName => {
        if (!sheetName) return;
        const cleanName = normalizeText(sheetName);
        const sheet = (workbook.Sheets && workbook.Sheets[sheetName]) ? workbook.Sheets[sheetName] : null;
        if (!sheet) return;

        try {
            const rawJson = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
            if (!Array.isArray(rawJson) || rawJson.length === 0) return;

            if (cleanName.includes('persona')) parsePersonasSheet(rawJson);
            else if (cleanName.includes('destino')) parseDestinosSheet(rawJson);
            else if (cleanName.includes('vuelo')) parseVuelosSheet(rawJson);
            else if (cleanName.includes('hospedaje') || cleanName.includes('hotel')) parseHospedajeSheet(rawJson);
            else if (cleanName.includes('actividad')) parseActividadesSheet(rawJson);
            else if (cleanName.includes('itinerario')) parseItinerarioSheet(rawJson);
        } catch (sheetErr) {
            console.warn(`Error en pestaña ${sheetName}:`, sheetErr);
        }
    });

    if (travelData && Array.isArray(travelData.actividades)) {
        travelData.actividades.forEach((act, idx) => {
            if (!act) return;
            const name = act.actividad || `Actividad ${idx + 1}`;
            const sampleList = (window.samplePhotos && Array.isArray(window.samplePhotos)) ? window.samplePhotos : [];
            travelData.activityPhotos[name] = sampleList.length > 0 ? sampleList[idx % sampleList.length] : '';
        });
    }

    try {
        if (typeof buildActivityPhotosUI === 'function') buildActivityPhotosUI();
    } catch (photoErr) {
        console.warn("Advertencia al construir galería de fotos:", photoErr);
    }
}

function findHeaderAndMap(rows, keywords) {
    if (!Array.isArray(rows) || rows.length === 0 || !Array.isArray(keywords) || keywords.length === 0) {
        return { headerIdx: 0, colMap: {} };
    }

    const normKeywords = keywords.map(kw => normalizeText(kw)).filter(Boolean);
    const maxSearchRows = Math.min(rows.length, 25);

    for (let i = 0; i < maxSearchRows; i++) {
        const row = rows[i];
        if (!Array.isArray(row) || row.length === 0) continue;
        const normRow = row.map(c => normalizeText(c));
        
        let matchCount = 0;
        normKeywords.forEach(normKw => {
            const hasMatch = normRow.some(cell => {
                if (!cell || typeof cell !== 'string') return false;
                const cleanCell = cell.trim();
                return cleanCell === normKw || cleanCell === normKw + 's';
            });
            if (hasMatch) matchCount++;
        });

        const minMatches = Math.min(normKeywords.length, 2);
        if (matchCount >= minMatches) {
            const map = {};
            normRow.forEach((cell, idx) => {
                if (cell && typeof cell === 'string' && cell.trim() !== '') {
                    map[cell.trim()] = idx;
                }
            });
            return { headerIdx: i, colMap: map };
        }
    }
    return { headerIdx: 0, colMap: {} };
}

function getVal(row, colMap, keywords, fallbackIdx = -1) {
    if (!Array.isArray(row) || row.length === 0) return '';
    
    const hasColMap = colMap && typeof colMap === 'object' && Object.keys(colMap).length > 0;
    
    if (hasColMap && Array.isArray(keywords)) {
        for (let kw of keywords) {
            if (!kw) continue;
            const normKw = normalizeText(kw);
            if (!normKw) continue;
            for (let key in colMap) {
                if (key && (key === normKw || key.includes(normKw))) {
                    const idx = colMap[key];
                    if (idx !== undefined && idx >= 0 && idx < row.length && row[idx] !== undefined && row[idx] !== null && String(row[idx]).trim() !== '') {
                        return row[idx];
                    }
                }
            }
        }
        return '';
    }

    if (!hasColMap && fallbackIdx >= 0 && fallbackIdx < row.length && row[fallbackIdx] !== undefined && row[fallbackIdx] !== null && String(row[fallbackIdx]).trim() !== '') {
        return row[fallbackIdx];
    }
    return '';
}

function parsePersonasSheet(rows) {
    if (!Array.isArray(rows) || rows.length === 0) return;
    const { headerIdx, colMap } = findHeaderAndMap(rows, ['nombre', 'persona', 'pasajero', 'paterno', 'nombres']);
    travelData.personas = travelData.personas || [];

    for (let i = headerIdx + 1; i < rows.length; i++) {
        const r = rows[i];
        if (!Array.isArray(r) || r.length === 0 || r.every(c => c === '' || c === null || c === undefined)) continue;

        let nombre = String(getVal(r, colMap, ['nombre completo', 'nombre', 'nombres', 'pasajero'], 3) || '').trim();
        const normNombre = normalizeText(nombre);

        // Auto-repara celdas con errores de fórmulas (#N/A) de celular
        if (!nombre || normNombre.includes('#') || normNombre === 'nombre' || normNombre === 'pasajero') {
            const tipo = String(getVal(r, colMap, ['tipo', 'categoria', 'categoría'], 0) || '').trim();
            const num = String(getVal(r, colMap, ['numero', 'número', 'no', 'id'], 1) || '').trim();
            const paterno = String(getVal(r, colMap, ['paterno', 'apellido paterno'], 1) || '').trim();
            const materno = String(getVal(r, colMap, ['materno', 'apellido materno'], 2) || '').trim();

            if (paterno || materno) {
                nombre = `${paterno} ${materno}`.trim();
            } else if (tipo || num) {
                nombre = `${tipo} ${num}`.trim();
            }
        }

        const finalNorm = normalizeText(nombre);
        if (!nombre || finalNorm.includes('#') || finalNorm === 'nombre' || finalNorm === 'pasajero') continue;

        travelData.personas.push({
            nombre: String(nombre),
            edad: getVal(r, colMap, ['edad', 'años', 'anos', 'age'], 4) || 'N/A',
            categoria: getVal(r, colMap, ['categoria', 'categoría', 'tipo', 'category'], 5) || 'ADULTO',
            grupo: getVal(r, colMap, ['grupo', 'grp', 'group'], 6) || 1,
            nivel: getVal(r, colMap, ['nivel', 'perfil', 'level'], 7) || 'Viajero',
            genero: getVal(r, colMap, ['genero', 'género', 'sexo', 'gender']) || '',
            contacto: getVal(r, colMap, ['contacto', 'numero', 'número', 'telefono', 'teléfono', 'celular', 'phone']) || '',
            alergias: getVal(r, colMap, ['alergia', 'alergias', 'restricciones', 'medico', 'médico', 'medical']) || ''
        });
    }
}

function parseDestinosSheet(rows) {
    if (!Array.isArray(rows) || rows.length === 0) return;
    const { headerIdx, colMap } = findHeaderAndMap(rows, ['ciudad', 'pais', 'destino']);
    travelData.destinos = travelData.destinos || [];

    for (let i = headerIdx + 1; i < rows.length; i++) {
        const r = rows[i];
        if (!Array.isArray(r) || r.length === 0 || r.every(c => c === '' || c === null || c === undefined)) continue;

        const ciudad = getVal(r, colMap, ['ciudad'], 1);
        const pais = getVal(r, colMap, ['pais', 'país'], 0);

        const normCiudad = normalizeText(ciudad);
        const normPais = normalizeText(pais);
        
        if ((!ciudad && !pais) || 
            normCiudad === 'ciudad' || 
            normPais === 'pais' || 
            normPais === 'país' || 
            normCiudad === 'nombre de ciudad' || 
            normCiudad === 'ciudad (pais)' ||
            normCiudad === 'ciudad (país)') continue;

        travelData.destinos.push({
            pais: String(pais || 'México'),
            ciudad: String(ciudad || 'Cancún'),
            destino: String(getVal(r, colMap, ['destino'], 2) || `${pais || ''}, ${ciudad || ''}`.trim()),
            llegada: formatDate(getVal(r, colMap, ['llegada', 'check in', 'fecha de llegada'], 3)),
            partida: formatDate(getVal(r, colMap, ['partida', 'salida', 'check out', 'fecha de partida'], 4)),
            dias: Number(getVal(r, colMap, ['dias', 'días'], 5)) || 1
        });
    }
}

function parseVuelosSheet(rows) {
    if (!Array.isArray(rows) || rows.length === 0) return;
    const { headerIdx, colMap } = findHeaderAndMap(rows, ['terminal', 'medio de transporte', 'empresa', 'pasajero', 'salida', 'destino']);
    travelData.vuelos = travelData.vuelos || [];

    for (let i = headerIdx + 1; i < rows.length; i++) {
        const r = rows[i];
        if (!Array.isArray(r) || r.length === 0 || r.every(c => c === '' || c === null || c === undefined)) continue;

        const pasajero = getVal(r, colMap, ['pasajero', 'nombre']);
        const salida = getVal(r, colMap, ['salida', 'origen']);
        const destino = getVal(r, colMap, ['destino']);

        const normPasajero = normalizeText(pasajero);
        if ((!pasajero && !salida && !destino) || normPasajero === 'pasajero') continue;

        const costoNeto = parseNumeric(getVal(r, colMap, ['costo 50 mundos', '50 mundos', 'costo']));
        const precioCliente = parseNumeric(getVal(r, colMap, ['precio cliente final', 'precio cliente', 'cliente final']));

        travelData.vuelos.push({
            terminal: String(getVal(r, colMap, ['terminal', 'aeropuerto']) || ''),
            medioTransporte: String(getVal(r, colMap, ['medio de transporte', 'medio', 'transporte']) || ''),
            empresa: String(getVal(r, colMap, ['empresa', 'aerolinea', 'aerolínea']) || ''),
            pasajero: String(pasajero || ''),
            salida: String(salida || ''),
            destino: String(destino || ''),
            redondo: String(getVal(r, colMap, ['es redondo', 'redondo']) || ''),
            equipaje: String(getVal(r, colMap, ['equipaje incluido', 'equipaje']) || ''),
            escalas: String(getVal(r, colMap, ['escalas', 'escala']) || ''),
            fechaDespegue: formatDate(getVal(r, colMap, ['fecha de salida', 'salida'])),
            horaDespegue: formatTime(getVal(r, colMap, ['hora de salida'])),
            fechaAterrizaje: formatDate(getVal(r, colMap, ['fecha de llegada', 'llegada'])),
            horaAterrizaje: formatTime(getVal(r, colMap, ['hora de llegada'])),
            costoNeto: costoNeto,
            precioCliente: precioCliente
        });
    }
}

function parseHospedajeSheet(rows) {
    if (!Array.isArray(rows) || rows.length === 0) return;
    const { headerIdx, colMap } = findHeaderAndMap(rows, ['hotel', 'check in', 'titular']);
    travelData.hospedaje = travelData.hospedaje || [];

    for (let i = headerIdx + 1; i < rows.length; i++) {
        const r = rows[i];
        if (!Array.isArray(r) || r.length === 0 || r.every(c => c === '' || c === null || c === undefined)) continue;

        const hotel = getVal(r, colMap, ['hotel'], 0);
        const checkIn = getVal(r, colMap, ['check in'], 1);
        const normHotel = normalizeText(hotel);

        if ((!hotel && !checkIn) || normHotel === 'hotel') continue;

        const costoNeto = parseNumeric(getVal(r, colMap, ['costo 50 mundos', '50 mundos', 'costo']));
        const precioCliente = parseNumeric(getVal(r, colMap, ['precio cliente final', 'precio cliente', 'cliente final'])) || (costoNeto > 0 ? costoNeto * 1.15 : 0);

        travelData.hospedaje.push({
            hotel: String(hotel || 'Hotel Seleccionado'),
            destino: String(getVal(r, colMap, ['destino', 'ciudad']) || ''),
            checkIn: formatDate(checkIn),
            checkOut: formatDate(getVal(r, colMap, ['check out'], 2)),
            noches: Number(getVal(r, colMap, ['noches'], 3)) || 1,
            habitaciones: Number(getVal(r, colMap, ['habs', 'habitacion'], 4)) || 1,
            tipo: String(getVal(r, colMap, ['tipo'], 5) || 'Standard'),
            todoIncluido: String(getVal(r, colMap, ['plan', 'todo incluido'], 6) || 'Sí'),
            pax: getVal(r, colMap, ['pax'], 7) || 2,
            titular: String(getVal(r, colMap, ['titular'], 9) || 'Cliente Titular'),
            costoNeto: costoNeto,
            precioCliente: precioCliente, 
            grupo: getVal(r, colMap, ['grupo'], 8) || 1
        });
    }
}

function parseActividadesSheet(rows) {
    if (!Array.isArray(rows) || rows.length === 0) return;
    const { headerIdx, colMap } = findHeaderAndMap(rows, ['actividad', 'fecha', 'lugar']);
    travelData.actividades = travelData.actividades || [];

    for (let i = headerIdx + 1; i < rows.length; i++) {
        const r = rows[i];
        if (!Array.isArray(r) || r.length === 0 || r.every(c => c === '' || c === null || c === undefined)) continue;

        const actividadStr = String(getVal(r, colMap, ['actividad', 'tour'], 0)).trim();
        const normActividad = normalizeText(actividadStr);

        if (!actividadStr || normActividad === 'actividad' || normActividad.includes('total') || normActividad.includes('utilidad')) continue;

        const costoNeto = parseNumeric(getVal(r, colMap, ['costo 50 mundos', '50 mundos', 'costo']));
        const precioCliente = parseNumeric(getVal(r, colMap, ['precio cliente final', 'precio cliente', 'cliente final'])) || (costoNeto > 0 ? costoNeto * 1.15 : 0);

        travelData.actividades.push({
            actividad: actividadStr,
            fecha: formatDate(getVal(r, colMap, ['fecha'], 1)),
            hora: formatTime(getVal(r, colMap, ['hora'], 2)),
            lugar: String(getVal(r, colMap, ['lugar'], 3) || 'Ubicación').trim(),
            destino: String(getVal(r, colMap, ['destino'], 4) || 'Destino').trim(),
            duracion: String(getVal(r, colMap, ['duracion'], 5) || 'Por definir').trim(),
            costoNeto: costoNeto,
            precioCliente: precioCliente,
            grupo: getVal(r, colMap, ['grupo'], 8) || 1
        });
    }
}

function parseItinerarioSheet(rows) {
    if (!Array.isArray(rows) || rows.length === 0) return;
    const { headerIdx, colMap } = findHeaderAndMap(rows, ['actividad', 'nombre', 'lugar', 'fecha']);
    travelData.itinerario = travelData.itinerario || [];

    for (let i = headerIdx + 1; i < rows.length; i++) {
        const r = rows[i];
        if (!Array.isArray(r) || r.length === 0 || r.every(c => c === '' || c === null || c === undefined)) continue;

        let rawActividad = getVal(r, colMap, ['actividad', 'tour', 'excursion', 'servicio'], 2);
        if (!rawActividad) {
            rawActividad = getVal(r, colMap, ['nombre de actividad'], 2) || getVal(r, colMap, ['nombre'], 0);
        }

        let rawLugar = getVal(r, colMap, ['lugar', 'ubicacion', 'punto'], 4);
        let actividadStr = String(rawActividad).trim();
        let lugarStr = String(rawLugar || 'Lugar').trim();

        const normActividad = normalizeText(actividadStr);
        if (!actividadStr || normActividad === 'actividad' || normActividad === 'nombre') continue;

        let rawSalida = getVal(r, colMap, ['hora de salida', 'salida']);
        let rawLlegada = getVal(r, colMap, ['hora de llegada', 'llegada']);

        travelData.itinerario.push({
            pasajeros: String(getVal(r, colMap, ['pasajero', 'pasajeros', 'cliente', 'nombre'], 0) || 'Todos los asignados'),
            grupo: getVal(r, colMap, ['grupo', 'grp'], 1) || 1,
            actividad: actividadStr,
            destino: String(getVal(r, colMap, ['destino', 'ciudad'], 3) || 'Destino'),
            lugar: lugarStr,
            hora: formatTime(getVal(r, colMap, ['hora', 'time', 'horario'], 5)),
            hora_salida: rawSalida ? formatTime(rawSalida) : null,
            hora_llegada: rawLlegada ? formatTime(rawLlegada) : null,
            fecha: formatDate(getVal(r, colMap, ['fecha', 'date', 'día', 'dia'], 6))
        });
    }
}

function formatDate(val) {
    if (val === null || val === undefined || val === '') return '';
    if (val instanceof Date) {
        if (isNaN(val.getTime())) return '';
        try { return val.toISOString().split('T')[0]; } catch (e) { return ''; }
    }
    if (typeof val === 'number') {
        try {
            if (window.XLSX && XLSX.SSF) {
                const date = XLSX.SSF.parse_date_code(val);
                if (date) return `${date.y}-${String(date.m).padStart(2,'0')}-${String(date.d).padStart(2,'0')}`;
            }
        } catch(e) {}
    }
    const str = String(val).trim();
    if (!str || str === '0') return '';
    if (str.includes('T')) return str.split('T')[0];
    if (str.includes(' ')) return str.split(' ')[0];
    return str;
}

function formatTime(val) {
    if (val === null || val === undefined || val === '') return '';
    if (val instanceof Date) {
        if (isNaN(val.getTime())) return '';
        return `${String(val.getHours()).padStart(2, '0')}:${String(val.getMinutes()).padStart(2, '0')}`;
    }
    if (typeof val === 'number') {
        const totalMinutes = Math.round(val * 24 * 60);
        const hours = Math.floor(totalMinutes / 60) % 24;
        const minutes = Math.floor(totalMinutes % 60);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    const str = String(val).trim();
    if (!str || str === '0') return '';
    return str;
}