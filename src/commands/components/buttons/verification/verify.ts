import { commandModule, CommandType, Service } from '@sern/handler';
import guildSchema from '#schemas/guild';
import memberSchema from '#schemas/member';
import { BaseGuildVoiceChannel, EmbedBuilder, TextChannel } from 'discord.js';
import { buttonConfirmation } from '#plugins';

export default commandModule({
	type: CommandType.Button,
	name: 'member-bypass-verify',
	plugins: [buttonConfirmation()],
	execute: async (button) => {
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
		await Service('@sern/utils')
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
				const chan1 = button.guild?.channels.cache.get(
					'825555222281060363'
				) as BaseGuildVoiceChannel;
				const chan2 = button.guild?.channels.cache.get(
					'825555223321640970'
				) as BaseGuildVoiceChannel;
				const chan3 = button.guild?.channels.cache.get(
					'825555224147263549'
				) as BaseGuildVoiceChannel;
				await chan1.setName(`Total Members: ${counts.total.toLocaleString()}`);
				await chan2.setName(`Users: ${counts.users.toLocaleString()}`);
				await chan3.setName(`Bots: ${counts.bots.toLocaleString()}`);
			});
	},
});
