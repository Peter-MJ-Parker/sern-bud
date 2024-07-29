import { commandModule, CommandType } from '@sern/handler';
import { publishConfig } from '@sern/publisher';
import { ApplicationCommandOptionType } from 'discord.js';

export default commandModule({
  type: CommandType.Slash,
  description: 'Manage birthdays in my memory.',
  plugins: [
    publishConfig({
      guildIds: ['678398938046267402']
    })
  ],
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: 'action',
      description: 'What would you like to do?',
      required: true,
      choices: [
        { name: 'Set your birthday', value: 'set' },
        { name: 'Change your birthday', value: 'edit' },
        { name: 'Delete your birthday', value: 'delete' },
        { name: 'Manage other birthdays', value: 'manage' }
      ]
    },
    {
      type: ApplicationCommandOptionType.String,
      name: 'date',
      description: 'Bday in (MM-DD) format.'
    },
    {
      type: ApplicationCommandOptionType.User,
      name: 'user-to-add',
      description: 'Select the user to add manually.'
    }
  ],
  async execute(ctx, { deps }) {
    const { birthday } = deps.prisma;
    const str = ctx.options.getString('action', true);
    let date = ctx.options.getString('date');
    if (
      ((str === 'set' || str === 'edit' || str === 'manage') && !date) ||
      ((str === 'set' || str === 'edit' || str === 'manage') && date && !isValidDate(date))
    ) {
      return await ctx.reply({
        ephemeral: true,
        content: 'Please provide a date in format: `MM-DD`'
      });
    } else {
      date = ctx.options.getString('date', true);
      let content = '';
      switch (str) {
        case 'edit':
          await birthday.upsert({
            where: {
              username: ctx.user.username,
              userID: ctx.userId
            },
            create: {
              gID: ctx.guildId!,
              nickname: ctx.user.displayName,
              username: ctx.user.username,
              date,
              userID: ctx.userId
            },
            update: {
              nickname: ctx.user.displayName,
              date
            }
          });
          content = `I have set your birthday as \`${date}\`.`;
          break;

        case 'delete':
          await birthday.delete({
            where: {
              userID: ctx.userId
            }
          });
          content = `I have deleted your birthday from my memory.`;
          break;

        case 'manage':
          const userToAdd = ctx.options.getUser('user-to-add');
          if (!userToAdd) {
            content = `Please pick a user to manage!`;
            break;
          }
          await birthday.upsert({
            where: {
              userID: userToAdd.id
            },
            create: {
              gID: ctx.guildId!,
              nickname: userToAdd.displayName,
              username: userToAdd.username,
              date,
              userID: userToAdd.id
            },
            update: {
              nickname: userToAdd.displayName,
              date
            }
          });
          content = `You have set ${userToAdd}'s birthday to: ${date}.`;
          break;

        case 'set':
          await birthday.create({
            data: {
              gID: ctx.guildId!,
              nickname: ctx.user.displayName,
              username: ctx.user.username,
              date,
              userID: ctx.userId
            }
          });
          content = `I have set your birthday as ${date}.`;
          break;
      }
      await ctx.reply({ ephemeral: true, content });
    }
  }
});
const dateRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

function isValidDate(dateString: string): boolean {
  if (!dateRegex.test(dateString)) {
    return false;
  }

  const [month, day] = dateString.split('-').map(Number);

  if (month === 2) {
    return day <= 29;
  } else if ([4, 6, 9, 11].includes(month)) {
    return day <= 30;
  } else {
    return true;
  }
}
