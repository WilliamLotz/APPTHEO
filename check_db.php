<?php
// check_db.php
require 'config.php';

echo "<h2>Diagnostic Base de Données</h2>";

// 1. Check Connection
if($pdo) {
    echo "<p style='color:green'>✅ Connexion BDD OK</p>";
} else {
    echo "<p style='color:red'>❌ Erreur Connexion BDD</p>";
    exit;
}

// 2. Check Table tc_places
try {
    $stmt = $pdo->query("SELECT count(*) as total FROM tc_places");
    $res = $stmt->fetch();
    echo "<p>Nombre de pancartes dans la base : <strong>" . $res['total'] . "</strong></p>";
    
    if($res['total'] == 0) {
        echo "<p style='color:red'>⚠️ La table est vide ! Vous n'avez pas lancé le script de mise à jour.</p>";
        echo "<a href='update_db.php'>CLIQUEZ ICI POUR AJOUTER LES PANCARTES DE TEST</a>";
    } else {
        echo "<p style='color:green'>✅ Données présentes.</p>";
        
        $stmt = $pdo->query("SELECT * FROM tc_places LIMIT 5");
        $places = $stmt->fetchAll();
        echo "<h3>Exemple de données (5 premiers) :</h3><ul>";
        foreach($places as $p) {
            echo "<li>{$p['name']} ({$p['lat']}, {$p['lng']})</li>";
        }
        echo "</ul>";
    }
} catch (Exception $e) {
    echo "<p style='color:red'>❌ Erreur SQL : " . $e->getMessage() . "</p>";
    echo "<p>La table n'existe probablement pas. <a href='update_db.php'>Lancer la mise à jour</a></p>";
}
?>
