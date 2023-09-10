import { commandModule, CommandType, Service } from '@sern/handler';
import { TextChannel } from 'discord.js';

export default commandModule({
	type: CommandType.Button,
	execute: async (ctx) => {
		const { utils } = Service('@sern/client');
		await utils.getMeme(ctx.channel as TextChannel, ctx);
	},
});
