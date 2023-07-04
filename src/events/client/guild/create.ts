import { EventType, eventModule } from '@sern/handler';
import { Events, Guild } from 'discord.js';
import guildSchema from '#schemas/guild';

export default eventModule({
	type: EventType.Discord,
	name: Events.GuildCreate,
	async execute(guild: Guild) {
		if (guild.id !== '678398938046267402') return;

		const counts = {
			users: guild.members.cache.filter((m) => !m.user.bot).size,
			bots: guild.members.cache.filter((m) => m.user.bot).size,
			total: guild.memberCount,
		};
		let Guild = await guildSchema.findOne({
			gID: guild.id,
		});
		if (Guild && !(Guild.allCount && Guild.botCount && Guild.userCount)) {
			await Guild.updateOne({
				$set: {
					allCount: counts.total,
					botCount: counts.bots,
					userCount: counts.users,
				},
			});
		}
		if (!Guild) {
			await new guildSchema({
				gID: guild.id,
				gName: guild.name,
				prefix: '?',
				allCount: counts.total,
				botCount: counts.bots,
				userCount: counts.users,
			}).save();
		}
	},
});
