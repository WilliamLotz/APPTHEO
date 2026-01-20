-- Structure de la base de données TrailConnect

CREATE DATABASE IF NOT EXISTS `trailconnect`;
USE `trailconnect`;

-- Table Utilisteurs / Equipes
CREATE TABLE IF NOT EXISTS `tc_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(150) UNIQUE NOT NULL,
  `password` varchar(255) NOT NULL,
  `mode` enum('solo','team') NOT NULL DEFAULT 'solo',
  `team_id` varchar(20) DEFAULT NULL, -- ID partagé pour les binômes
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table des Parcours (Routes)
CREATE TABLE IF NOT EXISTS `tc_routes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `map_data` LONGTEXT, -- JSON contenant les points Lat/Lng et POIs
  `distance_km` float DEFAULT 0,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table des Tentatives (Une course lancée par un user)
CREATE TABLE IF NOT EXISTS `tc_attempts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `route_id` int(11) NOT NULL,
  `start_time` datetime DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `status` enum('pending','running','finished','dnf') DEFAULT 'pending',
  `score` int(11) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table des Validations de Balises (Checkpoints)
CREATE TABLE IF NOT EXISTS `tc_validations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `attempt_id` int(11) NOT NULL,
  `checkpoint_index` int(11) NOT NULL, -- Quel numéro de panneau ?
  `validated_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `gps_lat` double,
  `gps_lng` double,
  `is_fraud_suspect` tinyint(1) DEFAULT 0, -- Si vitesse anormale détectée
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
