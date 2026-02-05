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

        if (path.includes('create.php')) {
            setTimeout(() => this.initEditorMode(), 100);
        } else if (path.includes('go.php')) {
            this.initNavigationMode();
        } else if (path.includes('pois.php')) {
            this.initPoisMode();
        } else if (path.includes('results.php')) {
            this.initResultsMode();
        } else if (path.includes('profile.php')) {
            this.initProfileMode();
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

    async handleProfileSaveConfirm() {
        const pwd = document.getElementById('confirm-password-input').value;
        if (!pwd) { alert("Veuillez entrer votre mot de passe."); return; }

        // Hide Modal
        const modalEl = document.getElementById('confirmPasswordModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();

        await this.saveProfile(pwd);
    },

    async saveProfile(password) {
        if (!this.state.currentUser) return;

        const name = document.getElementById('inp-name').value;
        const email = document.getElementById('inp-email') ? document.getElementById('inp-email').value : this.state.currentUser.email;
        const mode = this.state.currentUser.mode || 'team'; // Default to existing or team

        // New Password Logic
        const newPwd = document.getElementById('inp-new-pwd') ? document.getElementById('inp-new-pwd').value : '';
        const newPwdConfirm = document.getElementById('inp-new-pwd-confirm') ? document.getElementById('inp-new-pwd-confirm').value : '';

        // Basic Client Validation
        if (newPwd && newPwd !== newPwdConfirm) {
            alert("Les nouveaux mots de passe ne correspondent pas.");
            return;
        }

        try {
            const res = await fetch('./api/auth.php', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'update',
                    id: this.state.currentUser.id,
                    username: name,
                    email: email,
                    mode: mode,
                    password: password,
                    new_password: newPwd
                })
            });
            const data = await res.json();

            if (data.success) {
                // Update Local State
                this.state.currentUser.username = name;
                this.state.currentUser.email = email;
                this.state.currentUser.mode = mode;
                localStorage.setItem('tc_user', JSON.stringify(this.state.currentUser));

                this.render(); // Update header name

                // Show success message (will be visible briefly before reload if valid, but reload is requested)
                // Actually user requested "actualise la page comme CTRL R"
                window.location.reload();
            } else {
                alert(data.error);
                console.error(data.error);
            }
        } catch (e) {
            console.error(e);
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

        try {
            const res = await fetch(`./api/route.php?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                this.initNavigationMode(); // Reload list
            } else {
                console.error(data.error);
            }
        } catch (e) {
            console.error(e);
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
        document.getElementById('nav-selection').classList.remove('d-none');
        document.getElementById('nav-active').classList.add('d-none');
        document.getElementById('nav-active').classList.remove('d-flex');
        // TODO: Stop tracking in map.js
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
                console.error(data.error);
            }
        } catch (e) {
            console.error(e);
        }
    },

    async deletePoi(id) {
        try {
            const res = await fetch(`./api/pois.php?id=${id}`, { method: 'DELETE' });
            if ((await res.json()).success) {
                this.loadPois();
            }
        } catch (e) {
            console.error("Erreur");
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
    },

    async finishRoute(score, totalSeconds, validations = []) {
        if (!this.state.currentUser) return;

        // Calculate timestamps
        const now = new Date();
        const endTimeStr = now.toISOString().slice(0, 19).replace('T', ' ');

        const startTime = new Date(now.getTime() - (totalSeconds * 1000));
        const startTimeStr = startTime.toISOString().slice(0, 19).replace('T', ' ');

        // 1. Save Attempt
        try {
            const res = await fetch('./api/attempt.php', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: this.state.currentUser.id,
                    route_id: window.currentNavRouteId,
                    score: score,
                    start_time: startTimeStr,
                    end_time: endTimeStr,
                    validations: validations
                })
            });
            const data = await res.json();

            // 2. Load Leaderboard
            const resL = await fetch(`./api/attempt.php?route_id=${window.currentNavRouteId}&user_id=${this.state.currentUser.id}`);
            const dataL = await resL.json();

            if (dataL.success) {
                const list = document.getElementById('results-leaderboard');
                list.innerHTML = dataL.leaderboard.map((a, i) => `
                    <div class="list-group-item bg-transparent text-light border-secondary d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center">
                            <span class="badge bg-secondary me-3 rounded-pill">${i + 1}</span>
                            <span>${a.username}</span>
                            ${a.user_id == this.state.currentUser.id ? '<span class="badge bg-primary ms-2">Moi</span>' : ''}
                        </div>
                        <div class="text-end">
                            <div class="fw-bold text-warning">${a.score} pts</div>
                            <small class="text-muted">${new Date(a.duration_seconds * 1000).toISOString().substr(11, 8)}</small>
                        </div>
                    </div>
                `).join('');
            }

            // 3. Show Modal
            document.getElementById('res-score').textContent = score + " pts";
            document.getElementById('res-time').textContent = new Date(totalSeconds * 1000).toISOString().substr(11, 8);

            const modal = new bootstrap.Modal(document.getElementById('resultsModal'));
            modal.show();

        } catch (e) {
            console.error(e);
            console.error("Erreur de sauvegarde des résultats");
        }
    },

    // RESULTS PAGE LOGIC
    async initResultsMode() {
        if (!this.state.currentUser) return;
        const container = document.getElementById('results-content');
        container.innerHTML = '<div class="p-3 text-center text-muted">Chargement...</div>';

        // 1. Fetch Routes relevant to user/team
        // reusing route API
        try {
            const res = await fetch(`./api/route.php?user_id=${this.state.currentUser.id}`);
            const data = await res.json();

            if (data.success) {
                if (data.routes.length === 0) {
                    container.innerHTML = '<div class="p-4 text-center text-muted">Aucun parcours trouvé.</div>';
                    return;
                }

                container.innerHTML = `<div class="list-group list-group-flush">
                    ${data.routes.map(r => `
                        <a href="#" class="list-group-item list-group-item-action bg-transparent text-light border-secondary"
                           onclick="App.loadRouteResults(${r.id}, '${r.name}')">
                            <div class="d-flex w-100 justify-content-between">
                                <h5 class="mb-1 text-primary">${r.name}</h5>
                                <small>${parseFloat(r.distance_km).toFixed(2)} km</small>
                            </div>
                            <small class="text-muted">Cliquez pour voir les classements</small>
                        </a>
                    `).join('')}
                </div>`;
            }
        } catch (e) {
            container.innerHTML = '<div class="p-3 text-danger">Erreur de chargement.</div>';
        }
    },

    async loadRouteResults(routeId, routeName) {
        const container = document.getElementById('results-content');
        container.innerHTML = '<div class="p-3 text-center text-muted">Chargement du classement...</div>';

        try {
            const res = await fetch(`./api/attempt.php?route_id=${routeId}&user_id=${this.state.currentUser.id}`);
            const data = await res.json();
            this.currentResultData = data; // Store for tab switching

            // Header with Back Button
            let html = `
                <div class="p-3 bg-dark border-bottom border-secondary">
                    <div class="d-flex align-items-center mb-3">
                        <button class="btn btn-sm btn-outline-light me-3" onclick="App.initResultsMode()">
                            <i class="ph-bold ph-arrow-left"></i> Retour
                        </button>
                        <span class="fw-bold">${routeName}</span>
                    </div>
                    
                    <ul class="nav nav-pills nav-fill small">
                        <li class="nav-item">
                            <a class="nav-link active" href="#" onclick="App.renderLeaderboard('indiv', this)">Individuel</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="#" onclick="App.renderLeaderboard('squad', this)">Par Binôme</a>
                        </li>
                    </ul>
                </div>
                
                <div id="leaderboard-list"></div>
            `;

            container.innerHTML = html;
            this.renderLeaderboard('indiv');

        } catch (e) {
            console.error(e);
            container.innerHTML = '<div class="p-3 text-danger">Erreur.</div>';
        }
    },

    renderLeaderboard(type, tabEl) {
        if (tabEl) {
            document.querySelectorAll('#results-content .nav-link').forEach(l => l.classList.remove('active'));
            tabEl.classList.add('active');
        }

        const container = document.getElementById('leaderboard-list');
        const data = this.currentResultData;

        if (!data || !container) return;

        let html = '<div class="list-group list-group-flush">';

        if (type === 'indiv') {
            if (data.leaderboard && data.leaderboard.length > 0) {
                html += data.leaderboard.map((a, i) => `
                    <div class="list-group-item bg-transparent text-light border-secondary d-flex justify-content-between align-items-center"
                         style="cursor:pointer" onclick="App.loadAttemptDetails(${a.id})">
                        <div class="d-flex align-items-center">
                            <span class="badge bg-secondary me-3 rounded-pill">${i + 1}</span>
                            <div>
                                <div class="fw-bold">${a.username}</div>
                                ${a.squad_name ? `<span class="badge bg-dark border border-secondary text-primary" style="font-size:0.6rem">${a.squad_name}</span>` : ''}
                            </div>
                        </div>
                        <div class="text-end">
                            <div class="fw-bold text-warning">${a.score} pts</div>
                            <small class="text-secondary">${new Date(a.duration_seconds * 1000).toISOString().substr(11, 8)}</small>
                        </div>
                        <i class="ph-bold ph-caret-right ms-2 text-muted"></i>
                    </div>
                `).join('');
            } else {
                html += '<div class="p-4 text-center text-muted">Aucun résultat individuel.</div>';
            }
        } else {
            // SQUAD VIEW
            if (data.squads_leaderboard && data.squads_leaderboard.length > 0) {
                html += data.squads_leaderboard.map((s, i) => `
                    <div class="list-group-item bg-transparent text-light border-secondary d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center">
                            <span class="badge bg-primary me-3 rounded-pill">${i + 1}</span>
                            <div>
                                <div class="fw-bold">${s.squad_name}</div>
                                <small class="text-muted text-nowrap">${s.runs_count} course(s)</small>
                            </div>
                        </div>
                        <div class="text-end">
                            <div class="fw-bold text-warning">${Math.round(s.total_score)} pts <small class="text-muted fw-normal">(Tot)</small></div>
                            <small class="text-secondary">Moy: ${new Date(s.avg_seconds * 1000).toISOString().substr(11, 8)}</small>
                        </div>
                    </div>
                `).join('');
            } else {
                html += '<div class="p-4 text-center text-muted">Aucun résultat de binôme.</div>';
            }
        }

        html += '</div>';
        container.innerHTML = html;
    },

    async loadAttemptDetails(attemptId) {
        try {
            const res = await fetch(`./api/attempt.php?attempt_id=${attemptId}`);
            const data = await res.json();

            if (data.success) {
                const att = data.attempt;
                const vals = data.validations;

                // Populate Modal
                document.getElementById('det-title').textContent = att.route_name;
                document.getElementById('det-subtitle').textContent = `${att.username} • ${new Date(att.start_time).toLocaleString()}`;
                document.getElementById('det-score').textContent = att.score;

                // Calc duration
                const start = new Date(att.start_time);
                const end = new Date(att.end_time);
                const diff = end - start;
                document.getElementById('det-time').textContent = new Date(diff).toISOString().substr(11, 8);
                document.getElementById('det-checkpoints').textContent = vals.length;

                // Timeline
                const timeline = document.getElementById('det-timeline');
                if (vals.length === 0) {
                    timeline.innerHTML = '<p class="text-muted">Aucun détail de balise.</p>';
                } else {
                    timeline.innerHTML = vals.map((v, i) => {
                        const vTime = new Date(v.validated_at);
                        const split = vTime - start; // Time from start
                        const splitStr = new Date(split).toISOString().substr(11, 8);

                        return `
                            <div class="timeline-item checkpoint">
                                <div class="d-flex justify-content-between">
                                    <strong>Balise ${v.checkpoint_index + 1}</strong>
                                    <span class="badge bg-dark">${splitStr}</span>
                                </div>
                                <div class="small text-muted">Passage à ${vTime.toLocaleTimeString()}</div>
                            </div>
                         `;
                    }).join('');

                    // Add Finish
                    timeline.innerHTML += `
                        <div class="timeline-item finish">
                             <div class="d-flex justify-content-between">
                                <strong class="text-warning">Arrivée</strong>
                                <span class="badge bg-warning text-dark">${new Date(diff).toISOString().substr(11, 8)}</span>
                            </div>
                        </div>
                     `;
                }

                const modal = new bootstrap.Modal(document.getElementById('resultDetailModal'));
                modal.show();
            }
        } catch (e) {
            console.error(e);
        }
    },

    initProfileMode() {
        if (!this.state.currentUser) return;

        // Populate standard fields
        const nameInput = document.getElementById('inp-name');
        if (nameInput) nameInput.value = this.state.currentUser.username || '';

        const emailInput = document.getElementById('inp-email');
        if (emailInput) emailInput.value = this.state.currentUser.email || '';

        const modeInput = document.getElementById('inp-mode');
        if (modeInput) modeInput.value = this.state.currentUser.mode || 'solo';

        const form = document.getElementById('profile-form');
        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();

                // Validate New Password Match First
                const newPwd = document.getElementById('inp-new-pwd') ? document.getElementById('inp-new-pwd').value : '';
                const newPwdConfirm = document.getElementById('inp-new-pwd-confirm') ? document.getElementById('inp-new-pwd-confirm').value : '';
                if (newPwd && newPwd !== newPwdConfirm) {
                    alert("Les nouveaux mots de passe ne correspondent pas.");
                    return;
                }

                // Show Password Modal
                const pwdInput = document.getElementById('confirm-password-input');
                if (pwdInput) pwdInput.value = '';
                const modal = new bootstrap.Modal(document.getElementById('confirmPasswordModal'));
                modal.show();
            };
        }

        this.loadTeamInfo();
    },

    async loadTeamInfo() {
        if (!this.state.currentUser) return;

        const ui = document.getElementById('team-ui');
        if (!ui) return;

        try {
            // Add timestamp to prevent caching
            const res = await fetch(`./api/team.php?user_id=${this.state.currentUser.id}&_t=${Date.now()}`);
            const data = await res.json();

            if (data.success) {
                if (data.team) {
                    // HAS TEAM
                    // Update State immediately
                    this.state.currentUser.team_id = data.team.code;
                    this.state.currentUser.squad_id = data.my_squad ? data.my_squad.id : null;
                    localStorage.setItem('tc_user', JSON.stringify(this.state.currentUser));

                    // Group members by Squad
                    const membersBySquad = {};
                    const membersNoSquad = [];

                    // Initialize with empty arrays for known squads to ensure they appear even if empty
                    data.squads.forEach(s => membersBySquad[s.id] = { info: s, members: [] });

                    data.members.forEach(m => {
                        if (m.squad_id) {
                            if (!membersBySquad[m.squad_id]) membersBySquad[m.squad_id] = { info: { id: m.squad_id, name: 'Inconnu', count: 0 }, members: [] };
                            membersBySquad[m.squad_id].members.push(m);
                        } else {
                            membersNoSquad.push(m);
                        }
                    });

                    let squadsHtml = '';
                    let formSquadHtml = '';

                    // 1. Existing Binomes List
                    if (data.squads.length > 0) {
                        squadsHtml = data.squads.map(s => {
                            const squadMembers = membersBySquad[s.id]?.members || [];
                            const isMySquad = this.state.currentUser.squad_id == s.id;
                            const isOwner = s.created_by == this.state.currentUser.id;

                            return `
                                <div class="col-12 col-md-6 mb-2">
                                    <div class="card bg-dark border ${isMySquad ? 'border-primary' : 'border-secondary'} h-100">
                                        <div class="card-body p-2">
                                            <div class="d-flex justify-content-between align-items-center mb-2">
                                                <h6 class="mb-0 text-white">Binôme (${s.name})</h6>
                                                <div class="d-flex gap-1">
                                                    ${isOwner ? `<button class="btn btn-xs btn-outline-danger py-0" onclick="App.deleteSquad(${s.id})" title="Supprimer"><i class="ph-bold ph-trash"></i></button>` : ''}
                                                    ${!isMySquad && !data.my_squad ?
                                    `<button class="btn btn-xs btn-outline-primary py-0" onclick="App.joinSquad(${s.id})">Rejoindre</button>`
                                    : (isMySquad ? '<span class="badge bg-primary">Mon Binôme</span>' : '')}
                                                </div>
                                            </div>
                                            <ul class="list-unstyled small text-muted mb-0 ps-2 border-start border-secondary">
                                                ${squadMembers.map(m => `<li>${m.username}</li>`).join('')}
                                                ${squadMembers.length === 0 ? '<li><em>Vide</em></li>' : ''}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('');
                    } else {
                        squadsHtml = '<div class="col-12"><p class="text-muted small">Aucun binôme formé.</p></div>';
                    }

                    // ... (Skip Create/Leave Actions block unchanged in logic, but need to match context) ...
                    // Wait, I can't skip text in ReplaceContent easily without including it.
                    // I will just include the rendering logic for SquadsHtml

                    // 2. Create/Leave Actions (unchanged, not included in replacement to keep it short if possible, but context requires)
                    // Actually I'm replacing a huge block from 659 to 685.

                    // Check Team Owner
                    const isTeamOwner = data.team.created_by == this.state.currentUser.id;
                    const deleteTeamBtn = isTeamOwner ? `<button class="btn btn-danger btn-sm w-100 mt-2" onclick="App.deleteTeam()">Supprimer l'équipe</button>` : '';

                    // UI InnerHTML
                    // ... (Skipping to Footer) ...
                    // I will execute a MultiReplace to target Squad list AND Footer.


                    // 2. Create/Leave Actions
                    if (data.my_squad) {
                        formSquadHtml = `
                            <div class="alert alert-primary d-flex justify-content-between align-items-center p-2 mb-3">
                                <span>Vous êtes dans <strong>Binôme (${data.my_squad.name})</strong></span>
                                <button class="btn btn-sm btn-outline-danger bg-dark" onclick="App.leaveSquad()">Sortir</button>
                            </div>
                        `;
                    } else {
                        formSquadHtml = `
                            <div class="input-group input-group-sm mb-3">
                                <input type="text" id="new-squad-name" class="form-control bg-dark text-light border-secondary" placeholder="Nom du nouveau binôme...">
                                <button class="btn btn-outline-success" onclick="App.createSquad()">Créer & Rejoindre</button>
                            </div>
                        `;
                    }

                    ui.innerHTML = `
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h4 class="mb-0 text-primary">Équipe (${data.team.name})</h4>
                        </div>

                        
                        <!-- SECTION BINOMES -->
                        <h6 class="text-secondary small text-uppercase border-bottom border-secondary pb-1 mb-3">
                            <i class="ph-bold ph-users-three me-1"></i> Gestion des Binômes
                        </h6>
                        
                        ${formSquadHtml}
                        
                        <div class="row gx-2 mb-4">
                            ${squadsHtml}
                        </div>

                        <!-- SECTION SANS BINOME -->
                        <h6 class="text-secondary small text-uppercase border-bottom border-secondary pb-1 mb-2">
                            <i class="ph-bold ph-user me-1"></i> Sans Binôme (${membersNoSquad.length})
                        </h6>
                        <div class="d-flex flex-wrap gap-2 mb-4">
                            ${membersNoSquad.map(m => `
                                <span class="badge bg-secondary fw-normal p-2">
                                    ${m.username} ${m.id == this.state.currentUser.id ? '(Moi)' : ''}
                                </span>
                            `).join('')}
                        </div>

                        <div class="border-top border-secondary pt-3 mt-auto">
                            <button class="btn btn-outline-danger btn-sm w-100" onclick="App.leaveTeam()">Quitter l'équipe</button>
                            ${data.team.created_by == this.state.currentUser.id ?
                            `<button class="btn btn-danger btn-sm w-100 mt-2" onclick="App.deleteTeam()">Supprimer l'équipe</button>` : ''}
                        </div>
                    `;

                    // Update Local Storage
                    this.state.currentUser.team_id = data.team.code;
                    localStorage.setItem('tc_user', JSON.stringify(this.state.currentUser));

                } else {
                    // NO TEAM
                    const teamsList = data.available_teams ? data.available_teams.map(t => `
                        <div class="list-group-item bg-transparent text-light border-secondary d-flex justify-content-between align-items-center p-2 mb-2 rounded border">
                             <div>
                                <strong>${t.name}</strong> 
                             </div>
                             <button class="btn btn-sm btn-primary" onclick="App.joinTeam('${t.code}')">Rejoindre</button>
                        </div>
                    `).join('') : '';

                    ui.innerHTML = `
                        <p class="text-muted small mb-3"> Rejoignez une équipe existante ou créez la vôtre !</p>
                        
                        <h6 class="small text-muted mb-2">Équipes Disponibles</h6>
                        <div class="list-group mb-4" style="max-height: 250px; overflow-y: auto;">
                            ${teamsList || '<div class="text-center small text-muted my-3">Aucune équipe publique.</div>'}
                        </div>



                        <div class="text-center border-top border-secondary pt-3">
                            <button class="btn btn-sm btn-outline-light w-100" type="button" data-bs-toggle="modal" data-bs-target="#createTeamModal">
                                <i class="ph-bold ph-plus me-1"></i> Créer une nouvelle Équipe
                            </button>
                        </div>
                    `;
                    this.state.currentUser.team_id = null;
                    localStorage.setItem('tc_user', JSON.stringify(this.state.currentUser));
                }
            }
        } catch (e) {
            console.error(e);
            ui.innerHTML = '<div class="text-danger small">Erreur chargement équipe</div>';
        }
    },

    async createSquad() {
        const name = document.getElementById('new-squad-name').value;
        if (!name) return;
        try {
            const res = await fetch('./api/team.php', {
                method: 'POST', body: JSON.stringify({ action: 'create_squad', user_id: this.state.currentUser.id, name: name })
            });
            const data = await res.json();
            if (data.success) { this.loadTeamInfo(); }
            else { alert(data.error); }
        } catch (e) { console.error(e); }
    },
    async joinSquad(infoId) { // infoId passed from UI
        try {
            const res = await fetch('./api/team.php', {
                method: 'POST', body: JSON.stringify({ action: 'join_squad', user_id: this.state.currentUser.id, squad_id: infoId })
            });
            const data = await res.json();
            if (data.success) { this.loadTeamInfo(); }
            else { alert(data.error); }
        } catch (e) { console.error(e); }
    },
    async leaveSquad() {

        try {
            const res = await fetch('./api/team.php', {
                method: 'POST', body: JSON.stringify({ action: 'leave_squad', user_id: this.state.currentUser.id })
            });
            const data = await res.json();
            if (data.success) { this.loadTeamInfo(); }
        } catch (e) { console.error(e); }
    },

    async leaveTeam() {
        if (!confirm("Voulez-vous vraiment quitter cette équipe ?")) return;
        try {
            const res = await fetch('./api/team.php', {
                method: 'POST', body: JSON.stringify({ action: 'leave', user_id: this.state.currentUser.id })
            });
            const data = await res.json();
            if (data.success) { this.loadTeamInfo(); }
        } catch (e) { console.error(e); }
    },

    async deleteTeam() {
        if (!confirm("ATTENTION: Cela supprimera l'équipe et tous ses binômes. Cette action est irréversible.")) return;
        try {
            const res = await fetch('./api/team.php', {
                method: 'POST', body: JSON.stringify({ action: 'delete_team', user_id: this.state.currentUser.id })
            });
            const data = await res.json();
            if (data.success) { this.loadTeamInfo(); }
            else { alert(data.error); }
        } catch (e) { console.error(e); }
    },

    async deleteSquad(id) {
        if (!confirm("Supprimer ce binôme ?")) return;
        try {
            const res = await fetch('./api/team.php', {
                method: 'POST', body: JSON.stringify({ action: 'delete_squad', user_id: this.state.currentUser.id, squad_id: id })
            });
            const data = await res.json();
            if (data.success) { this.loadTeamInfo(); }
            else { alert(data.error); }
        } catch (e) { console.error(e); }
    },

    async createTeam() {
        const name = document.getElementById('new-team-name').value;
        if (!name) return;

        try {
            const res = await fetch('./api/team.php', {
                method: 'POST',
                body: JSON.stringify({ action: 'create', user_id: this.state.currentUser.id, team_name: name })
            });
            const data = await res.json();
            if (data.success) {
                // Close modal
                const modalEl = document.getElementById('createTeamModal');
                const modal = bootstrap.Modal.getInstance(modalEl);
                modal.hide();

                this.loadTeamInfo();
            } else {
                console.error(data.error);
            }
        } catch (e) { console.error(e); }
    },

    async joinTeam(codeArg = null) {
        if (this.isJoining) return; // Prevent double clicks
        this.isJoining = true;

        let code = codeArg;
        if (!code) {
            const inp = document.getElementById('join-code');
            if (inp) code = inp.value;
        }

        if (!code) {
            alert("Veuillez entrer un code ou sélectionner une équipe.");
            return;
        }

        document.body.style.cursor = 'wait'; // Visual feedback
        try {
            const res = await fetch('./api/team.php', {
                method: 'POST',
                body: JSON.stringify({ action: 'join', user_id: this.state.currentUser.id, code: code })
            });
            const data = await res.json();
            if (data.success) {
                this.loadTeamInfo();
            } else {
                alert(data.error);
            }
        } catch (e) {
            console.error(e);
            alert("Erreur technique: " + e.message);
        } finally {
            document.body.style.cursor = 'default';
            this.isJoining = false;
        }
    },

    async leaveTeam() {

        try {
            const res = await fetch('./api/team.php', {
                method: 'POST',
                body: JSON.stringify({ action: 'leave', user_id: this.state.currentUser.id })
            });
            const data = await res.json();
            if (data.success) {
                this.loadTeamInfo();
            }
        } catch (e) { console.error(e); }
    }
};

// Start App when DOM ready
window.App = App;
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
