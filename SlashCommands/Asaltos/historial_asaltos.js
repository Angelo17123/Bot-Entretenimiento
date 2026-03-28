const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const MySQLMatchRepository = require("../../src/infrastructure/database/mysql/MySQLMatchRepository");
const { resolveWeekQuery, readLocalWeek } = require("../../src/services/assaultPersistence");
function formatLine(i, r) {
const sub = r.event_subtype ? ` · ${r.event_subtype}` : "";
const sede = r.sede_name;
const def = r.def_name;
const atk = r.atk_name;
const w = r.winner_name;
const sd = r.score_def;
const sa = r.score_atk;
const fecha = r.fecha || "N/A";
const creador = r.creatorId ? `<@${r.creatorId}>` : "Desconocido";
const apoyo = r.staffApoyo && r.staffApoyo.length > 0
? `Apoyo: ${r.staffApoyo.map(id => `<@${id}>`).join(", ")}`
: "";
let line = `${i + 1}. **${sede}**${sub}\n`;
line += `   👤 Creador: ${creador}\n`;
line += `   📅 Fecha: ${fecha}\n`;
line += `   ⚔️ ${def} **${sd}-${sa}** ${atk} · 🏆 ${w}`;
if (apoyo) line += `\n   ${apoyo}`;
return line;
}
module.exports = {
data: new SlashCommandBuilder()
.setName("historial_asaltos")
.setDescription("Lista asaltos a sede por semana ISO (LOCALREGISTRO y/o MySQL).")
.addStringOption((o) =>
o
.setName("semana")
.setDescription("Vacío o 0 = semana actual. 13 = semana 13 del año. O 2026-W13")
.setRequired(false),
)
.setDefaultMemberPermissions(1n << 3n),
async execute(interaction) {
await interaction.deferReply({ flags: MessageFlags.Ephemeral });
try {
const raw = interaction.options.getString("semana");
const week = resolveWeekQuery(raw);
let rows = readLocalWeek(week);
let source = "LOCALREGISTRO";
if (!rows.length && global.mysqlReady) {
try {
rows = await MySQLMatchRepository.getMatchesByIsoYearWeek(week);
source = "MySQL";
} catch (e) {
console.error("historial_asaltos MySQL:", e);
}
}
if (!rows.length) {
return interaction.editReply({
content:
`No hay asaltos registrados para la semana **${week}** (ni en \`LOCALREGISTRO\`${global.mysqlReady ? " ni en MySQL" : ""}).\n\n` +
"*Ejemplos:* vacío o `0` = semana actual · `13` = semana 13 del año en curso · `2026-W13` = formato completo.",
});
}
const lines = rows.slice(0, 15).map((r, i) => formatLine(i, r));
const embed = new EmbedBuilder()
.setTitle(`📋 Asaltos a sede — ${week}`)
.setColor(0x2b2d31)
.setDescription(lines.join("\n").slice(0, 6000))
.setFooter({ text: `${rows.length} registro(s) · ${source}` });
return interaction.editReply({ embeds: [embed] });
} catch (err) {
console.error("historial_asaltos:", err);
return interaction.editReply({
content: `❌ Error al leer el historial: \`${err.message}\``,
});
}
},
};
