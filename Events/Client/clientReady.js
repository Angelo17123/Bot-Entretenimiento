const { ActivityType } = require("discord.js");
require("colors");
module.exports = {
name: "clientReady",
once: true,
/**
*
* @param {import("discord.js").Client} client
*/
async execute(client) {
console.info(`Bot encendido como: ${client.user.tag}`.green.bold);
await require("../../Handlers/slashHandler").loadSlash(client);
const estados = [
{
name: "Gestor de Asaltos ⚡",
type: ActivityType.Playing,
status: "online",
},
{
name: "Vigilando Sedes 🏰",
type: ActivityType.Watching,
status: "online",
},
{
name: "/panel_asaltos",
type: ActivityType.Listening,
status: "online",
},
{
name: "Staff Leones 🦁",
type: ActivityType.Playing,
status: "online",
},
];
let i = 0;
setInterval(async () => {
const actual = estados[i];
client.user.setPresence({
activities: [
{
name: actual.name,
type: actual.type,
url: actual.url ?? null,
},
],
status: actual.status,
});
i = (i + 1) % estados.length;
}, 5000);
},
};
