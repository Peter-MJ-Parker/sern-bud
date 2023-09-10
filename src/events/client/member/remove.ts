import { EventType, Service, eventModule } from '@sern/handler';
import {
	Colors,
	EmbedBuilder,
	Events,
	GuildMember,
	TextChannel,
} from 'discord.js';
import GuildSchema from '#schemas/guild';
import moneySchema from '#schemas/money';

export default eventModule({
	type: EventType.Discord,
	name: Events.GuildMemberRemove,
	execute: async (member: GuildMember) => {
		const { utils } = Service('@sern/client');
		const Guild = await GuildSchema.findOne({
			gID: member.guild.id,
		});
		if (!Guild) return;
		const guild = await member.client.guilds.fetch(member.guild.id);
		await utils
			.channelUpdater(guild)
			.then(async () => {
				const msg = await (
					(await member.guild.channels.fetch(Guild.leaveC!)) as TextChannel
				).send({
					embeds: [
						new EmbedBuilder({
							description: `[${
								member.user.username
							}](https://discord.com/users/${member.user.id}) left the server.\n
        ${
					member.guild.name
				} now has a total of **${Guild.userCount!}** members!`,
							color: Colors.Red,
							timestamp: Date.now(),
							footer: {
								text: `${member.client.user.username}`,
								iconURL: `${member.client.user.avatarURL({ size: 1024 })}`,
							},
						}),
					],
				});
				msg.react('👋');
			})
			.finally(async () => {
				await moneySchema.findOneAndDelete({
					userID: member.id,
				});
			});
	},
});
