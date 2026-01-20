<?php
// install.php - Lancez ce fichier pour installer la structure SQL

require 'config.php';

try {
    $sql = file_get_contents('setup.sql');
    $pdo->exec($sql);
    echo "<h1>Installation réussie !</h1>";
    echo "<p>La base de données <code>trailconnect</code> et les tables ont été créées.</p>";
    echo "<a href='index.php'>Retour à l'accueil</a>";
} catch (PDOException $e) {
    echo "<h1>Erreur d'installation</h1>";
    echo "<pre>" . $e->getMessage() . "</pre>";
}
?>
