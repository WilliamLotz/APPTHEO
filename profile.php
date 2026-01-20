<?php include 'includes/header.php'; ?>

<!-- VIEW: PROFILE -->
<div id="view-profile" class="view active container py-4">
    <header class="mb-4">
        <h2 class="h3">Mon Profil</h2>
    </header>
    <form id="profile-form">
        <div class="mb-3">
            <label for="inp-name" class="form-label text-muted">Nom ou Pseudo</label>
            <input type="text" class="form-control" id="inp-name" placeholder="Ex: Thomas Voeckler" required>
        </div>
        
        <div class="mb-3">
            <label for="inp-mode" class="form-label text-muted">Mode de participation</label>
            <select id="inp-mode" class="form-select">
                <option value="solo">Solo</option>
                <option value="team">Binôme / Équipe</option>
            </select>
        </div>

        <div class="mb-3">
            <label class="form-label text-muted">ID Équipe (Si Binôme)</label>
            <input type="text" class="form-control" placeholder="Généré automatiquement..." disabled style="opacity: 0.5;">
        </div>

        <button type="button" class="btn btn-danger w-100 mb-3" onclick="App.logout()">Se déconnecter</button>
    </form>
</div>

<?php include 'includes/nav.php'; ?>
<?php include 'includes/scripts.php'; ?>
