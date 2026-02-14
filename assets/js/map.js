/**
 * TrailConnect Map Logic
 * Uses Leaflet.js
 */

let editorMap = null;
let navMap = null;
let editorMarkers = [];
let editorPolyline = null;
let markerCounter = 0; // GLOBAL ID COUNTER

// Fake start position (Paris for default)
const DEFAULT_COORDS = [48.8566, 2.3522];

window.initEditorMode = function () {
    const container = document.getElementById('map-container');
    if (!container) return;

    if (editorMap) {
        editorMap.invalidateSize();
        return;
    }

    // Safety check if Leaflet is already initialized via class
    if (container.classList.contains('leaflet-container')) {
        container._leaflet_id = null;
        container.innerHTML = "";
    }

    editorMap = L.map('map-container').setView(DEFAULT_COORDS, 13);

    // Fix: Invalidate size after short delay to handle Flexbox layout
    setTimeout(() => { editorMap.invalidateSize(); }, 200);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(editorMap);

    // Click handler: Manual Point Addition with Snap-to-Road
    editorMap.on('click', async function (e) {
        let latlng = e.latlng;
        // Visual feedback
        const loadingMarker = L.marker(latlng, { opacity: 0.5 }).addTo(editorMap);

        try {
            // SNAP TO ROAD
            const url = `https://router.project-osrm.org/nearest/v1/driving/${latlng.lng},${latlng.lat}?number=1`;
            const res = await fetch(url);
            const data = await res.json();

            if (data.code === 'Ok' && data.waypoints && data.waypoints.length > 0) {
                const snapped = data.waypoints[0].location; // [lng, lat]
                latlng = L.latLng(snapped[1], snapped[0]);
            }
        } catch (err) {
            console.warn("Snap failed, using original position", err);
        } finally {
            loadingMarker.remove();
        }

        if (editorMarkers.length === 0) {
            // First point = START
            const marker = L.marker(latlng, {
                icon: L.divIcon({ className: 'start-marker', html: '🚩', iconSize: [30, 30] }),
                title: "Départ"
            }).addTo(editorMap);

            addToRoute(marker, latlng, "Départ");
        } else {
            // Next points = Checkpoints
            const count = editorMarkers.length; // Just for display name
            const name = "Point " + count;

            // Icon simple rouge
            const iconHtml = '<div style="background-color: #e74c3c; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px #c0392b;"></div>';

            const marker = L.marker(latlng, {
                icon: L.divIcon({ className: 'manual-marker', html: iconHtml, iconSize: [20, 20] }),
                title: name,
                draggable: false // Désactivé à la demande
            }).addTo(editorMap);

            addToRoute(marker, latlng, name);

            // Re-bind popup with correct ID
            // Default Score est 50
            marker._customScore = 50;

            // HTML content with stronger event handling approach (using oninput and logs)
            // Utilisation de oninput pour réagir dès la frappe
            const popupContent = `
                <div style="min-width:200px;">
                    <label class="form-label text-muted small mb-1">Nom du checkpoint :</label>
                    <input type="text" value="${name}" 
                           class="form-control form-control-sm mb-2" 
                           oninput="window.updateMarkerData(${marker._uniqueId}, 'name', this.value)">
                           
                    <label class="form-label text-muted small mb-1">Points rapportés :</label>
                    <input type="number" value="50" step="10" 
                           class="form-control form-control-sm mb-2" 
                           oninput="window.updateMarkerData(${marker._uniqueId}, 'score', this.value)">

                    <button class="btn btn-danger btn-sm w-100" onclick="window.removeMarker(${marker._uniqueId})">
                        Supprimer ce point
                    </button>
                    <div class="text-center text-muted small mt-1"><i>Modifications auto-sauvegardées</i></div>
                </div>
            `;

            marker.bindPopup(popupContent);
        }
    });

    // Try to get real location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const latlng = [pos.coords.latitude, pos.coords.longitude];
            editorMap.setView(latlng, 13);
        });
    }

    // Load Personal POIs
    if (window.loadMyPointsForEditor) window.loadMyPointsForEditor();
};

window.loadMyPointsForEditor = async function () {
    if (!App.state.currentUser) return;

    try {
        const res = await fetch(`./api/pois.php?user_id=${App.state.currentUser.id}`);
        const data = await res.json();

        if (data.success && data.points) {
            data.points.forEach(p => {
                const iconHtml = '<div style="background-color: #f1c40f; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px orange;"></div>';
                const m = L.marker([p.lat, p.lng], {
                    icon: L.divIcon({ className: 'my-poi-marker', html: iconHtml, iconSize: [18, 18] }),
                    title: p.name + " (" + (p.score || 0) + "pts)"
                }).addTo(editorMap);

                // Click to add to route
                m.on('click', () => {
                    if (confirm(`Ajouter "${p.name}" (${p.score}pts) au parcours ?`)) {
                        // Custom Add Logic passing ID and Score
                        const markerForRoute = L.marker([p.lat, p.lng], {
                            icon: L.divIcon({ className: 'manual-marker', html: iconHtml, iconSize: [20, 20] })
                        });
                        // Set properties
                        markerForRoute._customScore = p.score || 0;
                        markerForRoute.placeName = p.name;
                        markerForRoute.placeId = 'custom-' + p.id;

                        addToRoute(markerForRoute, L.latLng(p.lat, p.lng), p.name);
                    }
                });
            });
        }
    } catch (e) {
        console.error("Error loading editor POIs", e);
    }
};

