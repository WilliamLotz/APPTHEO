<?php
require_once 'config.php';

try {
    echo "Updating database for Attempts...<br>";

    $sql = "CREATE TABLE IF NOT EXISTS `tc_attempts` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `user_id` int(11) NOT NULL,
      `route_id` int(11) NOT NULL,
      `start_time` datetime DEFAULT NULL,
      `end_time` datetime DEFAULT NULL,
      `status` enum('pending','running','finished','dnf') DEFAULT 'pending',
      `score` int(11) DEFAULT 0,
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

    $pdo->exec($sql);
    echo "Table `tc_attempts` created or already exists.<br>";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
