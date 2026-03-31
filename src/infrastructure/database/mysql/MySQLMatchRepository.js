const db = require("../MySQLConnection");
class MySQLMatchRepository {
async init() {
const pool = db.getPool();
await pool.execute(`
CREATE TABLE IF NOT EXISTS matches (
id VARCHAR(64) PRIMARY KEY,
sede_name VARCHAR(100),
def_name VARCHAR(100),
atk_name VARCHAR(100),
winner_name VARCHAR(100),
score_def INT,
score_atk INT,
rounds INT,
capacity VARCHAR(50),
created_at DATETIME,
duration_minutes INT DEFAULT 0,
iso_year_week VARCHAR(12) NULL,
event_subtype VARCHAR(32) NULL,
source VARCHAR(48) NULL DEFAULT 'entretenimiento_system'
)
`);
await pool.execute(`
CREATE TABLE IF NOT EXISTS match_organizers (
match_id VARCHAR(64),
discord_id VARCHAR(50),
discord_username VARCHAR(100),
server_nickname VARCHAR(100),
assigned_at DATETIME,
PRIMARY KEY (match_id, discord_id),
FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
)
`);
for (const col of [
"ALTER TABLE matches ADD COLUMN iso_year_week VARCHAR(12) NULL",
"ALTER TABLE matches ADD COLUMN event_subtype VARCHAR(32) NULL",
"ALTER TABLE matches ADD COLUMN source VARCHAR(48) NULL DEFAULT 'entretenimiento_system'",
]) {
try {
await pool.query(col);
} catch (e) {
if (e.errno !== 1060) {
/* duplicate column */
}
}
}
console.log("✅ BASE DE DATOS: Tablas de Historial de Partidas verificadas (incl. semana ISO).");
}
async save(match) {
const pool = db.getPool();
const connection = await pool.getConnection();
const MySQLUserRepository = require("./MySQLUserRepository");
try {
await connection.beginTransaction();
const createdAt = new Date();
await connection.execute(
`INSERT INTO matches (id, sede_name, def_name, atk_name, winner_name, score_def, score_atk, rounds, capacity, created_at, iso_year_week, event_subtype, source)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
[
match.id,
match.location.name,
match.defTeam.name,
match.atkTeam.name,
match.winner?.name || "Empate",
match.scoreDef,
match.scoreAtk,
match.round,
match.capacity,
createdAt,
match.isoYearWeek || null,
match.eventSubtype || null,
match.source || "entretenimiento_system",
],
);
if (match.isRanked !== false) {
const defName = match.defTeam.name;
const atkName = match.atkTeam.name;
const winnerName = match.winner?.name;
let defPoints = 0,
atkPoints = 0;
let defWin = 0,
atkWin = 0;
let defLoss = 0,
atkLoss = 0;
if (winnerName === defName) {
defPoints = 1;
defWin = 1;
atkLoss = 1;
} else if (winnerName === atkName) {
atkPoints = 1;
atkWin = 1;
defLoss = 1;
} else {
defPoints = 0.5;
atkPoints = 0.5;
}
const updateQuery = `
INSERT INTO sedes_ranking (sede_name, wins, losses, points, total_matches)
VALUES (?, ?, ?, ?, 1)
ON DUPLICATE KEY UPDATE
wins = wins + VALUES(wins),
losses = losses + VALUES(losses),
points = points + VALUES(points),
total_matches = total_matches + 1
`;
await connection.execute(updateQuery, [defName, defWin, defLoss, defPoints]);
await connection.execute(updateQuery, [atkName, atkWin, atkLoss, atkPoints]);
}
if (match.leonesIds && match.leonesIds.length > 0) {
for (const userId of match.leonesIds) {
let username = "Desconocido";
let nickname = "Desconocido";
const userDb = await MySQLUserRepository.findById(userId);
if (userDb) {
username = userDb.username;
nickname = userDb.serverNickname;
}
await connection.execute(
`INSERT INTO match_organizers (match_id, discord_id, discord_username, server_nickname, assigned_at)
VALUES (?, ?, ?, ?, ?)`,
[match.id, userId, username, nickname, createdAt],
);
}
}
await connection.commit();
console.log(`💾 Match ${match.id} guardado (semana ${match.isoYearWeek || "N/A"}).`);
} catch (error) {
await connection.rollback();
console.error("❌ Error saving match history:", error);
throw error;
} finally {
connection.release();
}
}
async getMatchesByIsoYearWeek(isoYearWeek) {
const pool = db.getPool();
const [rows] = await pool.execute(
`SELECT * FROM matches
WHERE iso_year_week = ?
AND (id LIKE 'es_%' OR id LIKE 'match_%')
ORDER BY created_at DESC`,
[isoYearWeek],
);
return rows;
}
async getRecentAssaultWeeks(limit = 8) {
const pool = db.getPool();
const [rows] = await pool.execute(
`SELECT DISTINCT iso_year_week FROM matches
WHERE iso_year_week IS NOT NULL AND (id LIKE 'es_%' OR id LIKE 'match_%')
ORDER BY iso_year_week DESC
LIMIT ?`,
[limit],
);
return rows.map((r) => r.iso_year_week);
}
}
module.exports = new MySQLMatchRepository();
