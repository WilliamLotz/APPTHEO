<?php include 'includes/header.php'; ?>

<!-- VIEW: RESULTS -->
<div id="view-results" class="view active container py-4 d-flex flex-column h-100">
    <header class="mb-3">
        <h2 class="h4">Résultats & Statistiques</h2>
    </header>

    <div class="card border-0 bg-surface flex-grow-1">
        <div class="card-header bg-transparent border-bottom border-secondary">
             <ul class="nav nav-tabs card-header-tabs border-0" id="resultsTabs">
                 <li class="nav-item">
                     <a class="nav-link active" href="#" data-tab="routes">Parcours</a>
                 </li>
                 <!-- Future: Global Ranking -->
             </ul>
        </div>
        <div class="card-body p-0" style="overflow-y:auto;" id="results-content">
            <div class="p-3 text-center text-muted">
                Chargement...
            </div>
        </div>
    </div>
</div>

<!-- Modal Détails Course -->
<div class="modal fade" id="resultDetailModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-lg modal-dialog-centered">
    <div class="modal-content bg-surface text-light">
      <div class="modal-header border-secondary">
        <div>
           <h5 class="modal-title" id="det-title">Détails Course</h5>
           <small class="text-muted" id="det-subtitle">Utilisateur - Date</small>
        </div>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        
        <div class="row text-center mb-4">
            <div class="col-4 border-end border-secondary">
                <div class="display-6 fw-bold text-warning" id="det-score">0</div>
                <div class="text-muted small">POINTS</div>
            </div>
            <div class="col-4 border-end border-secondary">
                <div class="display-6 fw-bold" id="det-time">00:00</div>
                <div class="text-muted small">TEMPS</div>
            </div>
             <div class="col-4">
                <div class="display-6 fw-bold" id="det-checkpoints">0</div>
                <div class="text-muted small">BALISES</div>
            </div>
        </div>

        <h6 class="text-uppercase text-muted small mb-3">Chronologie des Balises</h6>
        <div class="timeline" id="det-timeline">
            <!-- Timeline items -->
        </div>

      </div>
    </div>
  </div>
</div>

<style>
/* Simple CSS for Timeline */
.timeline {
    position: relative;
    border-left: 2px solid #444;
    margin-left: 20px;
    padding-left: 20px;
}
.timeline-item {
    position: relative;
    margin-bottom: 20px;
}
.timeline-item::before {
    content: '';
    position: absolute;
    left: -26px;
    top: 5px;
    width: 10px;
    height: 10px;
    background: var(--primary);
    border-radius: 50%;
}
.timeline-item.start::before { background: #fff; }
.timeline-item.checkpoint::before { background: var(--primary); }
.timeline-item.finish::before { background: #e74c3c; }
</style>

<?php include 'includes/nav.php'; ?>
<?php include 'includes/scripts.php'; ?>

<script>
document.addEventListener('DOMContentLoaded', () => {
    if (typeof App.initResultsMode === 'function') {
        App.initResultsMode();
    }
});
</script>
