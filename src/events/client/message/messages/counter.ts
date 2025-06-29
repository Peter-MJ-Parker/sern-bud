import { EventType, Service, eventModule } from "@sern/handler";
import { ChannelType, Events, GuildMember, TextChannel } from "discord.js";

export default eventModule({
  type: EventType.Discord,
  name: Events.MessageCreate,
  execute: async (message) => {
    const prisma = Service("prisma");
    if (
      message.author.bot ||
      message.system ||
      message.channel.type === ChannelType.DM ||
      !message.guild ||
      !message.inGuild()
    )
      return null;

    try {
      let guildDoc = await prisma.guild.findFirst({
        where: {
          gID: message.guildId,
        },
      });
      if (!guildDoc?.countingChan)
        return message.reply(
          "Please setup the counting channel first with </counting:>"
        );
      let doc = await prisma.counter.findFirst({
        where: {
          id: message.guildId!,
        },
      });
      // if (!doc)
      //   if (message.channelId === doc.id) {
      //     const roles = {
      //       ruiner: "",
      //       savior: "",
      //     };
      //     const chan = message.channel as TextChannel;
      //     const top = "This channel is reserved for numbers only! Next up?";
      //     if (!chan.topic || chan.topic !== top) {
      //       await chan.setTopic(top);
      //     }
      //     if (
      //       !Number(message) &&
      //       message.author.id !== message.client.user.id
      //     ) {
      //       await message.delete();
      //     }
      //   }
    } catch (error) {
      console.log(error);
    }

    //functions

    const reset = async () => {};

    const update = async () => {};

    const role = async (
      action: "add" | "remove",
      member: GuildMember,
      role: string
    ) => {
      const ROLE = member.guild.roles.cache.get(role);
      if (!ROLE) return;
      if (action === "add") {
        if (!member.roles.cache.has(role)) {
          await member.roles.add(ROLE);
        } else {
        }
      } else {
        if (member.roles.cache.has(role)) {
          await member.roles.remove(ROLE);
        }
      }
    };
  },
});
