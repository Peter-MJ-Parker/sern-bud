import { EventType, eventModule } from "@sern/handler";
import { Events } from "discord.js";

export default eventModule({
  type: EventType.Discord,
  name: Events.MessageUpdate,
  /**
   * @param {import('discord.js').Message} message
   */
  execute: async () => {

  },
})