import { scheduledTask } from '@sern/handler';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default scheduledTask({
  trigger: '0 7 1 6 *', // 7 AM on June 1st every year
  timezone: 'America/New_York', // Eastern US Time
  async execute(_, { deps }) {
    const client = deps['@sern/client'];
    const db = deps.prisma.guild;
    let guilds = await db.findMany({});

    for (const guild of guilds) {
      if (!guild.announcementsChannelId) return;

      const announcementsChannel = client.channels.cache.get(guild.announcementsChannelId);
      if (announcementsChannel && announcementsChannel.isTextBased() && announcementsChannel.isSendable()) {
        await announcementsChannel.send({
          content: `🌈 Happy Pride Month! 🌈\n\nJoin us in celebrating love, acceptance, and diversity! Let's make this month a time of joy and pride for everyone!`,
          components: [
            new ActionRowBuilder<ButtonBuilder>({
              components: [
                new ButtonBuilder({
                  customId: `pride`,
                  label: 'Join the Pride Party!',
                  style: ButtonStyle.Primary
                })
              ]
            })
          ]
        });
        return;
      }
    }
  }
});
