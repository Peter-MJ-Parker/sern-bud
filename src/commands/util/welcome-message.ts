import { commandModule, CommandType } from '@sern/handler';
import { publishConfig } from '#plugins';
import { ApplicationCommandOptionType, TextInputBuilder, TextInputStyle } from 'discord.js';

export default commandModule({
  type: CommandType.Slash,
  description: 'Setup your custom message(s) for welcoming new members.',
  plugins: [
    publishConfig({
      integrationTypes: ['Guild'],
      contexts: [0]
    })
  ],
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: 'randomized-messages',
      description: 'Would you like to use one message or random messages?',
      choices: ['One', 'Random'].map(c => ({ name: c, value: c.toLowerCase() })),
      required: true
    }
  ],
  async execute(ctx, tbd) {
    const utils = tbd.deps['@sern/client'].utils,
      m = utils.createModal;
    const _random = ctx.options.getString('randomized-messages', true);
    const placeholder = 'Welcome to Joint Streaming, {member}! \n({member} will be mentioning the new user)';
    const inputs: TextInputBuilder[] =
      _random === 'one'
        ? [
            new TextInputBuilder({
              custom_id: 'custom_message',
              label: 'Your custom message.',
              placeholder,
              style: TextInputStyle.Paragraph,
              max_length: 100,
              required: true
            })
          ]
        : [
            new TextInputBuilder({
              custom_id: 'custom_message_one',
              label: 'Your first custom message.',
              placeholder,
              style: TextInputStyle.Paragraph,
              max_length: 100,
              required: true
            }),
            new TextInputBuilder({
              custom_id: 'custom_message_two',
              label: 'Your second custom message.',
              placeholder: placeholder.split('\n(')[0],
              style: TextInputStyle.Short,
              max_length: 100,
              required: true
            }),
            new TextInputBuilder({
              custom_id: 'custom_message_three',
              label: 'Your third custom message.',
              placeholder: placeholder.split('\n(')[0],
              style: TextInputStyle.Short,
              max_length: 100,
              required: false
            }),
            new TextInputBuilder({
              custom_id: 'custom_message_four',
              label: 'Your fourth custom message.',
              placeholder: placeholder.split('\n(')[0],
              style: TextInputStyle.Short,
              max_length: 100,
              required: false
            }),
            new TextInputBuilder({
              custom_id: 'custom_message_five',
              label: 'Your fifth custom message.',
              placeholder: placeholder.split('\n(')[0],
              style: TextInputStyle.Short,
              max_length: 100,
              required: false
            })
          ];
    const modal = m(
      `welcome-messages/${_random}`,
      _random === 'one' ? 'Message to greet new users.' : 'Messages to randomly greet new users.',
      inputs
    );

    await ctx.interaction.showModal(modal);
  }
});
