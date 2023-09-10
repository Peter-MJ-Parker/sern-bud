import { EventType, Service, eventModule } from '@sern/handler';
import { Events } from 'discord.js';

export default eventModule({
	type: EventType.Discord,
	name: Events.ClientReady,
	execute: async () => {
		const { user, utils } = Service('@sern/client');
		Service('@sern/logger').success('Logged into Discord as ' + user?.username);
		await utils.mongoConnect(utils.env.CONNECT);
	},
});
