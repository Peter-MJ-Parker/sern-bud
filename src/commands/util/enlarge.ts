import { commandModule, CommandType } from '@sern/handler';
import { ApplicationCommandOptionType } from 'discord.js';

export default commandModule({
  type: CommandType.Slash,
  description: 'Enlarges an emoji into a full-size picture.',
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: 'emoji',
      description: 'The emoji you want to enlarge.',
      required: true
    }
  ],
  async execute(ctx, tbd) {
    const { interaction } = ctx;
    let emoji = interaction.options.getString('emoji', true).trim();

    function getEmojiUrl(emoji: string): string | null {
      const customEmojiMatch = emoji.match(/<a?:\w+:(\d+)>/);
      if (customEmojiMatch) {
        const id = customEmojiMatch[1];
        const guildEmoji = interaction.guild?.emojis.cache.get(id);
        const clientEmoji = tbd.deps['@sern/client'].emojis.cache.get(id);
        return guildEmoji?.url || clientEmoji?.url || null;
      }

      if (emoji.length === 1 || emoji.length === 2) {
        const codePoint = emoji.codePointAt(0)?.toString(16);
        if (codePoint) {
          return `https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/${codePoint.padStart(4, '0')}.png`;
        }
      }

      return null;
    }

    const emojiUrl = getEmojiUrl(emoji);

    if (!emojiUrl) {
      return ctx.reply({
        content: "I cannot enlarge this emoji. It might not be a valid emoji or one I don't have access to.",
        ephemeral: true
      });
    }

    if (emojiUrl.startsWith('https://cdn.discordapp.com/emojis/')) {
      const id = emojiUrl.split('/').pop()?.split('.')[0];
      const type = await fetch(`https://cdn.discordapp.com/emojis/${id}.gif`)
        .then(response => (response.ok ? 'gif' : 'png'))
        .catch(() => 'png');

      return ctx.reply({
        content: `https://cdn.discordapp.com/emojis/${id}.${type}`
      });
    }

    return ctx.reply({
      content: emojiUrl
    });
  }
});
