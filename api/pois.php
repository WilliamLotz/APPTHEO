<?php
require_once '../config.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

if ($method === 'GET') {
    $user_id = $_GET['user_id'] ?? 0;
    
    if (!$user_id) {
        echo json_encode(['success' => false, 'error' => 'User ID manquant']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT * FROM tc_custom_points WHERE user_id = ? ORDER BY created_at DESC");
    $stmt->execute([$user_id]);
    $points = $stmt->fetchAll();

    echo json_encode(['success' => true, 'points' => $points]);

} elseif ($method === 'POST') {
    $user_id = $input['user_id'] ?? 0;
    $name = $input['name'] ?? '';
    $score = $input['score'] ?? 0;
    $desc = $input['description'] ?? '';
    $lat = $input['lat'] ?? 0;
    $lng = $input['lng'] ?? 0;

    if (!$user_id || !$name || !$lat || !$lng) {
        echo json_encode(['success' => false, 'error' => 'Données manquantes']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO tc_custom_points (user_id, name, score, description, lat, lng) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$user_id, $name, $score, $desc, $lat, $lng]);
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }

} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? 0;
    
    if ($id) {
        $stmt = $pdo->prepare("DELETE FROM tc_custom_points WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'ID manquant']);
    }
}
?>
