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

    let staticMapWrapper = null;

    try {
        if (mainBtn) mainBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Generando...';
        if (tabBtn) tabBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Generando...';

        switchTab('client');
        if (typeof updateClientProposalView === 'function') updateClientProposalView();
        if (typeof renderClientMapView === 'function') await renderClientMapView();

        await new Promise(r => setTimeout(r, 500));

        if (typeof prepareMapForCapture === 'function') {
            staticMapWrapper = prepareMapForCapture();
        }

        const element = document.getElementById('clientViewContainer');
        if (!element) return;

        const clientNameEl = document.getElementById('cv-client-name');
        let clientName = clientNameEl && clientNameEl.innerText ? clientNameEl.innerText.trim() : 'Cliente';
        clientName = clientName.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_");

        const opt = {
            margin:       [8, 6, 8, 6],
            filename:     `Cotizacion_50Mundos_${clientName || 'Viaje'}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { 
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false,
                scrollY: 0,
                backgroundColor: '#FAF8F5'
            },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak:    { 
                mode: ['css', 'legacy'],
                avoid: ['.pdf-avoid-break', '#mapClientView', '#mapStaticWrapper'] 
            }
        };

        await html2pdf().set(opt).from(element).save();

    } catch (err) {
        console.warn("Fallo en html2pdf, recurriendo a impresión nativa:", err);
        window.print();
    } finally {
        if (typeof restoreMapAfterCapture === 'function') {
            restoreMapAfterCapture(staticMapWrapper);
        }
        if (mainBtn) mainBtn.innerHTML = originalMainText;
        if (tabBtn) tabBtn.innerHTML = originalTabText;
    }
}