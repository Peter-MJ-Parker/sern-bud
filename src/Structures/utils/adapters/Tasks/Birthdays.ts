import { BaseTaskLogger } from '#utils';
import { EmbedBuilder, Guild, TextChannel } from 'discord.js';

export class Birthdays extends BaseTaskLogger {
  constructor() {
    super();
  }

  private async getGuildBirthdayData(guild: Guild): Promise<GuildData | null> {
    const guildDoc = await this.db.guild.findUnique({
      where: { gID: guild.id }
    });

    if (!guildDoc) return null;

    const birthdayLogChannel = guild.channels.cache.get(guildDoc.birthdayLogChannelId) as TextChannel;
    if (!birthdayLogChannel || !birthdayLogChannel.isTextBased()) return null;

    const guildBirthdays = await this.db.birthday.findUnique({
      where: { gID: guild.id },
      include: { birthdays: true }
    });

    return {
      guildDoc,
      birthdayLogChannel,
      guildBirthdays: guildBirthdays as GuildBirthdays | null
    };
  }

  private async sendBirthdayEmbed(channel: TextChannel, messageId: string | null, embed: EmbedBuilder) {
    await this.sendOrUpdateEmbed(channel, messageId, embed);
  }

  private formatBirthdayEntry(guild: Guild, birthday: Birthday) {
    const member = guild.members.cache.get(birthday.userID);
    return `${member?.displayName || birthday.nickname || birthday.username}: ${birthday.date}`;
  }

  private createEmbed(title: string, description: string): EmbedBuilder {
    return new EmbedBuilder().setTitle(title).setDescription(description).setColor('#FF69B4').setTimestamp();
  }

  private sortBirthdays(birthdays: Birthday[], byMonth = true): Birthday[] {
    return birthdays.sort((a, b) => {
      const [aMonth, aDay] = a.date.split('/').map(Number);
      const [bMonth, bDay] = b.date.split('/').map(Number);
      return byMonth ? aMonth - bMonth || aDay - bDay : aDay - bDay;
    });
  }

  private async logBirthdayList(guild: Guild, title: string, birthdays: Birthday[]) {
    const data = await this.getGuildBirthdayData(guild);
    if (!data) return;

    const { guildDoc, birthdayLogChannel, guildBirthdays } = data;

    if (!guildBirthdays || birthdays.length === 0) {
      const embed = this.createEmbed(title, 'No birthdays recorded for this period.');
      await this.sendBirthdayEmbed(birthdayLogChannel, guildDoc.birthdayLogMessageId, embed);
      return;
    }

    const description = this.formatBirthdayList(guild, birthdays);
    const embed = this.createEmbed(title, description);
    await this.sendBirthdayEmbed(birthdayLogChannel, guildDoc.birthdayLogMessageId, embed);
  }

  private formatBirthdayList(guild: Guild, birthdays: Birthday[]): string {
    const birthdaysByMonth = birthdays.reduce<Record<string, Birthday[]>>((acc, birthday) => {
      const [month] = birthday.date.split('/');
      if (!acc[month]) acc[month] = [];
      acc[month].push(birthday);
      return acc;
    }, {} as Record<string, any[]>);

    return Object.entries(birthdaysByMonth)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([month, monthBirthdays]) => {
        const monthName = new Date(2000, parseInt(month) - 1).toLocaleString('default', { month: 'long' });
        const birthdayList = monthBirthdays.map(b => this.formatBirthdayEntry(guild, b)).join('\n');
        return `**${monthName}**\n${birthdayList}`;
      })
      .join('\n\n');
  }

  public async logBirthdays(guild: Guild) {
    const data = await this.getGuildBirthdayData(guild);
    if (!data) return;

    const sortedBirthdays = this.sortBirthdays(data.guildBirthdays?.birthdays || []);
    await this.logBirthdayList(guild, 'Birthdays in my Memory', sortedBirthdays);
  }

  public async logCurrentMonthBirthdays(guild: Guild) {
    const data = await this.getGuildBirthdayData(guild);
    if (!data) return;

    const currentMonth = new Date().getMonth() + 1;
    const currentMonthBirthdays = data.guildBirthdays?.birthdays.filter(birthday => {
      const [month] = birthday.date.split('/').map(Number);
      return month === currentMonth;
    });

    const sortedBirthdays = this.sortBirthdays(currentMonthBirthdays ?? [], false);
    const monthName = new Date(2000, currentMonth - 1).toLocaleString('default', { month: 'long' });
    await this.logBirthdayList(guild, `Birthdays in ${monthName}`, sortedBirthdays);
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
          data: { birthdayLogMessageId: newMessage.id }
        });
      }
    } catch (error) {
      const newMessage = await channel.send({ embeds: [embed] });
      await this.db.guild.update({
        where: { gID: channel.guild.id },
        data: { birthdayLogMessageId: newMessage.id }
      });
    }
  }

  public isValidDate(dateString: string): boolean {
    const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])$/;
    if (!dateRegex.test(dateString)) {
      return false;
    }

    const [month, day] = dateString.split('/').map(Number);

    if (month === 2) {
      return day <= 29;
    } else if ([4, 6, 9, 11].includes(month)) {
      return day <= 30;
    } else {
      return true;
    }
  }
}

interface Birthday {
  userID: string;
  date: string;
  nickname: string | null;
  username: string;
}

interface GuildBirthdays {
  id: string;
  gID: string;
  birthdays: Birthday[];
}

interface GuildData {
  guildDoc: {
    birthdayLogMessageId: string | null;
    birthdayLogChannelId: string;
  };
  birthdayLogChannel: TextChannel;
  guildBirthdays: GuildBirthdays | null;
}
