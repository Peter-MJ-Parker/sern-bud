import { commandModule, CommandType, Service } from '@sern/handler';
import { EmbedBuilder, TextChannel } from 'discord.js';

export default commandModule({
	type: CommandType.Button,
	execute: async (ctx) => {
		const meme = await Service('@sern/utils').getMeme(
			ctx.channel as TextChannel,
			ctx
		);
		await ctx.update({
			embeds: [meme as EmbedBuilder],
		});
	},
});
