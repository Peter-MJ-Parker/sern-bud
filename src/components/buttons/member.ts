import { commandModule, CommandType } from '@sern/handler';
import { EmbedBuilder, type GuildMember, TextInputBuilder, TextInputStyle, type TextChannel } from 'discord.js';

export default commandModule({
  type: CommandType.Button,
  plugins: [],
  execute: async (button, { deps, params }) => {
    const memberId = button.message.embeds[0].footer!.text;
    const member = (await button.guild?.members.fetch())?.get(memberId)!;
    const [c, p] = [deps['@sern/client'], deps['prisma']];
    const guild = await p.guild.findFirst({
      where: {
        gID: button.guildId!
      }
    });
    if (!guild) {
      return await button.reply({
        flags: 64,
        content: 'I could not find any info for this guild in my database!'
      });
    }
    const memberData = await p.member.findFirst({
      where: {
        memberId: member.id
      }
    });
    if (!memberData) {
      return await button.reply({
        flags: 64,
        content: 'I could not find data for the specified member in my database!'
      });
    }
    await button.deferUpdate();

    switch (params) {
      case 'ban':
        await button.showModal(
          c.utils.createModal('ban-modal', `Ban ${member.user.username}`, [
            new TextInputBuilder({
              custom_id: 'ban-modal-reason',
              label: `Reason`,
              placeholder: `What is your reason for banning ${member.displayName}?`,
              style: TextInputStyle.Paragraph,
              min_length: 4,
              max_length: 100,
              required: true
            })
          ])
        );
        await button
          .awaitModalSubmit({
            time: 60000,
            filter: b => b.customId === 'ban-modal'
          })
          .then(async modal => {
            const buttonMember = button.member as GuildMember;
            if (!modal) {
              console.log(buttonMember.displayName + ' cancelled the ban modal.');
            } else {
              const reason = modal.fields.getTextInputValue('ban-modal-reason');
              const newEmbed = new EmbedBuilder({
                author: {
                  name: 'New member was banned!',
                  icon_url: c.user!.displayAvatarURL()!
                },
                title: member.user.username,
                thumbnail: { url: member.avatarURL()! },
                fields: [
                  {
                    name: 'Verification: ',
                    value: `User was banned by ${buttonMember}`
                  },
                  {
                    name: 'Reason:',
                    value: reason
                  }
                ],
                footer: { text: '' }
              });
              const newMsg = await button.message.edit({
                embeds: [newEmbed],
                components: []
              });
              await newMsg.react('👋');
              await p.member.delete({ where: { id: memberData.id } });
              return await member.ban({ reason });
            }
          });
        break;
      case 'kick':
        await button.showModal(
          c.utils.createModal('kick-modal', `Kick ${member.user.username}`, [
            new TextInputBuilder({
              custom_id: 'kick-modal-reason',
              label: `Reason`,
              placeholder: `What is your reason for kicking ${member.displayName}?`,
              style: TextInputStyle.Short,
              min_length: 4,
              max_length: 100,
              required: true
            })
          ])
        );
        await button
          .awaitModalSubmit({
            time: 60000,
            filter: b => b.customId === 'kick-modal'
          })
          .then(async modal => {
            const buttonMember = button.member as GuildMember;
            if (!modal) {
              console.log(buttonMember.displayName + ' cancelled the kick modal.');
            } else {
              const reason = modal.fields.getTextInputValue('kick-modal-reason');
              const newEmbed = new EmbedBuilder({
                author: {
                  name: 'New member was kicked!',
                  icon_url: member.client.user.displayAvatarURL()!
                },
                title: member.user.username,
                thumbnail: { url: member.avatarURL()! },
                fields: [
                  {
                    name: 'Verification: ',
                    value: `User was kicked by ${buttonMember}`
                  },
                  {
                    name: 'Reason:',
                    value: reason
                  }
                ],
                footer: { text: '' }
              });
              const newMsg = await button.message.edit({
                embeds: [newEmbed],
                components: []
              });
              await newMsg.react('👋');
              await p.member.delete({ where: { id: memberData.id } });
              return await member.kick(reason);
            }
          });
        break;
      case 'bypass-verify':
        const role = (await button.guild?.roles.fetch(guild?.verifiedRole!))!;

        if (!member.roles.cache.has(role.id)) await member.roles.add(role);
        const newEmbed = new EmbedBuilder({
          author: {
            name: 'New member verified!',
            icon_url: member.client.user.displayAvatarURL()!
          },
          title: member.user.username,
          thumbnail: { url: member.avatarURL()! },
          fields: [
            {
              name: 'Verification: ',
              value: `Manually passed by ${button.member}`
            }
          ],
          footer: { text: '' }
        });
        await button.message.edit({ embeds: [newEmbed], components: [] });
        const welcome = (await button.guild?.channels.fetch(guild.welcomeC)) as TextChannel;
        await p.member.delete({ where: { id: memberData.id } });
        const counts = {
          users: member.guild?.members.cache.filter(m => !m.user.bot).size!,
          bots: member.guild?.members.cache.filter(m => m.user.bot).size!,
          total: member.guild?.memberCount!
        };
        await c.utils
          .welcomeCreate(member, member.guild.name, counts.users, welcome, {
            intro: guild.introC,
            roles: guild.rolesChannelId
          })
          .then(async () => {
            await p.guild.update({
              where: {
                gID: member.guild.id
              },
              data: {
                allCount: counts.total,
                userCount: counts.users
              }
            });

            await c.utils.channelUpdater(member.guild);
          });
        break;
    }
  }
});
