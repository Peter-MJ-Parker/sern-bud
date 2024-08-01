import { Colors, EmbedBuilder, Guild } from 'discord.js';
import { Service } from '@sern/handler';

export abstract class BaseTaskLogger {
  constructor() {}
  protected get client() {
    return Service('@sern/client');
  }
  protected get db() {
    return Service('prisma');
  }

  async channelSend(guild: Guild, info: any) {
    let guildDoc = await this.db.guild.findFirst({
      where: {
        gID: guild.id
      }
    });
    if (!guildDoc) return;

    await guild.channels.fetch(guildDoc.taskLogsChannelId).then(async channel => {
      if (!channel?.isTextBased() || !channel) return;
      await channel.send({
        embeds: [
          new EmbedBuilder({
            title: 'Task Logger',
            description: info,
            color: Colors.Green,
            timestamp: Date.now(),
            footer: {
              text: this.client.user?.username!,
              icon_url: this.client.user?.displayAvatarURL()
            }
          })
        ]
      });
    });
  }
}
