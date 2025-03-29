import { commandModule, CommandType } from '@sern/handler';
import {
  EmbedBuilder,
  TextInputBuilder,
  TextInputStyle,
  TextChannel,
  ActionRowBuilder,
  ButtonBuilder
} from 'discord.js';

export default commandModule({
  type: CommandType.Button,
  async execute(ctx, tbd) {
    try {
      const { utils } = tbd.deps['@sern/client'],
        m = utils.createModal,
        cap = utils.capitalise;
      const { message } = ctx;
      const { channelId, messageId } = message.reference!;

      const refChannel = await ctx.client.channels.fetch(channelId);
      if (!refChannel?.isTextBased() || !refChannel?.isSendable()) {
        return await ctx.update({
          content: 'Could not communicate with the referenced channel. It might not be accessible.',
          components: []
        });
      }

      if (tbd.params !== 'yes') {
        return await ctx.update({
          content: 'Operation cancelled.',
          components: []
        });
      }

      const refMessage = (await refChannel.messages.fetch({ cache: false })).get(messageId!);
      if (!refMessage) {
        return await ctx.update({
          content: 'Cancelled this operation as there was no referenced message.',
          components: []
        });
      }

      const att = refMessage.attachments.first()?.url;
      if (!att) {
        return await ctx.update({
          content: 'Cancelled this operation as there was no attachment in specified message.',
          components: []
        });
      }

      const modal = m(`emoji-submit`, `Please provide some details for this emoji!`, [
        new TextInputBuilder({
          custom_id: 'emoji-name',
          label: 'Emoji name.',
          max_length: 10,
          min_length: 2,
          placeholder: 'newSmiley',
          required: true,
          style: TextInputStyle.Short
        }),
        new TextInputBuilder({
          custom_id: 'emoji-description',
          label: 'Emoji description.',
          placeholder: 'Describe this new emoji.',
          max_length: 100,
          required: true,
          style: TextInputStyle.Short
        }),
        new TextInputBuilder({
          custom_id: 'use-case',
          label: 'Emoji use-case',
          max_length: 2000,
          value:
            'What would you like this emoji to do (please be creative, I love challenges)?\n\ni.e: React to certain messages with this emoji - must have pre-requisite like you react with a different emoji first.',
          required: true,
          style: TextInputStyle.Paragraph
        })
      ]);

      await ctx.showModal(modal);

      const modSubmission = await ctx.awaitModalSubmit({
        time: 300000,
        filter: i => i.customId === 'emoji-submit'
      });

      await modSubmission.deferReply();

      const channelToSendTo = (await ctx.client.channels.fetch('833761882212663317')) as TextChannel;
      if (!channelToSendTo) {
        throw new Error('Target channel not found');
      }

      const marv = await ctx.client.users.fetch('371759410009341952');
      if (!marv) {
        throw new Error('Target user not found');
      }

      const [name, description, useCase] = [
        modSubmission.fields.getTextInputValue('emoji-name'),
        modSubmission.fields.getTextInputValue('emoji-description'),
        modSubmission.fields.getTextInputValue('use-case')
      ];

      const embed = new EmbedBuilder({
        title: 'New emoji submitted!',
        description: `__**Emoji Name:**__\n${name}\n\n__**Emoji Description:**__\n${description}\n\n__**Use Case:**__\n${useCase}\n\n`,
        fields: [
          {
            name: 'Submitters User Info',
            value: `> Username: ${modSubmission.user.username}\n> User ID: ${modSubmission.user.id}\n`
          }
        ],
        thumbnail: { url: att! },
        footer: {
          text: `${refMessage.channelId}/${refMessage.id}`
        }
      });

      const components = [
        new ActionRowBuilder<ButtonBuilder>({
          components: ['✅|accept', '❌|deny'].map(c => {
            const [emoji, name] = c.split('|');
            return new ButtonBuilder({
              custom_id: `emote/${name}`,
              emoji,
              label: cap(name),
              style: emoji === '✅' ? 3 : 4
            });
          })
        })
      ];

      await channelToSendTo.send({
        content: `${marv}, A new emoji has been submitted!`,
        embeds: [embed],
        components,
        allowedMentions: { users: [marv.id] }
      });

      await modSubmission.deleteReply();

      return await ctx.editReply({
        content: 'Your emoji submission has been sent successfully!',
        components: []
      });
    } catch (error: any) {
      if (error.message.includes('time')) {
        return await ctx.editReply({
          content: 'You ran out of time!.',
          components: []
        });
      }
      return await ctx.editReply({
        content: 'An error occurred while processing your request. Please try again later.'
      });
    }
  }
});
