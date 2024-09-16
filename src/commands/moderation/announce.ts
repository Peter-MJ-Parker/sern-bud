import { requirePermission } from '#plugins';
import { commandModule, CommandType } from '@sern/handler';
import { Colors, EmbedBuilder, PermissionFlagsBits, TextChannel } from 'discord.js';

export default commandModule({
  type: CommandType.Text,
  plugins: [requirePermission('user', [PermissionFlagsBits.Administrator])],
  async execute(ctx, tbd) {
    if (!ctx.inGuild) return;
    const channel = ctx.options[0];
    const message = ctx.options.slice(1).join(' ');
    if (!channel.startsWith('<#') || !channel.endsWith('>')) {
      return await ctx.reply('Invalid channel. `?announce <channelTag> <announcement>`');
    }
    const channelId = channel.match(/\d+/)![0];
    const channelToSendTo = (await ctx.guild!.channels.fetch()).get(channelId) as TextChannel;
    if (!channelToSendTo || !channelToSendTo.isTextBased()) {
      return await ctx.reply('Invalid channel. `?announce <channelTag> <announcement>`');
    }
    const embed = new EmbedBuilder({
      author: { name: `Sent by: ${ctx.user.displayName}`, icon_url: ctx.user.displayAvatarURL() },
      title: 'Announcement',
      description: message,
      footer: {
        text: tbd.deps['@sern/client'].user!.username,
        icon_url: tbd.deps['@sern/client'].user?.displayAvatarURL()
      },
      timestamp: Date.now(),
      color: Colors.Aqua
    });
    await channelToSendTo.sendTyping();
    await channelToSendTo
      .send({
        embeds: [embed]
      })
      .then(async m => await m.react('<:flame_party:1285284996264886352>'));
  }
});
