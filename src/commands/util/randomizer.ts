import { commandModule, CommandType } from "@sern/handler";
import { ApplicationCommandOptionType, TextChannel } from "discord.js";

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
  execute: async (interaction) => {
    const messageId = interaction.options.getString("message-id", true);
    const msg = await (interaction.channel as TextChannel).messages.fetch(
      messageId
    );
    if (!msg)
      return await interaction.reply({
        content: `The message ID needs to be valid, I shouldn't have to explain you this :i_mean:`,
        ephemeral: true,
      });
    else {
        console.log('message: ', msg);
      let reaction = msg.reactions.cache.find(r => r.emoji.name === "🎉");
      if (!reaction) {
        return await interaction.reply({
          content: 'No reactions with 🎉 found on the message.',
          ephemeral: true,
        });
      }
      let users = await reaction.users.fetch();

      let userids: string[] = [];

      users.map(async (user) => {
        userids.push(user.id);
      });

      const randomizer = Math.floor(Math.random() * userids.length);
      let finnal = userids[randomizer];

      await interaction.reply({
        content: `🥁 Drum roll please 🥁 \n\n||<@${finnal}>||`,
        ephemeral: true,
      });
    }
  },
});
