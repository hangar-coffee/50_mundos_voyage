async function getCoordinatesForDestination(cityName, countryName) {
    const cleanCity = (cityName || '').trim();
    const cleanCountry = (countryName || '').trim();
    const fullQuery = `${cleanCity}, ${cleanCountry}`.trim();
    const cacheKey = fullQuery.toLowerCase();

    if (geoCache[cacheKey]) {
        return geoCache[cacheKey];
    }

    const normCity = cleanCity.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (window.geoCoordinates) {
        for (let key in window.geoCoordinates) {
            if (normCity.includes(key) || key.includes(normCity)) {
                geoCache[cacheKey] = window.geoCoordinates[key];
                return window.geoCoordinates[key];
            }
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
    if (!travelData || !travelData.destinos || travelData.destinos.length === 0) return;

    const routePoints = [];
    const timelineHtml = [];

    for (let index = 0; index < travelData.destinos.length; index++) {
        const d = travelData.destinos[index];
        const coords = await getCoordinatesForDestination(d.ciudad, d.pais);
        d._coords = coords;
        routePoints.push({
            name: `${d.ciudad}, ${d.pais}`,
            coords: coords,
            days: d.dias,
            arrival: d.llegada
        });

        timelineHtml.push(`
            <div class="flex items-center gap-1.5 bg-voyage-cream px-3 py-1.5 rounded-lg border border-voyage-border text-slate-700">
                <span class="font-bold text-voyage-teal">${index + 1}.</span>
                <span class="font-bold text-voyage-teal">${d.ciudad} (${d.pais})</span>
                <span class="text-[10px] text-voyage-sage font-medium">(${d.dias}d)</span>
            </div>
            ${index < travelData.destinos.length - 1 ? '<i class="fa-solid fa-chevron-right text-voyage-sand text-xs"></i>' : ''}
        `);
    }

    const timelineContainer = document.getElementById('routeTimelineList');
    if (timelineContainer) timelineContainer.innerHTML = timelineHtml.join('');

    const firstCoords = routePoints[0]?.coords || [21.1619, -86.8515];

    if (mapDestinosObj) mapDestinosObj.remove();
    const elemDest = document.getElementById('mapDestinos');
    if (elemDest) {
        mapDestinosObj = L.map('mapDestinos', { preferCanvas: true }).setView(firstCoords, 5);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            crossOrigin: 'anonymous',
            maxZoom: 19
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
    }

    if (mapRutaObj) mapRutaObj.remove();
    const elemRuta = document.getElementById('mapRuta');
    if (elemRuta) {
        mapRutaObj = L.map('mapRuta', { preferCanvas: true }).setView(firstCoords, 5);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            crossOrigin: 'anonymous',
            maxZoom: 19
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
    }

    setTimeout(() => {
        if (mapDestinosObj) mapDestinosObj.invalidateSize();
        if (mapRutaObj) mapRutaObj.invalidateSize();
    }, 200);
}

async function renderClientMapView() {
    if (!travelData || !travelData.destinos || travelData.destinos.length === 0) return;
    const elemMap = document.getElementById('mapClientView');
    if (!elemMap) return;

    const routePoints = [];
    const legendHtml = [];

    for (let idx = 0; idx < travelData.destinos.length; idx++) {
        const d = travelData.destinos[idx];
        const coords = await getCoordinatesForDestination(d.ciudad, d.pais);
        d._coords = coords;
        routePoints.push({ name: `${d.ciudad}, ${d.pais}`, ciudad: d.ciudad, coords, dias: d.dias });

        legendHtml.push(`
            <div class="flex items-center gap-1.5 bg-white border border-voyage-border px-2.5 py-1 rounded-lg text-voyage-teal font-semibold shadow-xs">
                <span class="font-bold text-voyage-teal text-xs">${idx + 1}.</span>
                <span>${d.ciudad}${d.pais ? ', ' + d.pais : ''}</span>
                <span class="text-[10px] text-slate-500 font-normal">(${d.dias || 1}d)</span>
            </div>
        `);
    }

    const legendContainer = document.getElementById('cv-map-legend');
    if (legendContainer) legendContainer.innerHTML = legendHtml.join('');

    const firstCoords = routePoints[0]?.coords || [21.1619, -86.8515];

    if (mapClientViewObj) {
        mapClientViewObj.remove();
        mapClientViewObj = null;
    }
    
    mapClientViewObj = L.map('mapClientView', { preferCanvas: true }).setView(firstCoords, 5);
    
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        crossOrigin: 'anonymous',
        maxZoom: 19
    }).addTo(mapClientViewObj);

    const latLngs = routePoints.map(p => p.coords);
    if (latLngs.length > 1) {
        const polyline = L.polyline(latLngs, { color: '#2C4445', weight: 4, lineCap: 'round' }).addTo(mapClientViewObj);
        mapClientViewObj.fitBounds(polyline.getBounds(), { padding: [35, 35], maxZoom: 10 });
    } else {
        mapClientViewObj.setView(firstCoords, 6);
    }

    routePoints.forEach((d, idx) => {
        const numberIcon = L.divIcon({
            className: 'custom-map-number-pin',
            html: `<div style="background-color:#C8401C; color:#FFF; font-weight:bold; font-size:11px; font-family:sans-serif; border:2px solid #FFF; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 5px rgba(0,0,0,0.3);">${idx + 1}</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });

        L.marker(d.coords, { icon: numberIcon }).addTo(mapClientViewObj)
            .bindPopup(`<b>${idx + 1}. ${d.name}</b><br>${d.dias} Días de estancia`);
    });

    setTimeout(() => {
        if (mapClientViewObj) mapClientViewObj.invalidateSize();
    }, 200);
}

function prepareMapForCapture() {
    const mapContainer = document.getElementById('mapClientView');
    if (!mapContainer || mapContainer.offsetWidth === 0 || !mapClientViewObj) return null;

    const width = mapContainer.offsetWidth;
    const height = mapContainer.offsetHeight || 240;
    const containerRect = mapContainer.getBoundingClientRect();

    const canvas = document.createElement('canvas');
    const scale = 2;
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    const tiles = mapContainer.querySelectorAll('.leaflet-tile-pane img');
    tiles.forEach(tile => {
        if (tile.src && tile.complete && tile.naturalWidth !== 0) {
            const rect = tile.getBoundingClientRect();
            const x = rect.left - containerRect.left;
            const y = rect.top - containerRect.top;
            try {
                ctx.drawImage(tile, x, y, rect.width, rect.height);
            } catch(e) {}
        }
    });

    if (travelData && travelData.destinos && travelData.destinos.length > 0) {
        const points = [];
        for (let d of travelData.destinos) {
            if (d._coords) {
                const containerPoint = mapClientViewObj.latLngToContainerPoint(d._coords);
                points.push(containerPoint);
            }
        }

        if (points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.strokeStyle = '#2C4445';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
        }
    }

    if (travelData && travelData.destinos && travelData.destinos.length > 0) {
        travelData.destinos.forEach((d, idx) => {
            if (!d._coords) return;
            const pt = mapClientViewObj.latLngToContainerPoint(d._coords);
            const x = pt.x;
            const y = pt.y;

            ctx.beginPath();
            ctx.arc(x, y, 12, 0, 2 * Math.PI);
            ctx.fillStyle = '#C8401C';
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#FFFFFF';
            ctx.stroke();

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 11px Montserrat, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(idx + 1), x, y);
        });
    }

    const wrapper = document.createElement('div');
    wrapper.id = 'mapStaticWrapper';
    wrapper.className = mapContainer.className;
    wrapper.style.cssText = mapContainer.style.cssText;
    wrapper.style.position = 'relative';
    wrapper.style.overflow = 'hidden';
    wrapper.style.height = height + 'px';
    wrapper.style.width = '100%';

    const staticImg = document.createElement('img');
    staticImg.src = canvas.toDataURL('image/png');
    staticImg.style.width = '100%';
    staticImg.style.height = '100%';
    staticImg.style.objectFit = 'cover';
    staticImg.style.display = 'block';
    staticImg.style.borderRadius = '12px';

    wrapper.appendChild(staticImg);

    mapContainer.parentNode.insertBefore(wrapper, mapContainer);
    mapContainer.style.display = 'none';

    return wrapper;
}

function restoreMapAfterCapture(wrapper) {
    const mapContainer = document.getElementById('mapClientView');
    if (wrapper && wrapper.parentNode) {
        wrapper.parentNode.removeChild(wrapper);
    }
    if (mapContainer) {
        mapContainer.style.display = 'block';
        if (typeof mapClientViewObj !== 'undefined' && mapClientViewObj) {
            mapClientViewObj.invalidateSize();
        }
    }
}
// Recalcular tamaño de los mapas al redimensionar la pantalla o rotar el celular
window.addEventListener('resize', () => {
    if (typeof mapDestinosObj !== 'undefined' && mapDestinosObj) mapDestinosObj.invalidateSize();
    if (typeof mapRutaObj !== 'undefined' && mapRutaObj) mapRutaObj.invalidateSize();
    if (typeof mapClientViewObj !== 'undefined' && mapClientViewObj) mapClientViewObj.invalidateSize();
});