import { EventType, Service, eventModule } from "@sern/handler";
import { Events } from "discord.js";

export default eventModule({
  type: EventType.Discord,
  name: Events.ClientReady,
  execute: async () => {
    const { guilds, user, utils } = Service("@sern/client");
    Service("@sern/logger").success("Logged into Discord as " + user?.username);
    await utils.mongoConnect(utils.env.CONNECT);
    const guild = guilds.cache.get("678398938046267402")!;
    await utils.channelUpdater(guild);
  }
});
