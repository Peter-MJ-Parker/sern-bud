import { commandModule, CommandType } from '@sern/handler';
import { TextChannel } from 'discord.js';

export default commandModule({
  type: CommandType.Button,
  async execute(ctx, { deps, params }) {
    const [choice, messageId] = params!.split('^') as ['yes' | 'no', string];
    const db = deps.prisma.selectRoles;
    const guildMenus = await db.findFirst({
      where: {
        guildId: ctx.guildId!
      }
    });

    switch (choice) {
      case 'yes':
        const _menu = guildMenus!.menus.find(f => f.messageId === messageId)!;
        const channel = (await ctx.guild!.channels.fetch(_menu.channelId)) as TextChannel;
        const msg = await channel.messages.fetch(messageId)!;
        await msg.delete();
        await db.update({
          where: {
            guildId: ctx.guildId!
          },
          data: {
            menus: {
              deleteMany: {
                where: {
                  uniqueId: _menu.uniqueId
                }
              }
            }
          }
        });
        await ctx.update({
          components: [],
          content: 'I have deleted this menu!'
        });
        break;

      default:
        await ctx.update({
          components: [],
          content: 'I have cancelled this operation!'
        });
        break;
    }
  }
});
