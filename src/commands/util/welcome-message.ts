import { commandModule, CommandType } from '@sern/handler';
import { publishConfig, IntegrationContextType } from '#plugins';
import { ApplicationCommandOptionType, TextInputBuilder, TextInputStyle } from 'discord.js';

export default commandModule({
  type: CommandType.Slash,
  description: 'Setup your custom message(s) for welcoming new members.',
  plugins: [
    publishConfig({
      integrationTypes: ['Guild'],
      contexts: [IntegrationContextType.GUILD]
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
    const db = tbd.deps.prisma.customWelcomeMessages;
    let _current = await db.findUnique({
      where: {
        memberId: ctx.user.id
      }
    });

    const utils = tbd.deps['@sern/client'].utils,
      m = utils.createModal;
    const _random = ctx.options.getString('randomized-messages', true);
    const placeholder = (bool = true) =>
      `Welcome to Joint Streaming, {member}! ${
        bool === false ? '\n({member} will be mentioning the new user)' : ' (optional)'
      }`;
    const inputs: TextInputBuilder[] =
      _random === 'one'
        ? [
            new TextInputBuilder({
              custom_id: 'custom_message',
              label: 'Your custom message.',
              placeholder: placeholder(false),
              style: TextInputStyle.Paragraph,
              max_length: 100,
              value: _current?.singleMessage || '',
              required: true
            })
          ]
        : [
            new TextInputBuilder({
              custom_id: 'custom_message_one',
              label: 'Your first custom message.',
              placeholder: placeholder(false),
              style: TextInputStyle.Paragraph,
              max_length: 100,
              value: _current?.messagesArray[0] ?? '',
              required: true
            }),
            new TextInputBuilder({
              custom_id: 'custom_message_two',
              label: 'Your second custom message.',
              placeholder: placeholder(),
              style: TextInputStyle.Short,
              max_length: 100,
              value: _current?.messagesArray[1] ?? '',
              required: true
            }),
            new TextInputBuilder({
              custom_id: 'custom_message_three',
              label: 'Your third custom message.',
              placeholder: placeholder(),
              style: TextInputStyle.Short,
              max_length: 100,
              value: _current?.messagesArray[2] ?? '',
              required: false
            }),
            new TextInputBuilder({
              custom_id: 'custom_message_four',
              label: 'Your fourth custom message.',
              placeholder: placeholder(),
              style: TextInputStyle.Short,
              max_length: 100,
              value: _current?.messagesArray[3] ?? '',
              required: false
            }),
            new TextInputBuilder({
              custom_id: 'custom_message_five',
              label: 'Your fifth custom message.',
              placeholder: placeholder(),
              style: TextInputStyle.Short,
              max_length: 100,
              value: _current?.messagesArray[4] ?? '',
              required: false
            })
          ];
    const modal = m(
      `welcome-messages/${_random}`,
      _random === 'one'
        ? `Message to greet new users. ${_current?.singleMessage ? 'Any changes?' : ''}`
        : `Messages to randomly greet new users. ${_current?.messagesArray?.length! > 0 ? 'Any changes?' : ''}`,
      inputs
    );

    await ctx.interaction.showModal(modal);
  }
});
