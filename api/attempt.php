<?php
// api/attempt.php
require_once '../config.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

if ($method === 'POST') {
    // Save new attempt
    $user_id = $input['user_id'] ?? 0;
    $route_id = $input['route_id'] ?? 0;
    $start_time = $input['start_time'] ?? null; // expects YYYY-MM-DD HH:MM:SS
    $end_time = $input['end_time'] ?? date('Y-m-d H:i:s');
    $score = $input['score'] ?? 0;

    if (!$user_id || !$route_id) {
        echo json_encode(['success' => false, 'error' => 'Données manquantes']);
        exit;
    }

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("INSERT INTO tc_attempts (user_id, route_id, start_time, end_time, status, score) VALUES (?, ?, ?, ?, 'finished', ?)");
        $stmt->execute([$user_id, $route_id, $start_time, $end_time, $score]);
        $attemptId = $pdo->lastInsertId();

        // Save Validations (Checkpoints)
        if (!empty($input['validations'])) {
            $stmtVal = $pdo->prepare("INSERT INTO tc_validations (attempt_id, checkpoint_index, validated_at, gps_lat, gps_lng) VALUES (?, ?, ?, ?, ?)");
            foreach ($input['validations'] as $val) {
                // $val comes from JS: { index: 0, time: '2023-01-01 12:00', lat: 0, lng: 0 }
                $vLat = $val['lat'] ?? 0;
                $vLng = $val['lng'] ?? 0;
                $stmtVal->execute([$attemptId, $val['index'], $val['time'], $vLat, $vLng]);
            }
        }

        $pdo->commit();
        echo json_encode(['success' => true, 'id' => $attemptId]);
    } catch (PDOException $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }

} elseif ($method === 'GET') {
    // Get Leaderboard for a route (Team filtered)
    $route_id = $_GET['route_id'] ?? 0;
    $user_id = $_GET['user_id'] ?? 0;
    $attempt_id = $_GET['attempt_id'] ?? 0;

    if ($attempt_id) {
        // DETAILED VIEW
        try {
            // Fetch Attempt
            $stmt = $pdo->prepare("SELECT a.*, u.username, r.name as route_name 
                                   FROM tc_attempts a 
                                   JOIN tc_users u ON a.user_id = u.id 
                                   JOIN tc_routes r ON a.route_id = r.id
                                   WHERE a.id = ?");
            $stmt->execute([$attempt_id]);
            $attempt = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($attempt) {
                // Fetch Validations
                $stmtVal = $pdo->prepare("SELECT * FROM tc_validations WHERE attempt_id = ? ORDER BY validated_at ASC");
                $stmtVal->execute([$attempt_id]);
                $validations = $stmtVal->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode(['success' => true, 'attempt' => $attempt, 'validations' => $validations]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Not found']);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        exit;
    }

    if (!$route_id || !$user_id) {
        echo json_encode(['success' => false, 'error' => 'IDs manquants']);
        exit;
    }

    try {
        // 1. Get User's Team
        $stmtUser = $pdo->prepare("SELECT team_id FROM tc_users WHERE id = ?");
        $stmtUser->execute([$user_id]);
        $team = $stmtUser->fetchColumn();

        if (!$team) {
            // No team -> Just show user's own attempts? Or global?
            // Let's show specific message or global if wanted.
            // Requirement says "parmi les membre de la meme equipe".
            // If no team, maybe just show own?
            $sql = "SELECT a.*, u.username, 
                           TIMESTAMPDIFF(SECOND, a.start_time, a.end_time) as duration_seconds
                    FROM tc_attempts a
                    JOIN tc_users u ON a.user_id = u.id
                    WHERE a.route_id = ? AND a.user_id = ?
                    ORDER BY a.score DESC, duration_seconds ASC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$route_id, $user_id]);
        } else {
            // Team Leaderboard (Individuals)
            $sql = "SELECT a.*, u.username, u.squad_id, s.name as squad_name,
                           TIMESTAMPDIFF(SECOND, a.start_time, a.end_time) as duration_seconds
                    FROM tc_attempts a
                    JOIN tc_users u ON a.user_id = u.id
                    LEFT JOIN tc_squads s ON u.squad_id = s.id
                    WHERE a.route_id = ? AND u.team_id = ?
                    ORDER BY a.score DESC, duration_seconds ASC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$route_id, $team]);
            $attempts = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Squad Leaderboard (Aggregated)
            $sqlSquad = "SELECT s.name as squad_name, s.id as squad_id, 
                                SUM(a.score) as total_score,
                                AVG(a.score) as avg_score, 
                                AVG(TIMESTAMPDIFF(SECOND, a.start_time, a.end_time)) as avg_seconds,
                                COUNT(a.id) as runs_count
                         FROM tc_attempts a
                         JOIN tc_users u ON a.user_id = u.id
                         JOIN tc_squads s ON u.squad_id = s.id
                         WHERE a.route_id = ? AND u.team_id = ?
                         GROUP BY s.id
                         ORDER BY total_score DESC, avg_seconds ASC";
            $stmtS = $pdo->prepare($sqlSquad);
            $stmtS->execute([$route_id, $team]);
            $squads = $stmtS->fetchAll(PDO::FETCH_ASSOC);
        }

        if (!isset($attempts)) {
             $attempts = $stmt->fetchAll(PDO::FETCH_ASSOC); // Validation for solo case
             $squads = [];
        }

        echo json_encode(['success' => true, 'leaderboard' => $attempts, 'squads_leaderboard' => $squads, 'team_id' => $team]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
?>
