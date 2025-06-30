import { env } from '#utils';
import { EventType, Service, eventModule } from '@sern/handler';
import { ChannelType, Events, TextChannel } from 'discord.js';

export default eventModule({
  type: EventType.Discord,
  name: Events.MessageCreate,
  execute: async message => {
    const prisma = Service('prisma');
    const msg = message.content.toLowerCase();
    const prefixRegex = new RegExp(`^(<@!?${message.client.user.id}>)\\s*`);
    const counting = await prisma.counter.findFirst({
      where: {
        id: message.guildId!
      }
    });
    if (counting && message.channel.id !== counting.channel) return;

    if (prefixRegex.test(message.content)) {
      await message.delete();
      const stamp = `${message.client.readyTimestamp! / 1000}`;
      if (message.channel.isTextBased()) {
        const sent = await (message.channel as TextChannel).send(
          `${message.member}, I have been online since <t:${parseInt(stamp)}:R>`
        );
        setTimeout(async () => {
          await sent.delete();
        }, 10000);
      }
    }

    if (
      message.author.bot ||
      message.system ||
      message.channel.type === ChannelType.DM ||
      !message.guild ||
      !message.inGuild()
    )
      return null;

    let profileData = await prisma.money.findFirst({
      where: {
        userID: message.author.id,
        serverID: message.guild.id
      }
    });
    if (!profileData) {
      profileData = await prisma.money.create({
        data: {
          serverID: message.guildId,
          userID: message.author.id,
          username: message.author.username,
          bank: 0,
          wallet: 100,
          nickname: message.member?.nickname ? message.member?.nickname : null
        }
      });
    }
    try {
      if (!msg.startsWith(env.defaultPrefix)) {
        const coinsToAdd = Math.floor(Math.random() * 50) + 1;
        await prisma.money.update({
          where: {
            id: profileData.id
          },
          data: {
            wallet: { increment: coinsToAdd }
          }
        });
      }
    } catch (error) {
      console.log(error);
    }
  }
});
