window.addEventListener('DOMContentLoaded', () => {
    resetData();
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
        setTimeout(renderInteractiveMaps, 200);
    } else if (tabId === 'client') {
        updateClientProposalView();
        setTimeout(renderClientMapView, 200);
    }
}