<?php
// update_db.php - Lancez ce fichier pour mettre à jour la BDD
require 'config.php';

try {
    $sql = file_get_contents('update_places.sql');
    $pdo->exec($sql);
    echo "<h1>Mise à jour réussie !</h1>";
    echo "<p>Table <code>tc_places</code> créée et remplie.</p>";
    echo "<a href='index.php'>Retour</a>";
} catch (PDOException $e) {
    echo "<h1>Erreur</h1>";
    echo "<pre>" . $e->getMessage() . "</pre>";
}
?>
