<?php
// api/route.php
require_once '../config.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents('php://input'), true);

if ($method === 'POST') {
    // Sauvegarder (Nouvel Ajout) ou Mettre à jour (Édition)
    $id = $data['id'] ?? null;
    $name = $data['name'] ?? 'Parcours sans titre';
    $points = $data['points'] ?? []; // Array of {lat, lng}
    $distance = $data['distance'] ?? 0;
    $userId = $data['user_id'] ?? 0;

    if (empty($points)) {
        echo json_encode(['error' => 'Aucun point tracé']);
        exit;
    }

    try {
        $mapDataJson = json_encode($points);
        
        if ($id) {
            // UPDATE
            $stmt = $pdo->prepare("UPDATE tc_routes SET name = ?, map_data = ?, distance_km = ? WHERE id = ?");
            $stmt->execute([$name, $mapDataJson, $distance, $id]);
            $routeId = $id;
        } else {
            // INSERT
            $stmt = $pdo->prepare("INSERT INTO tc_routes (name, map_data, distance_km, created_by) VALUES (?, ?, ?, ?)");
            $stmt->execute([$name, $mapDataJson, $distance, $userId]);
            $routeId = $pdo->lastInsertId();
        }
        
        echo json_encode(['success' => true, 'route_id' => $routeId]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }

} elseif ($method === 'GET') {
    // Récupérer un parcours par ID
    $id = $_GET['id'] ?? 0;
    
    if ($id) {
        $stmt = $pdo->prepare("SELECT * FROM tc_routes WHERE id = ?");
        $stmt->execute([$id]);
        $route = $stmt->fetch();
        
        if ($route) {
            echo json_encode(['success' => true, 'route' => $route]);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Parcours introuvable']);
        }
    } else {
        // Lister les parcours
        // Si user_id est fourni, on filtre. Sinon on montre tout (ou public si on avait un flag)
        $filterUser = $_GET['user_id'] ?? 0;

        if ($filterUser) {
            // Fetch routes from the user OR from their team members
            $sql = "SELECT DISTINCT r.id, r.name, r.distance_km, r.created_at 
                    FROM tc_routes r 
                    LEFT JOIN tc_users u ON r.created_by = u.id 
                    WHERE r.created_by = ? 
                       OR (u.team_id IS NOT NULL AND u.team_id != '' AND u.team_id = (SELECT team_id FROM tc_users WHERE id = ?))
                    ORDER BY r.created_at DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$filterUser, $filterUser]);
        } else {
            // Mode "Public" ou global (limité)
            $stmt = $pdo->query("SELECT id, name, distance_km, created_at FROM tc_routes ORDER BY created_at DESC LIMIT 10");
        }

        $routes = $stmt->fetchAll();
        echo json_encode(['success' => true, 'routes' => $routes]);
    }

} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? 0;
    if ($id) {
        $stmt = $pdo->prepare("DELETE FROM tc_routes WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'ID manquant']);
    }
}
?>
