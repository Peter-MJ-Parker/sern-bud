import { EventType, Service, eventModule } from '@sern/handler';
import { ChannelType, Events, Message } from 'discord.js';
import Money from '#schemas/money';
import { env } from '#utils';

export default eventModule({
	type: EventType.Discord,
	name: Events.MessageCreate,
	execute: async (message: Message) => {
		let msg = message.content.toLowerCase();
		const prefixRegex = new RegExp(`^(<@!?${message.client.user.id}>)\\s*`);
		if (prefixRegex.test(message.content)) {
			await message.delete();
			const stamp = `${message.client.readyTimestamp! / 1000}`;
			const msg = await message.channel.send(
				`${message.member}, I have been online since <t:${parseInt(stamp)}:R>`
			);
			setTimeout(async () => {
				await msg.delete();
			}, 10000);
		}
		if (
			message.author.bot ||
			message.system ||
			message.channel.type === ChannelType.DM ||
			!message.guild ||
			!message.inGuild()
		)
			return null;

		const profileData = await Money.findOne({
			userID: message.author.id,
			serverID: message.guild.id,
		});
		if (!profileData) {
			await new Money({
				userID: message.author.id,
				nickname: message.member?.nickname ? message.member?.nickname : null,
				serverID: message.guild.id,
				guildName: message.guild.name,
				username: message.author.username,
				wallet: 100,
				bank: 0,
			}).save();
		}
		try {
			if (!msg.startsWith(env.defaultPrefix)) {
				const coinsToAdd = Math.floor(Math.random() * 50) + 1;
				await Money.findOneAndUpdate(
					{
						userID: message.author.id,
						serverID: message.guild.id,
					},
					{
						$inc: {
							wallet: coinsToAdd,
						},
					},
					{
						upsert: true,
					}
				);
			}
		} catch (error) {
			console.log(error);
		}
	},
});
