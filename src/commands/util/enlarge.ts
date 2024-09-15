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
    },
    {
      type: ApplicationCommandOptionType.Integer,
      name: 'size',
      description: 'Custom size for the emoji (16-4096 pixels). Default is 256.',
      required: false,
      min_value: 16,
      max_value: 4096
    }
  ],
  async execute(ctx) {
    const { interaction } = ctx;
    let emoji = interaction.options.getString('emoji', true).trim();
    const customSize = interaction.options.getInteger('size') || 256;
    const size = Math.max(16, Math.min(4096, customSize));

    function getEmojiUrl(emoji: string, size: number = 256): string | null {
      const safeSize = Math.max(16, Math.min(4096, size));

      const customEmojiMatch = emoji.match(/<a?:(\w+):(\d+)>/);
      if (customEmojiMatch) {
        const [, , id] = customEmojiMatch;
        return `https://cdn.discordapp.com/emojis/${id}.png?size=${safeSize}`;
      }

      if (/^\d+$/.test(emoji)) {
        return `https://cdn.discordapp.com/emojis/${emoji}.png?size=${safeSize}`;
      }

      if (emoji.length === 1 || emoji.length === 2) {
        const codePoint = emoji.codePointAt(0)?.toString(16);
        if (codePoint) {
          return `https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/${safeSize}/${codePoint.padStart(
            4,
            '0'
          )}.png`;
        }
      }

      if (emoji.startsWith('https://cdn.discordapp.com/emojis/')) {
        const id = emoji.split('/').pop()?.split('.')[0];
        if (id) {
          return `https://cdn.discordapp.com/emojis/${id}.png?size=${safeSize}`;
        }
      }

      if (emoji.startsWith('http://') || emoji.startsWith('https://')) {
        return emoji;
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

    if (emojiUrl.includes('cdn.discordapp.com/emojis/')) {
      const id = emojiUrl.split('/').pop()?.split('.')[0];
      const type = await fetch(`https://cdn.discordapp.com/emojis/${id}.gif?size=${size}`)
        .then(response => (response.ok ? 'gif' : 'png'))
        .catch(() => 'png');

      return ctx.reply({
        content: `https://cdn.discordapp.com/emojis/${id}.${type}?size=${size}`
      });
    }

    return ctx.reply({
      content: emojiUrl
    });
  }
});
