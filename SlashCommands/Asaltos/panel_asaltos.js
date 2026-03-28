const { SlashCommandBuilder, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { getRanking } = require('../../src/services/assaultPersistence');
module.exports = {
data: new SlashCommandBuilder()
.setName('panel_asaltos')
.setDescription('Inicializa la gestión de eventos y asaltos.')
.setDefaultMemberPermissions(1n << 3n),
async execute(interaction) {
const embed = new EmbedBuilder()
.setTitle('🛡️ GESTIÓN DE EVENTOS Y ASALTOS')
.setColor(0x2b2d31)
.setDescription(`Selecciona el tipo de actividad que deseas organizar. Todo está automatizado para máxima eficiencia.\n\n🛡️ **Asalto a Sede** (Clásico 15v15 / 20v20)\n✨ **Eventos Especiales** (Bicicleta, Duelos, Dinámicas)\n🏢 **Eventos Masivos** (BR Ciudad, Cayo, Rey del Crimen)`)
.setFooter({ text: 'Bot Entretenimiento • Sistema de Entretenimiento' });
const row1 = new ActionRowBuilder().addComponents(
new ButtonBuilder().setCustomId('btn_registrar_asalto').setLabel('✨ Registrar Asalto').setStyle(ButtonStyle.Success),
new ButtonBuilder().setCustomId('btn_registrar_duelo').setLabel('🚀 Registrar Evento').setStyle(ButtonStyle.Primary),
new ButtonBuilder().setCustomId('btn_mis_eventos').setLabel('📂 Mis Eventos o Asaltos').setStyle(ButtonStyle.Secondary)
);
const row2 = new ActionRowBuilder().addComponents(
new ButtonBuilder().setCustomId('btn_br_ciudad').setLabel('🏢 BR Ciudad').setStyle(ButtonStyle.Secondary),
new ButtonBuilder().setCustomId('btn_br_cayo').setLabel('🏝️ BR Cayo').setStyle(ButtonStyle.Secondary),
new ButtonBuilder().setCustomId('btn_rey_crimen').setLabel('👑 Rey del Crimen').setStyle(ButtonStyle.Secondary)
);
const row3 = new ActionRowBuilder().addComponents(
new ButtonBuilder().setCustomId('btn_ranking_asaltos').setLabel('🏆 Ranking Asaltos').setStyle(ButtonStyle.Danger),
new ButtonBuilder().setCustomId('btn_mis_asaltos').setLabel('⚔️ Mis Asaltos').setStyle(ButtonStyle.Secondary)
);
await interaction.reply({
embeds: [embed],
components: [row1, row2, row3]
});
}
};
