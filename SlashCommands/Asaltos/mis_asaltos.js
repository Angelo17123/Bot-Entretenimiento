const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const { getAssaultsByUser, resolveWeekQuery } = require("../../src/services/assaultPersistence");
function formatAssaultLine(i, r) {
const sub = r.event_subtype ? ` · ${r.event_subtype}` : "";
return `${i + 1}. **${r.sede_name}**${sub} · ${r.def_name} **${r.score_def}-${r.score_atk}** ${r.atk_name} · 🏆 ${r.winner_name} · 📅 ${r.fecha}`;
}
module.exports = {
data: new SlashCommandBuilder()
.setName("mis_asaltos")
.setDescription("Ver tus asalto(s) a sede realizados.")
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
const userId = interaction.user.id;
const assaults = getAssaultsByUser(userId, week);
if (!assaults.length) {
return interaction.editReply({
content: `No tienes asaltos registrados para la semana **${week}**.\n\n*Ejemplos:* vacío o \`0\` = semana actual · \`13\` = semana 13 del año en curso · \`2026-W13\` = formato completo.`,
});
}
const lines = assaults.slice(0, 20).map((r, i) => formatAssaultLine(i, r));
const embed = new EmbedBuilder()
.setTitle(`⚔️ Tus Asaltos a Sede — ${week}`)
.setColor(0x2b2d31)
.setDescription(lines.join("\n").slice(0, 3800))
.setFooter({ text: `${assaults.length} asalto(s) registrado(s)` });
return interaction.editReply({ embeds: [embed] });
} catch (err) {
console.error("mis_asaltos:", err);
return interaction.editReply({
content: `❌ Error al leer tus asaltos: \`${err.message}\``,
});
}
},
};
