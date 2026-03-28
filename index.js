const path = require("path");
const { Client, Collection } = require("discord.js");
require("dotenv").config({ path: path.join(__dirname, ".env") });
require("colors");
const MySQLConnection = require("./src/infrastructure/database/MySQLConnection");
const MigrationService = require("./src/infrastructure/database/migrations/MigrationService");
const MySQLMatchRepository = require("./src/infrastructure/database/mysql/MySQLMatchRepository");
const client = new Client({ intents: 53608447 });
client.slashCommands = new Collection();
(async () => {
if (!process.env.TOKEN_DISCORD_BOT) {
console.error(
"❌ Falta TOKEN_DISCORD_BOT. Colócalo en el archivo .env junto a index.js.".red,
);
process.exit(1);
}
await require("./Handlers/eventHandler").loadEvents(client);
try {
await MySQLConnection.connect();
await MigrationService.runMigrations();
await MySQLMatchRepository.init();
global.mysqlReady = true;
console.log("✅ MySQL listo (asaltos a sede se guardan por semana ISO).".green);
} catch (e) {
global.mysqlReady = false;
console.error(
"❌ MySQL no disponible. El bot arranca pero no se guardarán asaltos en BD.".red,
e.message,
);
}
await client.login(process.env.TOKEN_DISCORD_BOT);
})().catch((err) => {
console.error("❌ Error al iniciar el bot:", err);
process.exit(1);
});
process.on("unhandledRejection", (reason, promise) => {
console.error("❌ [Unhandled Rejection] at:", promise, "reason:", reason);
});
process.on("uncaughtException", (err) => {
console.error("❌ [Uncaught Exception] thrown:", err);
});
