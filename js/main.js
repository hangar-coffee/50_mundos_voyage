window.addEventListener('DOMContentLoaded', () => {
    if (typeof resetData === 'function') resetData();
    const currentDateEl = document.getElementById('cv-current-date');
    if (currentDateEl) {
        currentDateEl.innerText = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    }
});

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-white', 'text-voyage-teal', 'border', 'border-voyage-border', 'shadow-sm');
        btn.classList.add('text-slate-600');
    });

    const targetTab = document.getElementById('tab-' + tabId);
    if (targetTab) {
        targetTab.classList.remove('hidden');
    }

    const navBtn = document.getElementById('nav-' + tabId);
    if (navBtn && tabId !== 'client') {
        navBtn.classList.add('bg-white', 'text-voyage-teal', 'border', 'border-voyage-border', 'shadow-sm');
    }

    if (tabId === 'maps') {
        setTimeout(() => { if (typeof renderInteractiveMaps === 'function') renderInteractiveMaps(); }, 200);
    } else if (tabId === 'client') {
        if (typeof updateClientProposalView === 'function') updateClientProposalView();
        setTimeout(() => { if (typeof renderClientMapView === 'function') renderClientMapView(); }, 200);
    }
}

async function downloadPDF() {
    const mainBtn = document.getElementById('mainPdfBtn');
    const tabBtn = document.getElementById('tabPdfBtn');
    const originalMainText = mainBtn ? mainBtn.innerHTML : '';
    const originalTabText = tabBtn ? tabBtn.innerHTML : '';

    const element = document.getElementById('clientViewContainer');
    if (!element) return;

    // Guardar referencia del nodo en el DOM para devolverlo tras la captura
    const parent = element.parentNode;
    const nextSibling = element.nextSibling;
    const originalStyle = element.getAttribute('style') || '';
    const originalScrollY = window.scrollY;

    let staticMapWrapper = null;
    let containerWrapper = null;

    try {
        if (mainBtn) mainBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Generando...';
        if (tabBtn) tabBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Generando...';

        // 1. Activar pestaña cliente y resetear scroll
        switchTab('client');
        if (typeof updateClientProposalView === 'function') updateClientProposalView();
        window.scrollTo(0, 0);

        // 2. Contenedor temporal aislado en (0,0) con ABSOLUTE (no fixed) para evitar páginas en blanco
        containerWrapper = document.createElement('div');
        containerWrapper.id = 'pdf-render-container';
        containerWrapper.style.cssText = `
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 750px !important;
            background-color: #FAF8F5 !important;
            z-index: 999999 !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
        `;

        // 3. Estilos del documento ajustados a 750px exactos con padding equilibrado
        element.style.cssText = `
            width: 750px !important;
            max-width: 750px !important;
            min-width: 750px !important;
            margin: 0 !important;
            padding: 24px !important;
            box-sizing: border-box !important;
            background-color: #FAF8F5 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            transform: none !important;
        `;

        containerWrapper.appendChild(element);
        document.body.appendChild(containerWrapper);

        // 4. Redimensionar el mapa de Leaflet exactamente al ancho de 750px
        if (typeof renderClientMapView === 'function') await renderClientMapView();
        if (typeof mapClientViewObj !== 'undefined' && mapClientViewObj) {
            mapClientViewObj.invalidateSize();
        }
        await new Promise(r => setTimeout(r, 400));

        if (typeof prepareMapForCapture === 'function') {
            staticMapWrapper = prepareMapForCapture();
        }

        await new Promise(r => setTimeout(r, 300));

        const clientNameEl = document.getElementById('cv-client-name');
        let clientName = clientNameEl && clientNameEl.innerText ? clientNameEl.innerText.trim() : 'Cliente';
        clientName = clientName.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_");

        // 5. Opciones con 6mm de margen A4 para no cortar bordes ni sombras derechas
        const opt = {
            margin:       [6, 6, 6, 6],
            filename:     `Cotizacion_50Mundos_${clientName || 'Viaje'}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { 
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false,
                scrollX: 0,
                scrollY: 0,
                x: 0,
                y: 0,
                width: 750,
                windowWidth: 750,
                backgroundColor: '#FAF8F5'
            },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak:    { 
                mode: ['css', 'legacy'],
                avoid: ['.pdf-avoid-break', '#mapStaticWrapper', '#mapClientView'] 
            }
        };

        // Se envía 'element' directamente a html2pdf
        await html2pdf().set(opt).from(element).save();

    } catch (err) {
        console.error("Error generando PDF:", err);
        window.print();
    } finally {
        // 6. Restaurar mapa interactivo
        if (typeof restoreMapAfterCapture === 'function') {
            restoreMapAfterCapture(staticMapWrapper);
        }

        // Restaurar estilos y posición original del elemento en el sitio
        if (originalStyle) {
            element.setAttribute('style', originalStyle);
        } else {
            element.removeAttribute('style');
        }

        if (parent) {
            if (nextSibling) {
                parent.insertBefore(element, nextSibling);
            } else {
                parent.appendChild(element);
            }
        }

        if (containerWrapper && containerWrapper.parentNode) {
            containerWrapper.parentNode.removeChild(containerWrapper);
        }

        window.scrollTo(0, originalScrollY);

        if (mainBtn) mainBtn.innerHTML = originalMainText;
        if (tabBtn) tabBtn.innerHTML = originalTabText;
    }
}
// Recalcular el tamaño de los mapas al cambiar el tamaño de la pantalla o rotar el celular
window.addEventListener('resize', () => {
    if (typeof mapDestinosObj !== 'undefined' && mapDestinosObj) mapDestinosObj.invalidateSize();
    if (typeof mapRutaObj !== 'undefined' && mapRutaObj) mapRutaObj.invalidateSize();
    if (typeof mapClientViewObj !== 'undefined' && mapClientViewObj) mapClientViewObj.invalidateSize();
});