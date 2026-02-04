<?php
// api/team.php
require_once '../config.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

if ($method === 'POST') {
    $action = $input['action'] ?? '';
    $userId = $input['user_id'] ?? 0;

    if (!$userId) {
        echo json_encode(['success' => false, 'error' => 'User ID missing']);
        exit;
    }



    try {
        if ($action === 'create') {
            $name = $input['team_name'] ?? 'My Team';
            // Generate Code (6 chars upper)
            $code = strtoupper(substr(md5(uniqid()), 0, 6));
            
            // Create Team
            $stmt = $pdo->prepare("INSERT INTO tc_teams (name, code, created_by) VALUES (?, ?, ?)");
            $stmt->execute([$name, $code, $userId]);
            
            // Update User
            $stmtU = $pdo->prepare("UPDATE tc_users SET team_id = ?, squad_id = NULL WHERE id = ?");
            $stmtU->execute([$code, $userId]);
            
            echo json_encode(['success' => true, 'team' => ['name' => $name, 'code' => $code]]);

        } elseif ($action === 'join') {
            $code = strtoupper(trim($input['code'] ?? ''));
            
            // Check if team exists
            $stmt = $pdo->prepare("SELECT * FROM tc_teams WHERE code = ?");
            $stmt->execute([$code]);
            $team = $stmt->fetch();
            
            if ($team) {
                // Update User
                $stmtU = $pdo->prepare("UPDATE tc_users SET team_id = ?, squad_id = NULL WHERE id = ?");
                $stmtU->execute([$code, $userId]);
                echo json_encode(['success' => true, 'team' => $team]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Code équipe invalide']);
            }

        } elseif ($action === 'leave') {
            $stmt = $pdo->prepare("UPDATE tc_users SET team_id = NULL, squad_id = NULL WHERE id = ?");
            $stmt->execute([$userId]);
            echo json_encode(['success' => true]);
            
        } elseif ($action === 'create_squad') {
             $name = $input['name'] ?? 'Nouveau Groupe';
             // Get user team
             $stmt = $pdo->prepare("SELECT team_id FROM tc_users WHERE id = ?");
             $stmt->execute([$userId]);
             $teamCode = $stmt->fetchColumn();
             
             if ($teamCode) {
                 $stmt = $pdo->prepare("INSERT INTO tc_squads (team_code, name, created_by) VALUES (?, ?, ?)");
                 $stmt->execute([$teamCode, $name, $userId]);
                 $squadId = $pdo->lastInsertId();
                 
                 // Auto join
                 $stmt = $pdo->prepare("UPDATE tc_users SET squad_id = ? WHERE id = ?");
                 $stmt->execute([$squadId, $userId]);
                 
                 echo json_encode(['success' => true]);
             } else {
                 echo json_encode(['success' => false, 'error' => 'Aucune équipe']);
             }
             
        } elseif ($action === 'join_squad') {
            $squadId = intval($input['squad_id'] ?? 0);
            if ($squadId) {
                // Secure Join: Verify Squad belongs to User's Team
                $stmtU = $pdo->prepare("SELECT team_id FROM tc_users WHERE id = ?");
                $stmtU->execute([$userId]);
                $userTeam = trim($stmtU->fetchColumn() ?: '');

                $stmtS = $pdo->prepare("SELECT team_code FROM tc_squads WHERE id = ?");
                $stmtS->execute([$squadId]);
                $squadTeam = trim($stmtS->fetchColumn() ?: '');

                if ($squadTeam) {
                    if ($userTeam && $userTeam == $squadTeam) {
                        // Standard Case: Match
                        $stmt = $pdo->prepare("UPDATE tc_users SET squad_id = ?, team_id = ? WHERE id = ?");
                        $stmt->execute([$squadId, $userTeam, $userId]);
                        echo json_encode(['success' => true]);
                    } elseif (!$userTeam) {
                        // Healing Case
                        $stmt = $pdo->prepare("UPDATE tc_users SET squad_id = ?, team_id = ? WHERE id = ?");
                        $stmt->execute([$squadId, $squadTeam, $userId]);
                        echo json_encode(['success' => true, 'repaired' => true]);
                    } else {
                        // Mismatch Case
                        echo json_encode(['success' => false, 'error' => "Err: UID[$userId] UserTeam[$userTeam] vs SquadTeam[$squadTeam]"]);
                    }
                } else {
                    echo json_encode(['success' => false, 'error' => 'Erreur: Binôme introuvable']);
                }
            } else {
                echo json_encode(['success' => false, 'error' => 'ID manquant']);
            }
            
        } elseif ($action === 'leave_squad') {
            // HEALING LEAVE: Recover team_id from squad if missing
            $stmtU = $pdo->prepare("SELECT team_id, squad_id FROM tc_users WHERE id = ?");
            $stmtU->execute([$userId]);
            $userRow = $stmtU->fetch(PDO::FETCH_ASSOC);
            
            $userTeam = trim($userRow['team_id'] ?? '');
            $userSquad = $userRow['squad_id'] ?? 0;

            if ($userTeam) {
                // Normal Case: Preserve existing team
                $stmt = $pdo->prepare("UPDATE tc_users SET squad_id = NULL, team_id = ? WHERE id = ?");
                $stmt->execute([$userTeam, $userId]);
            } elseif ($userSquad) {
                // Healing Case: No team found, but user was in a squad. Recover team from squad.
                $stmtS = $pdo->prepare("SELECT team_code FROM tc_squads WHERE id = ?");
                $stmtS->execute([$userSquad]);
                $recoveredTeam = trim($stmtS->fetchColumn() ?: '');

                if ($recoveredTeam) {
                    $stmt = $pdo->prepare("UPDATE tc_users SET squad_id = NULL, team_id = ? WHERE id = ?");
                    $stmt->execute([$recoveredTeam, $userId]);
                } else {
                    // Safe Fallback
                    $stmt = $pdo->prepare("UPDATE tc_users SET squad_id = NULL WHERE id = ?");
                    $stmt->execute([$userId]);
                }
            } else {
                // Fallback
                $stmt = $pdo->prepare("UPDATE tc_users SET squad_id = NULL WHERE id = ?");
                $stmt->execute([$userId]);
            }
            echo json_encode(['success' => true]);
            
        } elseif ($action === 'delete_team') {
            // Get Team Code to verify
            $stmtC = $pdo->prepare("SELECT code FROM tc_teams WHERE created_by = ?");
            $stmtC->execute([$userId]);
            $myTeamCode = $stmtC->fetchColumn();

            if ($myTeamCode) {
                 // Kick users first (Manual Cascade)
                 $stmtU = $pdo->prepare("UPDATE tc_users SET team_id = NULL, squad_id = NULL WHERE team_id = ?");
                 $stmtU->execute([$myTeamCode]);

                 // Delete Squads
                 $stmtS = $pdo->prepare("DELETE FROM tc_squads WHERE team_code = ?");
                 $stmtS->execute([$myTeamCode]);

                 // Delete Team
                 $stmtT = $pdo->prepare("DELETE FROM tc_teams WHERE code = ?");
                 $stmtT->execute([$myTeamCode]);

                 echo json_encode(['success' => true]);
            } else {
                 echo json_encode(['success' => false, 'error' => 'Non autorisé ou équipe introuvable']);
            }

        } elseif ($action === 'delete_squad') {
            $squadId = intval($input['squad_id'] ?? 0);
            
            // Verify Ownership
            $stmtS = $pdo->prepare("SELECT id FROM tc_squads WHERE id = ? AND created_by = ?");
            $stmtS->execute([$squadId, $userId]);
            if ($stmtS->fetch()) {
                 // Reset Users
                 $stmtU = $pdo->prepare("UPDATE tc_users SET squad_id = NULL WHERE squad_id = ?");
                 $stmtU->execute([$squadId]);
                 
                 // Delete
                 $stmtD = $pdo->prepare("DELETE FROM tc_squads WHERE id = ?");
                 $stmtD->execute([$squadId]);
                 
                 echo json_encode(['success' => true]);
            } else {
                 echo json_encode(['success' => false, 'error' => 'Non autorisé']);
            }
        }

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }

} elseif ($method === 'GET') {
    // Get My Team Info & Members & Squads
    $userId = $_GET['user_id'] ?? 0;
    
    if (!$userId) { 
        echo json_encode(['success' => false]); 
        exit; 
    }

    try {
        // Get User Info (Team & Squad)
        $stmt = $pdo->prepare("SELECT team_id, squad_id FROM tc_users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        $teamCode = $user['team_id'] ?? null;
        $mySquadId = $user['squad_id'] ?? null;

        if ($teamCode) {
            // Get Team Details
            $stmtT = $pdo->prepare("SELECT * FROM tc_teams WHERE code = ?");
            $stmtT->execute([$teamCode]);
            $team = $stmtT->fetch(PDO::FETCH_ASSOC);
            if (!$team) $team = ['name' => 'Équipe ' . $teamCode, 'code' => $teamCode];
            


            // Get Members
            $stmtM = $pdo->prepare("SELECT id, username, squad_id FROM tc_users WHERE team_id = ?");
            $stmtM->execute([$teamCode]);
            $members = $stmtM->fetchAll(PDO::FETCH_ASSOC);
            
            // Get Squads
            $stmtS = $pdo->prepare("SELECT s.*, (SELECT COUNT(*) FROM tc_users WHERE squad_id = s.id) as count FROM tc_squads s WHERE team_code = ?");
            $stmtS->execute([$teamCode]);
            $squads = $stmtS->fetchAll(PDO::FETCH_ASSOC);
            
            // My Squad Name
            $mySquad = null;
            if ($mySquadId) {
                foreach ($squads as $s) {
                    if ($s['id'] == $mySquadId) {
                         $mySquad = $s; 
                         break; 
                    }
                }
            }

            echo json_encode([
                'success' => true, 
                'team' => $team, 
                'members' => $members,
                'squads' => $squads,
                'my_squad' => $mySquad
            ]);
        } else {
            // User has no team, fetch available teams for listing
            $stmtList = $pdo->query("SELECT * FROM tc_teams ORDER BY created_at DESC LIMIT 50");
            $available = $stmtList->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'team' => null, 'available_teams' => $available]);
        }

    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
?>
