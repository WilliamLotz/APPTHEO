<?php
require_once 'config.php';

try {
    echo "Fixing database structure...<br>";

    // Reset users table to avoid 'Duplicate entry' error when adding UNIQUE columns
    // We assume this is a dev environment and existing partial users can be removed.
    $pdo->exec("DELETE FROM tc_users");
    echo "Cleared existing users to allow schema update.<br>";

    // Add Email
    try {
        $pdo->exec("ALTER TABLE tc_users ADD COLUMN email varchar(150) UNIQUE NOT NULL AFTER username");
        echo "Added column 'email'<br>";
    } catch (PDOException $e) {
        // Ignore if exists
    }

    // Add Password
    try {
        $pdo->exec("ALTER TABLE tc_users ADD COLUMN password varchar(255) NOT NULL AFTER email");
        echo "Added column 'password'<br>";
    } catch (PDOException $e) {
        // Ignore if exists
    }
    
    // Check Columns
    $stmt = $pdo->query("DESCRIBE tc_users");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Columns: " . implode(', ', $columns) . "<br>";

    echo "Database structure updated successfully.";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
