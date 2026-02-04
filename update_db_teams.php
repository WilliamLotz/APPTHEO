<?php
// update_db_teams.php
require_once 'config.php';

try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS `tc_teams` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `name` varchar(100) NOT NULL,
      `code` varchar(10) NOT NULL UNIQUE,
      `created_by` int(11) NOT NULL,
      `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    
    echo "Table tc_teams created.<br>";

    // Update tc_users to hold team_int_id? 
    // Currently tc_users.team_id is varchar.
    // We will keep using the 'code' in tc_users.team_id for backward compatibility/simplicity
    // OR we switch to integer ID.
    // Let's switch to integer ID for better relation, but 'team_id' column name is ambiguous then.
    // Let's assume tc_users.team_id meant 'team identifier string'.
    // We will add `team_uid` (int) or just use the code as the link.
    // Using Code is easier for now: tc_users.team_id = tc_teams.code.
    
    echo "DB Updated.";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
