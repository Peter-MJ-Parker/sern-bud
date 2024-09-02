import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CacheType,
  ChatInputCommandInteraction,
  ComponentType,
  EmbedBuilder,
  Message,
  TextChannel
} from 'discord.js';

type Game = {
  players: Set<string>;
  round: number;
  inProgress: boolean;
  timer: number | null;
  numButtons: number;
  timeWindow: number;
  survivalButtonIndex: number;
  extraLifeButtonIndex: number;
  swapLivesButtonIndex: number;
  playerLives: Map<string, number>;
  lastEliminated: string[];
  clickedInRound: Set<string>;
  specialButtonActive: boolean;
  swapLivesActive: boolean;
  swappedPlayers: Map<string, number>;
};

export class ClickWar {
  constructor() {}
  public games: Map<string, Game> = new Map();
  private emojis = ['😄', '😃', '😀', '😊', '😉', '😍', '🥳', '😎', '🤩', '🤪', '😜', '😋'];
  private colors = [ButtonStyle.Primary, ButtonStyle.Secondary, ButtonStyle.Success, ButtonStyle.Danger];
  public displayLives = new Map();

  private funnyMessages = {
    gain: [
      "You so lucky. You've gained {lives} lives! You now have {currentLives} lives.",
      'You gained {lives} lives and now have {currentLives} lives.',
      'You just found {lives} lives lying around. How convenient! You now have {currentLives} lives.',
      'Look at you go. Extra {lives} lives added to your tally! You now have {currentLives} lives.',
      'You must have a four-leaf clover! Extra {lives} lives gained! You now have {currentLives} lives.',
      "You're invincible... lmao. Extra {lives} lives gained! You now have {currentLives} lives.",
      "You're a professional aren't you? You just earned {lives} extra lives. You now have {currentLives} lives.",
      'Have you played the lottery lately? Another {lives} lives added to your count! You now have {currentLives} lives.'
    ],
    lose: [
      'Damn! You just lost {lives} lives! You have {currentLives} lives left.',
      'That click cost you {lives} lives! You have {currentLives} lives left.',
      'Lmao. You lost {lives} lives. Loser. You have {currentLives} lives left.',
      "Goofball, you're {lives} lives down, many to go! You have {currentLives} lives left.",
      'Bad luck! You lost {lives} lives! You have {currentLives} lives left.',
      'Oh snap! {lives} lives have been lost! You have {currentLives} lives left.',
      'Clicking fail! You just lost {lives} lives! You have {currentLives} lives left.',
      'Goof, that is gonna hurt! You lost {lives} lives! You have {currentLives} lives left.'
    ],
    eliminate: [
      'Gtfo, you are eliminated.',
      'Out of the game! Loser.',
      'Eliminated! Maybe the next time... or not.',
      'No more lives! Lmao goofball.',
      'Game over! Buh Bye.',
      "You've been knocked out! Dueces.",
      'Yooouuurreeeee outta here!'
    ]
  };

