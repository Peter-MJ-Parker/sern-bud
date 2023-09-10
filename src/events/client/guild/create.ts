import { EventType, eventModule, Service } from '@sern/handler';
import {
	AuditLogEvent,
	ChannelType,
	Events,
	Guild,
	PermissionFlagsBits,
	TextChannel,
} from 'discord.js';
import guildSchema from '#schemas/guild';

export default eventModule({
	type: EventType.Discord,
	name: Events.GuildCreate,
	async execute(guild: Guild) {
		const { user, utils } = Service('@sern/client');
		const { entries } = await guild.fetchAuditLogs({
			limit: 1,
			type: AuditLogEvent.BotAdd,
		});
		const { executorId, targetId } = entries.first()!;
		const mem = guild.members.cache.get(executorId!)!;
		if (targetId === user?.id) {
			const pubChannel = guild.channels.cache.find((channel) => {
				if (
					channel.type === ChannelType.GuildText &&
					!channel
						.permissionsFor(guild.roles.everyone)
						.has(PermissionFlagsBits.ViewChannel) &&
					channel.permissionsFor(mem, true).has(PermissionFlagsBits.ViewChannel)
				) {
					return true;
				}
				return false;
			}) as TextChannel;
			if (pubChannel) {
				await pubChannel.sendTyping();
				await utils.delay(5);
				await pubChannel.send({});
			}
		}
		let Guild = await guildSchema.findOne({
			gID: guild.id,
		});

		if (!Guild) {
			await new guildSchema({
				gID: guild.id,
				gName: guild.name,
				// prefix: '?', //To change the default prefix of '?', uncomment this line and insert your desired prefix.
			}).save();
		}
	},
});
