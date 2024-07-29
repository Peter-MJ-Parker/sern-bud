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

  public isValidDate(dateString: string): boolean {
    const dateRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
    if (!dateRegex.test(dateString)) {
      return false;
    }

    const [month, day] = dateString.split('-').map(Number);

    if (month === 2) {
      return day <= 29;
    } else if ([4, 6, 9, 11].includes(month)) {
      return day <= 30;
    } else {
      return true;
    }
  }
}
