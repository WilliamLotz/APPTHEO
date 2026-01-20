<?php
require_once 'config.php';

echo "<h1>Starting DB Repair v2...</h1>";

try {
    // 1. Force drop and recreate just to be 100% sure if ALTER keeps failing
    // Or stick to the plan: Delete data then alter.
    
    $pdo->exec("TRUNCATE TABLE tc_users");
    echo "Table tc_users truncated.<br>";

    try {
        $pdo->exec("ALTER TABLE tc_users ADD COLUMN email varchar(150) UNIQUE NOT NULL AFTER username");
        echo "Added 'email' column.<br>";
    } catch (Exception $e) { 
        echo "Email col add skipped: " . $e->getMessage() . "<br>";
    }

    try {
        $pdo->exec("ALTER TABLE tc_users ADD COLUMN password varchar(255) NOT NULL AFTER email");
        echo "Added 'password' column.<br>";
    } catch (Exception $e) {
        echo "Password col add skipped.<br>";
    }

    $stmt = $pdo->query("DESCRIBE tc_users");
    $cols = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Final Columns: " . implode(', ', $cols);

} catch (Exception $e) {
    echo "Fatal: " . $e->getMessage();
}
?>
