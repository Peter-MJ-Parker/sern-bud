import { commandModule, CommandType } from '@sern/handler';
import { EmbedBuilder } from 'discord.js';

export default commandModule({
  type: CommandType.Button,
  async execute(button, { deps, params }) {
    if (!params) return;
    const action = params as 'accept' | 'deny';
    const m = button.message;
    const embed = EmbedBuilder.from(m.embeds![0]);
    const [channelId, messageId] = embed.data.footer!.text.split('/');
    const client = deps['@sern/client'];

    const channel = await client.channels.fetch(channelId);

    if (channel && (channel.isTextBased() || channel.isDMBased()) && channel.isSendable()) {
      const messages = await channel.messages.fetch({ cache: false });
      const message = messages.get(messageId);

      if (!message) {
        return await button.reply({
          flags: 64,
          content: `Message with id: \`${messageId}\` is invalid.`
        });
      }

      switch (action) {
        case 'accept':
          await button.deferUpdate();
          //upload emoji to client
          const emoji = embed.data.thumbnail!.url;
          const name = embed.data.description!.match(/__\*\*Emoji Name:\*\*__\n(.{1,10})\n/)![1];
          console.log(name);
          // const res = await client.utils.uploadApplicationEmoji(client, name, emoji);
          //send message to user as reply to original message
          //reply to button
          break;
        default:
          //send message to user as reply to original message
          //reply to button
          break;
      }
    }

    return await button.reply({
      flags: 64,
      content: `Channel with id: \`${channelId}\` is invalid.`
    });
  }
});
