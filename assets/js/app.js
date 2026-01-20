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
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProfile();
            });
        }

        if (path.includes('create.php')) {
            setTimeout(() => this.initEditorMode(), 100);
        } else if (path.includes('go.php')) {
            this.initNavigationMode();
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
        // ... handled in profile view usually, but let's keep it clean
        // Note: Profile.php has its own form handler in checkCurrentPage() -> calls this.saveUpdateProfile() likely?
        // Wait, the original code had saveProfile here. We should look at that.
        // For now let's just make sure Render handles the Login redirect.
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
    }
};

// Start App when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
