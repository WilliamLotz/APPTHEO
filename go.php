<?php
// Force HTTPS
if (empty($_SERVER['HTTPS']) || $_SERVER['HTTPS'] === "off") {
    $location = 'https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
    header('HTTP/1.1 301 Moved Permanently');
    header('Location: ' . $location);
    exit;
}
include 'includes/header.php'; ?>

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
        </header>
        
        <div id="nav-info-header" class="mb-2 text-center">
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
        
        <div id="race-timer" class="font-monospace display-4 fw-bold mb-3 text-center text-warning">00:00:00</div>

        <!-- BOUTON DÉMARRER -->
        <button class="btn btn-primary w-100 mb-5 py-3 fs-5 fw-bold shadow-sm" id="btn-start-race" onclick="App.startRealRace()">
            <i class="ph-fill ph-play me-2"></i> COMMENCER LA COURSE
        </button>

        <!-- CONTRÔLES PENDANT LA COURSE (Cachés au début) -->
        <div id="race-controls" class="d-none w-100 mb-5">
            <div class="row g-2">
                <div class="col-4">
                    <button class="btn btn-warning w-100 py-3 fw-bold text-white shadow-sm" id="btn-pause-race" onclick="App.togglePauseRace()">
                        <i class="ph-fill ph-pause me-1"></i> PAUSE
                    </button>
                </div>
                <div class="col-4">
                     <button class="btn btn-success w-100 py-3 fw-bold text-white shadow-sm" onclick="App.finishRealRace()">
                        <i class="ph-fill ph-flag me-1"></i> FINIR
                    </button>
                </div>
                <div class="col-4">
                    <button class="btn btn-danger w-100 py-3 fw-bold text-white shadow-sm" onclick="App.cancelRace()">
                        <i class="ph-bold ph-x me-1"></i> STOP
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Résultats -->
    <div class="modal fade" id="resultsModal" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content bg-surface text-light">
          <div class="modal-header border-secondary">
            <h5 class="modal-title">🏆 Course Terminée !</h5>
            <button type="button" class="btn-close btn-close-white" onclick="location.reload()" aria-label="Close"></button>
          </div>
          <div class="modal-body text-center">
            <h1 class="display-4 text-warning mb-3">Bravo !</h1>
            <p class="lead">Votre score : <strong id="res-score">0 pts</strong></p>
            <p>Temps : <span id="res-time">00:00:00</span></p>

            <hr class="border-secondary my-4">
            
            <h6 class="text-uppercase text-muted small mb-3">Classement Équipe</h6>
            <div id="results-leaderboard" class="list-group list-group-flush">
                <!-- Ajax Content -->
            </div>
            
          </div>
          <div class="modal-footer border-secondary justify-content-center">
             <button class="btn btn-primary w-100" onclick="location.reload()">Retour aux parcours</button>
          </div>
        </div>
      </div>
    </div>
</div>

<?php include 'includes/nav.php'; ?>
<?php include 'includes/scripts.php'; ?>