// Update marker data from popup inputs
window.updateMarkerData = function (uniqueId, field, value) {
    const m = editorMarkers.find(marker => marker._uniqueId === uniqueId);
    if (!m) return;
    if (field === 'name') m.placeName = value;
    else if (field === 'score') m._customScore = parseInt(value, 10);
};

let availablePlaceMarkers = [];
function setStartPoint(latlng) { }
async function loadNearbyPlaces(latlng) { console.log("Manual Mode"); return; }

window.selectPlace = function (id, name, lat, lng) {
    const latlng = L.latLng(lat, lng);
    const marker = availablePlaceMarkers.find(m => m.placeId === id);
    if (marker) {
        marker.setOpacity(1);
        marker.closePopup();
        marker.unbindPopup();
    }
    addToRoute(marker || L.marker(latlng), latlng, name);
};

// OSRM Public API
const ROUTING_API = "https://router.project-osrm.org/route/v1/driving/";

async function getRouteFromOSRM(startLat, startLng, endLat, endLng) {
    try {
        const response = await fetch(`${ROUTING_API}${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`);
        if (!response.ok) throw new Error("Routing failed");
        return await response.json();
    } catch (e) {
        console.error("Routing Error", e);
        return null;
    }
}

async function addToRoute(marker, latlng, name) {
    // Assign UNIQUE ID
    if (!marker._uniqueId) {
        marker._uniqueId = ++markerCounter;
    }

    marker.addTo(editorMap);
    editorMarkers.push(marker);

    // Si c'est le premier point, on ne trace rien
    if (editorMarkers.length < 2) return;

    const prevMarker = editorMarkers[editorMarkers.length - 2];
    const newMarker = marker;

    const p1 = prevMarker.getLatLng();
    const p2 = newMarker.getLatLng();

    const routeData = await getRouteFromOSRM(p1.lat, p1.lng, p2.lat, p2.lng);

    let latlngsToDraw = [p1, p2];
    let segmentDist = p1.distanceTo(p2);

    if (routeData && routeData.routes && routeData.routes.length > 0) {
        const coordinates = routeData.routes[0].geometry.coordinates;
        latlngsToDraw = coordinates.map(c => [c[1], c[0]]);
        segmentDist = routeData.routes[0].distance;
    }

    // HEX Color fallback
    const poly = L.polyline(latlngsToDraw, { color: '#00f2aa', weight: 5, opacity: 0.8 }).addTo(editorMap);

    newMarker.incomingPolyline = poly;
    newMarker.segmentDist = segmentDist;

    updateStatsValid(getTotalDist());
}

function getTotalDist() {
    return editorMarkers.reduce((acc, m) => acc + (m.segmentDist || 0), 0);
}

function updateStatsValid(totalMeters) {
    const distEl = document.querySelector('#view-editor strong:nth-of-type(1)');
    if (distEl) distEl.textContent = `${(totalMeters / 1000).toFixed(2)} km`;
}

// Ancienne fonction updateStats dépréciée
function updateStats(latlngs) { }

window.removeMarker = async function (uniqueId) {
    const index = editorMarkers.findIndex(m => m._uniqueId === uniqueId);
    if (index === -1) {
        console.error("Marker not found for deletion", uniqueId);
        return;
    }

    // Supprimer le marker
    editorMap.removeLayer(editorMarkers[index]);

    // Supprimer ligne arrivante
    if (editorMarkers[index].incomingPolyline) {
        editorMap.removeLayer(editorMarkers[index].incomingPolyline);
    }

    // Si point suivant, sa ligne arrivante est invalide
    if (index < editorMarkers.length - 1) {
        const nextMarker = editorMarkers[index + 1];
        if (nextMarker.incomingPolyline) {
            editorMap.removeLayer(nextMarker.incomingPolyline);
        }

        // Relier au précédent (si existe)
        if (index > 0) {
            const prevMarker = editorMarkers[index - 1];

            const p1 = prevMarker.getLatLng();
            const p2 = nextMarker.getLatLng();
            const routeData = await getRouteFromOSRM(p1.lat, p1.lng, p2.lat, p2.lng);

            let latlngsToDraw = [p1, p2];
            let segmentDist = p1.distanceTo(p2);

            if (routeData && routeData.routes && routeData.routes.length > 0) {
                const coordinates = routeData.routes[0].geometry.coordinates;
                latlngsToDraw = coordinates.map(c => [c[1], c[0]]);
                segmentDist = routeData.routes[0].distance;
            }

            const poly = L.polyline(latlngsToDraw, { color: '#00f2aa', weight: 5, opacity: 0.8 }).addTo(editorMap);
            nextMarker.incomingPolyline = poly;
            nextMarker.segmentDist = segmentDist;
        } else {
            // Si on supprime le Start (index 0) et qu'il y a un suivant
            // Le suivant devient le Start, donc dist = 0
            const nextMarker = editorMarkers[index + 1];
            nextMarker.segmentDist = 0;
            // TODO: Changer l'icône en Start ?
        }
    }

    editorMarkers.splice(index, 1);
    updateStatsValid(getTotalDist());
};

