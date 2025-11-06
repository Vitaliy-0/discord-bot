const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
require("dotenv").config();
const categories = "https://api.hentaicord.net/types-categories";
const { getRandom } = require("../../utils.js");

// messageId → { votes: {1,2,3}, voters: Set, names: {1:[],2:[],3:[]} }
const votesStorage = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sexy")
    .setDescription("3 картинки, 1 голос на человека"),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const categoriesFromApi = await fetch(categories, {
        headers: { Authorization: process.env.HENTAICORD_API_KEY },
      });
      const { categories: categoriesArray } = await categoriesFromApi.json();
      const withoutCategories = ["yaoi"];

      const randomType = getRandom(Object.keys(categoriesArray));
      let randomCategory = getRandom(categoriesArray[randomType]);
      while (withoutCategories.includes(randomCategory)) {
        randomCategory = getRandom(categoriesArray[randomType]);
      }

      const getImage = async () => {
        const res = await fetch(
          `https://api.hentaicord.net/retrieve/${randomType}/${randomCategory}`,
          { headers: { Authorization: process.env.HENTAICORD_API_KEY } }
        );
        const data = await res.json();
        return data?.image;
      };

      const images = await Promise.all([getImage(), getImage(), getImage()]);
      if (images.some((img) => !img)) {
        return interaction.editReply(
          "❌ Не удалось загрузить картинки, попробуй ещё раз!"
        );
      }

      const embeds = images.map((url, i) => ({
        title: `Вариант #${i + 1}`,
        image: { url },
        footer: { text: "Голоса: 0\nПока никто не голосовал" },
      }));

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("vote_1")
          .setLabel("1")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("vote_2")
          .setLabel("2")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("vote_3")
          .setLabel("3")
          .setStyle(ButtonStyle.Primary)
      );

      const msg = await interaction.editReply({ embeds, components: [row] });

      // Инициализация голосов и списков
      votesStorage.set(msg.id, {
        votes: { 1: 0, 2: 0, 3: 0 },
        voters: new Set(),
        names: { 1: [], 2: [], 3: [] },
      });

      const collector = msg.createMessageComponentCollector({ time: 60_000 });

      collector.on("collect", async (btn) => {
        const store = votesStorage.get(msg.id);
        const userId = btn.user.id;

        // Проверка на повторный голос
        if (store.voters.has(userId)) {
          return btn.reply({
            content: "❗ Ты уже проголосовал!",
            ephemeral: true,
          });
        }

        const choice = btn.customId.split("_")[1];
        store.votes[choice]++;
        store.voters.add(userId);

        // Записываем ник
        const nickname = btn.member?.displayName || btn.user.username;
        store.names[choice].push(nickname);

        // Обновляем embed’ы
        const newEmbeds = embeds.map((emb, i) => {
          const num = i + 1;
          const users = store.names[num].length
            ? store.names[num].join(", ")
            : "Пока никто не голосовал";

          return {
            ...emb,
            footer: {
              text: `Голоса: ${store.votes[num]}\n${users}`,
            },
          };
        });

        // ❗ КНОПКИ НЕ ОТКЛЮЧАЕМ, чтобы могли голосовать другие люди
        await btn.update({ embeds: newEmbeds });
      });

      collector.on("end", () => {
        try {
          interaction.editReply({ components: [] })
        } catch (err) {
          console.log("Не удалось обновить сообщение (возможно удалено).");
        }
      });
    } catch (err) {
      console.error(err);
      await interaction.editReply("🔥 Ошибка при загрузке, попробуй позже!");
    }
  },
};
