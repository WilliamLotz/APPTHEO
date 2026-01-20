<?php include 'includes/header.php'; ?>

<!-- VIEW: HOME -->
<div id="view-home" class="view active flex-grow-1 container py-4">
    <header class="text-center my-4">
        <i class="ph-fill ph-bicycle text-primary" style="font-size: 64px;"></i>
        <h1 class="text-gradient display-4 fw-bold">TrailConnect</h1>
        <p class="lead text-muted">L'aventure commence ici.</p>
    </header>

    <div class="card mb-3 border-0 bg-surface">
        <div class="card-body">
            <h2 class="h4 card-title">Bienvenue, <span id="user-name-display" class="text-primary">Cycliste</span></h2>
            <p class="card-text text-muted">Prêt pour votre prochaine sortie ?</p>
            <div class="row g-2">
                <div class="col-6">
                    <a href="profile.php" class="btn btn-primary w-100">
                        <i class="ph-bold ph-user me-2"></i> Profil
                    </a>
                </div>
                <div class="col-6">
                    <a href="create.php" class="btn btn-secondary w-100 bg-surface-2 border-0">
                        <i class="ph-bold ph-plus me-2"></i> Créer
                    </a>
                </div>
            </div>
        </div>
    </div>

    <div class="card mb-3 border-0 bg-surface">
        <div class="card-body">
            <h3 class="h5 card-title">Activités récentes</h3>
            <p class="card-text text-muted small">Aucun parcours récent.</p>
        </div>
    </div>

    <a href="go.php" class="btn btn-primary w-100 mt-auto mb-5">
            Lancer une sortie <i class="ph-bold ph-arrow-right ms-2"></i>
    </a>
</div>

<?php include 'includes/nav.php'; ?>
<?php include 'includes/scripts.php'; ?>
