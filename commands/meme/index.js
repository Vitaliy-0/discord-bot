const { SlashCommandBuilder } = require("discord.js");
require("dotenv").config();
const url = "https://api.apileague.com/retrieve-random-meme?keywords=rocket";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("meme")
    .setDescription("Рандомный мэм"),
  async execute(interaction) {
    await interaction.deferReply(); // чтобы Discord ждал ответ >3 сек

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "x-api-key": process.env.MEME_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`API вернул ошибку: ${response.status}`);
      }

      const data = await response.json();

      const memeUrl = data.url;
      const memeTitle = data.title || "Вот твой мем 🧠";

      if (!memeUrl) {
        return interaction.editReply(
          "❌ Не удалось получить мем (пустая ссылка). Попробуй ещё раз!"
        );
      }

      await interaction.editReply({
        content: memeTitle,
        embeds: [
          {
            image: { url: memeUrl },
          },
        ],
      });
    } catch (error) {
      console.error(error);
      await interaction.editReply(
        "🔥 Ошибка при загрузке мема, попробуй позже!"
      );
    }
  },
};
