import { EventType, Services, eventModule } from '@sern/handler';
import { Events } from 'discord.js';

export default eventModule<Events.ClientReady>({
  type: EventType.Discord,
  execute: async () => {
    const [{ user }, logger] = Services('@sern/client', '@sern/logger');
    logger.success('Logged into Discord as ' + user?.username);
  }
});
