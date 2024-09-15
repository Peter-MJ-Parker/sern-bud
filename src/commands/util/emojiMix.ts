import { env, extractEmoji } from '#utils';
import { commandModule, CommandType } from '@sern/handler';
import { ApplicationCommandOptionType, TextChannel } from 'discord.js';
import su from 'superagent';

export default commandModule({
  type: CommandType.Slash,
  name: 'emoji-mixer',
  description: 'Mix two emojis.',
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: 'emojis',
      description: 'The emojis to combine',
      required: true
    }
  ],
  async execute(ctx) {
    await ctx.interaction.deferReply({ ephemeral: true });
    const { options } = ctx;
    const emote = options.getString('emojis', true);
    const input = extractEmoji(emote);

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

    if (!output || !output.body.results[0] || emote.startsWith('<') || emote.endsWith('>')) {
      return await ctx.interaction.editReply({
        content: `One or both emojis are not supported in this command. (ie: Custom server emojis and default gestures.)`
      });
    }

    await ctx.interaction.editReply({
      content: 'Custom emoji created...'
    });

    return await (ctx.channel as TextChannel).send({
      content: output.body.results[0].url
    });
  }
});
