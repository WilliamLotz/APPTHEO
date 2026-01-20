<?php
// test_api.php
echo "<h1>Test API Places</h1>";
echo "<p>Test de l'extension CURL...</p>";

if(function_exists('curl_init')) {
    echo "<p style='color:green'>✅ CURL est activé.</p>";
} else {
    echo "<p style='color:red'>❌ CURL N'EST PAS ACTIVÉ dans PHP !</p>";
    echo "<p>Veuillez activer l'extension <code>php_curl</code> dans le panneau UwAmp (Configuration PHP > Extensions).</p>";
    exit;
}

echo "<p>Test appel api/places.php...</p>";

// Simulation d'un appel interne ou lien direct
$url = "http://" . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']) . "/api/places.php?lat=48.8566&lng=2.3522"; // Paris

echo "Appel vers : <a href='$url' target='_blank'>$url</a><br><br>";

echo "Essayez de cliquer sur le lien ci-dessus. Si vous voyez une erreur PHP, copiez-la moi.";
?>
