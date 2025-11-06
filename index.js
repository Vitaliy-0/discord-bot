const fs = require("node:fs");
const path = require("node:path");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");

function loadCommands(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      loadCommands(filePath);
    } else if (file === "index.js") {
      const command = require(filePath);
      client.commands.set(command.data.name, command);
    }
  }
}

loadCommands(commandsPath);

client.once("clientReady", () => {
  console.log(`✅ Бот вошёл как ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return; // важно!

  console.log("Команда вызвана:", interaction.commandName);

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error("Ошибка при выполнении команды:", error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "❌ Ошибка при выполнении команды.",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "❌ Ошибка при выполнении команды.",
        ephemeral: true,
      });
    }
  }
});

client.login(process.env.TOKEN);
