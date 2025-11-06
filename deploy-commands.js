const { REST, Routes } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config();

const commands = [];

const commandsPath = path.join(__dirname, "commands");

// Рекурсивно обходим все подпапки
function readCommands(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      readCommands(filePath); // рекурсивно
    } else if (file === "index.js") {
      const command = require(filePath);
      commands.push(command.data.toJSON());
    }
  }
}

readCommands(commandsPath);

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

// Локальная регистрация (на конкретный сервер)
rest
  .put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID
    ),
    { body: commands }
  )
  .then(() =>
    console.log(`✅ Зарегистрировано ${commands.length} slash-команд`)
  )
  .catch(console.error);
