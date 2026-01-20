<?php
// reset_data.php
require 'config.php';

$pdo->query("TRUNCATE TABLE tc_places");

echo "<h1>Cache vidé ! 🗑️</h1>";
echo "<p>J'ai supprimé toutes les anciennes données (les 20 ou 50 anciens points).</p>";
echo "<p>La prochaine fois que vous ferez une recherche sur la carte, le système sera OBLIGÉ d'utiliser le nouvel algorithme (8 pancartes par village).</p>";
echo "<p><a href='index.php'>Retourner à l'application</a></p>";
?>
