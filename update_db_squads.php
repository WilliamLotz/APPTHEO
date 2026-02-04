<?php
// update_db_squads.php
require_once 'config.php';

try {
    // Table for Squads (Sub-groups within a Team)
    $pdo->exec("CREATE TABLE IF NOT EXISTS `tc_squads` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `team_code` varchar(20) NOT NULL,
      `name` varchar(100) NOT NULL,
      `created_by` int(11) NOT NULL,
      `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    
    // Add squad_id to users
    // Check if column exists first to avoid error
    $col = $pdo->query("SHOW COLUMNS FROM `tc_users` LIKE 'squad_id'")->fetch();
    if (!$col) {
        $pdo->exec("ALTER TABLE `tc_users` ADD COLUMN `squad_id` int(11) DEFAULT NULL");
    }
    
    echo "Groups/Binomes tables updated.<br>";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
