<?php include 'includes/header.php'; ?>

<!-- VIEW: EDITOR -->
<div id="view-editor" class="view active container py-4 d-flex flex-column h-100">
    <header class="mb-3">
        <h2 class="h4">Créer un parcours</h2>
    </header>
    <div id="map-container" class="rounded mb-3 flex-grow-1" style="min-height: 400px; background: #2a2d35; border: 1px solid #444;"></div>
    <p class="small text-muted text-center">Touchez la carte pour ajouter des points.</p>
    
    <div class="card mb-3 border-0 bg-surface">
        <div class="card-body">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <span class="d-block small text-muted">Distance</span>
                    <strong class="fs-4">0.0 km</strong>
                </div>
                <div>
                        <span class="d-block small text-muted">Dénivelé</span>
                    <strong class="fs-4">0 m</strong>
                </div>
            </div>
        </div>
    </div>

    <button class="btn btn-primary w-100 mb-5" onclick="saveCurrentRoute()">Générer le QR Code / Sauvegarder</button>
</div>

<?php include 'includes/nav.php'; ?>
<?php include 'includes/scripts.php'; ?>

<script>
    // Force Map Init backup
    document.addEventListener('DOMContentLoaded', () => {
        console.log("Force Map Init Triggered");
        setTimeout(() => {
            if (typeof window.initEditorMode === 'function') {
                window.initEditorMode();
            } else {
                console.error("initEditorMode not found");
            }
        }, 500);
    });
</script>
