import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { env } from '#utils';

export class BudBot extends Client {
  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildExpressions,
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
    this.login(env.DISCORD_TOKEN);
    process.on('unhandledRejection', err => {
      return console.error('Unhandled Rejection:', err);
    });
    process.on('uncaughtException', err => {
      return console.error('Uncaught Exception:', err);
    });
  }
}
