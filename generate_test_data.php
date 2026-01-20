<?php
// generate_test_data.php
require 'config.php';

header('Content-Type: text/plain');

// Coordonnées La Havre (ou Paris par défaut si null)
$centerLat = 49.4944; 
$centerLng = 0.1079;

// Si l'utilisateur passe des coords
if(isset($_GET['lat'])) $centerLat = floatval($_GET['lat']);
if(isset($_GET['lng'])) $centerLng = floatval($_GET['lng']);

echo "GÉNÉRATION DE DONNÉES DE TEST\n";
echo "=============================\n";
echo "Centre: $centerLat, $centerLng\n";

// Vider la table
$pdo->query("TRUNCATE TABLE tc_places");
echo "Table tc_places vidée.\n";

$stmt = $pdo->prepare("INSERT INTO tc_places (name, lat, lng, points) VALUES (?, ?, ?, ?)");

$count = 0;
// Générer 20 pancartes (Rouges)
for($i=0; $i<20; $i++) {
    // Random offset (env. 5km autour)
    $lat = $centerLat + (mt_rand(-50, 50) / 1000);
    $lng = $centerLng + (mt_rand(-50, 50) / 1000);
    
    $name = "🛑 Pancarte Test " . ($i+1);
    $points = 50;
    
    $stmt->execute([$name, $lat, $lng, $points]);
    $count++;
}

// Générer 30 villages (Bleus)
for($i=0; $i<30; $i++) {
    // Random offset (env. 10km autour)
    $lat = $centerLat + (mt_rand(-100, 100) / 1000);
    $lng = $centerLng + (mt_rand(-100, 100) / 1000);
    
    $name = "🏠 Village Test " . ($i+1);
    $points = 10;
    
    $stmt->execute([$name, $lat, $lng, $points]);
    $count++;
}

echo "Succès ! $count lieux de test générés autour du Havre.\n";
echo "Retournez sur la carte et faites une recherche (le bouton 'Créer').\n";
?>
