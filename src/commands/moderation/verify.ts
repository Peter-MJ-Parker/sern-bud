import { commandModule, CommandType, Service } from '@sern/handler';
import guildSchema from '#schemas/guild';
import memberSchema from '#schemas/member';
import {
	Channel,
	ChannelType,
	Collection,
	EmbedBuilder,
	Message,
	Snowflake,
	TextChannel,
} from 'discord.js';

export default commandModule({
	type: CommandType.Text,
	plugins: [],
	description: 'Manually verifies a user.',
	execute: async ({ message }, [, args]) => {
		const { utils } = Service('@sern/client');
		const { channelUpdater, deleteOnTimeout, isValidSnowflake, welcomeCreate } =
			utils;
		const guild = await guildSchema.findOne({ gID: message.guild?.id! });
		if (!args[0]) {
			const msg = await message.reply({
				content: `You need to provide the message id that was sent in <#${guild?.modC!}>.\nUsage: \`?verify <messageID>\` (replace <messageID> with the corresponding id.)`,
			});
			return await deleteOnTimeout([msg, message], 5000);
		}
		try {
			if (isValidSnowflake(args[0]) === false) {
				let errorMsg = await message.reply({
					content: `${args[0]} is not a valid message id. Please try again <t:${
						Date.now() + 5000
					}:R>.`,
				});
				await deleteOnTimeout(errorMsg, 6000);
			}

			if (message.channel.isTextBased()) {
				const role = (await message.guild?.roles.fetch(guild?.verifiedRole!))!;
				const chan = message.guild?.channels.cache.get(
					'744945603313795306'
				) as TextChannel;

				if (message.channel.type === ChannelType.GuildText) {
					message.guild?.channels.cache.each(async (channel: Channel) => {
						if (channel.isTextBased() && channel === chan) {
							const textChannel = channel as TextChannel;
							const messages: Collection<Snowflake, Message> =
								await textChannel.messages.fetch({ limit: 5 });
							if (messages.has(args[0])) {
								const msgToEdit = await chan.messages.fetch(args[0]);
								if (
									msgToEdit.author.id !== message.guild?.members.me?.id &&
									msgToEdit.embeds.length < 1 &&
									isValidSnowflake(msgToEdit.embeds[0].footer?.text!) === false
								)
									return;
								const memberId = msgToEdit.embeds[0].footer?.text!;
								const member = (await message.guild?.members.fetch())?.get(
									memberId
								)!;
								if (!member.roles.cache.has(role.id))
									await member.roles.add(role);
								const newEmbed = new EmbedBuilder({
									author: {
										name: 'New member verified!',
										icon_url: member.client.user.displayAvatarURL()!,
									},
									title: member.user.username,
									thumbnail: { url: member.avatarURL()! },
									fields: [
										{
											name: 'Verification: ',
											value: `Manually passed by ${message.member}`,
										},
									],
									footer: { text: '' },
								});
								await msgToEdit.edit({
									embeds: [newEmbed],
									components: [],
								});
								const welcome = (await message.guild?.channels.fetch(
									guild?.welcomeC!
								)) as TextChannel;
								await memberSchema.findOneAndDelete({ memberId: memberId });
								const userCount = member.guild?.members.cache.filter(
									(m) => !m.user.bot
								).size!;

								await welcomeCreate(
									member,
									member.guild.name,
									userCount,
									welcome
								).then(async () => {
									await channelUpdater(member.guild);
								});
							}
						}
					});
				}
			}
		} catch (error) {
			console.log(error);
		}
	},
});
