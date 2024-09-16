import { publishConfig } from '#plugins';
import { env, extractEmoji } from '#utils';
import { commandModule, CommandType } from '@sern/handler';
import { ApplicationCommandOptionType } from 'discord.js';
import su from 'superagent';

export default commandModule({
  type: CommandType.Slash,
  name: 'emoji-mixer',
  description: 'Mix two emojis.',
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: 'emoji_1',
      description: 'The first emoji to mix',
      required: true
    },
    {
      type: ApplicationCommandOptionType.String,
      name: 'emoji_2',
      description: 'The second emoji to mix',
      required: true
    }
  ],
  plugins: [
    publishConfig({
      contexts: [0, 1, 2],
      integrationTypes: ['User', 'Guild']
    })
  ],
  async execute(ctx) {
    const { options } = ctx;
    const emote1 = options.getString('emoji_1', true);
    const emote2 = options.getString('emoji_2', true);

    function validateEmoji(emoji: string): string | null {
      if (emoji.startsWith('<') || emoji.endsWith('>')) {
        return `Emoji ${emoji} is a custom server emoji and is not supported.`;
      }
      const extracted = extractEmoji(emoji);
      if (extracted.length === 0) {
        return `Emoji ${emoji} is not a valid emoji.`;
      }
      if (extracted.length > 1) {
        return `Emoji ${emoji} contains multiple emojis. Please provide only one emoji.`;
      }
      return null;
    }

    const error1 = validateEmoji(emote1);
    const error2 = validateEmoji(emote2);

    if (error1 || error2) {
      return await ctx.reply({
        content: `${error1 ? error1 + '\n' : ''}${error2 ? error2 : ''}`,
        ephemeral: true
      });
    }

    const input = extractEmoji(emote1 + emote2);

    if (input.length !== 2) {
      return await ctx.reply({
        content: `You must provide exactly TWO valid emojis.`,
        ephemeral: true
      });
    }
    async function checkEmojiValidity(emoji: string): Promise<boolean> {
      const response = await su
        .get('https://tenor.googleapis.com/v2/featured')
        .query({
          key: env.TENOR_API_KEY,
          contentfilter: 'high',
          media_filter: 'png_transparent',
          compontent: 'proactive',
          collection: 'emoji_kitchen_v5',
          q: emoji
        })
        .catch(() => null);

      return !!response && response.body.results.length > 0;
    }

    const [isValid1, isValid2] = await Promise.all([checkEmojiValidity(input[0]), checkEmojiValidity(input[1])]);

    if (!isValid1 || !isValid2) {
      return await ctx.reply({
        content: `Unable to mix these emojis. Invalid emoji: ${
          !isValid1 && !isValid2 ? `both '${emote1}' and '${emote2}'` : !isValid1 ? `'${emote1}'` : `'${emote2}'`
        }. Please try different emojis.`,
        ephemeral: true
      });
    }

    const output = await su
      .get('https://tenor.googleapis.com/v2/featured')
      .query({
        key: env.TENOR_API_KEY,
        contentfilter: 'high',
        media_filter: 'png_transparent',
        compontent: 'proactive',
        collection: 'emoji_kitchen_v5',
        q: input.join('_')
      })
      .catch(() => {});

    if (!output || output.body.results.length === 0) {
      return await ctx.reply({
        content: `These emojis cannot be mixed together. Try a different combination.`,
        ephemeral: true
      });
    }

    return await ctx.reply({
      content: output.body.results[0].url
    });
  }
});
