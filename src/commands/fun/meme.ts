import { publish } from '#plugins';
import { commandModule, CommandType, Service } from '@sern/handler';
import { TextChannel } from 'discord.js';

export default commandModule({
	type: CommandType.Slash,
	plugins: [publish()],
	description: 'Gets a meme from reddit.',
	execute: async (ctx) => {
		const { getMeme } = Service('@sern/utils');
		await getMeme(
			ctx.channel as TextChannel,
			ctx.interaction //required to get the interaction of context
		);
	},
});
