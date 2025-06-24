import { publishConfig } from '#plugins';
import { capitalise } from '#utils';
import { commandModule, CommandType } from '@sern/handler';
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  Collection,
  InteractionReplyOptions,
  ModalBuilder,
  PermissionFlagsBits,
  Role,
  StringSelectMenuBuilder,
  TextChannel,
  TextInputBuilder,
  TextInputStyle
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
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'manage',
      description: 'Manage the menu that was initially sent.',
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: 'menu',
          description: 'Which menu are we editing?',
          autocomplete: true,
          required: true,
          command: {
            async execute(ctx, tbd) {
              const focusedOption = ctx.options.getFocused().toLowerCase();
              const db = tbd.deps.prisma.selectRoles;
              let _guild = await db.findUnique({
                where: {
                  guildId: ctx.guildId!
                }
              });
              let res: { name: string; value: string }[] = [];
              if (!_guild) {
                res = [{ name: 'No menus available!', value: 'unavailable' }];
                return await ctx.respond(res);
              }
              for (const menu of _guild.menus) {
                if (!menu) res.push({ name: 'No menus available!', value: 'unavailable' });
                let { uniqueId } = menu;
                res.push({ name: uniqueId, value: uniqueId });
              }
              const filter = res
                .filter(f => f.name.toLowerCase().startsWith(focusedOption))
                .map(choice => ({ name: choice.name, value: choice.value }))
                .slice(0, 25);
              await ctx.respond(filter);
            }
          }
        },
        {
          type: ApplicationCommandOptionType.String,
          name: 'item',
          description: 'What property of this menu would you like to edit?',
          choices: ['menu', 'message'].map(c => ({ name: c, value: c })),
          required: true
        },
        {
          type: ApplicationCommandOptionType.String,
          name: 'action',
          description: 'Please tell me what you would like to do.',
          required: true,
          autocomplete: true,
          command: {
            async execute(ctx) {
              const focusedOption = ctx.options.getFocused().toLowerCase();
              const item = ctx.options.getString('item', true) as 'menu' | 'message';
              let res: { name: string; value: string }[] = [];
              switch (item) {
                case 'menu':
                  res.push(
                    { name: 'Add Role', value: 'add-role' },
                    { name: 'Edit Role', value: 'edit-role' },
                    { name: 'Remove Role', value: 'remove-role' }
                  );
                  break;
                case 'message':
                  res.push(
                    { name: 'Edit Unique ID', value: 'edit-id' },
                    { name: 'Edit Title', value: 'edit-title' },
                    { name: 'Edit Description', value: 'edit-description' },
                    { name: 'Delete Whole Menu', value: 'menu-delete' }
                  );
                  break;
                default:
                  res.push({ name: 'Ran into an error!', value: 'invalid' });
                  break;
              }
              const filter = res.filter(f => f.name.toLowerCase().startsWith(focusedOption));
              await ctx.respond(filter);
            }
          }
        }
      ]
    }
  ],
  async execute(ctx, tbd) {
    const sub = ctx.options.getSubcommand();
    const client = tbd.deps['@sern/client'];
    const actions = {
      /**
       * Create a new select menu for a different set of roles and send to specified channel.
       */
      create: async () => {
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
          return { content: 'No suitable roles found to add to the menu.', flags: 64 };
        }

        const roleSelectMenu = new StringSelectMenuBuilder({
          custom_id: `role_select_setup/${ctx.user.id}`,
          placeholder: 'Select the roles to include in the user menu.',
          min_values: 1,
          max_values: Math.min(25, availableRoles.size),
          options: availableRoles.map(r => {
            return {
              label: r.name,
              value: r.id,
              emoji: getRoleVisualIndicator(r)
            };
          })
        });

        const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(roleSelectMenu);

        const msg = {
          components: [menuRow]
        };

        return msg;
      },
      /**
       * Manage the specified role menu embed.
       */
      manage: async () => {
        let reply: InteractionReplyOptions = {};
        const menu = ctx.options.getString('menu', true);
        if (menu === 'unavailable') return (reply = { content: 'Unable to manage any role selects!', flags: 64 });
        const db = tbd.deps.prisma.selectRoles;
        const guildMenus = await db.findFirst({
          where: {
            guildId: ctx.guildId!
          }
        });
        const action = ctx.options.getString('action', true) as Action;
        const _menu = guildMenus!.menus.find(f => f.uniqueId === menu);
        if (!_menu) return (reply = { content: 'Menu not found.', flags: 64 });
        const channel = (await ctx.guild!.channels.fetch(_menu.channelId)) as TextChannel;
        const msg = (await channel.messages.fetch({ cache: false })).get(_menu.messageId);
        if (!msg) return (reply = { content: 'Message not found.', flags: 64 });

        if (action === 'invalid') {
          return (reply = { content: 'An unknown error has occured!', flags: 64 });
        } else {
          const [act1, act2] = action.split('-');
          if (act2 == 'role') {
            const getMenu = (action: 'add' | 'edit' | 'remove', availableRoles: Collection<string, Role>) => {
              const c =
                action === 'add'
                  ? 'role(s) to add to'
                  : action === 'edit'
                  ? 'role to edit in'
                  : 'role(s) to remove from';
              const roleSelectMenu = new StringSelectMenuBuilder({
                custom_id: `menu_roles/${menu}^${action}`,
                placeholder: `Select the ${c} the user menu.`,
                min_values: 1,
                max_values: action === 'edit' ? 1 : Math.min(25, availableRoles.size),
                options: availableRoles.map(r => {
                  return {
                    label: r.name,
                    value: r.id,
                    emoji: getRoleVisualIndicator(r)
                  };
                })
              });
              return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(roleSelectMenu);
            };
            let availableRoles: Collection<string, Role>;
            if (action === 'add-role') {
              availableRoles = ctx.guild!.roles.cache.filter(
                role =>
                  !role.managed &&
                  role.position < (ctx.guild?.members.me?.roles.highest.position ?? 0) &&
                  !_menu.roles.some(menuRole => menuRole.id === role.id)
              );
            } else {
              availableRoles = ctx.guild!.roles.cache.filter(role =>
                _menu.roles.some(menuRole => menuRole.id === role.id)
              );
            }
            try {
              const menuRow = getMenu(act1 as 'add' | 'edit' | 'remove', availableRoles);
              return (reply = {
                components: [menuRow],
                flags: 64
              });
            } catch (error) {
              return (reply = { content: (error as Error).message, flags: 64 });
            }
          } else if (action === 'menu-delete') {
            return (reply = {
              content: `Menu: ${_menu.uniqueId} will be completely removed! Are you sure you want to do this?`,
              components: [
                new ActionRowBuilder<ButtonBuilder>({
                  components: ['yes', 'no'].map(
                    c =>
                      new ButtonBuilder({
                        custom_id: `menu_delete/${c}^${_menu.messageId}`,
                        label: capitalise(c),
                        style: c === 'no' ? ButtonStyle.Success : ButtonStyle.Danger
                      })
                  )
                })
              ],
              flags: 64
            });
          } else {
            let currentValue: string = '';
            let fieldToEdit: string = '';
            let max: number = 1;
            switch (action) {
              case 'edit-id':
                currentValue = _menu.uniqueId;
                fieldToEdit = 'uniqueId';
                max = 10;
                break;
              case 'edit-title':
                currentValue = _menu.title;
                fieldToEdit = 'title';
                max = 50;
                break;
              case 'edit-description':
                const embed = msg.embeds[0];
                currentValue = embed.data.description ?? '';
                fieldToEdit = 'description';
                max = 4000;
                break;
            }

            const modal = new ModalBuilder()
              .setCustomId(`edit_menu/${_menu.uniqueId}^${action}`)
              .setTitle(`Edit Menu ${fieldToEdit.charAt(0).toUpperCase() + fieldToEdit.slice(1)}`);

            const input = new TextInputBuilder()
              .setCustomId(action)
              .setLabel(`Enter new ${fieldToEdit}.`)
              .setStyle(act2 === 'description' ? TextInputStyle.Paragraph : TextInputStyle.Short)
              .setMaxLength(max)
              .setRequired(true);

            const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(input);
            modal.addComponents(actionRow);

            await ctx.interaction.showModal(modal);
            return;
          }
        }
      }
    };

    type ActionKey = keyof typeof actions;

    const result = await actions[sub as ActionKey]();
    if (result) {
      await ctx.reply(result);
    }
  }
});

type Action =
  | 'add-role'
  | 'edit-role'
  | 'remove-role'
  | 'edit-id'
  | 'edit-title'
  | 'edit-description'
  | 'menu-delete'
  | 'invalid';

function getRoleVisualIndicator(role: Role): string {
  const colorHex = role.color.toString(16).padStart(6, '0');

  switch (colorHex) {
    case '000000':
      return '⚫';
    case 'ffffff':
      return '⚪';
    case 'ff0000':
      return '🔴';
    case '00ff00':
      return '🟢';
    case '0000ff':
      return '🔵';
    case 'ffff00':
      return '🟡';
    case 'ffa500':
      return '🟠';
    case '800080':
      return '🟣';
    case 'ffc0cb':
      return '🩷';
    case '964b00':
      return '🟤';
    default:
      return '🔘';
  }
}
