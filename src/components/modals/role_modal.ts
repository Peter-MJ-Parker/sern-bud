import { commandModule, CommandType } from '@sern/handler';
import { ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder, TextChannel } from 'discord.js';

export default commandModule({
  type: CommandType.Modal,
  async execute(ctx, { deps, params }) {
    const [uniqueId, title, description] = [
      ctx.fields.getTextInputValue('menu_id'),
      ctx.fields.getTextInputValue('menu_title'),
      ctx.fields.getTextInputValue('menu_description')
    ];
    const db = deps.prisma;
    let tempRoles = await db.tempo.findUnique({
      where: {
        userId: params!
      }
    });

    if (!tempRoles) {
      return await ctx.reply({
        content: 'Did you already choose roles to add?',
        ephemeral: true
      });
    } else {
      const selected = tempRoles.roles.map(roleId => {
        const role = ctx.guild?.roles.cache.get(roleId)!;
        return {
          name: role.name,
          id: roleId
        };
      });
      const roles = selected
        .map(p => {
          const role = ctx.guild?.roles.cache.find(r => r.id === p.id);
          return `${role}`;
        })
        .join('\n');

      await ctx.reply({
        content: `Please tag the channel you wish this menu to be sent to.\nThe following roles will be added to the list:
        > ${roles.split('\n').join('\n> ')}`,
        allowedMentions: {
          roles: []
        },
        ephemeral: true
      });

      let validChannelSelected = false;
      let selectedChannel: TextChannel | null = null;
      let attempts = 0;
      const maxAttempts = 3;

      while (!validChannelSelected && attempts < maxAttempts) {
        const collected = await (ctx.channel as TextChannel).awaitMessages({
          filter: m => m.author.id === params,
          max: 1,
          time: 30000,
          errors: ['time']
        });

        const m = collected.first();
        if (!m) {
          await ctx.followUp({ content: 'No response received. Please try again.', ephemeral: true });
          attempts++;
          continue;
        }

        const channelMentionRegex = /^<#(\d+)>$/;

        if (channelMentionRegex.test(m.content)) {
          const channelId = m.content.match(channelMentionRegex)?.[1];
          if (!channelId) {
            await m.reply('Invalid channel mention format. Please try again.');
            attempts++;
            continue;
          }

          const channel = m.client.channels.cache.get(channelId);

          if (channel && channel.isTextBased()) {
            await m.react('👍');
            validChannelSelected = true;
            selectedChannel = channel as TextChannel;
          } else {
            await m.react('👎');
            await ctx.followUp({
              content: `${channel} is an invalid channel. Please mention a valid text channel.`,
              ephemeral: true
            });
          }
        } else {
          await ctx.followUp({ content: 'Please mention a valid channel using #channel-name.', ephemeral: true });
        }

        attempts++;
      }

      if (validChannelSelected && selectedChannel) {
        const userSelectMenu = new ActionRowBuilder<StringSelectMenuBuilder>({
          components: [
            new StringSelectMenuBuilder({
              custom_id: `role_add`,
              placeholder: `Select the role(s) for the game(s) you play.`,
              min_values: 0,
              max_values: tempRoles.roles.length,
              options: selected.flatMap(({ name, id }) => {
                return {
                  label: name,
                  value: id,
                  description: `Select if you want to see channels for ${name}.`
                };
              })
            })
          ]
        });
        const userSelectEmbed = new EmbedBuilder({
          title,
          description
        });
        let msg = await selectedChannel.send({
          embeds: [userSelectEmbed],
          components: [userSelectMenu]
        });
        await db.selectRoles.upsert({
          where: {
            guildId: msg.guildId
          },
          create: {
            guildId: msg.guildId,
            menus: {
              set: {
                messageId: msg.id,
                channelId: msg.channelId,
                title,
                uniqueId,
                roles: selected
              }
            }
          },
          update: {
            menus: {
              push: {
                messageId: msg.id,
                channelId: msg.channelId,
                title,
                uniqueId,
                roles: selected
              }
            }
          }
        });

        await db.tempo.delete({
          where: {
            id: tempRoles.id
          }
        });
      } else {
        await ctx.followUp({ content: 'Maximum attempts reached or operation cancelled.', ephemeral: true });
      }
    }
  }
});
