import { IntegrationContextType, publishConfig } from '#plugins';
import { commandModule, CommandType } from '@sern/handler';
import { ApplicationCommandOptionType, ChannelType, PermissionFlagsBits } from 'discord.js';

export default commandModule({
  type: CommandType.Slash,
  description: 'Manage counting system.',
  plugins: [
    publishConfig({
      defaultMemberPermissions: PermissionFlagsBits.Administrator,
      contexts: [IntegrationContextType.GUILD],
      integrationTypes: ['Guild']
    })
  ],
  options: [
    {
      name: 'start',
      description: 'Start the counting system.',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'channel',
          description: 'The channel to use for counting.',
          type: ApplicationCommandOptionType.Channel,
          required: true
        }
      ]
    },
    {
      name: 'stop',
      description: 'Stop the counting system.',
      type: ApplicationCommandOptionType.Subcommand
    },
    {
      name: 'reset',
      description: 'Reset the counting system.',
      type: ApplicationCommandOptionType.Subcommand
    },
    {
      name: 'set-channel',
      description: 'Set the channel for counting.',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'channel',
          description: 'The channel to use for counting.',
          type: ApplicationCommandOptionType.Channel,
          channel_types: [ChannelType.GuildText],
          required: true
        }
      ]
    },
    {
      name: 'saves-setup',
      description: 'Manage saves for the counting system.',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'enable',
          description: 'Enable or disable economy money for counting.',
          type: ApplicationCommandOptionType.Boolean,
          required: true
        },
        {
          name: 'amount',
          description: 'The amount of economy money to use for counting.',
          type: ApplicationCommandOptionType.Integer,
          required: false,
          min_value: 0
        }
      ]
    },
    {
      name: 'saves',
      description: 'Check amount of saves a user has.',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'user',
          description: 'The user to check saves for.',
          type: ApplicationCommandOptionType.User,
          required: false
        }
      ]
    }
  ],
  execute: async (ctx, { deps }) => {
    const { prisma } = deps;
    const { guildId } = ctx;
    const subcommand = ctx.options.getSubcommand();
    if (!guildId) {
      return ctx.reply({
        content: 'This command can only be used in a server.',
        flags: 64
      });
    }
    const counter = await prisma.counter.findFirst({ where: { id: guildId } });

    if (subcommand === 'start') {
      const channel = ctx.channel;
      if (!channel?.isTextBased()) {
        return;
      }
      if (!counter) {
        return ctx.reply({
          content: 'Counting system is not set up. Use `/counting set-channel` to set it up.',
          flags: 64
        });
      }
      if (counter.active) {
        return ctx.reply({
          content: 'Counting system is already active.',
          flags: 64
        });
      }
      await prisma.counter.update({
        where: { id: counter.id },
        data: { active: true }
      });
      return ctx.reply({
        content: `Counting system started in <#${counter.channel}>.`,
        flags: 64
      });
    } else if (subcommand === 'stop') {
      if (!counter) {
        return ctx.reply({
          content: 'Counting system is not set up. Use `/counting set-channel` to set it up.',
          flags: 64
        });
      }
      if (!counter.active) {
        return ctx.reply({
          content: 'Counting system is not active.',
          flags: 64
        });
      }
      await prisma.counter.update({ where: { id: guildId }, data: { active: false } });
      return ctx.reply({
        content: 'Counting system stopped.',
        flags: 64
      });
    } else if (subcommand === 'reset') {
      if (!counter) {
        return ctx.reply({
          content: 'Counting system is not set up. Use `/counting set-channel` to set it up.',
          flags: 64
        });
      }
      await prisma.counter.update({
        where: { id: guildId },
        data: { count: 0, users: [], active: false }
      });
      return ctx.reply({
        content: 'Counting system reset. Please start it again using `/counting start` when ready.',
        flags: 64
      });
    } else if (subcommand === 'set-channel') {
      const channel = ctx.options.getChannel('channel', true);
      if (!channel || channel.type !== ChannelType.GuildText) {
        return ctx.reply({
          content: 'Please provide a valid channel.',
          flags: 64
        });
      }
      await insert(channel.id);
    } else if (subcommand === 'saves-setup') {
      const enable = ctx.options.getBoolean('enable', true);
      const amount = ctx.options.getInteger('amount');
      if (!counter) {
        return ctx.reply({
          content: 'Counting system is not set up. Use `/counting set-channel` to set it up.',
          flags: 64
        });
      }
      if (enable) {
        const savesData = {
          enabled: true,
          amount: amount ?? 1000
        };
        await prisma.counter.update({
          where: { id: guildId },
          data: { saves: savesData }
        });
        return ctx.reply({
          content: `Economy money enabled for counting. Users can now use money to save the count. Current amount is ${amount}.`,
          flags: 64
        });
      } else {
        const saveData = {
          enabled: false,
          amount: counter.saves?.amount ?? 1000
        };
        await prisma.counter.update({
          where: { id: guildId },
          data: { saves: saveData }
        });
        return ctx.reply({
          content: 'Economy money disabled for counting. Users can no longer use money to save the count.',
          flags: 64
        });
      }
    } else if (subcommand === 'saves') {
      const user = ctx.options.getUser('user');
      if (!counter) {
        return ctx.reply({
          content: 'Counting system is not set up. Use `/counting set-channel` to set it up.',
          flags: 64
        });
      }
      const money = await prisma.money.findFirst({
        where: {
          serverID: guildId,
          userID: user?.id ?? ctx.user.id
        }
      });
      if (!money) {
        return ctx.reply({
          content: 'No economy money found for this user.',
          flags: 64
        });
      }
      const saves = Math.floor(money.wallet / 1000);
      return ctx.reply({
        content: `${user ? `<@${user.id}> has` : 'You have'} ${saves} save${saves === 1 ? '' : 's'}.`,
        flags: 64
      });
    }

    async function insert(channel: string) {
      let docs = await prisma.counter.findMany({});
      let doc = docs.find(d => d.id === guildId);
      if (!doc) {
        await prisma.counter.create({
          data: {
            id: guildId!,
            channel,
            count: 0,
            users: [],
            active: false,
            saves: {
              enabled: true,
              amount: 1000
            }
          }
        });
        return ctx.reply({
          content: `Counting channel set to <#${channel}>. Please start the counting system using \`/counting start\`.`,
          flags: 64
        });
      } else {
        if (doc.channel === channel) {
          return ctx.reply({
            content: `Counting channel is already set to <#${channel}>. No changes made.`,
            flags: 64
          });
        }
        await prisma.counter.update({
          where: { id: guildId! },
          data: { channel }
        });
        return ctx.reply({
          content: `Counting channel updated to <#${channel}>. Please start the counting system using \`/counting start\`.`,
          flags: 64
        });
      }
    }
  }
});
