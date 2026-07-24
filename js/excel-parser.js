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

function parseWorkbookData(workbook) {
    // 1. FORZAMOS el vaciado de los arreglos directamente.
    // Al no reasignar el objeto completo, evitamos errores si travelData es 'const' en otro archivo.
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

    // 2. Limpiamos la caché del navegador para matar los datos de sesiones pasadas de VS Code
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
        
        // Requiere coincidencia EXACTA de palabras clave de encabezado
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
    
    // 1. Búsqueda inteligente por nombre de columna
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
        // MODIFICACIÓN CLAVE: Si encontró los encabezados pero no halló esta columna en específico,
        // devolvemos vacío ('') en lugar de adivinar el índice. Esto evita que los datos se mezclen.
        return '';
    }

    // 2. El índice de respaldo SOLO se usa si el archivo de plano no tiene fila de encabezados.
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

        const nombre = getVal(r, colMap, ['nombre completo', 'nombre', 'nombres', 'pasajero'], 3) || 
                       `${getVal(r, colMap, ['paterno', 'apellido paterno'], 1)} ${getVal(r, colMap, ['materno', 'apellido materno'], 2)}`.trim();
        
        const normNombre = normalizeText(nombre);
        if (!nombre || normNombre === 'nombre' || normNombre === 'nombre completo' || normNombre === 'nombres' || normNombre === 'pasajero') continue;

        travelData.personas.push({
            nombre: String(nombre),
            // Ampliamos las palabras clave para encontrar las columnas sin importar dónde estén
            edad: getVal(r, colMap, ['edad', 'años', 'anos', 'age'], 4) || 'N/A',
            categoria: getVal(r, colMap, ['categoria', 'categoría', 'tipo', 'category'], 5) || 'ADULTO',
            grupo: getVal(r, colMap, ['grupo', 'grp', 'group'], 6) || 1,
            nivel: getVal(r, colMap, ['nivel', 'perfil', 'level'], 7) || 'Viajero',
            // Nuevos campos
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
    const { headerIdx, colMap } = findHeaderAndMap(rows, ['aerolinea', 'pasajero', 'despegue', 'salida']);
    travelData.vuelos = travelData.vuelos || [];

    for (let i = headerIdx + 1; i < rows.length; i++) {
        const r = rows[i];
        if (!Array.isArray(r) || r.length === 0 || r.every(c => c === '' || c === null || c === undefined)) continue;

        const pasajero = getVal(r, colMap, ['pasajero', 'nombre'], 3);
        const salida = getVal(r, colMap, ['salida', 'origen'], 4);
        const destino = getVal(r, colMap, ['destino'], 5);

        const normPasajero = normalizeText(pasajero);
        const normSalida = normalizeText(salida);
        const normDestino = normalizeText(destino);

        if ((!pasajero && !salida && !destino) || 
            normPasajero === 'pasajero' || 
            normSalida === 'salida' || 
            normSalida === 'origen' || 
            normDestino === 'destino') continue;

        const costoNeto = Number(getVal(r, colMap, ['50 mundos', 'costo'], 13)) || 0;
        const precioCliente = Number(getVal(r, colMap, ['precio cliente', 'cliente final'], 14)) || (costoNeto > 0 ? costoNeto * 1.15 : 0);

        travelData.vuelos.push({
            aeropuerto: String(getVal(r, colMap, ['aeropuerto'], 0) || 'AIC'),
            aerolinea: String(getVal(r, colMap, ['aerolinea', 'aerolínea'], 1) || 'Aerolínea'),
            grupo: getVal(r, colMap, ['grupo'], 2) || 1,
            pasajero: String(pasajero || 'Pasajero'),
            salida: String(salida || 'Origen'),
            destino: String(destino || 'Destino'),
            redondo: String(getVal(r, colMap, ['redondo'], 6) || 'Sí'),
            equipaje: String(getVal(r, colMap, ['equipaje'], 7) || 'Incluido'),
            escalas: String(getVal(r, colMap, ['escalas'], 8) || 'Directo'),
            fechaDespegue: formatDate(getVal(r, colMap, ['fecha de despegue', 'despegue'], 9)),
            horaDespegue: formatTime(getVal(r, colMap, ['hora de despegue'], 10)),
            fechaAterrizaje: formatDate(getVal(r, colMap, ['fecha de aterrizaje', 'aterrizaje'], 11)),
            horaAterrizaje: formatTime(getVal(r, colMap, ['hora de aterrizaje'], 12)),
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
        const normCheckIn = normalizeText(checkIn);
        
        // Se eliminó la línea "const grupo = normalizeText(grupo);" porque causaba error

        if ((!hotel && !checkIn) || 
            normHotel === 'hotel' || 
            normCheckIn === 'check in' || 
            normCheckIn === 'check-in') continue;

        const costoNeto = Number(getVal(r, colMap, ['50 mundos', 'costo'], 10)) || 0;
        const precioCliente = Number(getVal(r, colMap, ['precio cliente', 'cliente final'], 11)) || (costoNeto > 0 ? costoNeto * 1.15 : 0);

        travelData.hospedaje.push({
            hotel: String(hotel || 'Hotel Seleccionado'),
            checkIn: formatDate(checkIn),
            checkOut: formatDate(getVal(r, colMap, ['check out'], 2)),
            noches: Number(getVal(r, colMap, ['noches'], 3)) || 1,
            habitaciones: Number(getVal(r, colMap, ['habs', 'habitacion', 'habitación'], 4)) || 1,
            tipo: String(getVal(r, colMap, ['tipo'], 5) || 'Standard'),
            todoIncluido: String(getVal(r, colMap, ['todo incluido', 'plan'], 6) || 'Sí'),
            pax: getVal(r, colMap, ['pax'], 7) || 2,
            titular: String(getVal(r, colMap, ['titular'], 9) || 'Cliente Titular'),
            costoNeto: costoNeto,
            precioCliente: precioCliente, // <-- Coma agregada aquí
            grupo: getVal(r, colMap, ['grupo'], 8) || 1
        });
    }
}

function parseActividadesSheet(rows) {
    if (!Array.isArray(rows) || rows.length === 0) return;
    const { headerIdx, colMap } = findHeaderAndMap(rows, ['actividad', 'fecha', 'hora', 'lugar', 'duracion', 'duración']);
    travelData.actividades = travelData.actividades || [];

    const invalidKeywords = [
        'actividad', 'nombre de actividad', 'actividades', 'descripción', 'descripcion', 
        'tour', 'porcentaje', 'utilidad', 'porcentaje de utilidad', 'porcentaje de utilidad deseado',
        'total cliente', 'total 50 mundos', 'apartado', 'apartado de actividades', 'lugar', 'fecha', 'hora', 'duracion', 'duración'
    ];

    for (let i = headerIdx + 1; i < rows.length; i++) {
        const r = rows[i];
        if (!Array.isArray(r) || r.length === 0 || r.every(c => c === '' || c === null || c === undefined)) continue;

        let rawActividad = getVal(r, colMap, ['actividad', 'tour', 'excursion', 'excursión', 'servicio'], 0);
        let rawLugar = getVal(r, colMap, ['lugar', 'ubicacion', 'ubicación', 'punto de encuentro'], 3);
        
        let actividadStr = String(rawActividad).trim();
        let lugarStr = String(rawLugar || 'Ubicación').trim();

        const normActividad = normalizeText(actividadStr);

        if (!actividadStr || 
            invalidKeywords.some(kw => normActividad === kw) ||
            normActividad.includes('porcentaje') || 
            normActividad.includes('utilidad') || 
            normActividad.includes('apartado') ||
            normActividad.includes('total')) continue;

        const costoNeto = Number(getVal(r, colMap, ['50 mundos', 'costo', 'neto', 'precio neto'], 6)) || 0;
        const precioCliente = Number(getVal(r, colMap, ['precio cliente', 'cliente final', 'precio', 'venta'], 7)) || (costoNeto > 0 ? costoNeto * 1.15 : 0);

        travelData.actividades.push({
            actividad: actividadStr, // Toma exactamente lo que dice en el Excel
            fecha: formatDate(getVal(r, colMap, ['fecha', 'date', 'día', 'dia'], 1)),
            hora: formatTime(getVal(r, colMap, ['hora', 'time', 'horario'], 2)),
            lugar: lugarStr, // Toma exactamente lo que dice en el Excel
            destino: String(getVal(r, colMap, ['destino', 'ciudad', 'ubicación'], 4) || 'Destino').trim(),
            duracion: String(getVal(r, colMap, ['duracion', 'duración', 'tiempo'], 5) || 'Por definir').trim(),
            costoNeto: costoNeto,
            precioCliente: precioCliente,
            grupo: getVal(r, colMap, ['grupo', 'grp'], 8) || 1,
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

        let rawActividad = getVal(r, colMap, ['actividad', 'tour', 'excursion', 'excursión', 'servicio'], 2);
        if (!rawActividad) {
            rawActividad = getVal(r, colMap, ['nombre de actividad'], 2) || getVal(r, colMap, ['nombre'], 0);
        }

        let rawLugar = getVal(r, colMap, ['lugar', 'ubicacion', 'ubicación', 'punto'], 4);
        let actividadStr = String(rawActividad).trim();
        let lugarStr = String(rawLugar || 'Lugar').trim();

        const normActividad = normalizeText(actividadStr);
        if (!actividadStr || normActividad === 'actividad' || normActividad === 'nombre') continue;

        // Capturamos la hora cruda ANTES de formatearla para saber si la clienta realmente la escribió
        let rawSalida = getVal(r, colMap, ['hora de salida', 'salida', 'salida de']);
        let rawLlegada = getVal(r, colMap, ['hora de llegada', 'llegada', 'llegada a']);

        travelData.itinerario.push({
            pasajeros: String(getVal(r, colMap, ['pasajero', 'pasajeros', 'cliente', 'nombre'], 0) || 'Todos los asignados'),
            grupo: getVal(r, colMap, ['grupo', 'grp'], 1) || 1,
            actividad: actividadStr,
            destino: String(getVal(r, colMap, ['destino', 'ciudad'], 3) || 'Destino'),
            lugar: lugarStr,
            hora: formatTime(getVal(r, colMap, ['hora', 'time', 'horario'], 5)),
            // Asignamos la hora formateada SOLO si la celda no estaba vacía
            hora_salida: rawSalida ? formatTime(rawSalida) : null,
            hora_llegada: rawLlegada ? formatTime(rawLlegada) : null,
            fecha: formatDate(getVal(r, colMap, ['fecha', 'date', 'día', 'dia'], 6))
        });
    }
}
function formatDate(val) {
    if (val === null || val === undefined || val === '') return 'Por definir';
    if (val instanceof Date) {
        if (isNaN(val.getTime())) return 'Por definir';
        try {
            return val.toISOString().split('T')[0];
        } catch (e) {
            return 'Por definir';
        }
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
    if (!str || str === '0') return 'Por definir';
    if (str.includes('T')) return str.split('T')[0];
    if (str.includes(' ')) return str.split(' ')[0];
    return str;
}

function formatTime(val) {
    if (val === null || val === undefined || val === '') return '09:00';
    if (val instanceof Date) {
        if (isNaN(val.getTime())) return '09:00';
        return `${String(val.getHours()).padStart(2, '0')}:${String(val.getMinutes()).padStart(2, '0')}`;
    }
    if (typeof val === 'number') {
        const totalMinutes = Math.round(val * 24 * 60);
        const hours = Math.floor(totalMinutes / 60) % 24;
        const minutes = Math.floor(totalMinutes % 60);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    const str = String(val).trim();
    if (!str || str === '0') return '09:00';
    return str;
}