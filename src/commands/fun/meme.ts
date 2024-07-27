import { commandModule, CommandType, Service } from "@sern/handler";
import { TextChannel } from "discord.js";

export default commandModule({
  type: CommandType.Slash,
  plugins: [],
  description: "Gets a meme from reddit.",
  execute: async (ctx) => {
    const { utils } = Service("@sern/client");

    await utils.getMeme(ctx.channel as TextChannel, ctx.interaction);
  }
});
