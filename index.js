const path = require("path");
const { Client, Collection } = require("discord.js");
require("dotenv").config({ path: path.join(__dirname, ".env") });
require("colors");
const db = require("./src/infrastructure/database/PostgresConnection");
const PostgresMigrationService = require("./src/infrastructure/database/postgres/PostgresMigrationService");
const PostgresMatchRepository = require("./src/infrastructure/database/postgres/PostgresMatchRepository");
const PostgresSedesRepository = require("./src/infrastructure/database/postgres/PostgresSedesRepository");
const client = new Client({ intents: 53608447 });
client.slashCommands = new Collection();
(async () => {
  if (!process.env.TOKEN_DISCORD_BOT) {
    console.error(
      "❌ Falta TOKEN_DISCORD_BOT. Colócalo en el archivo .env junto a index.js.".red
    );
    process.exit(1);
  }
  await require("./Handlers/eventHandler").loadEvents(client);
  try {
    await db.connect();
    await PostgresMigrationService.runMigrations();
    await PostgresMatchRepository.init();
    await PostgresSedesRepository.init();
    console.log("✅ PostgreSQL listo (asaltos a sede se guardan por semana ISO).".green);
  } catch (e) {
    console.error(
      "❌ PostgreSQL no disponible. El bot arranca pero no se guardarán asaltos.".red,
      e.message
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
