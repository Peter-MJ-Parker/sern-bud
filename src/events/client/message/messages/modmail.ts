import { EventType, Service, eventModule } from '@sern/handler';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	ComponentType,
	Events,
	Message,
	PermissionFlagsBits,
	TextChannel,
} from 'discord.js';
import modmail from '#schemas/modmail';
import guildSchema from '#schemas/guild';

export default eventModule({
	type: EventType.Discord,
	name: Events.MessageCreate,
	async execute(message: Message) {
		if (message.author.bot) return;
		const { channels, user, users, utils } = Service('@sern/client');
		const author = await users.fetch(message.author.id);

		if (!message.inGuild()) {
			if (message.channel.type === ChannelType.DM) {
				if (!author) return;
				const exist = await modmail.find({
					userId: author.id,
				});

				const buttons = [
					new ActionRowBuilder<ButtonBuilder>({
						components: ['📤|Create', '❌|Cancel'].map((choice) => {
							const [emoji, name] = choice.split('|');
							return new ButtonBuilder({
								label: name,
								custom_id: 'mail-' + name.toLowerCase(),
								emoji,
								style:
									emoji === '❌' ? ButtonStyle.Danger : ButtonStyle.Success,
							});
						}),
					}),
				];
				const msg = await message.channel.send({
					embeds: [
						{
							author: {
								name: `${user?.username}'s ModMail System`,
								icon_url: user?.avatar ? user?.displayAvatarURL() : '',
							},
							title: 'Welcome to my ModMail System!',
							description: `
            \`\`\`
            > Direct Messaging me is only meant for ModMail.
            > ModMail is only a use case if you have a question or concern reguarding my features.
            > By continuing to use this feature, you agree to the following:
            >> All messages sent in this channel will be saved in a transcript in case needed to reference in later case.
            >> Clicking \`Create\`, will create a ticket for my developer. This message will auto-delete  ${
							Date.now() + 300000
						}.
            >> Your basic user info will be stored to track the following:
            >>> Username, User Id, Profile Picture
            \`\`\`
            `,
							footer: { text: '' },
						},
					],
					components: buttons,
				});
				await msg.pin();
				const collector = msg.createMessageComponentCollector({
					componentType: ComponentType.Button,
					filter: (i) =>
						i.customId === 'mail-create' || i.customId === 'mail-cancel',
					max: 1,
					maxUsers: 1,
					time: 300000,
				});
				collector.on('collect', async (int) => {
					await int.deferUpdate();
					switch (int.customId) {
						case 'mail-create':
							const chan = channels.cache.get(
								'' //Replace with a channel that is only accessible by staff.
							) as TextChannel;
							if (!exist) {
								const newThread = await chan.threads.create({
									name: 'DM from ' + author.displayName,
									type: ChannelType.PrivateThread,
									startMessage: message.content,
									invitable: false,
								});
								newThread
									.permissionsFor(author.id)
									?.add([
										PermissionFlagsBits.ViewChannel,
										PermissionFlagsBits.SendMessages,
										PermissionFlagsBits.SendMessagesInThreads,
									]);
								new modmail({
									channelId: newThread.id,
									userId: author.id,
									timestamp: Date.now(),
								});
								const sent = await newThread.send({
									embeds: [
										{
											title: 'ModMail from ' + author.username,
											description: `\`\`\`${
												message.content.length > 2000
													? message.content.slice(0, 2000)
													: message.content
											}\`\`\``,
											fields: [
												{
													name: 'User Id:',
													value: author.id,
												},
												{
													name: 'User:',
													value: `https://discord.com/users/${author.id}`,
													inline: true,
												},
											],
										},
									],
								});

								await message.reply('Staff will be with you soon!');
								const newButtons = ['🔒|Close', '🎟️|Invite'].map((choice) => {
									const [emoji, name] = choice.split('|');
									return new ButtonBuilder({
										custom_id: 'mail-' + name.toLowerCase(),
										emoji,
										label: name,
										style: ButtonStyle.Primary,
									});
								});
								const existingRow = int.message.components[0];
								const newRow: ActionRowBuilder =
									ActionRowBuilder.from(existingRow).setComponents(newButtons);
								await int.message.edit({
									components: [newRow as ActionRowBuilder<ButtonBuilder>],
								});
							} else {
								await message.reply(
									'You already have a ModMail open. Please close it before opening a new one.'
								);
							}
							break;
						case 'mail-cancel':
							break;
					}
				});
				collector.on('end', async (i, reason) => {
					await msg.unpin();
					await msg.edit({
						content:
							'I have cancelled the creation of this mail due to no response.',
						embeds: [],
						components: [],
					});
					await utils.delay(10);
					await msg.delete();
				});
			}
		} else {
			const mails = await modmail.find();

			// if (found && found.timestamp! < Date.now()) {
			// }
		}
	},
});
