import { BudBot } from '#BudBot';
import { Colors, EmbedBuilder } from 'discord.js';

export class TaskLogger {
  constructor(private client: BudBot) {}
  async channelSend(cid: string, info: any) {
    await this.client.channels.fetch(cid).then(async channel => {
      if (!channel?.isTextBased()) {
        throw Error('Invalid channel to send to');
      }
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
