<?php
// api/user.php
require_once '../config.php';
header('Content-Type: application/json');

// Recevoir le JSON du frontend
$data = json_decode(file_get_contents('php://input'), true);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Création / Connexion User
    $username = trim($data['username'] ?? '');
    $mode = $data['mode'] ?? 'solo';
    
    if (empty($username)) {
        http_response_code(400);
        echo json_encode(['error' => 'Nom requis']);
        exit;
    }

    try {
        // Vérifier si existe déjà (pour simplifier on check juste le username ici, 
        // en vrai on voudrait un login/pass ou un device ID)
        $stmt = $pdo->prepare("SELECT * FROM tc_users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if (!$user) {
            // Création
            $team_id = ($mode === 'team') ? uniqid('TEAM-') : null;
            
            $stmt = $pdo->prepare("INSERT INTO tc_users (username, mode, team_id) VALUES (?, ?, ?)");
            $stmt->execute([$username, $mode, $team_id]);
            
            $user_id = $pdo->lastInsertId();
            
            // Re-fetch pour avoir l'objet complet
            $stmt = $pdo->prepare("SELECT * FROM tc_users WHERE id = ?");
            $stmt->execute([$user_id]);
            $user = $stmt->fetch();
        }

        echo json_encode(['success' => true, 'user' => $user]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erreur BDD: ' . $e->getMessage()]);
    }
}
?>
