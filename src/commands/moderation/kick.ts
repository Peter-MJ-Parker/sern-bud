import { requirePermission } from '#plugins';
import { commandModule, CommandType } from '@sern/handler';
import { EmbedBuilder, PermissionFlagsBits, TextChannel } from 'discord.js';

export default commandModule({
  type: CommandType.Text,
  plugins: [requirePermission('both', [PermissionFlagsBits.BanMembers])],
  execute: async (ctx, { deps }) => {
    if (!ctx.options || !ctx.options[0] || !ctx.options[1]) {
      return await ctx.reply({
        embeds: [
          new EmbedBuilder({
            title: 'Invalid command usage!',
            description: `To manually kick a member here:
        - Get the message id by holding shift on a message
        - Click on \`Copy Message ID\`
        - Run the command: \`?kick <messageID> <reason for kick>\`
            - Here is an example to get a message id.
        `,
            image: {
              url: 'https://cdn.discordapp.com/attachments/833761882212663317/1267189192912273428/example.png?ex=66a7e166&is=66a68fe6&hm=8e40ef1641461dbb56e054196def2352a5736000f870b7ae9a0260ae227782b3&'
            }
          })
        ]
      });
    }
    const [messageId, reason] = ctx.options;
    const message = await (ctx.guild!.channels.cache.get(ctx.channelId) as TextChannel).messages.fetch(messageId);
    if (!message || !message.embeds) {
      return ctx.reply(
        'That message does not exist in this channel or is an invalid message to perform this command on!'
      );
    }
    const memberId = message.embeds[0].footer?.text!;
    const member = (await ctx.guild?.members.fetch())?.get(memberId)!;
    const [c, prisma] = [deps['@sern/client'], deps['prisma']];
    const guild = await prisma.guild.findFirst({
      where: {
        gID: ctx.guildId!
      }
    });
    if (!guild) {
      return await ctx.reply({
        flags: 64,
        content: 'I could not find any info for this guild in my database!'
      });
    }
    const memberData = await prisma.member.findFirst({
      where: {
        memberId: member.id
      }
    });
    if (!memberData) {
      return await ctx.reply({
        flags: 64,
        content: 'I could not find data for the specified member in my database!'
      });
    }
    const newEmbed = new EmbedBuilder({
      author: {
        name: 'New member was kicked!',
        icon_url: c.user!.displayAvatarURL()!
      },
      title: member.user.username,
      thumbnail: { url: member.avatarURL()! },
      fields: [
        {
          name: 'Verification: ',
          value: `User was kicked by ${ctx.member!}`
        },
        {
          name: 'Reason:',
          value: reason
        }
      ],
      footer: { text: '' }
    });
    const newMsg = await message.edit({
      embeds: [newEmbed],
      components: []
    });
    await newMsg.react('👋');
    await prisma.member.delete({ where: { id: memberData.id } });
    await member.kick(reason);
    return await newMsg.react('✅');
  }
});
