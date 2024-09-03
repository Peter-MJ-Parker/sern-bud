import { commandModule, CommandType } from '@sern/handler';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, GuildMember, TextChannel } from 'discord.js';

const userSelectedRoles = new Map<string, string[]>();

export default commandModule({
  type: CommandType.StringSelect,
  async execute(interaction, tbd) {
    const prisma = tbd.deps.prisma;
    const selectedRoles = interaction.values;
    const member = interaction.member as GuildMember;
    const channel = interaction.channel as TextChannel;
    if (!member || !('roles' in member)) return;

    const userId = interaction.user.id;

    let userRoles = await prisma.userRoles.findUnique({
      where: { userId }
    });

    const previouslySelectedRoles = userRoles?.roles || [];

    let addedRoles: string[] = [];
    let removedRoles: string[] = [];
    let deselectedRoles: string[] = [];

    for (const roleId of previouslySelectedRoles) {
      if (!selectedRoles.includes(roleId) && member.roles.cache.has(roleId)) {
        deselectedRoles.push(roleId);
      }
    }

    for (const roleId of selectedRoles) {
      if (!member.roles.cache.has(roleId)) {
        await member.roles.add(roleId);
        addedRoles.push(roleId);
      }
    }

    userSelectedRoles.set(userId, selectedRoles);

    let content = 'No changes have been made to your roles.';
    if (addedRoles.length > 0) {
      content = `Added roles: ${addedRoles.map(id => `<@&${id}>`).join(', ')}\n`;
    }

    if (deselectedRoles.length > 0) {
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('remove_roles').setLabel('Remove roles').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('keep_roles').setLabel('Keep roles').setStyle(ButtonStyle.Secondary)
      );

      const plural = deselectedRoles.length === 1 ? 'this role' : 'these roles';
      const abb = deselectedRoles.length === 1 ? 'it' : 'them';

      content += `You have ${plural}: ${deselectedRoles
        .map(id => `<@&${id}>`)
        .join(', ')}. Do you want to remove ${abb}?`;

      await interaction.reply({
        content,
        components: [row],
        ephemeral: true,
        allowedMentions: {
          roles: []
        }
      });

      try {
        const buttonInteraction = await channel.awaitMessageComponent({
          filter: i =>
            i.user.id === interaction.user.id && (i.customId === 'remove_roles' || i.customId === 'keep_roles'),
          time: 60000
        });

        if (buttonInteraction.customId === 'remove_roles') {
          for (const roleId of deselectedRoles) {
            await member.roles.remove(roleId);
            removedRoles.push(roleId);
          }
          await prisma.userRoles.upsert({
            where: { userId },
            update: { roles: selectedRoles },
            create: { userId, roles: selectedRoles }
          });
          await buttonInteraction.update({
            content: `Roles updated. Removed: ${removedRoles.map(id => `<@&${id}>`).join(', ')}`,
            components: []
          });
        } else {
          const keptRoles = [...selectedRoles, ...deselectedRoles];
          await prisma.userRoles.upsert({
            where: { userId },
            update: { roles: keptRoles },
            create: { userId, roles: keptRoles }
          });
          await buttonInteraction.update({
            content: 'Deselected roles have been kept.',
            components: []
          });
        }
      } catch (error) {
        const keptRoles = [...selectedRoles, ...deselectedRoles];
        await prisma.userRoles.upsert({
          where: { userId },
          update: { roles: keptRoles },
          create: { userId, roles: keptRoles }
        });
        await interaction.followUp({
          content: 'You did not respond in time. Deselected roles have been kept.',
          ephemeral: true
        });
      }
    } else {
      await prisma.userRoles.upsert({
        where: { userId },
        update: { roles: selectedRoles },
        create: { userId, roles: selectedRoles }
      });
      await interaction.reply({
        content,
        ephemeral: true
      });
    }
  }
});
