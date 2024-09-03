import { commandModule, CommandType } from '@sern/handler';
import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

export default commandModule({
  type: CommandType.StringSelect,
  async execute(ctx, { deps, params }) {
    if (ctx.user.id !== params)
      return await ctx.reply({
        content: 'Go away ignoramus, this is not for you!',
        ephemeral: true
      });
    const db = deps.prisma;
    const selected = ctx.values;

    await db.tempo.upsert({
      where: {
        userId: params
      },
      create: {
        userId: params,
        roles: selected
      },
      update: {
        roles: selected
      }
    });
    await ctx.showModal(
      new ModalBuilder({
        custom_id: `role_modal/${params}`,
        title: 'Describe the use-case of this menu.',
        components: [
          new ActionRowBuilder<TextInputBuilder>({
            components: [
              new TextInputBuilder({
                custom_id: 'menu_id',
                label: 'Unique ID',
                placeholder: 'Please provide a unique ID for the menu.',
                required: true,
                style: TextInputStyle.Short,
                max_length: 20
              })
            ]
          }),
          new ActionRowBuilder<TextInputBuilder>({
            components: [
              new TextInputBuilder({
                custom_id: 'menu_title',
                label: 'Title',
                placeholder: 'Please provide a short title for the menu.',
                required: true,
                style: TextInputStyle.Short,
                max_length: 50
              })
            ]
          }),
          new ActionRowBuilder<TextInputBuilder>({
            components: [
              new TextInputBuilder({
                custom_id: 'menu_placeholder',
                label: 'Placeholder',
                placeholder: 'Please provide a placeholder for the menu.',
                required: true,
                style: TextInputStyle.Short,
                max_length: 50
              })
            ]
          }),
          new ActionRowBuilder<TextInputBuilder>({
            components: [
              new TextInputBuilder({
                custom_id: 'menu_description',
                label: 'Description',
                placeholder: 'Please provide a detailed description for the menu.',
                required: true,
                style: TextInputStyle.Paragraph
              })
            ]
          })
        ]
      })
    );
  }
});
