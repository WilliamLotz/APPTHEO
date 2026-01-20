<?php
// api/places.php
require_once '../config.php';
header('Content-Type: application/json');

$lat = $_GET['lat'] ?? null;
$lng = $_GET['lng'] ?? null;
$radius = 50000; // 50km

if (!$lat || !$lng) {
    echo json_encode(['error' => 'Coordonnées manquantes']);
    exit;
}

// 1. D'abord on regarde si on a pas déjà des lieux en cache local
// On cherche dans un rayon un peu plus court pour le cache (ex 49km)
// Augmentation de la LIMIT à 200 pour avoir plus de densité
$sql = "SELECT id, name, lat, lng, points,
    ( 6371 * acos( cos( radians(?) ) * cos( radians( lat ) ) 
    * cos( radians( lng ) - radians(?) ) + sin( radians(?) ) 
    * sin( radians( lat ) ) ) ) AS distance 
    FROM tc_places 
    HAVING distance < 50 
    ORDER BY distance ASC LIMIT 200";

$stmt = $pdo->prepare($sql);
$stmt->execute([$lat, $lng, $lat]);
$cachedPlaces = $stmt->fetchAll();

// Si on a assez de résultats en cache (> 20), on renvoie direct
// (Avant c'était 5, on force un peu plus la richesse)
if (count($cachedPlaces) > 20) {
    echo json_encode(['success' => true, 'places' => $cachedPlaces, 'source' => 'cache', 'count' => count($cachedPlaces)]);
    exit;
}

// 2. Sinon, on interroge OpenStreetMap (Overpass API)
try {
    $overpassUrl = "https://overpass-api.de/api/interpreter";
    
    // Recherche de traffic_sign sur Noeuds/Voies/Relations
    // + Fallback sur Villes/Villages/Hameaux
    $query = "[out:json][timeout:25];
    (
      nwr[\"traffic_sign\"=\"city_limit\"](around:{$radius},{$lat},{$lng});
      nwr[\"traffic_sign\"=\"FR:EB10\"](around:{$radius},{$lat},{$lng});
      node[\"place\"~\"city|town|village|hamlet|suburb\"](around:{$radius},{$lat},{$lng});
    );
    out center 40;"; // On en demande 40 à l'API

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $overpassUrl . "?data=" . urlencode($query));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_USERAGENT, 'TrailConnect/1.0');
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); 
    
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    if (curl_errno($ch)) {
        throw new Exception("Curl Error: " . curl_error($ch));
    }
    curl_close($ch);

    $data = json_decode($result, true);
    
    if (!isset($data['elements'])) {
        throw new Exception("Erreur Overpass (HTTP $httpCode)");
    }

    $newPlaces = [];

    if (isset($data['elements'])) {
        foreach ($data['elements'] as $element) {
            
            // Gestion Latitude/Longitude
            $pLat = $element['lat'] ?? $element['center']['lat'] ?? null;
            $pLng = $element['lon'] ?? $element['center']['lon'] ?? null;
            
            if(!$pLat || !$pLng) continue;

            $rawName = $element['tags']['name'] ?? '';
            $isSign = isset($element['tags']['traffic_sign']);
            
            if ($isSign) {
                // Vraie pancarte
                $name = $rawName ? "🛑 " . $rawName : "🛑 Pancarte inconnue";
                $points = 50;
            } else {
                // Village/Ville (Fallback)
                if ($rawName) {
                    $name = "🏠 " . $rawName;
                } else {
                    continue; // Lieu sans nom, on ignore
                }
                $points = 10;
            }

            // Vérifier doublon (approx 100m)
            $check = $pdo->prepare("SELECT id FROM tc_places WHERE ABS(lat - ?) < 0.001 AND ABS(lng - ?) < 0.001");
            $check->execute([$pLat, $pLng]);
            
            if (!$check->fetch()) {
                // Insert principal
                $ins = $pdo->prepare("INSERT INTO tc_places (name, lat, lng, points) VALUES (?, ?, ?, ?)");
                $ins->execute([$name, $pLat, $pLng, $points]);
                
                $newPlaces[] = [
                    'id' => $pdo->lastInsertId(),
                    'name' => $name,
                    'lat' => $pLat,
                    'lng' => $pLng,
                    'points' => $points
                ];

                // === GÉNÉRATION PROCÉDURALE (DENSITÉ MAXIMUM) ===
                // Pour chaque village trouvé, on crée 8 Checkpoints autour (Etoile)
                // Distance : ~800m - 1.2km
                if (!$isSign) { 
                     $offsets = [
                         [0.008, 0],   // N
                         [-0.008, 0],  // S
                         [0, 0.012],   // E
                         [0, -0.012],  // W
                         [0.006, 0.009],  // NE
                         [0.006, -0.009], // NW
                         [-0.006, 0.009], // SE
                         [-0.006, -0.009] // SW
                     ];
                     
                     foreach($offsets as $idx => $off) {
                         // Variation aléatoire pour aspect naturel
                         $randLat = $off[0] + (rand(-10, 10) / 10000);
                         $randLng = $off[1] + (rand(-10, 10) / 10000);
                         
                         $virtLat = $pLat + $randLat;
                         $virtLng = $pLng + $randLng;
                         // Nom type: "🛑 [NomVillage] (Checkpoint 1)"
                         $virtName = "🛑 " . $rawName . " (Checkpoint " . ($idx+1) . ")"; 
                         
                         // Check doublon
                         $checkVirt = $pdo->prepare("SELECT id FROM tc_places WHERE ABS(lat - ?) < 0.001 AND ABS(lng - ?) < 0.001");
                         $checkVirt->execute([$virtLat, $virtLng]);
                         
                         if (!$checkVirt->fetch()) {
                             $ins->execute([$virtName, $virtLat, $virtLng, 50]);
                             $newPlaces[] = [
                                'id' => $pdo->lastInsertId(),
                                'name' => $virtName,
                                'lat' => $virtLat,
                                'lng' => $virtLng,
                                'points' => 50
                            ];
                         }
                     }
                }
            }
        }
    }

    $allPlaces = array_merge($cachedPlaces, $newPlaces);
    
    echo json_encode(['success' => true, 'places' => $allPlaces, 'count_new' => count($newPlaces)]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage(), 'places' => $cachedPlaces]);
}
?>