window.saveCurrentRoute = async function () {
    if (editorMarkers.length < 2) {
        alert("Il faut au moins 2 points (Départ + 1 Pancarte) !");
        return;
    }

    const name = prompt("Nom du parcours :", "Sortie du " + new Date().toLocaleDateString());
    if (!name) return;

    // Get Points
    const pointsData = editorMarkers.map(m => ({
        lat: m.getLatLng().lat,
        lng: m.getLatLng().lng,
        placeId: m.placeId || null,
        name: m.placeName || m.options.title, // Use custom name or default title
        score: m._customScore || 0 // Store score (0 for Start, 50+ for others)
    }));

    const dist = getTotalDist() / 1000;

    if (!App.state.currentUser) {
        alert("Vous devez être connecté pour sauvegarder.");
        return;
    }

    const payload = {
        name: name,
        points: pointsData,
        distance: dist,
        user_id: App.state.currentUser.id
    };

    try {
        const btn = document.querySelector('#view-editor button.btn-primary');
        const oldText = btn.textContent;
        btn.textContent = "Sauvegarde...";
        btn.disabled = true;

        const res = await fetch('./api/route.php', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.success) {
            alert(`Parcours "${name}" sauvegardé ! (ID: ${data.route_id})`);
        } else {
            alert('Erreur: ' + data.error);
        }

        btn.textContent = oldText;
        btn.disabled = false;
    } catch (e) {
        console.error(e);
        alert("Erreur réseau");
    }
};

// Variables Navigation
let navPolyline = null;
let navMarkers = [];
let navUserMarker = null;
let navRouteData = null; // OSRM Raw data containing steps
let navSimulationInterval = null;
let navCurrentStepIndex = 0;

