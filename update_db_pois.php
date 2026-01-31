<?php
require_once 'config.php';

try {
    echo "Updating database for Custom Points...<br>";

    $sql = "CREATE TABLE IF NOT EXISTS `tc_custom_points` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `user_id` int(11) NOT NULL,
      `name` varchar(100) NOT NULL,
      `description` text,
      `lat` double NOT NULL,
      `lng` double NOT NULL,
      `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

    $pdo->exec($sql);
    echo "Table `tc_custom_points` created or already exists.<br>";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
