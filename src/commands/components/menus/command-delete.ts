import { ownerOnly, buttonConfirmation } from '#plugins';
import { commandModule, CommandType, Service } from '@sern/handler';
import type { TextChannel } from 'discord.js';

export default commandModule({
	type: CommandType.StringSelect,
	plugins: [ownerOnly()],
	description: 'Deletes an Application Command.',
	execute: async (interaction) => {
		const { utils } = Service('@sern/client');
		const [id] = interaction.values;
		const command = await interaction.client.application?.commands.fetch(id);
		await command.delete().then(async () => {
			await interaction
				.update({
					content: `I have deleted command: **${command.name}**.`,
					components: [],
				})
				.then(async (reply) => {
					await utils.deleteOnTimeout(reply, 5000);
				});
		});
	},
});
