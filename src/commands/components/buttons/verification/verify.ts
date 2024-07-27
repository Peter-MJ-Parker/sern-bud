import { commandModule, CommandType, Service } from '@sern/handler';
import guildSchema from '#schemas/guild';
import memberSchema from '#schemas/member';
import { EmbedBuilder, TextChannel } from 'discord.js';

export default commandModule({
	type: CommandType.Button,
	name: 'member-bypass-verify',
	plugins: [],
	execute: async (button) => {
		await button.deferUpdate();
		const { utils } = Service('@sern/client');
		const guild = await guildSchema.findOne({ gID: button.guild?.id! });
		const role = (await button.guild?.roles.fetch(guild?.verifiedRole!))!;
		const memberId = button.message.embeds[0].footer?.text!;
		const member = (await button.guild?.members.fetch())?.get(memberId)!;

		if (!member.roles.cache.has(role.id)) await member.roles.add(role);
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
					value: `Manually passed by ${button.member}`,
				},
			],
			footer: { text: '' },
		});
		await button.message.edit({ embeds: [newEmbed], components: [] });
		const welcome = (await button.guild?.channels.fetch(
			guild?.welcomeC!
		)) as TextChannel;
		await memberSchema.findOneAndDelete({ memberId: member.id });
		const counts = {
			users: member.guild?.members.cache.filter((m) => !m.user.bot).size!,
			bots: member.guild?.members.cache.filter((m) => m.user.bot).size!,
			total: member.guild?.memberCount!,
		};
		await utils
			.welcomeCreate(member, member.guild.name, counts.users, welcome)
			.then(async () => {
				await guildSchema.findOneAndUpdate(
					{
						gID: member.guild.id,
					},
					{
						$set: {
							allCount: counts.total,
							userCount: counts.users,
						},
					}
				);
				await utils.channelUpdater(member.guild);
			});
	},
});
