import { Colors, EmbedBuilder, Guild } from 'discord.js';
import { Service } from '@sern/handler';
import { today } from '#utils';

export abstract class BaseTaskLogger {
  constructor() {}
  protected get client() {
    return Service('@sern/client');
  }
  protected get db() {
    return Service('prisma');
  }

  async channelSend(guild: Guild, info: string) {
    const channel = await guild.channels.fetch('742730720450969671');
    if (!channel || !channel.isTextBased()) return;

    const messages = await channel.messages.fetch();
    const message = messages.find(m => m.author.id === this.client.user?.id && m.embeds[0]?.title === 'Task Logger');

    const embed = new EmbedBuilder({
      title: 'Task Logger',
      description: info,
      color: Colors.Green,
      timestamp: Date.now(),
      footer: {
        text: this.client.user?.username ?? '',
        icon_url: this.client.user?.displayAvatarURL() ?? ''
      }
    });
    if (message) {
      await message.edit({
        embeds: [embed]
      });

      await this.db.taskMessages.upsert({
        where: { messageId: message.id },
        create: { messageId: message.id },
        update: { messageId: message.id }
      });
    } else {
      const newMessage = await channel.send({
        embeds: [embed]
      });

      await this.db.taskMessages.create({
        data: { messageId: newMessage.id }
      });
    }
  }

  async secondarySend(guild: Guild, info: string) {
    const channel = await guild.channels.fetch('742730720450969671');
    if (!channel || !channel.isTextBased()) return;

    const messages = await channel.messages.fetch();
    const message = messages.find(
      m => m.author.id === this.client.user?.id && m.embeds[0]?.title === 'Birthday Dates Checked'
    );

    if (message) {
      const currentEmbed = EmbedBuilder.from(message.embeds[0]);
      const description = currentEmbed.data.description || '';
      let newDescription = description;
      const date = `\`${today}\``;

      if (!description.includes(date)) {
        if (description.trim().length > 0) {
          newDescription = `${description}, ${date}`;
        } else {
          newDescription = date;
        }
      }

      currentEmbed.setDescription(newDescription);
      await message.edit({
        embeds: [currentEmbed]
      });

      await this.db.taskMessages.upsert({
        where: { messageId: message.id },
        create: { messageId: message.id },
        update: { messageId: message.id }
      });
    } else {
      const embed = new EmbedBuilder({
        title: 'Birthday Dates Checked',
        description: info + `\n\`${today}\``,
        color: Colors.Green,
        timestamp: Date.now(),
        footer: {
          text: this.client.user?.username ?? '',
          icon_url: this.client.user?.displayAvatarURL() ?? ''
        }
      });
      const newMessage = await channel.send({
        embeds: [embed]
      });

      await this.db.taskMessages.create({
        data: { messageId: newMessage.id }
      });
    }
  }
}
