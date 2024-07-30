import { eventModule, EventType, Services } from '@sern/handler';
import { Events, type Guild } from 'discord.js';

export default eventModule({
  type: EventType.Discord,
  name: Events.GuildCreate,
  async execute(guild: Guild) {
    const [c, p] = Services('@sern/client', 'prisma');
    let guildData = await p.guild.findFirst({
      where: { gID: guild.id }
    });

    if (!guildData) {
      const members = await guild.members.fetch();
      const counts = {
        a: members.size,
        b: members.filter(m => m.user.bot).size,
        u: members.filter(m => !m.user.bot).size
      };
      guildData = await p.guild.create({
        data: {
          gID: guild.id,
          gName: guild.name,
          botCount: counts.b,
          allCount: counts.a,
          userCount: counts.u,
          welcomeC: guild.systemChannelId ?? ''
        }
      });
    }
  }
});
