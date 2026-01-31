# Plan de Déploiement - TrailConnect

Voici les étapes à suivre pour mettre votre site en ligne (hébergement mutualisé type OVH, Ionos, Hostinger, ou VPS).

## 1. Préparation de la Base de Données

Actuellement, votre site fonctionne avec une base locale (`root` / `root`). En production, vous aurez une vraie base de données sécurisée.

1.  **Exporter votre base locale** :
    *   Ouvrez **phpMyAdmin** (via UwAmp).
    *   Sélectionnez la base `trailconnect`.
    *   Cliquez sur **Exporter** (Format SQL).
    *   Sauvegardez le fichier (ex: `backup_trailconnect.sql`).

2.  **Importer chez l'hébergeur** :
    *   Créez une nouvelle base de données dans le panneau de gestion de votre hébergeur.
    *   Notez bien les **identifiants** fournis :
        *   Hôte (souvent `localhost`, mais parfois une IP ou URL type `db500.hosting.com`).
        *   Nom de la base (ex: `u12345_trailconnect`).
        *   Utilisateur (ex: `u12345_admin`).
        *   Mot de passe.
    *   Ouvrez le phpMyAdmin de l'hébergeur et **importez** votre fichier `backup_trailconnect.sql`.

## 2. Configuration (`config.php`)

C'est LE fichier le plus critique. Il ne doit **JAMAIS** contenir vos mots de passe de production si vous le mettez sur GitHub public.

**Action à faire lors de la mise en ligne :**
Modifiez le fichier `config.php` sur le serveur (ou utilisez des variables d'environnement si l'hébergeur le permet).

**Exemple de modification à faire sur le serveur :**

```php
<?php
// config.php en PRODUCTION

// 1. Désactiver l'affichage des erreurs pour ne pas fuiter d'infos aux hackers
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(0); // Ou E_ALL & ~E_NOTICE pour logguer sans afficher

// 2. Vos vrais identifiants
$host = 'db500.hosting.com'; // Donné par l'hébergeur
$db   = 'u12345_trailconnect';
$user = 'u12345_admin';
$pass = 'VOTRE_MOT_DE_PASSE_SECURISE';

$charset = 'utf8mb4';
$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
// ... reste du code ...
```

## 3. Sécurité & HTTPS (CRITIQUE pour le GPS)

Pour que la géolocalisation (`navigator.geolocation`) fonctionne sur téléphone, **votre site DOIT impérativement être en HTTPS** (cadenas vert).

1.  Activez le **certificat SSL** (Let's Encrypt est souvent gratuit) dans le panneau de votre hébergeur.
2.  Forcez la redirection HTTP vers HTTPS (souvent une case à cocher, ou via un fichier `.htaccess`).

**Exemple de fichier `.htaccess` (à créer à la racine si besoin) :**
```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

## 4. Nettoyage des fichiers

Ne mettez pas en ligne les fichiers inutiles qui pourraient être dangereux :

*   ❌ `setup.sql` (Contient la structure de la base, inutile une fois importée).
*   ❌ `.git/` (Le dossier caché de versionning, ne pas le uploader via FTP).
*   ❌ `fix_db.php`, `fix_db_v2.php` (Scripts de maintenance).

## 5. Résumé des fichiers à uploader

Transférez via FTP (FileZilla) ou Git :

*   📂 `api/` (Dossier complet)
*   📂 `assets/` (Dossier complet)
*   📂 `includes/` (Dossier complet)
*   📄 `index.php`
*   📄 `create.php`
*   📄 `go.php`
*   📄 `profile.php`
*   📄 `login.php`
*   📄 `config.php` (À modifier immédiatement après upload !)

## 6. Vérifications Finales

1.  Connectez-vous au site.
2.  Vérifiez que la carte s'affiche (chargement correct des assets).
3.  Testez la création d'un compte (vérifie que l'écriture en BDD marche).
4.  Testez la géolocalisation sur mobile (vérifie que le HTTPS est actif).
