<nav class="bottom-nav fixed-bottom bg-dark border-top border-secondary">
    <a href="index.php" class="nav-link nav-item text-center flex-grow-1 p-2 <?php echo basename($_SERVER['PHP_SELF']) == 'index.php' ? 'active' : ''; ?>">
        <i class="ph-fill ph-house fs-4"></i>
        <span class="d-block small">Accueil</span>
    </a>
    <a href="create.php" class="nav-link nav-item text-center flex-grow-1 p-2 <?php echo basename($_SERVER['PHP_SELF']) == 'create.php' ? 'active' : ''; ?>">
        <i class="ph-fill ph-map-trifold fs-4"></i>
        <span class="d-block small">Créer</span>
    </a>
    <a href="go.php" class="nav-link nav-item text-center flex-grow-1 p-2 <?php echo basename($_SERVER['PHP_SELF']) == 'go.php' ? 'active' : ''; ?>">
        <i class="ph-fill ph-navigation-arrow fs-4"></i>
        <span class="d-block small">Go</span>
    </a>
    <a href="profile.php" class="nav-link nav-item text-center flex-grow-1 p-2 <?php echo basename($_SERVER['PHP_SELF']) == 'profile.php' ? 'active' : ''; ?>">
        <i class="ph-fill ph-user fs-4"></i>
        <span class="d-block small">Profil</span>
    </a>
</nav>
