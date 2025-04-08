import { EventType, eventModule, Service } from '@sern/handler';
import { EmbedBuilder, Events, Guild, GuildMember, TextChannel } from 'discord.js';

export default eventModule<Events.GuildMemberRemove>({
  type: EventType.Discord,
  execute: async (member: GuildMember) => {
    const prisma = Service('prisma');
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
  }
});