window.loadRouteForNav = async function (routeId) {
    if (!navMap) window.initNavMap();

    // Clear old map data
    if (navPolyline) navPolyline.remove();
    navMarkers.forEach(m => m.remove());
    navMarkers = [];
    if (navUserMarker) navUserMarker.remove();
    if (navSimulationInterval) clearInterval(navSimulationInterval);

    try {
        const res = await fetch(`./api/route.php?id=${routeId}`);
        const data = await res.json();

        if (!data.success) {
            alert("Impossible de charger le parcours.");
            return;
        }

        const route = data.route;
        const points = JSON.parse(route.map_data); // [{lat,lng,name...}]

        // Variables pour édition Navigation
        window.navPointsData = points;
        window.currentNavRouteId = routeId;
        window.currentNavRouteDist = route.distance_km;
        window.currentNavRouteName = route.name;

        // Afficher stats
        document.getElementById('nav-route-stats').textContent = `${points.length} points • ${parseFloat(route.distance_km).toFixed(2)} km`;

        // Tracer les marqueurs
        const latlngs = [];
        points.forEach((pt, idx) => {
            const ll = [pt.lat, pt.lng];
            latlngs.push(ll);

            let iconHtml = '';
            // Affiche le score ou le numéro
            let label = pt.score ? `${pt.score}pts` : '';

            if (idx === 0) iconHtml = '<div style="font-size:20px;">🚩</div>';
            else iconHtml = `<div style="background-color: #e74c3c; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;" title="${pt.name} - ${label}"></div>`;

            const m = L.marker(ll, {
                icon: L.divIcon({ className: 'nav-point', html: iconHtml, iconSize: [20, 20] })
            }).addTo(navMap);

            // Popup EDITABLE en Nav
            const popupContent = `
                <div style="min-width:200px;">
                    <strong class="d-block mb-2">Édition Rapide</strong>
                    <label class="form-label text-muted small mb-1">Nom :</label>
                    <input type="text" value="${pt.name || ''}" 
                           class="form-control form-control-sm mb-2" 
                           oninput="window.updateNavPoint(${idx}, 'name', this.value)">
                           
                    <label class="form-label text-muted small mb-1">Points :</label>
                    <input type="number" value="${pt.score || 0}" step="10" 
                           class="form-control form-control-sm mb-2" 
                           oninput="window.updateNavPoint(${idx}, 'score', this.value)">
                    
                    <div id="save-status-${idx}" class="small text-success mt-1" style="display:none;">Sauvegardé !</div>
                </div>
            `;

            m.bindPopup(popupContent);

            navMarkers.push(m);
        });

        // Centrer
        navMap.fitBounds(latlngs, { padding: [50, 50] });

        // CALCULER LA ROUTE OSRM COMPLETE POUR AVOIR LES INSTRUCTIONS
        let coordsString = points.map(p => `${p.lng},${p.lat}`).join(';');
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&steps=true&geometries=geojson`;

        console.log("Fetching full nav route OSRM...");
        try {
            const routeRes = await fetch(osrmUrl);
            const routeJson = await routeRes.json();

            if (routeJson.routes && routeJson.routes.length > 0) {
                navRouteData = routeJson.routes[0];

                // Tracer la ligne bleue
                const coordinates = navRouteData.geometry.coordinates.map(c => [c[1], c[0]]);
                navPolyline = L.polyline(coordinates, { color: '#3498db', weight: 6, opacity: 0.9 }).addTo(navMap);

                // Initialiser l'instruction
                // updateTurnByTurn(startPos.lat, startPos.lng); // Can't call yet as we need user pos
            } else {
                console.warn("OSRM: Pas de route trouvée");
                alert("Attention : Guidage détaillé indisponible (Erreur Route). Le mode 'Vol d'oiseau' sera utilisé.");
            }
        } catch (errOSRM) {
            console.error("OSRM Fetch Error:", errOSRM);
            alert("Erreur chargement itinéraire (OSRM). Guidage simplifié uniquement.");
        }

        // Initialiser le marqueur utilisateur au départ (toujours, même si OSRM fail)
        // CHANGE: On attend le GPS réel pour afficher le user marker.
        // Sinon on croit qu'on est au départ alors qu'on est ailleurs.
        /* 
        if (points && points.length > 0) { ... } 
        */

        // Force Map Refresh
        setTimeout(() => { navMap.invalidateSize(); }, 200);

        // Afficher première instruction (only if navRouteData is available)
        if (navRouteData) {
            // Simulate being at start to show first instruction
            updateTurnByTurn(points[0].lat, points[0].lng);
        }

        // AJOUT DU BOUTON RECENTRER (Custom Control)
        if (window.navRecenterControl) {
            try { navMap.removeControl(window.navRecenterControl); } catch (e) { }
        }

        const RecenterControl = L.Control.extend({
            options: { position: 'bottomright' },
            onAdd: function (map) {
                const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
                // Style clean, slightly offset from bottom
                container.style.backgroundColor = 'transparent';
                container.style.border = 'none';
                container.style.marginBottom = '20px';
                container.style.marginRight = '10px';

                const btn = L.DomUtil.create('button', 'btn btn-light shadow d-flex align-items-center justify-content-center', container);
                btn.style.width = '60px';
                btn.style.height = '60px'; // Bigger touch target
                btn.style.borderRadius = '50%';
                btn.style.border = '2px solid var(--primary)';
                btn.style.padding = '0';
                btn.style.cursor = 'pointer';
                btn.innerHTML = '<i class="ph-bold ph-crosshair text-primary fs-3"></i>'; // Bigger icon

                // Prevent map interaction events propagation
                L.DomEvent.disableClickPropagation(container);
                L.DomEvent.disableScrollPropagation(container);

                // Events
                btn.onclick = function (e) {
                    e.preventDefault();
                    console.log("Recenter Control Clicked");
                    App.recenterMap();
                };

                // Touch handling specific
                L.DomEvent.on(btn, 'touchstart', function (e) {
                    L.DomEvent.stopPropagation(e);
                    e.preventDefault(); // Prevent ghost click
                    App.recenterMap();
                });

                return container;
            }
        });

        window.navRecenterControl = new RecenterControl();
        navMap.addControl(window.navRecenterControl);


        // --- GUIDAGE VERS LE DÉPART (Géolocalisation Robuste) ---
        console.log("Attente signal GPS...");

        // On écoute l'événement "locationfound" de Leaflet
        navMap.on('locationfound', async function onLocationFound(e) {
            const userLat = e.latlng.lat;
            const userLng = e.latlng.lng;
            console.log("Position GPS (Nav Launch):", userLat, userLng);

            // 1. Créer/Déplacer Marqueur
            if (navUserMarker) {
                navUserMarker.setLatLng([userLat, userLng]);
            } else {
                const userIcon = L.divIcon({
                    className: 'user-marker-icon',
                    html: '<i class="ph-fill ph-navigation-arrow" style="font-size: 36px; color: #2ecc71; transform: rotate(-45deg); filter: drop-shadow(0 0 5px rgba(0,0,0,0.5));"></i>',
                    iconSize: [36, 36],
                    iconAnchor: [18, 18]
                });
                navUserMarker = L.marker([userLat, userLng], { icon: userIcon, zIndexOffset: 3000 }).addTo(navMap);
            }

            // 2. Calculer route d'approche UNE FOIS
            const startPoint = points[0];
            // On désactive l'écouteur pour ne pas recalculer l'approche en boucle
            navMap.off('locationfound', onLocationFound);

            try {
                const approachData = await getRouteFromOSRM(userLat, userLng, startPoint.lat, startPoint.lng);
                if (approachData && approachData.routes && approachData.routes.length > 0) {
                    const coords = approachData.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                    // Ligne pointillée grise
                    L.polyline(coords, { color: '#7f8c8d', weight: 4, dashArray: '10, 10', opacity: 0.8 }).addTo(navMap);

                    const dist = approachData.routes[0].distance;
                    const text = `Rejoignez le départ 🚩 (${dist < 1000 ? Math.round(dist) + 'm' : (dist / 1000).toFixed(1) + 'km'})`;

                    const instrEl = document.getElementById('nav-instruction');
                    const distEl = document.getElementById('nav-dist-next');
                    if (instrEl) instrEl.textContent = text;
                    if (distEl) distEl.textContent = dist < 1000 ? Math.round(dist) + ' m' : (dist / 1000).toFixed(1) + ' km';

                    // Zoom Global (User + Start)
                    const bounds = L.latLngBounds([userLat, userLng], [startPoint.lat, startPoint.lng]);
                    navMap.fitBounds(bounds, { padding: [50, 50] });
                }
            } catch (err) { console.warn("Erreur calcul approche", err); }
        });

        navMap.on('locationerror', function (e) {
            console.warn("Erreur GPS:", e.message);
            alert("Erreur GPS : " + e.message + "\n(Sur mobile, vérifiez que le GPS est actif et que le site est en HTTPS ou autorisé).");
        });

        // Lance la recherche
        navMap.locate({ setView: false, enableHighAccuracy: true, timeout: 10000 });

    } catch (e) {
        console.error("Erreur générale loadRouteForNav:", e);
        alert("Erreur critique chargement parcours: " + e.message);
    }
};

window.updateNavPoint = function (index, field, value) {
    if (!window.navPointsData) return;

    if (field === 'score') value = parseInt(value, 10);
    window.navPointsData[index][field] = value;

    // Debounce save or just save immediately
    // Pour UX immédiate, on save.
    window.saveNavRouteChanges(index);
};

window.saveNavRouteChanges = async function (idx) {
    const statusEl = document.getElementById(`save-status-${idx}`);
    if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.textContent = 'Sauvegarde...';
        statusEl.style.color = 'orange';
    }

    const payload = {
        id: window.currentNavRouteId,
        name: window.currentNavRouteName,
        points: window.navPointsData,
        distance: window.currentNavRouteDist,
        user_id: App.state.currentUser ? App.state.currentUser.id : 0
    };

    try {
        const res = await fetch('./api/route.php', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success && statusEl) {
            statusEl.textContent = 'Sauvegardé !';
            statusEl.style.color = 'green';
            // Update stats header immediately
            document.getElementById('nav-route-stats').textContent = `${window.navPointsData.length} points • ${parseFloat(window.currentNavRouteDist).toFixed(2)} km`;

            // Update marker label if score changed (need to recreate marker or just update tooltip if we had one)
            // Simplex UX: just save.
        }
    } catch (e) {
        console.error(e);
        if (statusEl) {
            statusEl.textContent = 'Erreur save';
            statusEl.style.color = 'red';
        }
    }
};

let currentStepIndex = 0;

function updateTurnByTurn(userLat, userLng) {
    // FALLBACK: Si OSRM HS ou pas de route (Bird Flight Mode)
    if (!navRouteData || !navRouteData.legs || !navRouteData.legs[0]) {
        // Trouver le prochain point non validé
        const nextIdx = window.navPointsData.findIndex((p, i) => !navValidatedIndices.has(i));
        if (nextIdx !== -1) {
            const nextPt = window.navPointsData[nextIdx];
            const dist = getDistanceMeters(userLat, userLng, nextPt.lat, nextPt.lng);

            document.getElementById('nav-instruction').innerHTML = `<div style="font-size: 2rem;">↗️</div> Allez vers : <strong>${nextPt.name || 'Point ' + (nextIdx + 1)}</strong>`;
            document.getElementById('nav-dist-next').textContent = dist < 1000 ? Math.round(dist) + " m" : (dist / 1000).toFixed(1) + " km";
        }
        return;
    }

    const steps = navRouteData.legs[0].steps;

    // Simple logic: Find the first step that we haven't passed yet.
    // We assume we are moving forward.
    // We check distance to the *end* of the current step (the maneuver point).
    // If we are very close to it, we snap to it.
    // Actually, simpler: Find the step whose maneuver location is closest to us, OR just the next one.

    // Better approach:
    // Iterate from currentStepIndex.
    // Calculate distance to the maneuver of steps[currentStepIndex+1].
    // If distance < 20m, we are "at" the turn, so increment index.

    // Handle end of route
    if (currentStepIndex >= steps.length) return;

    const currentStep = steps[currentStepIndex];
    // The maneuver for the *next* instruction is at the end of this step? 
    // No, OSRM steps are: "Do this maneuver at start, then drive for X meters".
    // So steps[i] is "Turn Left", and you drive along steps[i].geometry.
    // The NEXT maneuver is at steps[i+1].maneuver.location.

    // So we want to know: "What is the NEXT maneuver?" -> steps[currentStepIndex+1]

    if (currentStepIndex + 1 < steps.length) {
        const nextStep = steps[currentStepIndex + 1];
        const nextManeuverLoc = nextStep.maneuver.location; // [lng, lat]
        const distToManeuver = getDistanceMeters(userLat, userLng, nextManeuverLoc[1], nextManeuverLoc[0]);

        // Update UI
        let arrow = "⬆️";
        let type = nextStep.maneuver.type;
        let modifier = nextStep.maneuver.modifier;

        if (modifier && modifier.includes('left')) arrow = "⬅️";
        if (modifier && modifier.includes('right')) arrow = "➡️";
        if (modifier && modifier.includes('sharp left')) arrow = "↙️";
        if (modifier && modifier.includes('sharp right')) arrow = "↘️";
        if (type === 'arrive') arrow = "🏁";

        let text = "Dans " + (distToManeuver < 1000 ? Math.round(distToManeuver) + "m" : (distToManeuver / 1000).toFixed(1) + "km") + " : ";

        // Translate
        const translations = {
            'turn': 'Tournez',
            'new name': 'Continuez',
            'depart': 'Départ',
            'arrive': 'Arrivée',
            'merge': 'Insérez-vous',
            'ramp': 'Bretelle',
            'roundabout': 'Rond-point',
            'fork': 'Bifurquez'
        };
        const modTranslations = {
            'left': 'à GAUCHE',
            'right': 'à DROITE',
            'sharp left': 'Serré à GAUCHE',
            'sharp right': 'Serré à DROITE',
            'slight left': 'Légèrement GAUCHE',
            'slight right': 'Légèrement DROITE',
            'straight': 'Tout droit'
        };

        let action = translations[type] || type;
        let dir = modTranslations[modifier] || "";

        text += `${action} ${dir}`;
        if (nextStep.name) text += " sur " + nextStep.name;

        // Big Display
        document.getElementById('nav-instruction').innerHTML = `<div style="font-size: 2rem;">${arrow}</div> ${text}`;
        document.getElementById('nav-dist-next').textContent = distToManeuver < 1000 ? Math.round(distToManeuver) + " m" : (distToManeuver / 1000).toFixed(1) + " km";

        // Logic to advance step
        // If we are within 30m of the maneuver, we assume we passed it.
        // But need to be careful not to skip if we are just approaching.
        if (distToManeuver < 30) {
            // We reached the turn!
            // Wait until we move AWAY from it to switch? 
            // Or just switch now and show Next Next?
            // Switch now is safer for "Quickly turn left then right".
            currentStepIndex++;
        }
    } else {
        // Last step (Arriving)
        document.getElementById('nav-instruction').textContent = "Arrivée imminente 🏁";
        document.getElementById('nav-dist-next').textContent = "0 m";
    }
}

// --- REAL GPS TRACKING ---
let navWatchId = null;
let navValidatedIndices = new Set();
let navOnFinishCallback = null;

window.startRealTracking = function (onMoveCallback, onFinish) {
    if (navWatchId) navigator.geolocation.clearWatch(navWatchId);
    navValidatedIndices.clear();
    navOnFinishCallback = onFinish;

    if (!navigator.geolocation) {
        alert("Géolocalisation non supportée par votre navigateur.");
        return;
    }

    // Check for secure context (HTTPS requirement)
    if (window.isSecureContext === false) {
        alert("ATTENTION : La géolocalisation nécessite HTTPS (ou localhost). Sur mobile via IP, cela risque de bloquer.");
    }

    // ZOOM IMMÉDIAT SUR LE DÉPART (En attendant le GPS)
    if (window.navPointsData && window.navPointsData.length > 0) {
        const startPt = window.navPointsData[0];
        navMap.setView([startPt.lat, startPt.lng], 18, { animate: true });
    }

    // Force Zoom immediately using Leaflet's helper to wake up GPS
    navMap.locate({ setView: true, maxZoom: 18 });

    const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    };

    console.log("Démarrage du suivi GPS...");
    let hasZoomedToStart = false;

    try {
        navWatchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude, accuracy } = pos.coords;
                // console.log("Position reçue:", latitude, longitude, accuracy); // Too verbose
                const latlng = [latitude, longitude];

                // 1. Update Marker
                if (!navUserMarker) {
                    const userIcon = L.divIcon({
                        className: 'user-marker-icon',
                        html: '<i class="ph-fill ph-navigation-arrow" style="font-size: 40px; color: var(--primary); transform: rotate(-45deg); filter: drop-shadow(0 2px 5px rgba(0,0,0,0.5));"></i>',
                        iconSize: [40, 40],
                        iconAnchor: [20, 20]
                    });
                    navUserMarker = L.marker(latlng, { icon: userIcon, zIndexOffset: 2000 }).addTo(navMap);
                } else {
                    navUserMarker.setLatLng(latlng);
                }

                // ZOOM AUTOMATIQUE AU DÉPART OU SUIVI
                if (!hasZoomedToStart) {
                    navMap.setView(latlng, 18, { animate: true });
                    hasZoomedToStart = true;
                } else {
                    // On suit l'utilisateur mais on garde son niveau de zoom s'il l'a changé
                    // Ou on peut forcer le centrage sans changer le zoom
                    navMap.panTo(latlng, { animate: true });
                }

                // 2. Check Proximity
                checkProximity(latitude, longitude);

                // 3. Update Turn-by-Turn Instructions
                updateTurnByTurn(latitude, longitude);

                // 4. Callback
                if (onMoveCallback) onMoveCallback(latitude, longitude);
            },
            (err) => {
                console.warn("Erreur GPS:", err);
            },
            options
        );
    } catch (e) {
        console.error("Erreur lancement GPS:", e);
        alert("Erreur technique lancement GPS: " + e.message);
    }
};

window.stopRealTracking = function () {
    if (navWatchId !== null) {
        try { navigator.geolocation.clearWatch(navWatchId); } catch (e) { }
        try { clearInterval(navWatchId); } catch (e) { }
        navWatchId = null;
    }
};

window.getRaceStatus = function () {
    // Calculate total score and format validations
    let totalScore = 0;
    const validations = [];

    if (window.navPointsData) {
        window.navPointsData.forEach((pt, idx) => {
            if (navValidatedIndices.has(idx)) {
                totalScore += (pt.score || 0);
                validations.push({
                    index: idx,
                    lat: pt.lat,
                    lng: pt.lng,
                    time: new Date().toISOString() // Approximate validation time if not tracked detailed
                    // To be precise, we should store time AT validation.
                });
            }
        });
    }

    return { score: totalScore, validations: validations };
};

function checkProximity(userLat, userLng) {
    if (!window.navPointsData) return;

    const THRESHOLD = 25; // meters

    window.navPointsData.forEach((pt, idx) => {
        if (navValidatedIndices.has(idx)) return; // Already done

        const dist = getDistanceMeters(userLat, userLng, pt.lat, pt.lng);
        if (dist <= THRESHOLD) {
            // VALIDATION !
            validatePoint(idx, pt);
        }
    });
}

function validatePoint(idx, pt) {
    navValidatedIndices.add(idx);

    // Visual Feedback
    const marker = navMarkers[idx];
    if (marker) {
        // Change icon to Green Check
        const iconHtml = '<div style="background-color: #2ecc71; color: white; width: 20px; height: 20px; border-radius: 50%; display:flex; align-items:center; justify-content:center; font-size:12px; border: 2px solid white;">✔</div>';

        const newIcon = L.divIcon({ className: 'validated-point', html: iconHtml, iconSize: [24, 24] });
        marker.setIcon(newIcon);
    }

    // Haptic Feedback
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

    // Notification & Audio
    const ptName = pt.name || ("Point " + (idx + 1));
    const msg = `Point validé : ${ptName} !`;

    // Audio
    if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(msg);
        u.lang = 'fr-FR';
        window.speechSynthesis.speak(u);
    }

    // System Notification
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification("TrailConnect", { body: msg, icon: 'assets/img/icon.png' });
    }

    // Update UI Instruction to Next Point
    // Find next unvalidated point
    const nextIdx = window.navPointsData.findIndex((p, i) => !navValidatedIndices.has(i));

    if (nextIdx !== -1) {
        const nextPt = window.navPointsData[nextIdx];
        const nextName = nextPt.name || ("Point " + (nextIdx + 1));
        const directionMsg = "Allez vers : " + nextName;

        document.getElementById('nav-instruction').textContent = directionMsg;

        // Speak next direction after a short delay
        if ('speechSynthesis' in window) {
            setTimeout(() => {
                const u = new SpeechSynthesisUtterance("Prochaine étape : " + nextName);
                u.lang = 'fr-FR';
                window.speechSynthesis.speak(u);
            }, 2000);
        }

    } else {
        const finishMsg = "Terminé ! Bravo ! 🏁";
        document.getElementById('nav-instruction').textContent = finishMsg;

        if ('speechSynthesis' in window) {
            const u = new SpeechSynthesisUtterance("Félicitations ! Vous avez terminé le parcours.");
            u.lang = 'fr-FR';
            window.speechSynthesis.speak(u);
        }

        // Call Finish Logic
        if (navOnFinishCallback) navOnFinishCallback(navValidatedIndices.size, window.navPointsData.length);
    }
}

function getDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

// Keep simulation for testing on PC
window.startSimulationTracking = function (onMoveCallback, onFinish) {
    if (!navRouteData || !navUserMarker) {
        alert("Données de route non chargées. Veuillez patienter ou recharger.");
        return;
    }

    navValidatedIndices.clear();
    navOnFinishCallback = onFinish;

    const allCoords = navRouteData.geometry.coordinates.map(c => [c[1], c[0]]);
    let i = 0;

    // Simulate GPS loop
    navWatchId = setInterval(() => { // reusing navWatchId variable for interval ID
        if (i >= allCoords.length) {
            clearInterval(navWatchId);
            navWatchId = null;
            return;
        }

        const [lat, lng] = allCoords[i];

        // 1. Update Marker
        navUserMarker.setLatLng([lat, lng]);
        navMap.panTo([lat, lng]);

        // 2. Check Proximity
        checkProximity(lat, lng);

        // 3. Update Instructions
        updateTurnByTurn(lat, lng);

        // 4. Callback
        if (onMoveCallback) onMoveCallback(lat, lng);

        i++;
    }, 200); // Speed of simulation
};

window.simulateGPSMove = function () {
    alert("Mode simulation remplacé par mode réel.");
};

window.initNavMap = function () {
    if (navMap) {
        navMap.invalidateSize();
        return;
    }

    const container = document.getElementById('nav-map-container');
    if (!container) return;

    navMap = L.map('nav-map-container').setView(DEFAULT_COORDS, 15);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: 'Map data &copy; OSM',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(navMap);
};

// --- POIS MAP LOGIC ---
let poisMap = null;
let poisMarkers = [];
let poisClickEnabled = false;

window.initPoisMap = function () {
    const container = document.getElementById('pois-map-container');
    if (!container) return;

    if (poisMap) {
        poisMap.invalidateSize();
        return;
    }

    if (container.classList.contains('leaflet-container')) {
        container._leaflet_id = null;
        container.innerHTML = "";
    }

    poisMap = L.map('pois-map-container').setView(DEFAULT_COORDS, 13);
    setTimeout(() => { poisMap.invalidateSize(); }, 200);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd', maxZoom: 20
    }).addTo(poisMap);

    // Click to add with Snap-to-Road
    poisMap.on('click', async function (e) {
        if (!poisClickEnabled) return;

        // Visual feedback
        const loadingMarker = L.marker(e.latlng, { opacity: 0.5 }).addTo(poisMap);

        try {
            // SNAP TO ROAD API
            // Uses OSRM 'nearest' service
            const url = `https://router.project-osrm.org/nearest/v1/driving/${e.latlng.lng},${e.latlng.lat}?number=1`;
            const res = await fetch(url);
            const data = await res.json();

            loadingMarker.remove();

            if (data.code === 'Ok' && data.waypoints && data.waypoints.length > 0) {
                const snapped = data.waypoints[0].location; // [lng, lat]
                const lat = snapped[1];
                const lng = snapped[0];
                const streetName = data.waypoints[0].name;

                // Open Modal with Snapped Coords
                document.getElementById('poi-lat').value = lat;
                document.getElementById('poi-lng').value = lng;

                // Pre-fill name if empty (optional comfort)
                const nameInput = document.getElementById('poi-name');
                if (!nameInput.value && streetName) {
                    nameInput.value = streetName;
                }

                // Show temporary marker at snapped location
                L.marker([lat, lng], {
                    icon: L.divIcon({ className: 'poi-marker', html: '<div style="background-color:cyan;width:12px;height:12px;border-radius:50%;"></div>' })
                }).addTo(poisMap).bindPopup("Point sur route détecté").openPopup();

                const modal = new bootstrap.Modal(document.getElementById('poiModal'));
                modal.show();

                poisClickEnabled = false;

            } else {
                alert("Aucune route trouvée à proximité.");
            }
        } catch (err) {
            console.error(err);
            loadingMarker.remove();
            alert("Erreur de connexion au service de route.");
        }
    });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            poisMap.setView([pos.coords.latitude, pos.coords.longitude], 13);
        });
    }
};

window.renderPoisOnMap = function (points) {
    if (!poisMap) return;

    // Clear old
    poisMarkers.forEach(m => m.remove());
    poisMarkers = [];

    points.forEach(p => {
        const iconHtml = '<div style="background-color: #f1c40f; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white;"></div>';
        const m = L.marker([p.lat, p.lng], {
            icon: L.divIcon({ className: 'poi-marker', html: iconHtml, iconSize: [18, 18] })
        }).addTo(poisMap);

        m.bindPopup(`<strong>${p.name}</strong><br>${p.description || ''}`);
        poisMarkers.push(m);
    });
};

window.enablePoiMapClick = function () {
    poisClickEnabled = true;
};

window.disablePoiMapClick = function () {
    poisClickEnabled = false;
};
