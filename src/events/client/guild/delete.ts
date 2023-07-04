import { EventType, eventModule } from '@sern/handler';
import { Events, Guild } from 'discord.js';
import guildSchema from '#schemas/guild';

export default eventModule({
	type: EventType.Discord,
	name: Events.GuildDelete,
	async execute(guild: Guild) {
		if (guild.id !== '678398938046267402') return;

		let Guild = await guildSchema.findOne({
			gID: guild.id,
		});
		if (!Guild) {
			return null;
		} else {
			await Guild.deleteOne();
		}
	},
});
