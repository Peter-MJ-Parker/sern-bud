import { publish } from '#plugins';
import moneySchema from '#schemas/money';
import { commandModule, CommandType } from '@sern/handler';
import { ApplicationCommandOptionType } from 'discord.js';

export default commandModule({
	type: CommandType.Both,
	plugins: [publish()],
	description: 'Checks the money balance of a user.',
	options: [
		{
			name: 'user',
			type: ApplicationCommandOptionType.User,
			description: 'Select a user to view their balance.',
		},
	],
	execute: async (ctx) => {
		const user = ctx.options.getUser('user') ?? ctx.user;
		let money = await moneySchema.findOne({
			userID: user.id,
			serverID: ctx.guild?.id,
		});
		const wallet = money?.wallet;
		const bank = money?.bank;
		await ctx.reply({
			content: `${user} holds ${wallet} coins on them and ${bank} in their bank.`,
			ephemeral: true,
		});
	},
});
