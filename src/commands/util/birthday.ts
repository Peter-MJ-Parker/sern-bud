import { commandModule, CommandType } from '@sern/handler';
import { ApplicationCommandOptionType, GuildMember, PermissionFlagsBits, User } from 'discord.js';

export default commandModule({
  type: CommandType.Slash,
  description: 'Manage birthdays in my memory.',
  plugins: [],
  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'set',
      description: 'Set a birthday.',
      options: [
        {
          type: ApplicationCommandOptionType.User,
          name: 'user-to-add',
          description: 'Select the user to add manually.',
          required: true
        },
        {
          type: ApplicationCommandOptionType.String,
          name: 'date',
          description: 'Birthday in (MM/DD) format.',
          required: true
        }
      ]
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'edit',
      description: 'Edit a birthday.',
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: 'user-to-edit',
          description: 'Select the user to edit manually.',
          autocomplete: true,
          required: true,
          command: {
            onEvent: [],
            async execute(ctx, { deps }) {
              const focusedOption = ctx.options.getFocused().toLowerCase();
              let res: { name: string; value: string }[] = [];
              const guildBirthday = await deps.prisma.birthday.findUnique({
                where: {
                  gID: ctx.guildId!
                },
                select: { birthdays: true }
              });
              if (!guildBirthday) {
                res = [{ name: 'No birthdays found', value: 'none' }];
                return await ctx.respond(res);
              }

              const userBirthday = guildBirthday.birthdays.find(b => b.userID === ctx.user.id);
              if (!(ctx.member as GuildMember).permissions.has(PermissionFlagsBits.Administrator)) {
                if (!userBirthday) {
                  res = [{ name: "You do not have permission to manage other users' birthdays.", value: 'non-admin' }];
                  return await ctx.respond(res);
                } else {
                  res = [{ name: `${userBirthday.username} (${userBirthday.date})`, value: userBirthday.userID }];
                  return await ctx.respond(res);
                }
              }
              res = guildBirthday.birthdays.map(b => ({
                name: `${b.username} (${b.date})`,
                value: b.userID
              }));
              const filter = res
                .filter(f => f.name.toLowerCase().startsWith(focusedOption))
                .map(choice => ({ name: choice.name, value: choice.value }))
                .slice(0, 25);
              await ctx.respond(filter);
            }
          }
        },
        {
          type: ApplicationCommandOptionType.String,
          name: 'edit-date',
          description: 'Birthday in (MM/DD) format.',
          required: true
        }
      ]
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'delete',
      description: 'Delete a birthday.',
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: 'user-to-delete',
          description: 'Select the user to delete manually.',
          autocomplete: true,
          required: true,
          command: {
            onEvent: [],
            async execute(ctx, { deps }) {
              const focusedOption = ctx.options.getFocused().toLowerCase();
              let res: { name: string; value: string }[] = [];

              const guildBirthday = await deps.prisma.birthday.findUnique({
                where: {
                  gID: ctx.guildId!
                },
                select: { birthdays: true }
              });
              if (!guildBirthday) {
                res = [{ name: 'No birthdays found', value: 'none' }];
                return await ctx.respond(res);
              }
              const userBirthday = guildBirthday.birthdays.find(b => b.userID === ctx.user.id);
              if (!(ctx.member as GuildMember).permissions.has(PermissionFlagsBits.Administrator)) {
                if (!userBirthday) {
                  res = [{ name: 'Your birthday is not set!', value: 'non-admin' }];
                  return await ctx.respond(res);
                } else {
                  res = [{ name: `${userBirthday.username} (${userBirthday.date})`, value: userBirthday.userID }];
                  return await ctx.respond(res);
                }
              }
              res = guildBirthday.birthdays.map(b => ({
                name: `${b.username} (${b.date})`,
                value: b.userID
              }));
              const filter = res
                .filter(f => f.name.toLowerCase().startsWith(focusedOption))
                .map(choice => ({ name: choice.name, value: choice.value }))
                .slice(0, 25);
              await ctx.respond(filter);
            }
          }
        }
      ]
    }
  ],
  async execute(ctx, { deps }) {
    const [c, i, birthdayModel, guildModel] = [
      deps['@sern/client'],
      deps['task-logger'],
      deps.prisma.birthday,
      deps.prisma.guild
    ];
    const sub = ctx.options.getSubcommand(true);
    const members = await ctx.guild?.members.fetch()!;
    let userToAdd = ctx.options.getUser('user-to-add', false);
    let userToEdit = ctx.options.getString('user-to-edit', false);
    let userToDelete = ctx.options.getString('user-to-delete', false);
    let content = '';
    let _guild = await guildModel.findFirst({
      where: {
        gID: ctx.guildId!
      }
    });

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
    const userBirthday = guildBirthday.birthdays.find(
      b => b.userID === (userToAdd?.id || userToEdit || userToDelete || ctx.user.id)
    );

    const pronoun = (user: User | string | undefined) => {
      if (user instanceof User) {
        return user.id === ctx.user.id ? 'your' : `${user}'s`;
      } else if (typeof user === 'string') {
        return user === ctx.user.id ? 'your' : `<@${user}>'s`;
      } else {
        return 'unknown user';
      }
    };

    const actions = {
      set: async () => {
        userToAdd = ctx.options.getUser('user-to-add', true);
        if (userToAdd.bot) return { flags: 64, content: 'You cannot add a bot to my database, geek!' };
        if (!(ctx.member as GuildMember).permissions.has(PermissionFlagsBits.Administrator) && userToAdd !== ctx.user) {
          return { flags: 64, content: "You do not have permission to manage other users' birthdays." };
        }
        let date = ctx.options.getString('date', true);
        if (!date || !i.bdays.isValidDate(date)) {
          return { flags: 64, content: 'Please provide a date in format: `MM/DD`' };
        }

        if (userBirthday) {
          content = `I already have ${pronoun(userToAdd)} birthday saved in my memory as \`${userBirthday.date}\`.`;
        } else {
          await birthdayModel.update({
            where: { id: guildBirthday.id },
            data: {
              birthdays: {
                push: {
                  nickname: userToAdd.displayName,
                  username: userToAdd.username,
                  date,
                  userID: userToAdd.id
                }
              }
            }
          });
          content = `I have set ${pronoun(userToAdd)} birthday as ${date}.`;

          if (userToAdd.id === ctx.user.id && date === c.utils.today) {
            content += ` 🎉 Happy Birthday! 🎂`;
            await c.utils.bdayAnnouncement(ctx, [`<@${userToAdd.id}>`]);
          }
        }
        return { flags: 64, content };
      },
      edit: async () => {
        userToEdit = ctx.options.getString('user-to-edit', true);
        if (userToEdit === 'none') {
          return { flags: 64, content: 'No birthdays were found to edit.' };
        } else if (userToEdit === 'non-admin') {
          return { flags: 64, content: 'You do not have your birthday set.' };
        }
        let date = ctx.options.getString('edit-date', true);
        if (!date || !i.bdays.isValidDate(date)) {
          return { flags: 64, content: 'Please provide a new date in format: `MM/DD`' };
        }

        const { user: editableUser } = members.get(userToEdit)!;
        if (!userBirthday) {
          return {
            flags: 64,
            content: `I do not have ${pronoun(editableUser)} birthday saved in my memory. Please set it first.`
          };
        } else if (userBirthday.date === date) {
          return { flags: 64, content: `That is the current date. Please use a different date.` };
        } else {
          await birthdayModel.update({
            where: { id: guildBirthday.id },
            data: {
              birthdays: {
                updateMany: {
                  where: { userID: userToEdit },
                  data: { nickname: editableUser.displayName, date }
                }
              }
            }
          });

          content = `I have updated ${pronoun(editableUser)} birthday to \`${date}\`.`;
          if (userToEdit === ctx.user.id && date === c.utils.today) {
            content += ` 🎉 Happy Birthday! 🎂`;
            await c.utils.bdayAnnouncement(ctx, [`<@${userToEdit}>`]);
          }

          return { flags: 64, content };
        }
      },
      delete: async () => {
        userToDelete = ctx.options.getString('user-to-delete', true);
        switch (userToDelete) {
          case 'none':
            content = 'No birthdays were found to delete.';
            break;
          case 'non-admin':
            content = 'You do not have your birthday set.';
            break;
          default:
            const deletableUser = members.get(userToDelete)?.user;
            const birthdayToDelete = guildBirthday.birthdays.find(b => b.userID === userToDelete)!;
            let str = '';
            if (!deletableUser) {
              str = pronoun(birthdayToDelete.userID);
            } else {
              str = pronoun(deletableUser);
            }
            if (birthdayToDelete) {
              await birthdayModel.update({
                where: { id: guildBirthday.id },
                data: {
                  birthdays: {
                    deleteMany: { where: { userID: userToDelete } }
                  }
                }
              });
              content = `I have deleted ${str} birthday from my memory.`;
            } else {
              content = `I do not have ${str} birthday saved in my memory. Have you set it already?`;
            }
            break;
        }
        return { flags: 64, content };
      }
    };

    type SubKey = keyof typeof actions;

    const result = await actions[sub as SubKey]();
    if (result) {
      await ctx.reply(result);
    }

    //integrate multiguild separation
    await i.bdays.logBirthdays(ctx.guild!);
  }
});
