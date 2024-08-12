import { buttonConfirmation, ownerOnly, publishConfig } from '#plugins';
import { commandModule, CommandType } from '@sern/handler';
import { ApplicationCommandOptionType, PermissionsBitField } from 'discord.js';

export default commandModule({
  type: CommandType.Slash,
  description: 'Kills a scheduled task by uuid.',
  plugins: [
    publishConfig({
      guildIds: ['678398938046267402'],
      defaultMemberPermissions: PermissionsBitField.Flags.Administrator
    }),
    ownerOnly(),
    buttonConfirmation()
  ],
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: 'uuid',
      description: 'Kills specified task.',
      required: true,
      autocomplete: true,
      command: {
        async execute(ctx, { deps }) {
          const { tasks } = deps['@sern/scheduler'];
          const focusedOption = ctx.options.getFocused().toLowerCase();
          const filter = tasks.filter(f => f.toLowerCase().startsWith(focusedOption)).map(t => ({ name: t, value: t }));
          await ctx.respond(filter);
        }
      }
    }
  ],
  async execute(ctx, { deps }) {
    const uuid = ctx.options.getString('uuid', true);
    deps['@sern/scheduler'].kill(uuid);
    return await ctx.interaction.editReply({
      content: `Task: \`${uuid}\` has been stopped.`
    });
  }
});
