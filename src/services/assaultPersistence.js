const MySQLMatchRepository = require("../infrastructure/database/mysql/MySQLMatchRepository");
const localRegistro = require("./localRegistro");
/**
* Semana ISO (año + número de semana), útil para agrupar asalto(s) "por semana".
*/
function getISOYearWeekString(d = new Date()) {
const date = new Date(d.getTime());
date.setHours(0, 0, 0, 0);
date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
const week1 = new Date(date.getFullYear(), 0, 4);
const weekNo =
1 +
Math.round(
((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7,
);
return `${date.getFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}
function getWeekNumber(d = new Date()) {
const date = new Date(d.getTime());
date.setHours(0, 0, 0, 0);
date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
const week1 = new Date(date.getFullYear(), 0, 4);
const weekNo =
1 +
Math.round(
((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7,
);
return weekNo;
}
function getMonthString(d = new Date()) {
const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
return `${months[d.getMonth()]} ${d.getFullYear()}`;
}
function getISOYearWeekFromNumber(weekNum, year = new Date().getFullYear()) {
return `${year}-W${String(weekNum).padStart(2, "0")}`;
}
/**
* Interpreta la opción "semana" del comando: formato ISO, solo número (1–53) o 0/ahora = semana actual.
*/
function resolveWeekQuery(raw) {
if (raw == null) return getISOYearWeekString();
const s = String(raw).trim();
if (s === "") return getISOYearWeekString();
if (s === "0" || /^actual|ahora|current|hoy$/i.test(s)) {
return getISOYearWeekString();
}
const isoMatch = s.match(/^(\d{4})-W(\d{1,2})$/i);
if (isoMatch) {
const y = isoMatch[1];
const w = String(parseInt(isoMatch[2], 10)).padStart(2, "0");
return `${y}-W${w}`;
}
const onlyDigits = s.match(/^(\d{1,2})$/);
if (onlyDigits) {
const num = parseInt(onlyDigits[1], 10);
if (num >= 1 && num <= 53) {
const y = new Date().getFullYear();
return `${y}-W${String(num).padStart(2, "0")}`;
}
}
return s;
}
/**
* Convierte una sesión del panel de entretenimiento (asalto a sede, no bicicleta)
* al formato que espera MySQLMatchRepository (misma lógica que bot v2).
* @param {Object} session - La sesión del asalto
* @param {string} sessionId - ID de la sesión
* @param {string} creatorId - ID del usuario que creó el asalto
*/
function sessionToMatchRecord(session, sessionId, creatorId) {
const targetWins = session.isBicicleta ? 3 : 2;
const winnerTeam = session.teamA.points >= targetWins ? session.teamA : session.teamB;
const defTeam = session.teamA.role === "Defensa" ? session.teamA : session.teamB;
const atkTeam = session.teamA.role === "Ataque" ? session.teamA : session.teamB;
const capRaw = (session.capacity || "").toString();
const num = capRaw.match(/\d+/);
const capStr = num ? `${num[0]} vs ${num[0]}` : capRaw;
const now = new Date();
const fechaCompleta = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
const staffApoyo = (session.staff || []).filter(id => id !== creatorId);
return {
id: `es_${Date.now()}_${sessionId}`,
location: { name: session.sede },
defTeam: { name: defTeam.name },
atkTeam: { name: atkTeam.name },
winner: { name: winnerTeam.name },
scoreDef: defTeam.points,
scoreAtk: atkTeam.points,
round: session.currentRound,
capacity: capStr,
leonesIds: session.staff || [],
creatorId: creatorId,
staffApoyo: staffApoyo,
fecha: fechaCompleta,
isRanked: true,
isoYearWeek: getISOYearWeekString(),
eventSubtype: session.subtype || "normal",
source: "entretenimiento_system",
};
}
function matchToLocalRecord(match) {
return {
id: match.id,
savedAt: new Date().toISOString(),
isoYearWeek: match.isoYearWeek,
sede_name: match.location.name,
def_name: match.defTeam.name,
atk_name: match.atkTeam.name,
winner_name: match.winner.name,
score_def: match.scoreDef,
score_atk: match.scoreAtk,
rounds: match.round,
capacity: match.capacity,
event_subtype: match.eventSubtype,
leonesIds: match.leonesIds,
creatorId: match.creatorId,
staffApoyo: match.staffApoyo || [],
fecha: match.fecha,
};
}
/**
* Siempre guarda en carpeta LOCALREGISTRO. Si MySQL está listo, también en BD.
*/
async function saveFinishedAssault(session, sessionId) {
if (session.isBicicleta) {
return { ok: false, reason: "not_assault" };
}
const creatorId = session.creatorId || session.staff?.[0];
const match = sessionToMatchRecord(session, sessionId, creatorId);
const localRow = matchToLocalRecord(match);
let localRelative;
try {
localRelative = localRegistro.appendAssault(localRow);
} catch (e) {
console.error("❌ Error guardando en LOCALREGISTRO:", e);
return { ok: false, reason: "local_error", error: e.message };
}
let mysqlOk = false;
if (global.mysqlReady) {
try {
await MySQLMatchRepository.save(match);
mysqlOk = true;
} catch (e) {
console.error("❌ Error guardando asalto en MySQL (registro local ya guardado):", e);
}
}
return {
ok: true,
matchId: match.id,
isoYearWeek: match.isoYearWeek,
local: true,
localRelative,
mysql: mysqlOk,
};
}
/**
* Lee todos los registros de un usuario específico
* @param {string} userId - ID del usuario
* @param {string} isoYearWeek - Semana ISO (opcional, si no se pasa usa todas)
*/
function getAssaultsByUser(userId, isoYearWeek = null) {
const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "..", "..", "LOCALREGISTRO");
if (!fs.existsSync(dir)) return [];
const files = fs.readdirSync(dir).filter(f => f.endsWith(".json"));
let allRecords = [];
for (const file of files) {
if (isoYearWeek && file !== `${isoYearWeek}.json`) continue;
try {
const data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
if (Array.isArray(data)) {
allRecords = allRecords.concat(data);
}
} catch (e) {
}
}
return allRecords.filter(r => r.creatorId === userId);
}
/**
* Obtiene el ranking de usuarios por cantidad de asalto(s) realizados (creador + todos los staff)
* @param {string} isoYearWeek - Semana ISO (opcional)
*/
function getRanking(isoYearWeek = null) {
const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "..", "..", "LOCALREGISTRO");
if (!fs.existsSync(dir)) return [];
const files = fs.readdirSync(dir).filter(f => f.endsWith(".json"));
const userStats = {};
for (const file of files) {
if (isoYearWeek && file !== `${isoYearWeek}.json`) continue;
try {
const data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
if (Array.isArray(data)) {
for (const record of data) {
const allParticipants = [record.creatorId, ...(record.staffApoyo || [])].filter(Boolean);
for (const userId of allParticipants) {
if (!userStats[userId]) {
userStats[userId] = {
userId: userId,
count: 0,
assaults: []
};
}
userStats[userId].count++;
userStats[userId].assaults.push({
sede: record.sede_name,
fecha: record.fecha,
winner: record.winner_name,
def: record.def_name,
atk: record.atk_name,
score: `${record.score_def}-${record.score_atk}`,
id: record.id,
rol: userId === record.creatorId ? 'Creador' : 'Apoyo'
});
}
}
}
} catch (e) {
}
}
return Object.values(userStats).sort((a, b) => b.count - a.count);
}
function getWeeksInMonth(year, month) {
const weeks = [];
const firstDay = new Date(year, month, 1);
const lastDay = new Date(year, month + 1, 0);
let currentWeek = getISOYearWeekString(firstDay);
weeks.push(currentWeek);
for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 7)) {
const weekStr = getISOYearWeekString(d);
if (!weeks.includes(weekStr)) {
weeks.push(weekStr);
}
}
return weeks.sort();
}
function getRankingMensual() {
const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "..", "..", "LOCALREGISTRO");
if (!fs.existsSync(dir)) return [];
const now = new Date();
const year = now.getFullYear();
const month = now.getMonth();
const weeksThisMonth = getWeeksInMonth(year, month);
const files = fs.readdirSync(dir).filter(f => f.endsWith(".json"));
const userStats = {};
for (const file of files) {
if (!weeksThisMonth.includes(file.replace('.json', ''))) continue;
try {
const data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
if (Array.isArray(data)) {
for (const record of data) {
const allParticipants = [record.creatorId, ...(record.staffApoyo || [])].filter(Boolean);
for (const userId of allParticipants) {
if (!userStats[userId]) {
userStats[userId] = {
userId: userId,
count: 0,
assaults: []
};
}
userStats[userId].count++;
userStats[userId].assaults.push({
sede: record.sede_name,
fecha: record.fecha,
winner: record.winner_name,
def: record.def_name,
atk: record.atk_name,
score: `${record.score_def}-${record.score_atk}`,
id: record.id,
rol: userId === record.creatorId ? 'Creador' : 'Apoyo'
});
}
}
}
} catch (e) {
}
}
return Object.values(userStats).sort((a, b) => b.count - a.count);
}
function getAssaultsByUserMensual(userId) {
const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "..", "..", "LOCALREGISTRO");
if (!fs.existsSync(dir)) return [];
const now = new Date();
const year = now.getFullYear();
const month = now.getMonth();
const weeksThisMonth = getWeeksInMonth(year, month);
const files = fs.readdirSync(dir).filter(f => f.endsWith(".json"));
let allRecords = [];
for (const file of files) {
if (!weeksThisMonth.includes(file.replace('.json', ''))) continue;
try {
const data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
if (Array.isArray(data)) {
allRecords = allRecords.concat(data);
}
} catch (e) {
}
}
return allRecords.filter(r => {
const participants = [r.creatorId, ...(r.staffApoyo || [])];
return participants.includes(userId);
});
}
module.exports = {
getISOYearWeekString,
getWeekNumber,
getMonthString,
getISOYearWeekFromNumber,
getWeeksInMonth,
resolveWeekQuery,
sessionToMatchRecord,
saveFinishedAssault,
readLocalWeek: localRegistro.readWeek,
getAssaultsByUser,
getRanking,
getRankingMensual,
getAssaultsByUserMensual,
};
