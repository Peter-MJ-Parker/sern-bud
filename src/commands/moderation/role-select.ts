import { publishConfig } from '#plugins';
import { commandModule, CommandType } from '@sern/handler';
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ComponentBuilder,
  PermissionFlagsBits,
  RoleSelectMenuBuilder
} from 'discord.js';

export default commandModule({
  type: CommandType.Slash,
  description: 'Create optional roles in the server.',
  plugins: [
    publishConfig({
      defaultMemberPermissions: PermissionFlagsBits.Administrator,
      guildIds: ['678398938046267402']
    })
  ],
  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'create',
      description: 'Create a selectable menu for different roles.'
    }
    // {
    //   type: ApplicationCommandOptionType.Subcommand,
    //   name: 'manage',
    //   description: 'Manage the embed that was initially sent.',
    //   options: [
    //     {
    //       type: ApplicationCommandOptionType.String,
    //       name: 'menu',
    //       description: 'Which menu are we editing?',
    //       autocomplete: true,
    //       required: true,
    //       command: {
    //         async execute(ctx, tbd) {
    //           const focusedOption = ctx.options.getFocused().toLowerCase();
    //           const db = tbd.deps.prisma.selectRoles;
    //           let _guild = await db.findUnique({
    //             where: {
    //               guildId: ctx.guildId!
    //             }
    //           });
    //           let res: { name: string; value: string }[] = [];
    //           if (!_guild) return res.push({ name: 'No embeds available!', value: 'unavailable' });

    //           for (const menu of _guild.menus) {
    //             if (!menu) res.push({ name: 'No embeds available!', value: 'unavailable' });
    //             let { title, uniqueId } = menu;
    //             res.push({ name: title, value: uniqueId });
    //           }
    //           const filter = res
    //             .filter(f => f.name.toLowerCase().startsWith(focusedOption))
    //             .map(choice => ({ name: choice.name, value: choice.value }))
    //             .slice(0, 25);
    //           await ctx.respond(filter);
    //         }
    //       }
    //     },
    //     {
    //       type: ApplicationCommandOptionType.String,
    //       name: 'item',
    //       description: 'What property of this menu would you like to edit?',
    //       choices: ['role', 'embed'].map(c => ({ name: c, value: c })),
    //       required: true
    //     },
    //     {
    //       type: ApplicationCommandOptionType.String,
    //       name: 'action',
    //       description: 'What would you like to do with this item?',
    //       required: true,
    //       autocomplete: true,
    //       command: {
    //         async execute(ctx) {
    //           const item = ctx.options.getString('item', true) as 'role' | 'embed';
    //           const focusedOption = ctx.options.getFocused().toLowerCase();
    //           let res: { name: string; value: string }[] = [];

    //           switch (item) {
    //             case 'role':
    //               ['add', 'remove', 'edit'].map(c => res.push({ name: c, value: c }));
    //             case 'embed':
    //               ['edit', 'delete'].map(c => res.push({ name: c, value: c }));
    //           }

    //           const filter = res
    //             .filter(f => f.name.toLowerCase().startsWith(focusedOption))
    //             .map(choice => ({ name: choice.name, value: choice.value }));

    //           await ctx.respond(filter);
    //         }
    //       }
    //     }
    //   ]
    // }
  ],
  async execute(ctx, tbd) {
    const sub = ctx.options.getSubcommand();

    const actions = {
      /**
       * Create a new select menu for a different set of roles and send to specified channel.
       */
      create: async (): Promise<{ components: ComponentBuilder[] } | { content: string; ephemeral: boolean }> => {
        const excludedRoles = [
          '742730447368355930',
          '678399702974070804',
          '739849649770463323',
          '679872454369607742',
          '721246940477653053',
          '771042399241240636',
          '678400106982277130',
          '756539847975501947',
          'everyone'
        ];

        const availableRoles = ctx.guild?.roles.cache.filter(
          role =>
            !excludedRoles.includes(role.id) &&
            !role.managed &&
            role.position < (ctx.guild?.members.me?.roles.highest.position ?? 0)
        );

        if (!availableRoles || availableRoles.size === 0) {
          return { content: 'No suitable roles found to add to the menu.', ephemeral: true };
        }

        const roleSelectMenu = new RoleSelectMenuBuilder()
          .setCustomId(`role_select_setup/${ctx.user.id}`)
          .setPlaceholder('Select the roles to include in the user menu.')
          .setMinValues(1)
          .setMaxValues(Math.min(25, availableRoles.size));

        const menuRow = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(roleSelectMenu);

        const msg = {
          components: [menuRow]
        };

        return msg;
      },
      /**
       * Manage the specified role menu embed.
       */
      manage: async (): Promise<any> => {
        const menu = ctx.options.getString('menu', true);
        if (menu === 'unavailable') return { content: 'Unable to manage any role selects!', ephemeral: true };
      }
    };

    type ActionKey = keyof typeof actions;

    const result = await actions[sub as ActionKey]();
    return ctx.interaction.deferred ? await ctx.interaction.editReply(result) : await ctx.reply(result);
  }
});
