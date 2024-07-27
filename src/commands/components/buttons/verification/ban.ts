import { commandModule, CommandType } from '@sern/handler';
import { EmbedBuilder, GuildMember, TextInputBuilder, TextInputStyle } from 'discord.js';
import memberSchema from '#schemas/member';

export default commandModule({
  type: CommandType.Button,
  name: 'member-ban',
  plugins: [],
  execute: async (button, { deps }) => {
    await button.deferUpdate();
    const memberId = button.message.embeds[0].footer?.text!;
    const member = await button.guild?.members.fetch(memberId)!;
    const { utils } = deps['@sern/client'];

    await button.showModal(
      utils.createModal('ban-modal', `Ban ${member.user.username}`, [
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
          const newEmbed = new EmbedBuilder({
            author: {
              name: 'New member was banned!',
              icon_url: member.client.user.displayAvatarURL()!
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
                value: modal.fields.getTextInputValue('ban-modal-reason')
              }
            ],
            footer: { text: '' }
          });
          const newMsg = await button.message.edit({
            embeds: [newEmbed],
            components: []
          });
          await newMsg.react('👋');
          await memberSchema.findOneAndDelete({ memberId: member.id });
        }
      });
  }
});
