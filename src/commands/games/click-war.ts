import { permsToString, publishConfig } from '#plugins';
import { CommandControlPlugin, commandModule, CommandType, controller } from '@sern/handler';
import { Colors, ComponentType, EmbedBuilder, PermissionFlagsBits, TextChannel } from 'discord.js';

function noPlay() {
  return CommandControlPlugin<CommandType.Slash>(async (ctx, { deps }) => {
    const p = deps.prisma.userRoles;
    const usersRoles = await p.findFirst({
      where: {
        userId: ctx.userId
      },
      select: {
        roles: true
      }
    });

    if (usersRoles?.roles.some(r => r === '1280173420574802062')) {
      return controller.next();
    } else {
      await ctx.reply({
        ephemeral: true,
        content: 'Please get the Click War Role before playing this game!'
      });
      return controller.stop();
    }
  });
}

export default commandModule({
  type: CommandType.Slash,
  description: 'Create a Chaotic Click War.',
  options: [],
  plugins: [
    publishConfig({
      guildIds: ['678398938046267402']
    }),
    noPlay()
  ],
  async execute(ctx, tbd) {
    const { clickWar } = tbd.deps['@sern/client'];
    const { interaction, guildId: guildId } = ctx;
    const channel = interaction.channel as TextChannel;
    const games = clickWar.games;
    let game = games.get(guildId!);
    if (!game) {
      game = clickWar.createNewGame();
      games.set(guildId!, game);
    }
    const p = tbd.deps.prisma.userRoles;
    const usersRoles = await p.findFirst({
      where: {
        userId: ctx.userId
      },
      select: {
        roles: true
      }
    });
    try {
      await interaction.reply({ content: 'Setting up the Chaotic Click War lobby...', ephemeral: true });

      if (game.inProgress) {
        await channel.send('A game is already in progress.');
        return;
      }

      const message = await clickWar.sendLobbyMessage(channel, game);

      const collector = message.createMessageComponentCollector({
        filter: i => ['join', 'leave', 'start', 'cancel', 'players'].includes(i.customId),
        time: 86400000,
        componentType: ComponentType.Button
      });

      collector.on('collect', async i => {
        const perm = permsToString(PermissionFlagsBits.ManageMessages);

        if (!usersRoles?.roles.some(r => r === '1280173420574802062')) {
          return await i.reply({
            ephemeral: true,
            content: 'Please get the Click War Role before playing this game!'
          });
        }
        try {
          if (i.customId === 'join') {
            if (!game.players.has(i.user.id)) {
              game.players.add(i.user.id);
              game.playerLives.set(i.user.id, 10);
              clickWar.displayLives.set(i.user.id, 10);

              await i.reply({ content: 'You have joined the CHAOS.', ephemeral: true });
              await clickWar.updateLobbyEmbed(message, game);
            } else {
              if (!i.replied && !i.deferred) {
                await i.reply({ content: 'You have already joined this Chaotic Click War lobby.', ephemeral: true });
              }
            }
          } else if (i.customId === 'leave') {
            game.players.delete(i.user.id);
            game.playerLives.delete(i.user.id);
            clickWar.displayLives.delete(i.user.id);
            if (!i.replied && !i.deferred) {
              await i.reply({
                content: 'Leaving the Chaos? Click Join and come back. Please. I beg.',
                ephemeral: true
              });
            }
            await clickWar.updateLobbyEmbed(message, game);
          } else if (i.customId === 'start') {
            if (!i.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
              if (!i.replied && !i.deferred) {
                await i.reply({
                  content: `You do not have permission to start the game. You need "${perm}" permissions.`,
                  ephemeral: true
                });
              }
              return;
            }
            if (game.inProgress) {
              if (!i.replied && !i.deferred) {
                await i.reply({ content: 'Game is already in progress.', ephemeral: true });
              }
              return;
            }
            if (game.players.size < 2) {
              if (!i.replied && !i.deferred) {
                await i.reply({ content: 'Not enough players to start the game.', ephemeral: true });
              }
              return;
            }

            game.inProgress = true;
            game.round = 0;

            const disabledRow = clickWar.createButtonRow(true);
            await i.update({ content: 'Chaotic Click War game is starting!', embeds: [], components: [disabledRow] });

            const playerMentions = Array.from(game.players).map(playerId => `<@${playerId}>`);
            await clickWar.sendPlayerMentions(channel, playerMentions);

            collector.stop();
            setTimeout(() => clickWar.startGame(interaction, game), 7000);
          } else if (i.customId === 'cancel') {
            if (!i.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
              if (!i.replied && !i.deferred) {
                await i.reply({
                  content: `You do not have permission to cancel the game. You need "${perm}" permissions.`,
                  ephemeral: true
                });
              }
              return;
            }
            clickWar.resetGame();
            await i.update({ content: 'The game has been cancelled.', embeds: [], components: [] });
            collector.stop('cancelled');
          } else if (i.customId === 'players') {
            const playersEmbed = new EmbedBuilder()
              .setTitle('Current Players')
              .setDescription(
                Array.from(game.players)
                  .map(player => `<@${player}>`)
                  .join('\n') || 'No players yet.'
              )
              .setColor(Colors.DarkGrey);
            if (!i.replied && !i.deferred) {
              await i.reply({ embeds: [playersEmbed], ephemeral: true });
            }
          }
        } catch (error) {
          if (!i.replied && !i.deferred) {
            await i.reply({ content: 'An error occurred while processing your request.', ephemeral: true });
          }
        }
      });

      collector.on('end', async collected => {
        if (collected[0] === 'cancelled') return;
        if (!game.inProgress) {
          clickWar.resetGame();
          await channel.send('Lobby was canceled.');
        }
      });
    } catch (error) {
      await interaction.reply({
        ephemeral: true
      });
    }
  }
});
