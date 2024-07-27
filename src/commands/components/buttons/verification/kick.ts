import { commandModule, CommandType, Service } from '@sern/handler';
import { EmbedBuilder, GuildMember, TextInputBuilder, TextInputStyle } from 'discord.js';

export default commandModule({
  type: CommandType.Button,
  name: 'member-kick',
  plugins: [],
  execute: async (button, { deps }) => {
    await button.deferUpdate();
    const memberId = button.message.embeds[0].footer?.text!;
    const member = (await button.guild?.members.fetch())?.get(memberId)!;
    const { utils } = deps['@sern/client'];

    await button.showModal(
      utils.createModal('kick-modal', `Kick ${member.user.username}`, [
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
                value: modal.fields.getTextInputValue('kick-modal-reason')
              }
            ],
            footer: { text: '' }
          });
          const newMsg = await button.message.edit({
            embeds: [newEmbed],
            components: []
          });
          await newMsg.react('👋');
        }
      });
  }
});
