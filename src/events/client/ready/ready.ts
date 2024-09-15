import { EventType, Services, eventModule } from '@sern/handler';
import { Events } from 'discord.js';

export default eventModule({
  type: EventType.Discord,
  name: Events.ClientReady,
  execute: async () => {
    const [{ guilds, user, utils }, logger] = Services('@sern/client', '@sern/logger');
    logger.success('Logged into Discord as ' + user?.username);
    const guild = guilds.cache.get('678398938046267402')!;
    await utils.channelUpdater(guild);
  }
});
