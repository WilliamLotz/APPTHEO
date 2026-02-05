<?php
require_once '../config.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents('php://input'), true);

if ($method === 'POST') {
    $action = $data['action'] ?? 'login';

    if ($action === 'register') {
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';
        $username = $data['username'] ?? '';

        if (!$email || !$password || !$username) {
            echo json_encode(['success' => false, 'error' => 'Champs manquants']);
            exit;
        }

        // Hash password
        $hash = password_hash($password, PASSWORD_DEFAULT);

        try {
            // Check email
            $stmt = $pdo->prepare("SELECT id FROM tc_users WHERE email = ?");
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                echo json_encode(['success' => false, 'error' => 'Cet email est déjà utilisé']);
                exit;
            }

            // Insert
            $stmt = $pdo->prepare("INSERT INTO tc_users (username, email, password) VALUES (?, ?, ?)");
            $stmt->execute([$username, $email, $hash]);
            $id = $pdo->lastInsertId();

            $user = [
                'id' => $id,
                'username' => $username,
                'email' => $email
            ];

            echo json_encode(['success' => true, 'user' => $user]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Erreur SQL: ' . $e->getMessage()]);
        }

    } elseif ($action === 'login') {
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';

        if (!$email || !$password) {
            echo json_encode(['success' => false, 'error' => 'Email et mot de passe requis']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("SELECT * FROM tc_users WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user && password_verify($password, $user['password'])) {
                // Remove password from response
                unset($user['password']);
                echo json_encode(['success' => true, 'user' => $user]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Identifiants incorrects']);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Erreur SQL']);
        }
    } elseif ($action === 'update') {
        $id = $data['id'] ?? 0;
        $username = $data['username'] ?? '';
        $email = $data['email'] ?? '';
        $mode = $data['mode'] ?? 'solo';
        $password = $data['password'] ?? '';

        if (!$id || !$username || !$email || !$password) {
            echo json_encode(['success' => false, 'error' => 'Données manquantes (mot de passe requis)']);
            exit;
        }

        try {
            // Verify Password
            $stmt = $pdo->prepare("SELECT password FROM tc_users WHERE id = ?");
            $stmt->execute([$id]);
            $currentHash = $stmt->fetchColumn();

            if (!password_verify($password, $currentHash)) {
                 echo json_encode(['success' => false, 'error' => 'Mot de passe incorrect']);
                 exit;
            }

            // Check email uniqueness (excluding self)
            $stmt = $pdo->prepare("SELECT id FROM tc_users WHERE email = ? AND id != ?");
            $stmt->execute([$email, $id]);
            if ($stmt->fetch()) {
                echo json_encode(['success' => false, 'error' => 'Cet email est déjà pris']);
                exit;
            }

            // Prepare Update
            $sql = "UPDATE tc_users SET username = ?, email = ?, mode = ?";
            $params = [$username, $email, $mode];

            $newPassword = $data['new_password'] ?? '';
            if ($newPassword) {
                $sql .= ", password = ?";
                $params[] = password_hash($newPassword, PASSWORD_DEFAULT);
            }

            $sql .= " WHERE id = ?";
            $params[] = $id;

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
             http_response_code(500);
             echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    }
}
?>
