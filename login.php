<?php include 'includes/header.php'; ?>

<div class="container d-flex flex-column justify-content-center min-vh-100 py-4">
    <div class="text-center mb-4">
        <i class="ph-fill ph-bicycle text-primary" style="font-size: 48px;"></i>
        <h1 class="h3 mt-2">Bienvenue</h1>
    </div>

    <div class="card border-0 bg-surface">
        <div class="card-body p-4">
            
            <!-- Login Form -->
            <form id="login-form">
                <h2 class="h5 mb-3">Connexion</h2>
                <div class="mb-3">
                    <label class="form-label text-muted small">Email</label>
                    <input type="email" class="form-control" name="email" required>
                </div>
                <div class="mb-3">
                    <label class="form-label text-muted small">Mot de passe</label>
                    <input type="password" class="form-control" name="password" required>
                </div>
                <button type="submit" class="btn btn-primary w-100 mb-3">Se connecter</button>
                <div class="text-center">
                    <a href="#" class="small text-muted text-decoration-none" onclick="toggleAuthMode('register')">Pas encore de compte ? Créer un compte</a>
                </div>
            </form>

            <!-- Register Form (Hidden) -->
            <form id="register-form" class="d-none">
                <h2 class="h5 mb-3">Créer un compte</h2>
                <div class="mb-3">
                    <label class="form-label text-muted small">Nom d'utilisateur</label>
                    <input type="text" class="form-control" name="username" required>
                </div>
                <div class="mb-3">
                    <label class="form-label text-muted small">Email</label>
                    <input type="email" class="form-control" name="email" required>
                </div>
                <div class="mb-3">
                    <label class="form-label text-muted small">Mot de passe</label>
                    <input type="password" class="form-control" name="password" required>
                </div>
                <button type="submit" class="btn btn-success w-100 mb-3">S'inscrire</button>
                <div class="text-center">
                    <a href="#" class="small text-muted text-decoration-none" onclick="toggleAuthMode('login')">Déjà un compte ? Se connecter</a>
                </div>
            </form>

        </div>
    </div>
</div>

<script>
    function toggleAuthMode(mode) {
        if (mode === 'register') {
            document.getElementById('login-form').classList.add('d-none');
            document.getElementById('register-form').classList.remove('d-none');
        } else {
            document.getElementById('login-form').classList.remove('d-none');
            document.getElementById('register-form').classList.add('d-none');
        }
    }

    // Handle Forms
    document.addEventListener('DOMContentLoaded', () => {
        // Login
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            data.action = 'login';
            
            try {
                const res = await fetch('api/auth.php', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                const result = await res.json();
                
                if (result.success) {
                    localStorage.setItem('tc_user', JSON.stringify(result.user));
                    window.location.href = 'index.php';
                } else {
                    alert(result.error);
                }
            } catch (err) {
                alert('Erreur serveur');
            }
        });

        // Register
        document.getElementById('register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            data.action = 'register';
            
            try {
                const res = await fetch('api/auth.php', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                const result = await res.json();
                
                if (result.success) {
                    localStorage.setItem('tc_user', JSON.stringify(result.user));
                    alert('Compte créé !');
                    window.location.href = 'index.php';
                } else {
                    alert(result.error);
                }
            } catch (err) {
                alert('Erreur serveur');
            }
        });
    });
</script>

<?php include 'includes/scripts.php'; ?>
