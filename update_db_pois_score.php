<?php
require_once 'config.php';

try {
    echo "Updating database structure for POI scores...<br>";

    // Add 'score' column if not exists
    try {
        $pdo->exec("ALTER TABLE tc_custom_points ADD COLUMN score int(11) DEFAULT 0 AFTER description");
        echo "Added column 'score'<br>";
    } catch (PDOException $e) {
        echo "Column 'score' likely exists or error: " . $e->getMessage() . "<br>";
    }

    echo "Database structure updated successfully.";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
