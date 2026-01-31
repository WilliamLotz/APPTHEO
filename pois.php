<?php include 'includes/header.php'; ?>

<div id="view-pois" class="view active container py-4 d-flex flex-column h-100">
    <header class="mb-3 d-flex justify-content-between align-items-center">
        <h2 class="h4 mb-0">Mes Points</h2>
        <button id="btn-add-poi" class="btn btn-sm btn-primary" onclick="App.togglePoiCreationMode()">
            <i class="ph-bold ph-plus me-1"></i> Nouveau
        </button>
    </header>

    <div id="pois-map-container" class="rounded mb-3 flex-grow-1" style="min-height: 400px; background: #2a2d35; border: 1px solid #444;"></div>
    
    <div class="card border-0 bg-surface">
        <div class="card-header bg-transparent border-0 pb-0">
            <h3 class="h6 text-muted mb-0">Liste des points</h3>
        </div>
        <div class="card-body px-2" id="pois-list">
            <p class="text-center text-muted small">Chargement...</p>
        </div>
    </div>
</div>

<!-- Modal Creation Point -->
<div class="modal fade" id="poiModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content bg-surface text-light">
      <div class="modal-header border-secondary">
        <h5 class="modal-title">Nouveau Point</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <form id="poi-form">
            <input type="hidden" id="poi-lat">
            <input type="hidden" id="poi-lng">
            <div class="mb-3">
                <label class="form-label">Nom</label>
                <input type="text" class="form-control" id="poi-name" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Points (Score)</label>
                <input type="number" class="form-control" id="poi-score" value="10" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Description</label>
                <textarea class="form-control" id="poi-desc" rows="2"></textarea>
            </div>
            <button type="submit" class="btn btn-primary w-100">Enregistrer</button>
        </form>
      </div>
    </div>
  </div>
</div>

<?php include 'includes/nav.php'; ?>
<?php include 'includes/scripts.php'; ?>

<script>
    // Specific logic for Points page
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof App.initPoisMode === 'function') {
            App.initPoisMode();
        }
    });
</script>
