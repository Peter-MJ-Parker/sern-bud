import { buttonConfirmation, ownerOnly, publishConfig } from '#plugins';
import { commandModule, CommandType } from '@sern/handler';
import { ApplicationCommandOptionType, PermissionsBitField } from 'discord.js';

export default commandModule({
  type: CommandType.Slash,
  description: 'Manage scheduled tasks by uuid.',
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
      description: 'Which scheduled task would you like to manage?',
      required: true,
      autocomplete: true,
      command: {
        async execute(ctx, { deps }) {
          const { tasks } = deps['@sern/scheduler'];
          const focusedOption = ctx.options.getFocused().toLowerCase();
          const filter = tasks
            .filter(f => f.toLowerCase().startsWith(focusedOption))
            .map(t => ({ name: t.split('/')[0], value: t }));
          await ctx.respond(filter);
        }
      }
    },
    {
      type: ApplicationCommandOptionType.String,
      name: 'action',
      description: 'What would you like to do with this task?',
      required: true,
      choices: ['kill', 'dispose'].map(m => ({ name: m, value: m }))
    }
  ],
  async execute(ctx, { deps }) {
    const uuid = ctx.options.getString('uuid', true);
    const action = ctx.options.getString('action', true) as 'kill' | 'dispose';
    const t = deps['@sern/scheduler'][action](uuid);
    return await ctx.interaction.editReply({
      content: `Task: \`${uuid.split('/')[0]}\` has been ${action === 'dispose' ? 'deleted' : 'stopped'}.`
    });
  }
});
