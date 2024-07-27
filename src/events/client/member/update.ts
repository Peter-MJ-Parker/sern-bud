import { EventType, eventModule } from '@sern/handler';
import { Events, GuildMember } from 'discord.js';
import MoneySchema from '#schemas/money';

export default eventModule({
	type: EventType.Discord,
	name: Events.GuildMemberUpdate,
	async execute(oldMember: GuildMember, newMember: GuildMember) {
		if (newMember.nickname !== oldMember.nickname) {
			await MoneySchema.findOneAndUpdate(
				{
					userID: newMember.id,
				},
				{
					$set: {
						nickname: newMember.nickname,
					},
				}
			);
		}
	},
});
