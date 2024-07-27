import { commandModule, CommandType } from '@sern/handler';
import { ApplicationCommandOptionType } from 'discord.js';
import moneySchema from '#schemas/money';
import { cooldown } from '#plugins';

export default commandModule({
  type: CommandType.Slash,
  //   plugins: [cooldown.],
  description: 'Economy commands.',
  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'shop',
      description: 'Explains how to use the Economy shop and its commands.',
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: 'shop-features',
          description: 'Which shop feature would you like to use?',
          required: true,
          autocomplete: true,
          command: {
            onEvent: [],
            async execute(auto) {
              const focus = auto.options.getFocused();
              const choices = ['buy', 'help', 'info', 'sell'];
              const filtered = choices
                .filter(choice => choice.startsWith(focus))
                .slice(0, 25)
                .map(choice => {
                  let name = choice;
                  let value = choice;
                  return { name, value };
                });
              await auto.respond(filtered);
            }
          }
        }
      ]
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'basics',
      description: 'Basics on economy system.',
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: 'basic-features',
          description: 'Which basic feature would you like to use?',
          required: true,
          autocomplete: true,
          command: {
            onEvent: [],
            async execute(auto) {
              const focus = auto.options.getFocused();
              const choices = ['balance', 'deposit', 'help', 'steal', 'withdraw'];
              const filtered = choices
                .filter(choice => choice.toLowerCase().startsWith(focus))
                .slice(0, 25)
                .map(choice => {
                  let name = choice;
                  let value = choice;
                  return { name, value };
                });
              await auto.respond(filtered);
            }
          }
        },
        {
          type: ApplicationCommandOptionType.User,
          name: 'user',
          description: 'If supported, select a user.'
        }
      ]
    }
  ],
  execute: async ({ interaction }, tbd) => {
    const { options } = interaction;
    const sub = options.getSubcommand();
    switch (sub) {
      case 'shop':
        let shop = options.getString('shop-features');
        console.log(shop);
        switch (shop) {
          case '':
            break;

          default:
            break;
        }
        break;

      case 'basics':
        let basic = options.getString('basic-features');
        console.log(basic);
        switch (basic) {
          case 'balance':
            const user = interaction.options.getUser('user') ?? interaction.user;
            let money = await moneySchema.findOne({
              userID: user.id,
              serverID: interaction.guild?.id
            });
            const wallet = money?.wallet;
            const bank = money?.bank;
            await interaction.reply({
              content: `${user} holds ${wallet} coins on them and ${bank} in their bank.`,
              ephemeral: true
            });
            break;

          default:
            break;
        }
        break;
    }
  }
});
