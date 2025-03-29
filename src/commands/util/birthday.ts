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
      description: 'Select the user to add manually. (Only for Admins)'
    },
    {
      type: ApplicationCommandOptionType.String,
      name: 'date',
      description: 'Bday in (MM/DD) format.'
    }
  ],
  async execute(ctx, { deps }) {
    const [i, [birthdayModel, guildModel]] = [deps['task-logger'], [deps.prisma.birthday, deps.prisma.guild]];
    const guild = await guildModel.findFirst({
      where: {
        gID: ctx.guildId!
      }
    });
    const action = ctx.options.getString('action', true);
    const dateOption = ctx.options.getString('date');

    if (!dateOption || !i.bdays.isValidDate(dateOption)) {
      return await ctx.reply({
        flags: 64,
        content: 'Please provide a valid date in format: `MM/DD`'
      });
    }

    const date = dateOption;

    const userToAdd = ctx.options.getUser('user-to-add');
    if (!(ctx.member as GuildMember).permissions.has(PermissionFlagsBits.Administrator) && userToAdd) {
      return await ctx.reply({
        flags: 64,
        content: "You are missing permission: `Administrator`. You cannot manage other users' birthdays."
      });
    }

    const u = userToAdd ?? ctx.user;

    let guildBirthday = await birthdayModel.findFirst({
      where: {
        gID: ctx.guildId!
      },
      include: { birthdays: true }
    });

    if (!guildBirthday) {
      guildBirthday = await birthdayModel.create({
        data: {
          gID: ctx.guildId!,
          birthdays: []
        }
      });
    }
    const userBirthday = guildBirthday.birthdays.find(b => b.userID === u.id);

    let content = '';

    switch (action) {
      case 'edit':
        if (!userBirthday) {
          content = `I do not have ${
            u.id === ctx.user.id ? 'your' : `${userToAdd}'s`
          } birthday saved in my memory. Please set it first.`;
        } else if (userBirthday.date === date) {
          content = `That is the current date. Please use a different date.`;
        } else {
          await birthdayModel.update({
            where: { id: guildBirthday.id },
            data: {
              birthdays: {
                updateMany: {
                  where: { userID: u.id },
                  data: { nickname: u.displayName, date }
                }
              }
            }
          });
          content = `I have updated ${u.id === ctx.user.id ? 'your' : `${userToAdd}'s`} birthday to \`${date}\`.`;
        }
        break;

      case 'set':
        if (userBirthday) {
          content = `I already have ${
            u.id === ctx.user.id ? 'your' : `${userToAdd}'s`
          } birthday saved in my memory as \`${userBirthday.date}\`.`;
        } else {
          await birthdayModel.update({
            where: { id: guildBirthday.id },
            data: {
              birthdays: {
                push: {
                  nickname: u.displayName,
                  username: u.username,
                  date,
                  userID: u.id
                }
              }
            }
          });
          content = `I have set ${u.id === ctx.user.id ? 'your' : `${userToAdd}'s`} birthday as ${date}.`;
        }
        break;
      case 'delete':
        if (userBirthday) {
          await birthdayModel.update({
            where: { id: guildBirthday.id },
            data: {
              birthdays: {
                deleteMany: { where: { userID: u.id } }
              }
            }
          });
          content = `I have deleted ${u.id === ctx.user.id ? 'your' : `${userToAdd}'s`} birthday from my memory.`;
        } else {
          content = `I do not have ${
            u.id === ctx.user.id ? 'your' : `${userToAdd}'s`
          } birthday saved in my memory. Have you set it already?`;
          break;
        }
    }

    await ctx.reply({ flags: 64, content });
    //integrate multiguild separation
    await i.bdays.logBirthdays(ctx.guild!);
  }
});
