<?php
// import_wfs.php
require 'config.php';

header('Content-Type: text/plain');

echo "IMPORTATION WFS - VILLE DU HAVRE\n";
echo "================================\n";

// URL de base trouvée dans le fichier texte
$baseUrl = "http://data.agglo-lehavre.fr/arcgis/services/voirie_transport_et_deplacement/MapServer/WFSServer";

// Nom de la couche (trouvé dans le XML)
// Note: ArcGIS server utilise souvent "NomService:NomCouche" ou juste "NomCouche"
$typeName = "DOMAINE_PANNEAU_ENTREE_VILLE"; 

// On tente le format JSON pour faciliter le parsing
$params = [
    'service' => 'WFS',
    'version' => '2.0.0',
    'request' => 'GetFeature',
    'typeNames' => $typeName, 
    'outputFormat' => 'GEOJSON' 
];

$url = $baseUrl . "?" . http_build_query($params);

echo "URL: $url\n\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
// ArcGIS Server peut être lent
curl_setopt($ch, CURLOPT_TIMEOUT, 60); 

echo "Téléchargement en cours...\n";
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if(curl_errno($ch)) {
    die("ERREUR CURL: " . curl_error($ch));
}
curl_close($ch);

echo "Code HTTP: $httpCode\n";
echo "Taille réponse: " . strlen($response) . " octets\n";

// Vérification si c'est du XML (Erreur ou GML) ou JSON
$isJson = (substr(trim($response), 0, 1) === '{');

if(!$isJson) {
    echo "ATTENTION: La réponse n'est pas du JSON. Analyse XML...\n";
    echo substr($response, 0, 500) . "\n...\n";
    
    // Si c'est du XML, on essaie de voir si c'est une exception
    if(strpos($response, 'ExceptionReport') !== false) {
        die("ERREUR WFS renvoyée par le serveur.");
    }
    // TODO: Parser GML si besoin
    die("Format non géré pour l'instant (Probablement GML).");
}

$data = json_decode($response, true);
if(!$data || !isset($data['features'])) {
    die("ERREUR JSON: Pas de 'features' trouvé.");
}

$features = $data['features'];
$count = count($features);
echo "Nombre de panneaux trouvés: $count\n";

if($count > 0) {
    // Vider la table ou ajouter ?
    // Pour être propre et éviter les doublons avec OSM, on peut vider ou ajouter avec un flag
    // Ici on vide si l'utilisateur veut utiliser CE fichier
    echo "Vidage de la table tc_places...\n";
    $pdo->query("TRUNCATE TABLE tc_places");
    
    $stmt = $pdo->prepare("INSERT INTO tc_places (name, lat, lng, points) VALUES (?, ?, ?, ?)");
    
    $imported = 0;
    foreach($features as $f) {
        $props = $f['properties'];
        $geom = $f['geometry'];
        
        if($geom['type'] !== 'Point') continue;
        
        $lng = $geom['coordinates'][0];
        $lat = $geom['coordinates'][1];
        
        // Création d'un nom
        // Propriétés attendues (selon XML): on ne connait pas les clés exactes, on dump le premier pour voir
        if($imported === 0) {
            echo "Exemple de propriétés: " . print_r($props, true) . "\n";
        }
        
        $name = "🛑 Panneau Le Havre"; // Nom par défaut
        // Essai de trouver un label pertinent
        foreach(['NOM', 'LIBELLE', 'VILLE', 'COMMUNE'] as $key) {
            if(isset($props[$key])) {
                $name = "🛑 " . $props[$key];
                break;
            }
        }
        
        $points = 50; // Haute valeur car donnée officielle
        
        $stmt->execute([$name, $lat, $lng, $points]);
        $imported++;
    }
    
    echo "Succès ! $imported panneaux importés dans la base.\n";
}
?>
