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
        


        <div class="mb-4">
            <h3 class="h6 text-muted mb-2">Gestion d'Équipe</h3>
            <div id="team-ui" class="bg-dark rounded p-3 border border-secondary">
                <div class="text-center text-muted small">Chargement...</div>
            </div>
        </div>

        <!-- Hidden inputs for legacy manual update if needed, but handled by new UI -->
        <input type="hidden" id="inp-team">
        
        <!-- SAVE PROFILE BUTTON REMOVED for Team, kept for Name/Mode -->
        <button type="submit" class="btn btn-primary w-100 mb-3">Sauvegarder Profil</button>
        <button type="button" class="btn btn-danger w-100 mb-3" onclick="App.logout()">Se déconnecter</button>
    </form>
</div>

<!-- Modal Create Team -->
<div class="modal fade" id="createTeamModal" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content bg-surface text-light">
      <div class="modal-header border-secondary">
        <h5 class="modal-title">Créer une Équipe</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <input type="text" id="new-team-name" class="form-control mb-3" placeholder="Nom de l'équipe (ex: Les Rapides)">
        <button class="btn btn-primary w-100" onclick="App.createTeam()">Valider</button>
      </div>
    </div>
  </div>
</div>


<?php include 'includes/nav.php'; ?>
<?php include 'includes/scripts.php'; ?>
