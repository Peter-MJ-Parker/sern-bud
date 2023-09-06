import { EventType, eventModule } from '@sern/handler';
import { Events, Guild } from 'discord.js';
import guildSchema from '#schemas/guild';

export default eventModule({
	type: EventType.Discord,
	name: Events.GuildCreate,
	async execute(guild: Guild) {
		let Guild = await guildSchema.findOne({
			gID: guild.id,
		});

		if (!Guild) {
			await new guildSchema({
				gID: guild.id,
				gName: guild.name,
				// prefix: '?', //To change the default prefix of '?', uncomment this line and insert your desired prefix.
			}).save();
		}
	},
});
