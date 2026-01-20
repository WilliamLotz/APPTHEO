-- Ajout de la table des lieux (Pancartes)
CREATE TABLE IF NOT EXISTS `tc_places` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL, -- Ex: "Entrée Jouy-en-Josas"
  `lat` double NOT NULL,
  `lng` double NOT NULL,
  `points` int(11) DEFAULT 10, -- Points rapportés
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insertion de données de démo (Pour tester autour de Paris)
INSERT INTO `tc_places` (`name`, `lat`, `lng`, `points`) VALUES
('Tour Eiffel', 48.8584, 2.2945, 50),
('Notre Dame', 48.8529, 2.3500, 30),
('Sacré Cœur', 48.8867, 2.3431, 40),
('Arc de Triomphe', 48.8738, 2.2950, 35),
('Château de Vincennes', 48.8425, 2.4364, 20),
('Stade de France', 48.9244, 2.3601, 25),
('La Défense', 48.8922, 2.2361, 15),
('Versailles', 48.8049, 2.1204, 60);
