const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pedik")
    .setDescription("Проверяет педика дня"),
  async execute(interaction) {
    const guild = interaction.guild;
    console.log('Команда pedik вызвана')
    // Обновляем кэш участников, чтобы получить актуальные статусы
    await guild.members.fetch();
    console.log('Участники получены')

    // Фильтруем: только люди (не боты) и кто онлайн
    const onlineMembers = guild.members.cache.filter(
      (member) =>
        !member.user.bot &&
        member.presence &&
        member.presence.status === "online"
    );

    // Проверяем, есть ли такие участники
    if (onlineMembers.size === 0) {
      return interaction.reply("😔 Никого онлайн нет — сегодня без педика.");
    }

    // Случайный выбор участника
    const randomMember = onlineMembers.random();

    await interaction.reply(`🏳️‍🌈 Педик дня — <@${randomMember.id}>!`);
  },
};
