import { ownerOnly, publish } from '#plugins';
import { commandModule, CommandType, Service } from '@sern/handler';
import {
	ApplicationCommandOptionType,
	EmbedBuilder,
	GuildMember,
} from 'discord.js';

export default commandModule({
	type: CommandType.Slash,
	plugins: [publish(), ownerOnly()],
	description: 'Emits client events for testing purposes.',
	options: [
		{
			name: 'event',
			description: 'Event name to emit/test',
			type: ApplicationCommandOptionType.String,
			choices: [
				{ name: 'guildMemberAdd', value: 'guildMemberAdd' },
				{ name: 'guildMemberRemove', value: 'guildMemberRemove' },
				// { name: "guildMemberUpdate", value: "guildMemberUpdate" },
				// { name: "guildCreate", value: "guildCreate" },
				// { name: "guildDelete", value: "guildDelete" },
				// { name: "emojiCreate", value: "emojiCreate" },
				// { name: "emojiDelete", value: "emojiDelete" },
			],
			required: true,
		},
		{
			name: 'user',
			description: 'Select a user to emit the event on.',
			type: ApplicationCommandOptionType.User,
			required: true,
		},
	],
	execute: async ({ interaction }, [, options]) => {
		const client = Service('@sern/client');
		try {
			const event = options.getString('event', true)!;
			const user = options.getUser('user')?.id!;
			const message = `Event: ***${event}*** has been triggered!`;
			const embed = new EmbedBuilder({
				description: `\\✅ **Success:** \\✅\n ${message}`,
				color: 0x13ad0e,
			});
			let member: GuildMember;
			switch (event) {
				case 'guildMemberAdd':
					member = interaction.guild?.members.cache.get(user)!;
					client.emit(event, member);
					break;
				case 'guildMemberRemove':
					member = interaction.guild?.members.cache.get(user)!;
					client.emit(event, member);
					break;
				// case "guildMemberUpdate":
				// 	member = interaction.guild?.members.cache.get(user)!;
				// 	client.emit(event, member);
				// 	break;
				// case "guildCreate":
				// 	client.emit(event, interaction.guild);
				// 	embed.addFields({
				// 		name: "\u200b",
				// 		value: "This event went to the console as it is not setup.",
				// 	});
				// 	break;
				// case "guildDelete":
				// 	client.emit(event, interaction.guild);
				// 	embed.addFields({
				// 		name: "\u200b",
				// 		value: "This event went to the console as it is not setup.",
				// 	});
				// 	break;
				// case "emojiCreate":
				// 	client.emit(event, interaction.guild);
				// 	embed.addFields({
				// 		name: "\u200b",
				// 		value: "This event went to the console as it is not setup.",
				// 	});
				// 	break;
				// case "emojiDelete":
				// 	client.emit(event, interaction.guild);
				// 	embed.addFields({
				// 		name: "\u200b",
				// 		value: "This event went to the console as it is not setup.",
				// 	});
				// 	break;
				// case "emojiUpdate":
				// 	client.emit(event, interaction.guild);
				// 	embed.addFields({
				// 		name: "\u200b",
				// 		value: "This event went to the console as it is not setup.",
				// 	});
				// 	break;

				default:
					break;
			}

			await interaction.reply({
				embeds: [embed],
				ephemeral: true,
			});
		} catch (error) {
			console.log(error);
			await interaction.reply({
				embeds: [
					{
						description: `\\📛 **Error:** \\📛\n ${error}`,
						color: 0xfc0303,
					},
				],
				ephemeral: true,
			});
		}
	},
});