  public createButtonRow(disabled = false) {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('join').setLabel('Join').setStyle(ButtonStyle.Primary).setDisabled(disabled),
      new ButtonBuilder().setCustomId('leave').setLabel('Leave').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
      new ButtonBuilder().setCustomId('start').setLabel('Start').setStyle(ButtonStyle.Success).setDisabled(disabled),
      new ButtonBuilder().setCustomId('cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger).setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId('players')
        .setLabel('Players')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled)
    );
  }

  public async sendLobbyMessage(channel: TextChannel, game: Game) {
    return await channel.send({
      embeds: [this.createLobbyEmbed(game)],
      components: [this.createButtonRow()]
    });
  }

  public async startGame(interaction: ChatInputCommandInteraction<CacheType>, game: Game) {
    const channel = interaction.channel as TextChannel;
    try {
      while (game.players.size > 1) {
        game.round++;
        game.numButtons = Math.min(5, 3 + Math.floor(game.round / 2));

        if (game.round === 20) {
          await this.specialRound20(interaction, game);
          continue;
        }

        game.survivalButtonIndex = Math.floor(Math.random() * game.numButtons);
        game.extraLifeButtonIndex = Math.floor(Math.random() * game.numButtons);
        while (game.extraLifeButtonIndex === game.survivalButtonIndex) {
          game.extraLifeButtonIndex = Math.floor(Math.random() * game.numButtons);
        }

        const showSwapLivesButton = Math.random() < 0.2 && !game.swapLivesActive;
        if (showSwapLivesButton) {
          game.swapLivesButtonIndex = Math.floor(Math.random() * game.numButtons);
        }

        if (!game.specialButtonActive && Math.random() < 0.2) {
          game.specialButtonActive = true;

          setTimeout(async () => {
            const specialRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId('special_button')
                .setLabel(Math.random() < 0.5 ? 'QUICK. CLICK ME TO LOSE' : 'CLICK ME TO GAIN 3 LIVES')
                .setStyle(ButtonStyle.Danger)
            );

            const specialMessage = await channel.send({
              content: 'Special button active for 5 seconds!',
              components: [specialRow]
            });

            const specialCollector = specialMessage.createMessageComponentCollector({
              filter: i => i.customId === 'special_button' && game.players.has(i.user.id),
              time: 5000,
              max: 1,
              componentType: ComponentType.Button
            });

            specialCollector.on('collect', async i => {
              if (i.customId === 'special_button') {
                if (i.component.label!.includes('LOSE')) {
                  game.players.delete(i.user.id);
                  game.playerLives.delete(i.user.id);
                  this.displayLives.delete(i.user.id);
                  await i.reply({ content: 'You clicked the wrong button and lost all your lives!', ephemeral: true });
                  await channel.send(`<@${i.user.id}> was eliminated by the special button!`);
                } else {
                  const currentLives = (game.playerLives.get(i.user.id) || 0) + 3;
                  game.playerLives.set(i.user.id, currentLives);
                  this.displayLives.set(i.user.id, currentLives);
                  const message = this.funnyMessages.gain[Math.floor(Math.random() * this.funnyMessages.gain.length)]
                    .replace('{lives}', '3')
                    .replace('{currentLives}', currentLives.toString());
                  await i.reply({ content: message, ephemeral: true });
                }
              }
              await specialMessage.delete();
            });

            specialCollector.on('end', async () => {
              if (!specialCollector.collected.size) {
                await specialMessage.delete();
              }
              game.specialButtonActive = false;
            });
          }, Math.floor(Math.random() * (game.timeWindow - 5000)));
        }

        const row = new ActionRowBuilder<ButtonBuilder>();
        for (let i = 0; i < game.numButtons; i++) {
          let buttonLabel = this.emojis[Math.floor(Math.random() * this.emojis.length)];
          let buttonStyle = this.colors[Math.floor(Math.random() * this.colors.length)];

          if (showSwapLivesButton && i === game.swapLivesButtonIndex) {
            buttonLabel = '🔄 Swap Lives';
            buttonStyle = ButtonStyle.Primary;
          }

          row.addComponents(new ButtonBuilder().setCustomId(`button_${i}`).setLabel(buttonLabel).setStyle(buttonStyle));
        }

        const embed = new EmbedBuilder()
          .setTitle(`Round ${game.round}`)
          .setDescription('Choose a button!')
          .setColor('Random');

        const message = await channel.send({ embeds: [embed], components: [row] });

        const collector = message.createMessageComponentCollector({
          filter: i => i.customId.startsWith('button_') && game.players.has(i.user.id),
          time: game.timeWindow,
          componentType: ComponentType.Button
        });

        let playersToEliminate: string[] = [];
        let playersWhoClicked: Set<string> = new Set();

        collector.on('collect', async i => {
          try {
            if (game.clickedInRound.has(i.user.id)) {
              if (!i.replied && !i.deferred) {
                await i.reply({ content: 'You can only click once per round!', ephemeral: true });
              }
              return;
            }

            game.clickedInRound.add(i.user.id);
            playersWhoClicked.add(i.user.id);
            const buttonIndex = parseInt(i.customId.split('_')[1]);
            if (!isNaN(buttonIndex)) {
              const randomLivesChange = Math.floor(Math.random() * 4) + 1;

              if (game.swappedPlayers.has(i.user.id)) {
                const newLives = game.swappedPlayers.get(i.user.id);
                if (!i.replied && !i.deferred) {
                  await i.reply({
                    content: `Your lives were swapped in the last round! You now have ${newLives} lives.`,
                    ephemeral: true
                  });
                }
                game.swappedPlayers.delete(i.user.id);
              }

              if (buttonIndex === game.survivalButtonIndex) {
                if (!i.replied && !i.deferred) {
                  await i.reply({ content: 'You made it. Whoopty f-ckn DOO DOO.', ephemeral: true });
                }
              } else if (buttonIndex === game.extraLifeButtonIndex) {
                const currentLives = (game.playerLives.get(i.user.id) || 0) + randomLivesChange;
                game.playerLives.set(i.user.id, currentLives);
                this.displayLives.set(i.user.id, currentLives);
                const message = this.funnyMessages.gain[Math.floor(Math.random() * this.funnyMessages.gain.length)]
                  .replace('{lives}', randomLivesChange.toString())
                  .replace('{currentLives}', currentLives.toString());
                if (!i.replied && !i.deferred) {
                  await i.reply({ content: message, ephemeral: true });
                }
              } else if (showSwapLivesButton && buttonIndex === game.swapLivesButtonIndex) {
                await this.handleSwapLives(interaction, i.user.id, game);
              } else {
                let remainingLives = (game.playerLives.get(i.user.id) || 0) - randomLivesChange;
                if (remainingLives > 0) {
                  game.playerLives.set(i.user.id, remainingLives);
                  this.displayLives.set(i.user.id, remainingLives);
                  const message = this.funnyMessages.lose[Math.floor(Math.random() * this.funnyMessages.lose.length)]
                    .replace('{lives}', randomLivesChange.toString())
                    .replace('{currentLives}', remainingLives.toString());
                  if (!i.replied && !i.deferred) {
                    await i.reply({ content: message, ephemeral: true });
                  }
                } else {
                  playersToEliminate.push(i.user.id);
                  game.players.delete(i.user.id);
                  game.playerLives.delete(i.user.id);
                  this.displayLives.delete(i.user.id);
                  if (!i.replied && !i.deferred) {
                    await i.reply({
                      content:
                        this.funnyMessages.eliminate[Math.floor(Math.random() * this.funnyMessages.eliminate.length)],
                      ephemeral: true
                    });
                  }
                }
              }
            }
          } catch (error) {
            if (!i.replied && !i.deferred) {
              await i.reply({ content: 'An error occurred during the game round.', ephemeral: true });
            }
          }
        });

        collector.on('end', async collected => {
          try {
            const playersWhoDidNotClick = Array.from(game.players).filter(player => !playersWhoClicked.has(player));
            playersToEliminate.push(...playersWhoDidNotClick);

            const survivors = collected
              .filter(
                i =>
                  i.customId &&
                  !isNaN(parseInt(i.customId.split('_')[1])) &&
                  parseInt(i.customId.split('_')[1]) === game.survivalButtonIndex
              )
              .map(i => i.user.id);
            game.players = new Set(
              Array.from(game.players).filter(
                player => survivors.includes(player) || !playersToEliminate.includes(player)
              )
            );

            const revealRow = new ActionRowBuilder<ButtonBuilder>();
            for (let i = 0; i < game.numButtons; i++) {
              revealRow.addComponents(
                new ButtonBuilder()
                  .setCustomId(`reveal_${i}`)
                  .setLabel(
                    i === game.survivalButtonIndex
                      ? 'Survive'
                      : i === game.extraLifeButtonIndex
                      ? 'Extra Life'
                      : showSwapLivesButton && i === game.swapLivesButtonIndex
                      ? 'Swap Lives'
                      : 'Trap'
                  )
                  .setStyle(
                    i === game.survivalButtonIndex
                      ? ButtonStyle.Success
                      : i === game.extraLifeButtonIndex
                      ? ButtonStyle.Primary
                      : showSwapLivesButton && i === game.swapLivesButtonIndex
                      ? ButtonStyle.Primary
                      : ButtonStyle.Danger
                  )
                  .setDisabled(true)
              );
            }

            await message.edit({
              embeds: [embed],
              content: `Round ${game.round} over! ${game.players.size} players remain.`,
              components: [revealRow]
            });

            if (game.players.size === 0) {
              await this.initiateSuddenDeath(interaction, game, playersToEliminate);
              return;
            } else if (game.players.size <= 1) {
              game.inProgress = false;
              const winnerId = game.players.size === 1 ? Array.from(game.players)[0] : null;
              if (winnerId) {
                await channel.send(`🎉 **Congratulations!** 🎉\n<@${winnerId}> is the **WINNER**! 🏆`);
              } else {
                await channel.send('No winners this time.');
              }
              this.resetGame();
              return;
            }

            if (playersToEliminate.length === 0) {
              await channel.send('No one was eliminated this round.');
            } else {
              const eliminatedMentions = playersToEliminate.map(player => `<@${player}>`).join(' ');
              await channel.send(`${eliminatedMentions} gtfo. Everyone else, get ready to keep playing!`);
            }

            game.lastEliminated = playersToEliminate;
          } catch (error) {
            await channel.send('An error occurred at the end of the round.');
          }
        });

        await new Promise(resolve => setTimeout(resolve, game.timeWindow + 2000));

        game.clickedInRound.clear();
      }
    } catch (error) {
      await channel.send('An error occurred while starting the game.');
    }
  }

  public async handleSwapLives(interaction, playerId, game: Game) {
    const channel = interaction.channel as TextChannel;
    const eligiblePlayers = Array.from(game.players).filter(id => id !== playerId);

    if (eligiblePlayers.length === 0) {
      await channel.send(`<@${playerId}> tried to swap lives, but there were no eligible players to swap with!`);
      return;
    }

    const randomTarget = eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)];
    const playerLives = game.playerLives.get(playerId) || 0;
    const targetLives = game.playerLives.get(randomTarget) || 0;

    game.playerLives.set(playerId, targetLives);
    game.playerLives.set(randomTarget, playerLives);

    game.swappedPlayers.set(playerId, targetLives);
    game.swappedPlayers.set(randomTarget, playerLives);

    this.displayLives.set(playerId, targetLives);
    this.displayLives.set(randomTarget, playerLives);

    await channel.send(`<@${playerId}> swapped lives with <@${randomTarget}>!`);
  }

  public async specialRound20(interaction, game: Game) {
    const channel = interaction.channel as TextChannel;
    const specialEmbed = new EmbedBuilder()
      .setTitle('Jump Back In or Gain 5 Lives')
      .setDescription('Jump back in first, then play round 21. You have 10 seconds to do both.')
      .setColor('Random');

    const specialRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('special_revival_button')
        .setLabel('CLICK ME TO JUMP BACK IN OR GAIN 5 LIVES')
        .setStyle(ButtonStyle.Success)
    );

    const specialMessage = await channel.send({
      embeds: [specialEmbed],
      components: [specialRow]
    });

    const specialCollector = specialMessage.createMessageComponentCollector({
      filter: i => game.playerLives.has(i.user.id) || game.lastEliminated.includes(i.user.id),
      time: 10000
    });

    specialCollector.on('collect', async i => {
      try {
        await i.deferUpdate();

        if (game.players.has(i.user.id)) {
          const currentLives = (game.playerLives.get(i.user.id) || 0) + 5;
          game.playerLives.set(i.user.id, currentLives);
          this.displayLives.set(i.user.id, currentLives);
          await i.followUp({
            content: `You gained 5 lives! You now have ${currentLives} lives. Quick, get ready for round 21!`,
            ephemeral: true
          });
        } else if (game.lastEliminated.includes(i.user.id)) {
          game.players.add(i.user.id);
          game.playerLives.set(i.user.id, 5);
          this.displayLives.set(i.user.id, 5);
          await i.followUp({
            content: `Welcome back! You’ve jumped back in with 5 lives. Quick, get ready for round 21!`,
            ephemeral: true
          });
        } else {
        }
      } catch (error) {
        if (!i.replied && !i.deferred) {
          await i.reply({ content: 'An error occurred while processing your request.', ephemeral: true });
        }
      }
    });

    specialCollector.on('end', async () => {
      try {
        await specialMessage.delete();
        await channel.send('The special round has ended. The game will continue with extended time for Round 21.');
      } catch (error) {
        await channel.send('An error occurred at the end of the special round.');
      }
    });

    game.timeWindow = 10000;
  }

  public createLobbyEmbed(game: Game) {
    return new EmbedBuilder()
      .setTitle('Chaotic Click War Lobby')
      .setDescription(
        `Click "Join" to join the game. Click "Start" to begin the game when ready.

**How to Play Chaotic Click War:**
1. Click a button and pray you don't get eliminated. Simple. Now CLICK JOIN and get ready to play.
If you get eliminated, stick around for round 20 for a chance to JUMP BACK IN! You have to JUMP BACK IN FIRST and also PLAY ROUND 21. You HAVE TO DO BOTH to successfully jump back in! Good luck! 
`
      )
      .addFields({ name: 'Players', value: game.players.size.toString(), inline: true })
      .setColor('Random');
  }
  public async updateLobbyEmbed(message: Message<true>, game: Game) {
    const updatedEmbed = this.createLobbyEmbed(game);
    await message.edit({ embeds: [updatedEmbed] });
  }

  public createNewGame(): Game {
    return {
      players: new Set(),
      round: 0,
      inProgress: false,
      timer: null,
      numButtons: 3,
      timeWindow: 6000,
      survivalButtonIndex: 0,
      extraLifeButtonIndex: -1,
      swapLivesButtonIndex: -1,
      playerLives: new Map(),
      lastEliminated: [],
      clickedInRound: new Set(),
      specialButtonActive: false,
      swapLivesActive: false,
      swappedPlayers: new Map()
    };
  }

  public async sendPlayerMentions(channel: TextChannel, mentions) {
    const maxChunkSize = 2000;
    let baseMessage = 'Starting. ';
    let currentMessage = baseMessage;

    for (const mention of mentions) {
      if ((currentMessage + mention + ' ').length > maxChunkSize) {
        await channel.send(currentMessage.trim());
        currentMessage = baseMessage + mention + ' ';
      } else {
        currentMessage += mention + ' ';
      }
    }

    if (currentMessage !== baseMessage) {
      await channel.send(currentMessage.trim());
    }
  }
  public resetGame() {
    return this.createNewGame();
  }

  public async initiateSuddenDeath(interaction, game: Game, playersToEliminate: string[]) {
    const channel = interaction.channel as TextChannel;
    try {
      const eliminatedMentions = playersToEliminate.map(player => `<@${player}>`).join(' ');

      await channel.send(`All remaining players have been eliminated simultaneously. ${eliminatedMentions}`);

      const delay = Math.floor(Math.random() * 10000) + 5000;
      await new Promise(resolve => setTimeout(resolve, delay));

      await channel.send(`Initiating sudden death round!`);

      const suddenDeathButton = new ButtonBuilder()
        .setCustomId('sudden_death')
        .setLabel('Sudden Death - Click Fast!')
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(suddenDeathButton);
      const embed = new EmbedBuilder()
        .setTitle('Sudden Death Round')
        .setDescription('First player to click the button wins!')
        .setColor('Random');

      const message = await channel.send({ embeds: [embed], components: [row] });

      const collector = message.createMessageComponentCollector({
        filter: i => i.customId === 'sudden_death' && playersToEliminate.includes(i.user.id),
        max: 1,
        time: 10000
      });

      collector.on('collect', async i => {
        try {
          game.inProgress = false;
          if (!i.replied && !i.deferred) {
            await i.reply({ content: 'Congratulations! You are the winner!', ephemeral: true });
          }
          await channel.send(`<@${i.user.id}> is the winner of the sudden death round!`);
          this.resetGame();
        } catch (error) {
          await channel.send('An error occurred during the sudden death round.');
        }
      });

      collector.on('end', async collected => {
        try {
          if (!collected.size) {
            await channel.send('No one clicked the button in time. There are no winners.');
            this.resetGame();
          }
        } catch (error) {
          await channel.send('An error occurred at the end of the sudden death round.');
        }
      });
    } catch (error) {
      await channel.send('An error occurred while initiating the sudden death round.');
    }
  }
}
