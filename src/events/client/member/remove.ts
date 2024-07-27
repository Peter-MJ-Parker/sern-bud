import { EventType, eventModule } from '@sern/handler';
import {
	EmbedBuilder,
	Events,
	Guild,
	GuildMember,
	TextChannel,
} from 'discord.js';
import GuildSchema from '#schemas/guild';
import moneySchema from '#schemas/money';

export default eventModule({
	type: EventType.Discord,
	name: Events.GuildMemberRemove,
	execute: async (member: GuildMember) => {
		if (member.guild.id !== '678398938046267402') return;
		const Guild = await GuildSchema.findOne({
			gID: member.guild.id,
		});
		const guild = (await member.client.guilds.fetch(member.guild.id)) as Guild;
		const counts = {
			users: guild.members.cache.filter((m) => !m.user.bot).size,
			bots: guild.members.cache.filter((m) => m.user.bot).size,
			total: guild.memberCount,
		};
		if (member.user.bot) {
			await Guild?.updateOne({
				$set: {
					botCount: counts.bots,
					allCount: counts.total,
				},
			});
		} else {
			await Guild?.updateOne({
				$set: {
					userCount: counts.users,
					allCount: counts.total,
				},
			});
		}
		const msg = (
			(await member.guild.channels.fetch(Guild?.leaveC!)) as TextChannel
		).send({
			embeds: [
				new EmbedBuilder()
					.setDescription(
						`[${member.user.username}](https://discord.com/users/${
							member.user.id
						}) left the server.\n
        ${
					member.guild.name
				} now has a total of **${Guild?.userCount!}** members!`
					)
					.setTimestamp()
					.setColor('Red')
					.setFooter({
						text: `${member.client.user.username}`,
						iconURL: `${member.client.user.avatarURL({ size: 1024 })}`,
					}),
			],
		});
		(await msg).react('👋');
	},
});
