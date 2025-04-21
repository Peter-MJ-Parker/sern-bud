import { commandModule, CommandType } from "@sern/handler";
import { ApplicationCommandOptionType, MessageFlags, TextChannel } from "discord.js";

export default commandModule({
  description: "Pick a random user who reacted with :tada:",
  type: CommandType.Slash,
  options: [
    {
      name: "message-id",
      description: "ID of the message to pick from",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  execute: async (ctx, { deps }) => {
    const client = deps["@sern/client"];
    const messageId = ctx.options.getString("message-id", true);
    const msg = await (ctx.channel as TextChannel).messages.fetch(
      messageId
    );
    if (!msg)
      return await ctx.reply({
        content: `The message ID needs to be valid, I shouldn't have to explain you this :i_mean:`,
        flags: MessageFlags.Ephemeral
      });
    else {
      let reaction = msg.reactions.cache.find(r => r.emoji.name === "🎉");
      if (!reaction) {
        return await ctx.reply({
          content: 'No reactions with 🎉 found on the message.',
          flags: MessageFlags.Ephemeral
        });
      }
      await ctx.reply({
        content: `<a:loading:1177281558563016806> Choosing a random person that reacted with emoji: 🎉.\n\nMessage: ${msg.url}\n\n🥁 Drum roll please 🥁 <a:loading:1177281558563016806>`,
      });
      let users = await reaction.users.fetch();

      let userids: string[] = [];

      users.map(async (user) => {
        userids.push(user.id);
      });

      const randomizer = Math.floor(Math.random() * userids.length);
      let final = userids[randomizer];
      await client.utils.delay(3000)
      await ctx.interaction.editReply({
        content: `<@${final}> is the winner!\n\n-# This is currently just for fun. No prizes will be given out for this.`,
      });
    }
  },
});
