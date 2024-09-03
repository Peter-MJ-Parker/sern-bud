import { commandModule, CommandType } from '@sern/handler';
import { ActionRowBuilder, StringSelectMenuBuilder, TextChannel } from 'discord.js';

export default commandModule({
  type: CommandType.StringSelect,
  async execute(interaction, tbd) {
    const [uniqueId, action] = tbd.params?.split('^')!;
    const db = tbd.deps.prisma.selectRoles;
    const guildMenus = await db.findFirst({
      where: {
        guildId: interaction.guildId!
      }
    });

    const _menu = guildMenus!.menus.find(f => f.uniqueId === uniqueId)!;
    const channel = (await interaction.guild!.channels.fetch(_menu.channelId)) as TextChannel;
    const msg = await channel.messages.fetch(_menu.messageId)!;

    const selectedRoles = action === 'edit' ? [interaction.values[0]] : interaction.values;
    const roles = selectedRoles.map(roleId => interaction.guild!.roles.cache.get(roleId));

    if (!roles || roles.some(role => !role)) {
      return interaction.reply({ content: 'One or more roles not found.', ephemeral: true });
    }

    let options = _menu.roles.map(role => ({
      label: role.name,
      value: role.id,
      description: `Select if you want to see channels for ${role.name}.`
    }));

    if (action === 'add') {
      const rolesToAdd = interaction.values.map(roleId => {
        const role = interaction.guild!.roles.cache.get(roleId);
        return {
          label: role!.name,
          value: role!.id,
          description: `Select if you want to see channels for ${role!.name}.`
        };
      });
      options.push(...rolesToAdd);
    } else if (action === 'edit') {
      /**
       * Decide what to edit!
       */
      const roleToEdit = interaction.values[0];
      const role = interaction.guild!.roles.cache.get(roleToEdit);
      const index = options.findIndex(option => option.value === roleToEdit);

      if (index !== -1 && role) {
        options[index] = {
          label: role.name,
          value: role.id,
          description: `Select if you want to see channels for ${role.name}.`
        };
      }
    } else if (action === 'remove') {
      const rolesToRemove = new Set(interaction.values);
      options = options.filter(option => !rolesToRemove.has(option.value));
    }

    const iRow = ActionRowBuilder.from(msg.components[0]) as ActionRowBuilder;
    const iMenu = StringSelectMenuBuilder.from(iRow.components[0] as StringSelectMenuBuilder);
    iMenu.setOptions(options);
    iMenu.setMaxValues(options.length);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(iMenu);

    await msg.edit({
      components: [row]
    });

    await db.update({
      where: {
        guildId: interaction.guildId!,
        menus: {
          some: {
            uniqueId
          }
        }
      },
      data: {
        menus: {
          updateMany: {
            where: {
              uniqueId
            },
            data: {
              roles: {
                set: options.map(r => ({ id: r.value, name: r.label }))
              }
            }
          }
        }
      }
    });
    return interaction.reply({ content: 'Select menu updated successfully!', ephemeral: true });
  }
});
