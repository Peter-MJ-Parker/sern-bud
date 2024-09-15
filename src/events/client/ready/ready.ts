import { EventType, Services, eventModule } from '@sern/handler';
import { Events, TextChannel } from 'discord.js';

export default eventModule({
  type: EventType.Discord,
  name: Events.ClientReady,
  execute: async () => {
    const [{ guilds, user, utils }, logger] = Services('@sern/client', '@sern/logger');
    logger.success('Logged into Discord as ' + user?.username);
    const guild = guilds.cache.get('678398938046267402')!;
    await utils.channelUpdater(guild);
    await (guild.channels.cache.get('833761882212663317') as TextChannel).send('<:batty:1284983393175470100>');
  }
});
