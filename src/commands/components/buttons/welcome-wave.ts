import { commandModule, CommandType, Service } from "@sern/handler";

export default commandModule({
  type: CommandType.Button,
  name: "welcome-wave",
  description: "Sends a sticker in chat in response to welcome message.",
  execute: async (i) => {
    await i.deferUpdate();
    await Service("@sern/client").utils.sticker(i);
  }
});
