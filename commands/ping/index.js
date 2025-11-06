const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Проверяет отклик бота"),
  async execute(interaction) {
    await interaction.reply("🏓 Pong!");
  },
};
