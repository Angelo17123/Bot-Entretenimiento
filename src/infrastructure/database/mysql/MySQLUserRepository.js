const db = require('../MySQLConnection');
class MySQLUserRepository {
async init() {
const pool = db.getPool();
await pool.execute(`
CREATE TABLE IF NOT EXISTS users (
discord_id VARCHAR(50) PRIMARY KEY,
role VARCHAR(50) DEFAULT 'Civil',
username VARCHAR(100),
server_nickname VARCHAR(100),
join_date DATETIME,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`);
await pool.execute(`
CREATE TABLE IF NOT EXISTS staff_blacklist (
discord_id VARCHAR(50) PRIMARY KEY,
staff_name VARCHAR(100),
reasons TEXT,
days INT,
start_date DATETIME,
end_date DATETIME,
author_id VARCHAR(50)
)
`);
console.log('✅ BASE DE DATOS: Tablas de Usuarios y Blacklist verificadas.');
}
async save(user) {
const pool = db.getPool();
await pool.execute(
`INSERT INTO users (discord_id, role, username, server_nickname, join_date)
VALUES (?, ?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
role=VALUES(role),
username=VALUES(username),
server_nickname=VALUES(server_nickname),
join_date=VALUES(join_date)`,
[user.discordId, user.role, user.username, user.serverNickname, user.joinDate]
);
}
async findById(discordId) {
const pool = db.getPool();
const [rows] = await pool.execute("SELECT * FROM users WHERE discord_id = ?", [discordId]);
if (rows.length === 0) return null;
const r = rows[0];
return {
discordId: r.discord_id,
role: r.role,
username: r.username,
serverNickname: r.server_nickname,
joinDate: r.join_date
};
}
async findAll(limit = 10, offset = 0, roleFilter = null) {
const pool = db.getPool();
let query = "SELECT * FROM users";
const params = [];
if (roleFilter && roleFilter !== 'ALL') {
query += " WHERE role = ?";
params.push(roleFilter);
}
query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
params.push(limit.toString(), offset.toString());
const [rows] = await pool.execute(query, params);
return rows.map(r => ({
discordId: r.discord_id,
role: r.role,
username: r.username,
serverNickname: r.server_nickname,
joinDate: r.join_date
}));
}
async findAllUsers() {
const pool = db.getPool();
const [rows] = await pool.execute("SELECT discord_id, username, server_nickname FROM users ORDER BY username ASC");
return rows.map(r => ({
discordId: r.discord_id,
username: r.username,
serverNickname: r.server_nickname
}));
}
async countAll(roleFilter = null) {
const pool = db.getPool();
let query = "SELECT COUNT(*) as count FROM users";
const params = [];
if (roleFilter && roleFilter !== 'ALL') {
query += " WHERE role = ?";
params.push(roleFilter);
}
const [rows] = await pool.execute(query, params);
return rows[0].count;
}
async delete(discordId) {
const pool = db.getPool();
await pool.execute("DELETE FROM users WHERE discord_id = ?", [discordId]);
}
async addToBlacklist(data) {
const pool = db.getPool();
const startDate = new Date();
const endDate = new Date();
endDate.setDate(endDate.getDate() + data.days);
await pool.execute(
`INSERT INTO staff_blacklist (discord_id, staff_name, reasons, days, start_date, end_date, author_id)
VALUES (?, ?, ?, ?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
staff_name=VALUES(staff_name), reasons=VALUES(reasons), days=VALUES(days),
start_date=VALUES(start_date), end_date=VALUES(end_date), author_id=VALUES(author_id)`,
[
data.discordId,
data.staffName || 'Desconocido',
data.reasons,
data.days,
startDate,
endDate,
data.authorId
]
);
}
async checkBlacklist(discordId) {
const pool = db.getPool();
const [rows] = await pool.execute(
"SELECT * FROM staff_blacklist WHERE discord_id = ? AND end_date > NOW()",
[discordId]
);
return rows.length > 0 ? rows[0] : null;
}
}
module.exports = new MySQLUserRepository();
