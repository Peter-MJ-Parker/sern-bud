import { scheduledTask } from '@sern/handler';
import type { Guild, Role, TextChannel } from 'discord.js';

export default scheduledTask({
  trigger: '50 3,7,11,15,19,23 * * *',
  timezone: 'America/New_York',
  async execute(_, { deps }) {
    const client = deps['@sern/client'];
    const guild = client.guilds.cache.get('678398938046267402') as Guild;
    const channel = guild.channels.cache.get('780435610611089418') as TextChannel;
    const role = (await guild.roles.fetch()).get('1272284689826054264') as Role;
    // await channel.send({
    //   content: `${role}, Server will be restarted in 10 minutes! Please return to title screen soon to prevent loss of progress!`
    // });
  }
});
