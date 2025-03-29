import { EventType, eventModule, Service } from '@sern/handler';
import {
  ActionRowBuilder,
  AuditLogEvent,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Events,
  GuildMember,
  TextChannel
} from 'discord.js';

export default eventModule({
  type: EventType.Discord,
  name: Events.GuildMemberAdd,
  async execute(member: GuildMember) {
    const prisma = Service('prisma');
    const Guild = await prisma.guild.findFirst({
      where: { gID: member.guild.id }
    });
    if (!Guild) return;
    let Verification = await prisma.member.findFirst({ where: { memberId: member.id } });

    let mod = member.guild?.channels.cache.get(Guild.modC) as TextChannel;
    if (member.user.bot) {
      let botAdd = (
        await member.guild.fetchAuditLogs({
          limit: 1,
          type: AuditLogEvent.BotAdd
        })
      ).entries.first()!;
      const { executor, target, targetId } = botAdd;
      return await mod.send({
        embeds: [
          {
            author: {
              name: target?.username!,
              url: `https://discord.com/users/${targetId}`,
              icon_url: target?.defaultAvatarURL!
            },
            description: `A new bot has been invited to the guild by ${executor?.username}. Please add roles manually as desired.`
          }
        ]
      });
    }

    let embeds = [
      new EmbedBuilder({
        author: {
          name: 'New member joined!',
          icon_url: member.client.user.displayAvatarURL()!
        },
        title: member.user.username,
        thumbnail: { url: member.avatarURL()! },
        fields: [
          {
            name: 'Verification: ',
            value: `<a:loading:1039716650242555904> Pending...`
          }
        ],
        footer: {
          text: member.id
        }
      })
    ];

    const components = [
      new ActionRowBuilder<ButtonBuilder>({
        components: ['✅|Bypass-Verify', '👢|Kick', '💥|Ban'].map(button => {
          const [emoji, name] = button.split('|');
          return new ButtonBuilder({
            custom_id: `member/${name.toLowerCase().toString()}`,
            style: emoji === '✅' ? ButtonStyle.Success : ButtonStyle.Danger,
            label: name.toString(),
            emoji: emoji.toString()
          });
        })
      })
    ];
    let msg = await mod.send({
      embeds,
      components
    });
    if (!Verification) {
      Verification = await prisma.member.create({
        data: { memberId: member.id, messageId: msg.id }
      });
    } else {
      if (Verification && Verification.messageId !== msg.id) {
        const oldMessage = await mod.messages.fetch(Verification.messageId!);
        if (oldMessage) {
          await oldMessage.delete().then(async () => {
            await prisma.member.update({
              where: { id: Verification?.id! },
              data: {
                messageId: msg.id
              }
            });
          });
        }
      }
    }
  }
});
