import { BudBot } from '#BudBot';
import { PrismaClient } from '@prisma/client';
import { Colors, EmbedBuilder, Guild, TextChannel } from 'discord.js';

export class TaskLogger {
  constructor(private client: BudBot, private db: PrismaClient) {}
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

  public async logBirthdays(guild: Guild) {
    const guildDoc = await this.db.guild.findUnique({
      where: { gID: guild.id }
    });

    if (!guildDoc) return;

    const birthdayLogChannel = guild.channels.cache.get(guildDoc.birthdayLogChannelId) as TextChannel;
    if (!birthdayLogChannel || !birthdayLogChannel.isTextBased()) return;

    const guildBirthdays = await this.db.birthday.findUnique({
      where: { gID: guild.id },
      include: { birthdays: true }
    });

    if (!guildBirthdays || guildBirthdays.birthdays.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle('Birthdays in my Memory')
        .setDescription('No birthdays recorded for this guild.')
        .setColor('#FF69B4')
        .setTimestamp();

      await this.sendOrUpdateEmbed(birthdayLogChannel, guildDoc.birthdayMessageId, embed);
      return;
    }

    const sortedBirthdays = guildBirthdays.birthdays.sort((a, b) => {
      const [aMonth, aDay] = a.date.split('-').map(Number);
      const [bMonth, bDay] = b.date.split('-').map(Number);
      return aMonth - bMonth || aDay - bDay;
    });

    const birthdaysByMonth = sortedBirthdays.reduce((acc, birthday) => {
      const [month] = birthday.date.split('-');
      if (!acc[month]) acc[month] = [];
      acc[month].push(birthday);
      return acc;
    }, {} as Record<string, typeof sortedBirthdays>);

    const description = Object.entries(birthdaysByMonth)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([month, birthdays]) => {
        const monthName = new Date(2000, parseInt(month) - 1).toLocaleString('default', { month: 'long' });
        const birthdayList = birthdays
          .map(b => {
            const member = guild.members.cache.get(b.userID);
            return `${member?.displayName || b.nickname || b.username}: ${b.date}`;
          })
          .join('\n');
        return `**${monthName}**\n${birthdayList}`;
      })
      .join('\n\n');

    const embed = new EmbedBuilder()
      .setTitle('Birthdays in my Memory')
      .setDescription(description)
      .setColor('#FF69B4')
      .setTimestamp();

    await this.sendOrUpdateEmbed(birthdayLogChannel, guildDoc.birthdayMessageId, embed);
  }

  private async sendOrUpdateEmbed(channel: TextChannel, messageId: string | null, embed: EmbedBuilder) {
    try {
      if (messageId) {
        const existingMessage = await channel.messages.fetch(messageId);
        await existingMessage.edit({ embeds: [embed] });
      } else {
        const newMessage = await channel.send({ embeds: [embed] });
        await this.db.guild.update({
          where: { gID: channel.guild.id },
          data: { birthdayMessageId: newMessage.id }
        });
      }
    } catch (error) {
      console.error('Error sending or updating birthday message:', error);
      const newMessage = await channel.send({ embeds: [embed] });
      await this.db.guild.update({
        where: { gID: channel.guild.id },
        data: { birthdayMessageId: newMessage.id }
      });
    }
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
