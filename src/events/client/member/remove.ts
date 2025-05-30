import { EventType, eventModule, Services } from '@sern/handler';
import { EmbedBuilder, Events, Guild, TextChannel } from 'discord.js';

export default eventModule({
  type: EventType.Discord,
  name: Events.GuildMemberRemove,
  execute: async member => {
    const [i, prisma] = Services('task-logger', 'prisma');
    const Guild = await prisma.guild.findFirst({
      where: { gID: member.guild.id }
    });
    if (!Guild) return;
    const guild = (await member.client.guilds.fetch(member.guild.id)) as Guild;
    const counts = {
      users: guild.members.cache.filter(m => !m.user.bot).size,
      bots: guild.members.cache.filter(m => m.user.bot).size,
      total: guild.memberCount
    };
    let data = {};
    if (member.user.bot) {
      data = {
        botCount: counts.bots,
        allCount: counts.total
      };
    } else {
      data = {
        userCount: counts.users,
        allCount: counts.total
      };
    }
    await prisma.guild.update({
      where: { gID: member.guild.id },
      data
    });
    const msg = await ((await member.guild.channels.fetch(Guild?.leaveC!)) as TextChannel).send({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `[${member.user.username}](https://discord.com/users/${member.user.id}) left the server.\n
        ${member.guild.name} now has a total of **${Guild?.userCount!}** members!`
          )
          .setTimestamp()
          .setColor('Red')
          .setFooter({
            text: `${member.client.user.username}`,
            iconURL: `${member.client.user.avatarURL({ size: 1024 })}`
          })
      ]
    });
    await msg.react('👋');

    const guildBirthdays = await prisma.birthday.findFirst({
      where: {
        gID: guild.id
      },
      select: { birthdays: true }
    });

    const _birthdayExists = guildBirthdays?.birthdays.some(u => u.userID === member.id);

    if (guildBirthdays && _birthdayExists) {
      const updatedBirthdays = guildBirthdays.birthdays.filter(u => u.userID !== member.id);

      await prisma.birthday.update({
        where: { gID: guild.id },
        data: { birthdays: updatedBirthdays }
      });

      const embed = EmbedBuilder.from(msg.embeds[0]);
      embed.addFields({
        name: 'Birthday Removed',
        value: `Successfully deleted ${member.user.username}'s birthday from the database.`,
        inline: false
      });
      await msg.edit({ embeds: [embed] });

      await i.bdays.logBirthdays(member.guild);
    }
  }
});
