import { publish } from '#plugins';
import { commandModule, CommandType, Service } from '@sern/handler';
import { TextChannel } from 'discord.js';

export default commandModule({
	type: CommandType.Both,
	plugins: [publish()],
	description: 'Gets a meme from reddit.',
	options: [],
	execute: async (ctx) => {
		const { getMeme } = Service('@sern/utils');
		await getMeme(
			ctx.channel as TextChannel,
			ctx.interaction //required to get the interaction of context
		);
	},
});
