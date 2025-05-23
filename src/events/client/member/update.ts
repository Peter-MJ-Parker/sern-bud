import { EventType, eventModule, Service } from '@sern/handler';
import { Events, GuildMember } from 'discord.js';

export default eventModule<Events.GuildMemberUpdate>({
  type: EventType.Discord,
  async execute(oldMember: GuildMember, newMember: GuildMember) {
    const prisma = Service('prisma');
    if (newMember.nickname !== oldMember.nickname) {
      let profile = await prisma.money.findFirst({
        where: { userID: oldMember.id || newMember.id, serverID: oldMember.guild.id || newMember.guild.id }
      });
      if (!profile) return;
      await prisma.money.update({
        where: { id: profile.id },
        data: {
          nickname: newMember.nickname
        }
      });
    }
  }
});
