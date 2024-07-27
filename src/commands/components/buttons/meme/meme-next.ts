import { commandModule, CommandType, Service } from '@sern/handler';
import { TextChannel } from 'discord.js';

export default commandModule({
	type: CommandType.Button,
	execute: async (ctx) => {
		await Service('@sern/client').utils.getMeme(
			ctx.channel as TextChannel,
			ctx
		);
	},
});
