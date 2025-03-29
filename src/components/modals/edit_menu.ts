import { commandModule, CommandType } from '@sern/handler';
import { TextChannel, EmbedBuilder } from 'discord.js';

export default commandModule({
  type: CommandType.Modal,
  async execute(ctx, { deps, params }) {
    const [uniqueId, action] = params!.split('^');
    const db = deps.prisma.selectRoles;
    const guildMenus = await db.findFirst({
      where: {
        guildId: ctx.guildId!
      }
    });

    const _menu = guildMenus!.menus.find(f => f.uniqueId === uniqueId)!;
    const channel = (await ctx.guild!.channels.fetch(_menu.channelId)) as TextChannel;
    const msg = await channel.messages.fetch(_menu.messageId)!;
    const embed = msg.embeds[0]!;
    const field = ctx.fields.getTextInputValue(action);

    const actions = {
      id: async () => {
        if (field === uniqueId) {
          return 'Same ID, try agan.';
        } else {
          await db.update({
            where: { id: ctx.guildId! },
            data: {
              menus: {
                updateMany: {
                  where: { messageId: _menu.messageId },
                  data: { uniqueId: field }
                }
              }
            }
          });

          const newEmbed = EmbedBuilder.from(embed).setFooter({ text: `ID: ${field}` });
          await msg.edit({ embeds: [newEmbed] });

          return `Unique ID updated successfully from ${_menu.uniqueId} to ${field}`;
        }
      },
      title: async () => {
        if (field === embed.title || field === _menu.title) {
          return 'Same title, try again.';
        } else {
          await db.update({
            where: { id: ctx.guildId! },
            data: {
              menus: {
                updateMany: {
                  where: { messageId: _menu.messageId },
                  data: { title: field }
                }
              }
            }
          });

          const newEmbed = EmbedBuilder.from(embed).setTitle(field);
          await msg.edit({ embeds: [newEmbed] });

          return `Title updated successfully from ${_menu.title} to ${field}.`;
        }
      },
      description: async () => {
        if (field === embed.description) {
          return 'Same description, try again.';
        } else {
          const newEmbed = EmbedBuilder.from(embed).setDescription(field);
          await msg.edit({ embeds: [newEmbed] });

          return `Description updated successfully from ${embed.description} to ${field}.`;
        }
      }
    };

    const [, act1] = action.split('-')!;

    try {
      const result = await actions[act1 as keyof typeof actions]();
      await ctx.reply({ content: result, flags: 64, });
    } catch (error) {
      console.error('Error updating menu:', error);
      await ctx.reply({
        content: 'An error occurred while updating the menu.' + (error as Error).message,
        flags: 64,
      });
    }
  }
});
