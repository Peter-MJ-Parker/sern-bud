import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { ClickWar, env, Utils } from '#utils';

export class BudBot extends Client {
  utils: Utils;
  clickWar: ClickWar;
  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
      ],
      partials: [
        Partials.Channel,
        Partials.GuildMember,
        Partials.GuildScheduledEvent,
        Partials.Message,
        Partials.Reaction,
        Partials.ThreadMember,
        Partials.User
      ],
      allowedMentions: {
        repliedUser: false,
        parse: ['everyone', 'roles', 'users']
      }
    });
    this.utils = new Utils();
    this.clickWar = new ClickWar();
    this.login(env.DISCORD_TOKEN);
  }
}
