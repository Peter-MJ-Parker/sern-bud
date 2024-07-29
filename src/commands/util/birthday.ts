import { commandModule, CommandType } from '@sern/handler';
import { ApplicationCommandOptionType, GuildMember, PermissionFlagsBits } from 'discord.js';

export default commandModule({
  type: CommandType.Slash,
  description: 'Manage birthdays in my memory.',
  plugins: [],
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: 'action',
      description: 'What would you like to do?',
      required: true,
      choices: [
        { name: 'Set a birthday', value: 'set' },
        { name: 'Change a birthday', value: 'edit' },
        { name: 'Delete a birthday', value: 'delete' }
      ]
    },
    {
      type: ApplicationCommandOptionType.User,
      name: 'user-to-add',
      description: 'Select the user to add manually.'
    },
    {
      type: ApplicationCommandOptionType.String,
      name: 'date',
      description: 'Bday in (MM-DD) format.'
    }
  ],
  async execute(ctx, { deps }) {
    const { birthday: birthdays } = deps.prisma;
    const i = deps['task-logger'];
    const str = ctx.options.getString('action', true);
    let date = ctx.options.getString('date');
    if ((str !== 'delete' && !date) || (str !== 'delete' && date && !i.isValidDate(date))) {
      return await ctx.reply({
        ephemeral: true,
        content: 'Please provide a date in format: `MM-DD`'
      });
    } else {
      date = ctx.options.getString('date', true);
      let userToAdd = ctx.options.getUser('user-to-add');
      if (!(ctx.member as GuildMember).permissions.has(PermissionFlagsBits.Administrator) && userToAdd) {
        return await ctx.reply({
          ephemeral: true,
          content: "You are missing permission: `Administrator`. You cannot manage other users' birthdays."
        });
      }
      let content = '';
      let u = userToAdd ?? ctx.user;
      let birthday = await birthdays.findFirst({
        where: {
          gID: ctx.guildId!,
          userID: u.id
        }
      });
      switch (str) {
        case 'edit':
          if (birthday) {
            if (birthday.date === date) {
              content = `That is the current date. Please use a different date.`;
              break;
            }
            await birthdays.update({
              where: {
                id: birthday.id
              },
              data: {
                nickname: u.displayName,
                date
              }
            });
            content = `I have updated ${u.id === ctx.user.id ? 'your' : `${userToAdd}'s`} birthday to \`${date}\`.`;
            break;
          }
          content = `I do not have ${
            u.id === ctx.user.id ? 'your' : `${userToAdd}'s`
          } birthday saved in my memory. Please set it first.`;
          break;

        case 'delete':
          if (birthday) {
            await birthdays.delete({
              where: {
                id: birthday.id
              }
            });
            content = `I have deleted ${u.id === ctx.user.id ? 'your' : `${userToAdd}'s`} birthday from my memory.`;
            break;
          }
          content = `I do not have ${
            u.id === ctx.user.id ? 'your' : `${userToAdd}'s`
          } birthday saved in my memory. Please set it first.`;
          break;

        case 'set':
          if (birthday) {
            content = `I already have ${
              u.id === ctx.user.id ? 'your' : `${userToAdd}'s`
            } birthday saved in my memory as \`${birthday.date}\`.`;
            break;
          }
          await birthdays.create({
            data: {
              gID: ctx.guildId!,
              nickname: u.displayName,
              username: u.username,
              date,
              userID: u.id
            }
          });
          content = `I have set ${u.id === ctx.user.id ? 'your' : `${userToAdd}'s`} birthday as ${date}.`;
          break;
      }
      await ctx.reply({ ephemeral: true, content });
    }
  }
});
