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

window.initEditorMap = function () {
    if (editorMap) return; // Already init

    const container = document.getElementById('map-container');
    if (!container) return;

    editorMap = L.map('map-container').setView(DEFAULT_COORDS, 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(editorMap);

    // Click handler: Manual Point Addition
    editorMap.on('click', function (e) {
        if (editorMarkers.length === 0) {
            // First point = START
            const marker = L.marker(e.latlng, {
                icon: L.divIcon({ className: 'start-marker', html: '🚩', iconSize: [30, 30] }),
                title: "Départ"
            }).addTo(editorMap);

            addToRoute(marker, e.latlng, "Départ");
        } else {
            // Next points = Checkpoints
            const count = editorMarkers.length; // Just for display name
            const name = "Point " + count;

            // Icon simple rouge
            const iconHtml = '<div style="background-color: #e74c3c; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px #c0392b;"></div>';

            const marker = L.marker(e.latlng, {
                icon: L.divIcon({ className: 'manual-marker', html: iconHtml, iconSize: [20, 20] }),
                title: name,
                draggable: false // Désactivé à la demande
            }).addTo(editorMap);

            addToRoute(marker, e.latlng, name);

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
};

// Update marker data from popup inputs
window.updateMarkerData = function (uniqueId, field, value) {
    const m = editorMarkers.find(marker => marker._uniqueId === uniqueId);
    if (!m) {
        console.warn("Marker not found for update:", uniqueId);
        return;
    }

    if (field === 'name') {
        m.placeName = value; // Store custom name
        console.log("Updated Name for Marker", uniqueId, ":", value);
    } else if (field === 'score') {
        m._customScore = parseInt(value, 10);
        console.log("Updated Score for Marker", uniqueId, ":", value);
    }
};

let availablePlaceMarkers = [];

function setStartPoint(latlng) { }

async function loadNearbyPlaces(latlng) {
    console.log("Mode manuel activé : Pas de recherche automatique.");
    return;
}

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
        const routeRes = await fetch(osrmUrl);
        const routeJson = await routeRes.json();

        if (routeJson.routes && routeJson.routes.length > 0) {
            navRouteData = routeJson.routes[0];

            // Tracer la ligne bleue
            const coordinates = navRouteData.geometry.coordinates.map(c => [c[1], c[0]]);
            navPolyline = L.polyline(coordinates, { color: '#3498db', weight: 6, opacity: 0.9 }).addTo(navMap);

            // Initialiser le marqueur utilisateur au départ
            const startPos = points[0];
            const userIcon = L.divIcon({
                className: 'user-marker-icon',
                html: '<div style="background-color: var(--primary); width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px var(--primary);"></div>',
                iconSize: [20, 20]
            });
            navUserMarker = L.marker([startPos.lat, startPos.lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(navMap);

            // Afficher première instruction
            updateNavInstruction(0);

        } else {
            alert("Erreur de calcul d'itinéraire (Trop complexe ou serveur HS).");
        }
    } catch (e) {
        console.error(e);
        alert("Erreur réseau");
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

function updateNavInstruction(stepIndex) {
    if (!navRouteData) return;

    const firstLeg = navRouteData.legs[0];
    if (firstLeg && firstLeg.steps.length > stepIndex) {
        const step = firstLeg.steps[stepIndex];
        let text = step.maneuver.type;
        if (step.maneuver.modifier) text += " " + step.maneuver.modifier;
        if (step.name) text += " sur " + step.name;

        text = text.replace('turn right', 'Tournez à DROITE ➡️')
            .replace('turn left', 'Tournez à GAUCHE ⬅️')
            .replace('depart', 'Démarrage 🚩')
            .replace('arrive', 'Arrivée 🏁')
            .replace('new name', 'Continuez');

        document.getElementById('nav-instruction').textContent = text;
        document.getElementById('nav-dist-next').textContent = step.distance < 1000 ? Math.round(step.distance) + " m" : (step.distance / 1000).toFixed(1) + " km";
    }
}

// Simulation Démo
window.simulateGPSMove = function () {
    if (!navRouteData || !navUserMarker) return;

    const allCoords = navRouteData.geometry.coordinates.map(c => [c[1], c[0]]);
    let i = 0;

    if (navSimulationInterval) clearInterval(navSimulationInterval);

    document.getElementById('btn-simulate-gps').textContent = "Simulation en cours...";
    document.getElementById('btn-simulate-gps').disabled = true;

    navSimulationInterval = setInterval(() => {
        if (i >= allCoords.length) {
            clearInterval(navSimulationInterval);
            alert("Arrivée !");
            document.getElementById('btn-simulate-gps').textContent = "Relancer Simulation on";
            document.getElementById('btn-simulate-gps').disabled = false;
            return;
        }

        const pos = allCoords[i];
        navUserMarker.setLatLng(pos);
        navMap.panTo(pos);

        if (i % 50 === 0) {
            const fakeSteps = ["Tournez à droite", "Continuez tout droit", "Léger virage gauche", "Attention carrefour"];
            const rand = fakeSteps[Math.floor(Math.random() * fakeSteps.length)];
            document.getElementById('nav-instruction').textContent = rand;
            document.getElementById('nav-dist-next').textContent = Math.round(Math.random() * 500) + " m";
        }

        i++;
    }, 100);
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
