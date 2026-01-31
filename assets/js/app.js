/**
 * TrailConnect App Logic
 */

const App = {
    state: {
        currentUser: null,
        currentRoute: 'home',
        activeParcours: null,
    },

    init() {
        this.loadUser();
        // this.setupNavigation(); // No longer needed for SPA
        this.checkCurrentPage();
        this.render();
        console.log("TrailConnect Initialized (Multi-page)");
    },

    loadUser() {
        const stored = localStorage.getItem('tc_user');
        if (stored) {
            this.state.currentUser = JSON.parse(stored);
        }
    },

    logout() {
        localStorage.removeItem('tc_user');
        window.location.href = 'login.php';
    },

    checkCurrentPage() {
        const path = window.location.pathname;

        // Profile form listener if on profile page
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            // Populate
            if (this.state.currentUser) {
                document.getElementById('inp-name').value = this.state.currentUser.username || '';
                document.getElementById('inp-mode').value = this.state.currentUser.mode || 'solo';
                document.getElementById('inp-team').value = this.state.currentUser.team_id || '';
            }

            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProfile(); // Changed to saveProfile
            });
        }

        if (path.includes('create.php')) {
            setTimeout(() => this.initEditorMode(), 100);
        } else if (path.includes('go.php')) {
            this.initNavigationMode();
        } else if (path.includes('pois.php')) {
            this.initPoisMode();
        }
    },

    /* navigateTo(viewId) { ... removed ... } */

    render() {
        // Initial render logic
        if (!this.state.currentUser) {
            // Not logged in -> Redirect to Login
            if (!window.location.pathname.includes('login.php')) {
                window.location.href = 'login.php';
            }
        } else {
            const nameDisplay = document.getElementById('user-name-display');
            if (nameDisplay) nameDisplay.textContent = this.state.currentUser.username; // Changed name to username as per DB
        }
    },

    async saveProfile() {
        if (!this.state.currentUser) return;

        const name = document.getElementById('inp-name').value;
        const mode = document.getElementById('inp-mode').value;
        const team = document.getElementById('inp-team').value.toUpperCase();

        try {
            const res = await fetch('./api/auth.php', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'update',
                    id: this.state.currentUser.id,
                    username: name,
                    mode: mode,
                    team_id: team
                })
            });
            const data = await res.json();

            if (data.success) {
                // Update Local State
                this.state.currentUser.username = name;
                this.state.currentUser.mode = mode;
                this.state.currentUser.team_id = team;
                localStorage.setItem('tc_user', JSON.stringify(this.state.currentUser));

                alert("Profil mis à jour !");
                this.render(); // Update header name
            } else {
                alert("Erreur: " + data.error);
            }
        } catch (e) {
            console.error(e);
            alert("Erreur réseau");
        }
    },

    // ...

    async initNavigationMode() {
        if (!this.state.currentUser) return; // Should be handled by render redirect

        console.log("Navigation initialized - Loading routes...");

        // Reset view to selection
        const sel = document.getElementById('nav-selection');
        if (sel) sel.classList.remove('d-none');
        const active = document.getElementById('nav-active');
        if (active) active.classList.add('d-none');

        const listContainer = document.getElementById('routes-list');
        if (!listContainer) return;

        listContainer.innerHTML = '<div class="col-12"><p class="text-muted">Chargement...</p></div>';

        try {
            const res = await fetch(`./api/route.php?user_id=${this.state.currentUser.id}`); // Filter by user!
            const data = await res.json();

            if (data.success && data.routes.length > 0) {
                listContainer.innerHTML = '';
                data.routes.forEach(route => {
                    const el = document.createElement('div');
                    el.className = 'col-12 col-md-6 col-lg-4';
                    el.innerHTML = `
                        <div class="card border-0 bg-surface mb-2">
                            <div class="card-body py-2 px-3">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h3 class="h6 mb-0">${route.name}</h3>
                                        <p class="small text-muted mb-0">${parseFloat(route.distance_km).toFixed(2)} km</p>
                                    </div>
                                    <div class="d-flex gap-2">
                                        <button class="btn btn-outline-danger btn-sm rounded-circle p-2 d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;" onclick="App.deleteRoute(${route.id})">
                                            <i class="ph-bold ph-trash"></i>
                                        </button>
                                        <button class="btn btn-primary btn-sm rounded-pill px-3" onclick="App.startNavigation(${route.id}, '${route.name}')">
                                            Go <i class="ph-bold ph-arrow-right ms-1"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    listContainer.appendChild(el);
                });
            } else {
                listContainer.innerHTML = '<div class="col-12"><p class="text-muted">Aucun parcours trouvé. Créez-en un !</p></div>';
            }
        } catch (e) {
            console.error(e);
            listContainer.innerHTML = '<div class="col-12"><p class="text-danger">Erreur de chargement</p></div>';
        }
    },

    async deleteRoute(id) {
        if (!confirm("Supprimer définitivement ce parcours ?")) return;

        try {
            const res = await fetch(`./api/route.php?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                this.initNavigationMode(); // Reload list
            } else {
                alert("Erreur: " + data.error);
            }
        } catch (e) {
            console.error(e);
            alert("Erreur réseau");
        }
    },

    startNavigation(routeId, routeName) {
        // Switch views
        document.getElementById('nav-selection').classList.add('d-none');
        document.getElementById('nav-active').classList.remove('d-none');
        document.getElementById('nav-active').classList.add('d-flex'); // Ensure flex is on

        // Update Header
        document.getElementById('nav-route-name').textContent = routeName;

        // Init Map if needed
        if (window.initNavMap) window.initNavMap();

        // Load Route on Map
        if (window.loadRouteForNav) window.loadRouteForNav(routeId);
    },

    stopNavigation() {
        if (confirm("Arrêter la navigation ?")) {
            document.getElementById('nav-selection').classList.remove('d-none');
            document.getElementById('nav-active').classList.add('d-none');
            document.getElementById('nav-active').classList.remove('d-flex');
            // TODO: Stop tracking in map.js
        }
    },

    // --- POIS MODULE ---
    initPoisMode() {
        if (!this.state.currentUser) return; // Should allow redirect
        console.log("POIs Mode Initialized");

        // Load List
        this.loadPois();

        // Init Map
        if (window.initPoisMap) window.initPoisMap();

        // Form Handler
        const form = document.getElementById('poi-form');
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                await this.savePoi();
            };
        }

        // Modal Close Handler to reset toggle button
        const modalEl = document.getElementById('poiModal');
        if (modalEl) {
            modalEl.addEventListener('hidden.bs.modal', () => {
                // Only reset if we are still in "danger" mode (meaning we didn't just save which resets it too)
                const btn = document.getElementById('btn-add-poi');
                if (btn && btn.classList.contains('btn-danger')) {
                    // Call Cancel logic
                    this.togglePoiCreationMode();
                }
            });
        }
    },

    async loadPois() {
        const listContainer = document.getElementById('pois-list');
        if (!listContainer) return;

        try {
            const res = await fetch(`./api/pois.php?user_id=${this.state.currentUser.id}`);
            const data = await res.json();

            if (data.success) {
                // Render List
                if (data.points.length === 0) {
                    listContainer.innerHTML = '<p class="text-center text-muted small p-3">Aucun point enregistré.</p>';
                } else {
                    listContainer.innerHTML = data.points.map(p => `
                        <div class="d-flex justify-content-between align-items-center border-bottom py-2">
                            <div>
                                <strong>${p.name}</strong> <span class="badge bg-warning text-dark rounded-pill ms-1">${p.score || 0} pts</span>
                                <p class="mb-0 small text-muted text-truncate" style="max-width: 200px;">${p.description || ''}</p>
                            </div>
                            <button class="btn btn-sm btn-outline-danger" onclick="App.deletePoi(${p.id})">
                                <i class="ph-bold ph-trash"></i>
                            </button>
                        </div>
                    `).join('');
                }

                // Render on Map
                if (window.renderPoisOnMap) window.renderPoisOnMap(data.points);
            }
        } catch (e) {
            console.error(e);
            listContainer.innerHTML = '<p class="text-danger">Erreur chargement</p>';
        }
    },

    async savePoi() {
        const name = document.getElementById('poi-name').value;
        const score = document.getElementById('poi-score').value;
        const desc = document.getElementById('poi-desc').value;
        const lat = document.getElementById('poi-lat').value;
        const lng = document.getElementById('poi-lng').value;

        if (!name || !lat) {
            alert("Erreur de données");
            return;
        }

        try {
            const res = await fetch('./api/pois.php', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: this.state.currentUser.id,
                    name, score: score, description: desc, lat, lng
                })
            });
            const data = await res.json();

            if (data.success) {
                // Close modal (Bootstrap 5 vanilla way)
                const modalEl = document.getElementById('poiModal');
                const modal = bootstrap.Modal.getInstance(modalEl);
                modal.hide();

                // Refresh
                this.loadPois();
                document.getElementById('poi-form').reset();

                // Reset UI Button
                const btn = document.getElementById('btn-add-poi');
                if (btn && window.disablePoiMapClick) {
                    window.disablePoiMapClick(); // Stop click listener
                    btn.classList.remove('btn-danger');
                    btn.classList.add('btn-primary');
                    btn.innerHTML = '<i class="ph-bold ph-plus me-1"></i> Nouveau';
                }
            } else {
                alert("Erreur: " + data.error);
            }
        } catch (e) {
            console.error(e);
            alert("Erreur sauvegardé");
        }
    },

    async deletePoi(id) {
        if (!confirm("Supprimer ce point ?")) return;
        try {
            const res = await fetch(`./api/pois.php?id=${id}`, { method: 'DELETE' });
            if ((await res.json()).success) {
                this.loadPois();
            }
        } catch (e) {
            alert("Erreur");
        }
    },

    togglePoiCreationMode() {
        const btn = document.getElementById('btn-add-poi');
        if (btn.classList.contains('btn-danger')) {
            // Cancel mode
            if (window.disablePoiMapClick) window.disablePoiMapClick();
            btn.classList.remove('btn-danger');
            btn.classList.add('btn-primary');
            btn.innerHTML = '<i class="ph-bold ph-plus me-1"></i> Nouveau';
        } else {
            // Enable mode
            if (window.enablePoiMapClick) window.enablePoiMapClick();
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-danger');
            btn.innerHTML = '<i class="ph-bold ph-x me-1"></i> Annuler';
            // alert removed as requested
        }
    }
};

// Start App when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
