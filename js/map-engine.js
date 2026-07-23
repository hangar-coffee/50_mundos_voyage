async function getCoordinatesForDestination(cityName, countryName) {
    const cleanCity = (cityName || '').trim();
    const cleanCountry = (countryName || '').trim();
    const fullQuery = `${cleanCity}, ${cleanCountry}`.trim();
    const cacheKey = fullQuery.toLowerCase();

    if (geoCache[cacheKey]) {
        return geoCache[cacheKey];
    }

    const normCity = cleanCity.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    for (let key in window.geoCoordinates) {
        if (normCity.includes(key) || key.includes(normCity)) {
            geoCache[cacheKey] = window.geoCoordinates[key];
            return window.geoCoordinates[key];
        }
    }

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullQuery)}`);
        const data = await response.json();
        if (data && data.length > 0) {
            const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            geoCache[cacheKey] = coords;
            return coords;
        }
    } catch (err) {
        console.warn("Geocoding API fallthrough", err);
    }

    if (cleanCountry) {
        try {
            const respCountry = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanCountry)}`);
            const dataCountry = await respCountry.json();
            if (dataCountry && dataCountry.length > 0) {
                const coords = [parseFloat(dataCountry[0].lat), parseFloat(dataCountry[0].lon)];
                geoCache[cacheKey] = coords;
                return coords;
            }
        } catch (err) {}
    }

    return [19.4326, -99.1332];
}

async function renderInteractiveMaps() {
    if (travelData.destinos.length === 0) return;

    const routePoints = [];
    const timelineHtml = [];

    for (let index = 0; index < travelData.destinos.length; index++) {
        const d = travelData.destinos[index];
        const coords = await getCoordinatesForDestination(d.ciudad, d.pais);
        routePoints.push({
            name: `${d.ciudad}, ${d.pais}`,
            coords: coords,
            days: d.dias,
            arrival: d.llegada
        });

        timelineHtml.push(`
            <div class="flex items-center gap-1.5 bg-voyage-cream px-3 py-1.5 rounded-lg border border-voyage-border text-slate-700">
                <span class="w-5 h-5 rounded-full bg-voyage-terracotta text-white font-bold text-[10px] flex items-center justify-center">${index + 1}</span>
                <span class="font-bold text-voyage-teal">${d.ciudad} (${d.pais})</span>
                <span class="text-[10px] text-voyage-sage font-medium">(${d.dias}d)</span>
            </div>
            ${index < travelData.destinos.length - 1 ? '<i class="fa-solid fa-chevron-right text-voyage-sand text-xs"></i>' : ''}
        `);
    }

    document.getElementById('routeTimelineList').innerHTML = timelineHtml.join('');

    const firstCoords = routePoints[0]?.coords || [21.1619, -86.8515];

    if (mapDestinosObj) mapDestinosObj.remove();
    mapDestinosObj = L.map('mapDestinos').setView(firstCoords, 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(mapDestinosObj);

    const bounds1 = L.latLngBounds();
    routePoints.forEach((pt, i) => {
        L.marker(pt.coords).addTo(mapDestinosObj)
            .bindPopup(`<b>${i+1}. ${pt.name}</b><br>Estancia: ${pt.days} días<br>Llegada: ${pt.arrival}`);
        bounds1.extend(pt.coords);
    });

    if (routePoints.length > 1) {
        mapDestinosObj.fitBounds(bounds1, { padding: [40, 40], maxZoom: 10 });
    } else {
        mapDestinosObj.setView(firstCoords, 6);
    }

    if (mapRutaObj) mapRutaObj.remove();
    mapRutaObj = L.map('mapRuta').setView(firstCoords, 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(mapRutaObj);

    const latLngs = routePoints.map(p => p.coords);
    
    if (latLngs.length > 1) {
        const polyline = L.polyline(latLngs, { color: '#C8401C', weight: 4, dashArray: '8, 8', lineCap: 'round' }).addTo(mapRutaObj);
        mapRutaObj.fitBounds(polyline.getBounds(), { padding: [40, 40], maxZoom: 10 });
    } else {
        mapRutaObj.setView(firstCoords, 6);
    }

    routePoints.forEach((pt, i) => {
        L.circleMarker(pt.coords, {
            radius: 8,
            fillColor: '#2C4445',
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
        }).addTo(mapRutaObj).bindPopup(`<b>Parada ${i+1}: ${pt.name}</b>`);
    });

    setTimeout(() => {
        if (mapDestinosObj) mapDestinosObj.invalidateSize();
        if (mapRutaObj) mapRutaObj.invalidateSize();
    }, 200);
}

async function renderClientMapView() {
    if (travelData.destinos.length === 0) return;
    
    const routePoints = [];
    for (let d of travelData.destinos) {
        const coords = await getCoordinatesForDestination(d.ciudad, d.pais);
        routePoints.push({ name: `${d.ciudad}, ${d.pais}`, coords, dias: d.dias });
    }

    const firstCoords = routePoints[0]?.coords || [21.1619, -86.8515];

    if (mapClientViewObj) mapClientViewObj.remove();
    mapClientViewObj = L.map('mapClientView').setView(firstCoords, 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(mapClientViewObj);

    const latLngs = routePoints.map(p => p.coords);
    if (latLngs.length > 1) {
        const polyline = L.polyline(latLngs, { color: '#2C4445', weight: 4, lineCap: 'round' }).addTo(mapClientViewObj);
        mapClientViewObj.fitBounds(polyline.getBounds(), { padding: [30, 30], maxZoom: 10 });
    } else {
        mapClientViewObj.setView(firstCoords, 6);
    }

    routePoints.forEach((d) => {
        L.marker(d.coords).addTo(mapClientViewObj)
            .bindPopup(`<b>${d.name}</b><br>${d.dias} Días de estancia`);
    });

    setTimeout(() => {
        if (mapClientViewObj) mapClientViewObj.invalidateSize();
    }, 200);
}