<?php
// config.php - Configuration de la base de données

$host = 'localhost';
$db   = 'trailconnect';
$user = 'root';
$pass = 'root'; // Mot de passe par défaut UwAmp

$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    // Connexion initiale sans DB pour pouvoir la créer si elle n'existe pas
    $pdo_init = new PDO("mysql:host=$host;charset=$charset", $user, $pass, $options);
    
    // Création DB si n'existe pas
    $pdo_init->exec("CREATE DATABASE IF NOT EXISTS `$db`");
    
    // Connexion finale à la bonne DB
    $pdo = new PDO($dsn, $user, $pass, $options);
    
} catch (\PDOException $e) {
    // En production on log l'erreur, ici on l'affiche pour le debuug
    die("Erreur de connexion BDD : " . $e->getMessage());
    // Note: Sur UwAmp le mot de passe root est souvent 'root'
}
?>
