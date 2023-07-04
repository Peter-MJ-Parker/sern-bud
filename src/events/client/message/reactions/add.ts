import { welcomeCreate } from '#utils';
import { EventType, eventModule } from '@sern/handler';
import {
	BaseGuildVoiceChannel,
	EmbedBuilder,
	Events,
	MessageReaction,
	PartialMessageReaction,
	TextChannel,
	User,
} from 'discord.js';
import guildSchema from '#schemas/guild';
import memberSchema from '#schemas/member';

export default eventModule({
	type: EventType.Discord,
	name: Events.MessageReactionAdd,
	execute: async (
		reaction: MessageReaction | PartialMessageReaction,
		user: User
	) => {
		if (reaction.message.guild?.id !== '678398938046267402') return;

		let message = reaction.message!;
		const counts = {
			users: message.guild?.members.cache.filter((m) => !m.user.bot).size!,
			bots: message.guild?.members.cache.filter((m) => m.user.bot).size!,
			total: message.guild?.memberCount!,
		};
		if (message.partial) await message.fetch();
		if (reaction.partial) await reaction.fetch();

		if (user.bot) return;
		if (!reaction.message.guild) return;

		if (message.id === '744940669834887218' && reaction.emoji.toString()) {
			let mmm = reaction.message.guild.members.cache.get(user.id)!;
			const Guild = await guildSchema.findOne({
				gID: mmm.guild.id,
			});
			let lilbud = message.guild?.roles.cache.get(Guild?.verifiedRole!)!;
			if (!mmm.roles.cache.has(lilbud.id)) {
				await message.guild?.members?.cache
					.get(user.id)
					?.roles.add(lilbud)
					.catch((err) => console.log(err));
				console.log(
					user.username +
						' reacted with ' +
						reaction.emoji.name +
						" and gained role: lil' buds."
				);
				await message.channel
					.send(
						`${mmm}, You may now go to <#${Guild?.introC!}> and introduce yourself!`
					)
					.then(async (m) => {
						setTimeout(() => {
							m.delete().catch((err) => {
								console.log(
									"Regular Error. Couldn't Delete the message.\n" + err
								);
							});
						}, 5 * 1000);
					});
				await welcomeCreate(
					mmm,
					mmm.guild.name,
					counts.users,
					mmm.guild.systemChannel!
				)
					.then(async () => {
						await Guild?.updateOne({
							$set: {
								allCount: counts.total,
								userCount: counts.users,
							},
						});
					})
					.finally(async () => {
						const Verification = await memberSchema.findOne({
							memberId: mmm.id,
						});
						const channel = (await message.guild?.channels.fetch(
							Guild?.modC!
						)) as TextChannel;
						const msg = await channel.messages.fetch(Verification?.messageId!);
						await msg
							.edit({
								components: [],
								embeds: [
									EmbedBuilder.from(msg.embeds[0])
										.setFields([
											{
												name: 'Verification: ',
												value: `✅ - ${mmm} successfully verified!`,
											},
										])
										.setFooter(null),
								],
							})
							.then(async () => {
								await Verification?.deleteOne();
							})
							.finally(async () => {
								const chan1 = message.guild?.channels.cache.get(
									'825555222281060363'
								) as BaseGuildVoiceChannel;
								const chan2 = message.guild?.channels.cache.get(
									'825555223321640970'
								) as BaseGuildVoiceChannel;
								const chan3 = message.guild?.channels.cache.get(
									'825555224147263549'
								) as BaseGuildVoiceChannel;
								await chan1.setName(
									`Total Members: ${counts.total.toLocaleString()}`
								);
								await chan2.setName(`Users: ${counts.users.toLocaleString()}`);
								await chan3.setName(`Bots: ${counts.bots.toLocaleString()}`);
							});
					});
			} else {
				console.log(user.username + ' reacted with ' + reaction.emoji.name);
			}
		}
	},
});
