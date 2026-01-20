<?php
require_once 'config.php';
$stmt = $pdo->query("DESCRIBE tc_users");
$cols = $stmt->fetchAll(PDO::FETCH_COLUMN);
echo "COLS: " . implode(',', $cols);
?>
