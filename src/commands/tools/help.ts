import { publish } from '#plugins';
import { commandModule, CommandType } from '@sern/handler';
import {
	ApplicationCommand,
	ApplicationCommandOptionType,
	Collection,
	type GuildMember,
	GuildResolvable,
	EmbedBuilder,
} from 'discord.js';

const roles = [
	'742730447368355930',
	'678399702974070804',
	'739849649770463323',
	'679872454369607742',
];

export default commandModule({
	type: CommandType.Both,
	plugins: [publish()],
	description: 'Describes how to use the bot and commands.',
	options: [
		{
			name: 'command',
			type: ApplicationCommandOptionType.String,
			description: 'Command to get help with.',
			autocomplete: true,
			command: {
				onEvent: [],
				async execute(auto) {
					const focus = auto.options.getFocused();
					let commands: Collection<
						string,
						ApplicationCommand<{
							guild: GuildResolvable;
						}>
					>;
					if ((auto.member as GuildMember).roles.cache.hasAny(...roles)) {
						commands = (await auto.client.application.commands.fetch()).filter(
							(cmd) => !['help'].includes(cmd.name)
						);
					}
					commands = (await auto.client.application.commands.fetch()).filter(
						(cmd) => !['verify', 'kick', 'ban', 'help'].includes(cmd.name)
					);
					const choices = [...commands.map((m) => m)];
					const filtered = choices
						.filter((choice) => choice.name.startsWith(focus))
						.slice(0, 25)
						.map((choice) => {
							let name = choice.name;
							let value = choice.id;
							return { name, value };
						});
					await auto.respond(filtered);
				},
			},
		},
	],
	execute: async (ctx, [type, args]) => {
		switch (type) {
			case 'text':
				const textCommand = args[0];
				const textHelp = new EmbedBuilder({
					author: { name: 'SmokinWeed Help' },
				});
				if ((ctx.member as GuildMember).roles.cache.hasAny(...roles)) {
					if (!textCommand)
						textHelp
							.setDescription(
								'I see you are a moderator of this server. Here are some moderation commands.\n**NOTE:** Do not use the members ID to moderate them!'
							)
							.setFields(
								{
									name: '?verify',
									value:
										'**Description:** This command will allow you to verify a new member into the server using the corresponding message id.\n**Usage:** ?verify <messageID>',
								},
								{
									name: '?ban',
									value:
										'**Description:** This command will allow you to ban a new member from the server using the corresponding message id.\n**Usage:** ?ban <messageID>',
								},
								{
									name: '?kick',
									value:
										'**Description:** This command will allow you to kick a new member from the server using the corresponding message id.\n**Usage:** ?kick <messageID>',
								},
								{
									name: '**HINT:**',
									value:
										'The corresponding message id is found by copying the Message ID of the previous message with the buttons attached (Verify, Ban, Kick).',
								}
							)
							.setFooter({
								text: 'If you need help, ping <@371759410009341952>',
							});
				}
				if (!textCommand) {
					const helpEmbed: EmbedBuilder = new EmbedBuilder({
						author: { name: 'SmokinWeed Help' },
						description: '',
						fields: [],
						footer: {
							text: 'If you need help, ping <@371759410009341952>',
						},
					});
				}
				return ctx.reply({
					ephemeral: true,
					embeds: [textHelp],
				});

				break;
			case 'slash':
				let slashCommand = args.getString('command')!;
				if ((ctx.member as GuildMember).id !== '371759410009341952') {
					return ctx.reply({
						ephemeral: true,
						content: 'Command still in development.',
					});
				} else {
					if (!slashCommand) {
						const helpEmbed: EmbedBuilder = new EmbedBuilder({
							author: { name: 'SmokinWeed Help' },
							description:
								'I currently only support Slash (/) Commands. Use </help:1146560094448922714> [command] to get more info on a specific command!',
							fields: [
								{
									name: '',
									value: '',
								},
							],
						});
						return ctx.reply({
							ephemeral: true,
							embeds: [helpEmbed],
						});
					}
					const command =
						ctx.client.application?.commands.cache?.get(slashCommand)!;
					const embeds = [
						new EmbedBuilder({
							title: command.name + ' HELP',
							fields: [
								{
									name: 'Description',
									value: command.description,
								},
							],
						}),
					];
					if (command.options && command.options.length > 0) {
						embeds[0].addFields({
							name: 'Options:',
							value: command.options
								.map((f) => {
									const name = f.name;
									const des = f.description;
									return `**${name.toUpperCase()}**\n${des}\n\n`;
								})
								.toString(),
						});
					}
					return ctx.reply({
						ephemeral: true,
						embeds,
					});
				}
				break;
		}
	},
});
