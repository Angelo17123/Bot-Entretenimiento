const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const { getRanking, resolveWeekQuery } = require("../../src/services/assaultPersistence");
function formatRankingLine(i, entry) {
const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  ";
return `${medal} **${entry.count}** asalto(s) — <@${entry.userId}>`;
}
function formatDetailedRankingLine(i, entry) {
const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  ";
let text = `${medal} **${entry.count}** asalto(s) — <@${entry.userId}>\n`;
if (entry.assaults.length > 0) {
const details = entry.assaults.slice(-5).map(a => `  • ${a.sede}: ${a.winner} vs ${a.def} (${a.score}) - ${a.fecha}`).join("\n");
text += details;
}
return text;
}
module.exports = {
data: new SlashCommandBuilder()
.setName("ranking_asaltos")
.setDescription("Ver ranking de quién realizó más asalto(s) a sedes.")
.addStringOption((o) =>
o
.setName("semana")
.setDescription("Vacío o 0 = semana actual. 13 = semana 13 del año. O 2026-W13")
.setRequired(false),
)
.addBooleanOption((o) =>
o
.setName("detallado")
.setDescription("Ver detalles de cada asalto (últimos 5)")
.setRequired(false),
)
.setDefaultMemberPermissions(1n << 3n),
async execute(interaction) {
await interaction.deferReply({ flags: MessageFlags.Ephemeral });
try {
const raw = interaction.options.getString("semana");
const week = resolveWeekQuery(raw);
const detallado = interaction.options.getBoolean("detallado") || false;
const ranking = getRanking(week);
const guild = interaction.guild;
const members = await guild.members.fetch();
const memberStats = new Map();
for (const [id, member] of members) {
if (!member.user.bot) {
memberStats.set(id, {
userId: id,
count: 0,
assaults: []
});
}
}
for (const entry of ranking) {
if (memberStats.has(entry.userId)) {
memberStats.set(entry.userId, entry);
} else {
memberStats.set(entry.userId, entry);
}
}
const allUsers = Array.from(memberStats.values()).sort((a, b) => b.count - a.count);
if (!allUsers.length) {
return interaction.editReply({
content: `No hay miembros en el servidor para mostrar ranking.`,
});
}
const lines = allUsers.slice(0, 20).map((entry, i) =>
detallado ? formatDetailedRankingLine(i, entry) : formatRankingLine(i, entry)
);
const embed = new EmbedBuilder()
.setTitle(`🏆 Ranking de Asaltos a Sedes — ${week}${detallado ? " (Detallado)" : ""}`)
.setColor(detallado ? 0x00FF00 : 0xFFD700)
.setDescription(lines.join("\n").slice(0, 6000))
.setFooter({ text: `${allUsers.length} miembro(s) del servidor` });
return interaction.editReply({ embeds: [embed] });
} catch (err) {
console.error("ranking_asaltos:", err);
return interaction.editReply({
content: `❌ Error al leer el ranking: \`${err.message}\``,
});
}
},
};
