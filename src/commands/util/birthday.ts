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
          description: 'Select the user to add manually. (Only for Admins)'
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
          description: 'Select the user to edit manually. (Only for Admins)',
          autocomplete: true,
          command: {
            onEvent: [],
            async execute(ctx, { deps }) {
              if (!(ctx.member as GuildMember).permissions.has(PermissionFlagsBits.Administrator)) {
                return [{ name: "You do not have permission to manage other users' birthdays.", value: 'non-admin' }];
              }
              const guildBirthday = await deps.prisma.birthday.findFirst({
                where: {
                  gID: ctx.guildId!
                },
                include: { birthdays: true }
              });
              if (!guildBirthday) return [{ name: 'No birthdays found', value: 'none' }];

              return guildBirthday.birthdays.map(b => ({
                name: `${b.nickname} (${b.date})`,
                value: b.userID
              }));
            }
          }
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
      name: 'delete',
      description: 'Delete a birthday.',
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: 'user-to-delete',
          description: 'Select the user to delete manually. (Only for Admins)',
          autocomplete: true,
          command: {
            onEvent: [],
            async execute(ctx, { deps }) {
              if (!(ctx.member as GuildMember).permissions.has(PermissionFlagsBits.Administrator)) {
                return [{ name: "You do not have permission to manage other users' birthdays.", value: 'non-admin' }];
              }
              const guildBirthday = await deps.prisma.birthday.findFirst({
                where: {
                  gID: ctx.guildId!
                },
                include: { birthdays: true }
              });
              if (!guildBirthday) return [{ name: 'No birthdays found', value: 'none' }];

              return guildBirthday.birthdays.map(b => ({
                name: `${b.nickname} (${b.date})`,
                value: b.userID
              }));
            }
          }
        }
      ]
    }
  ],
  async execute(ctx, { deps }) {
    const [i, birthdayModel] = [deps['task-logger'], deps.prisma.birthday];
    const sub = ctx.options.getSubcommand(true);
    const members = await ctx.guild?.members.fetch()!;
    let userToAdd = ctx.options.getUser('user-to-add', false);
    let userToEdit = ctx.options.getString('user-to-edit', false);
    let userToDelete = ctx.options.getString('user-to-delete', false);
    let content = '';

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

    const pronoun = (user: User) => (user.id === ctx.user.id ? 'your' : `${user}'s`);

    const actions = {
      set: async () => {
        let date = ctx.options.getString('date', true);
        if (!date || !i.bdays.isValidDate(date)) {
          content = 'Please provide a date in format: `MM/DD`';
        }
        if (!userToAdd) {
          userToAdd = ctx.user;
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
        }
        return { flags: 64, content };
      },
      edit: async () => {
        if (userToEdit === 'none') {
          content = 'No birthdays were found to edit.';
        } else if (userToEdit === 'non-admin') {
          content = "You do not have permission to manage other users' birthdays.";
        }
        let date = ctx.options.getString('date', true);
        if (!date || !i.bdays.isValidDate(date)) {
          content = 'Please provide a new date in format: `MM/DD`';
        }
        if (!userToEdit) {
          userToEdit = ctx.user.id;
        }
        const { user: editableUser } = members.get(userToEdit)!;
        if (!userBirthday) {
          content = `I do not have ${pronoun(editableUser)} birthday saved in my memory. Please set it first.`;
        } else if (userBirthday.date === date) {
          content = `That is the current date. Please use a different date.`;
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
        }
        return { flags: 64, content };
      },
      delete: async () => {
        switch (userToDelete) {
          case 'none':
            content = 'No birthdays were found to delete.';
            break;
          case 'non-admin':
            content = "You do not have permission to manage other users' birthdays.";
            break;
          default:
            if (!userToDelete) {
              userToDelete = ctx.user.id;
            }
            const { user: deletableUser } = members.get(userToDelete)!;
            if (userBirthday) {
              await birthdayModel.update({
                where: { id: guildBirthday.id },
                data: {
                  birthdays: {
                    deleteMany: { where: { userID: userToDelete } }
                  }
                }
              });
              content = `I have deleted ${pronoun(deletableUser)} birthday from my memory.`;
            } else {
              content = `I do not have ${pronoun(deletableUser)} birthday saved in my memory. Have you set it already?`;
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
