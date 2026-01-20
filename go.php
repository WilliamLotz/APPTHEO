<?php include 'includes/header.php'; ?>

<!-- VIEW: NAVIGATE -->
<div id="view-navigate" class="view active container py-4">
    <!-- MODE SÉLECTION -->
    <div id="nav-selection">
        <header class="mb-3">
            <h2 class="h4">Choisir un parcours</h2>
        </header>
        <div id="routes-list" class="row g-2">
            <p class="text-muted">Chargement des parcours...</p>
        </div>
    </div>

    <!-- MODE NAVIGATION ACTIVE (Caché par défaut) -->
    <div id="nav-active" class="d-none h-100 flex-column">
            <header class="d-flex justify-content-between align-items-center mb-2">
            <button class="btn btn-sm btn-link text-white text-decoration-none p-0" onclick="App.stopNavigation()">
                <i class="ph-bold ph-arrow-left"></i> Retour
            </button>
            <div class="font-monospace fs-5">00:00:00</div>
        </header>
        
        <div id="nav-info-header" class="mb-2">
            <h3 id="nav-route-name" class="h5 mb-0">Nom du parcours</h3>
            <span id="nav-route-stats" class="small text-muted">0 pts • 0 km</span>
        </div>

        <div id="nav-map-container" class="rounded mb-3 flex-grow-1" style="min-height: 30vh;"></div>

        <div class="card border-0 bg-surface mb-3" style="border-left: 4px solid var(--primary) !important;">
            <div class="card-body">
                <h3 class="h6">Prochaine étape</h3>
                <p id="nav-instruction" class="fs-5 mb-1 text-white">En attente du signal GPS...</p>
                <div id="nav-dist-next" class="display-6 fw-bold text-primary">-- m</div>
            </div>
        </div>
        
        <button class="btn btn-primary w-100 mb-5" id="btn-simulate-gps" onclick="window.simulateGPSMove()">
            <i class="ph-fill ph-play me-2"></i> Simuler Avancée (Démo)
        </button>
    </div>
</div>

<?php include 'includes/nav.php'; ?>
<?php include 'includes/scripts.php'; ?>
