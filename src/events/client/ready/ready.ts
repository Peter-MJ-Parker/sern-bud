import { env } from '#utils';
import { EventType, Service, eventModule } from '@sern/handler';
import { Events } from 'discord.js';

export default eventModule({
	type: EventType.Discord,
	name: Events.ClientReady,
	execute: async () => {
		Service('@sern/logger').success(
			'Logged into Discord as ' + Service('@sern/client').user?.username
		);
		await Service('@sern/utils').mongoConnect(env.CONNECT);
	},
});
