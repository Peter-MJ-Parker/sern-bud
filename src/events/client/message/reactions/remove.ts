import { EventType, eventModule } from '@sern/handler';
import {
	Events,
	MessageReaction,
	PartialMessageReaction,
	User,
} from 'discord.js';

export default eventModule({
	type: EventType.Discord,
	name: Events.MessageReactionRemove,
	execute: async (
		reaction: MessageReaction | PartialMessageReaction,
		user: User
	) => {
		if (reaction.message.guild?.id !== '678398938046267402') return;
		let msg = reaction.message;

		if (msg.partial) await msg.fetch();
		if (reaction.partial) await reaction.fetch();

		if (user.bot) return;
		if (!msg.guild) return;

		if (msg.id === '744940669834887218' && reaction.emoji.toString()) {
			console.log(user.username + ' removed reaction ' + reaction.emoji.name);
		}
	},
});
