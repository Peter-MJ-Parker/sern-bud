import { ownerOnly } from '#plugins';
import { commandModule, CommandType } from '@sern/handler';

export default commandModule({
	type: CommandType.StringSelect,
	plugins: [ownerOnly()],
	description: 'Deletes an Application Command.',
	execute: async (interaction) => {
		const [id] = interaction.values;
		const command = await interaction.client.application?.commands.fetch(id);
		await command.delete().then(() => {
			interaction
				.update({
					content: `I have deleted command: **${command.name}**.`,
					components: [],
				})
				.then((reply) => {
					setTimeout(async () => {
						await reply.delete();
					}, 5000);
				});
		});
	},
});
