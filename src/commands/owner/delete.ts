import { ownerOnly } from '#plugins';
import { commandModule, CommandType } from '@sern/handler';
import {
	ActionRowBuilder,
	ComponentType,
	StringSelectMenuBuilder,
	TextChannel,
} from 'discord.js';

export default commandModule({
	type: CommandType.Text,
	plugins: [ownerOnly()],
	description: 'removes application commands by id',
	execute: async ({ message, client }, [, args]) => {
		await message.delete();
		const commands = await client.application?.commands.fetch()!;
		await (message.channel as TextChannel).send({
			components: [
				new ActionRowBuilder<StringSelectMenuBuilder>({
					components: [
						{
							type: ComponentType.StringSelect,
							custom_id: 'command-delete',
							placeholder: 'Select a command to delete',
							options: commands.map((command) => {
								return {
									label: `${command.name}`,
									value: `${command.id}`,
									description: `${
										command.description
											? command.description
											: 'App based command --- no description.'
									}`,
								};
							}),
						},
					],
				}),
			],
		});
	},
});
