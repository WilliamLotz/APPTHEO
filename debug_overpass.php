<?php
// debug_overpass.php
header('Content-Type: text/plain');

echo "TEST OVERPASS API\n";
echo "=================\n";

$lat = 48.8566; // Paris
$lng = 2.3522;
$radius = 10000;

echo "Coordonnées test: $lat, $lng (Rayon: $radius m)\n";

$overpassUrl = "https://overpass-api.de/api/interpreter";
$query = "[out:json][timeout:25];(node[\"traffic_sign\"=\"city_limit\"](around:{$radius},{$lat},{$lng}););out body 5;";

echo "Query: $query\n\n";

if(!function_exists('curl_init')) {
    die("ERREUR: CURL non activé sur ce serveur.");
}

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $overpassUrl . "?data=" . urlencode($query));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_USERAGENT, 'TrailConnect/1.0');
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); 
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$start = microtime(true);
$result = curl_exec($ch);
$duration = microtime(true) - $start;

if (curl_errno($ch)) {
    echo "ERREUR CURL: " . curl_error($ch) . "\n";
} else {
    $info = curl_getinfo($ch);
    echo "HTTP Code: " . $info['http_code'] . "\n";
    echo "Durée: " . round($duration, 3) . "s\n";
    echo "\nRÉPONSE BRUTE (500 permiers caractères):\n";
    echo substr($result, 0, 500) . "...\n";
    
    $json = json_decode($result, true);
    if($json && isset($json['elements'])) {
        echo "\nANALYSE JSON:\n";
        echo "Nombre d'éléments trouvés: " . count($json['elements']) . "\n";
    } else {
        echo "\nJSON INVALIDE ou VIDE.\n";
    }
}
curl_close($ch);
?>
