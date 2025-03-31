import { ButtonInteraction, GuildMember, TextChannel } from 'discord.js';
import { Service } from '@sern/handler';

export const gifs = [
  'https://i.imgur.com/f5DOAFz.gif',
  'https://i.imgur.com/mdFUdn4.gif',
  'https://i.imgur.com/CnQfH1w.gif',
  'https://i.imgur.com/I7gHjTl.gif',
  'https://i.imgur.com/fb5Tl3E.gif',
  'https://i.imgur.com/8IBM9kY.gif',
  'https://i.imgur.com/8yVGhcw.gif',
  'https://i.imgur.com/EOqtlZs.gif',
  'https://i.imgur.com/5S0KTnM.gif',
  'https://i.imgur.com/zb5n4qP.gif',
  'https://i.imgur.com/m074qMp.gif',
  'https://i.imgur.com/Hl2qAoQ.gif',
  'https://i.imgur.com/MIEV4L8.gif',
  'https://i.imgur.com/k4kZShH.gif',
  'https://i.imgur.com/aWyP4Lc.gif',
  'https://i.imgur.com/uHiWMCB.gif',
  'https://i.imgur.com/JL5ogD1.gif',
  'https://i.imgur.com/PYdFdsf.gif',
  'https://i.imgur.com/cVFf21A.gif',
  'https://i.imgur.com/fWQukMs.gif',
  'https://i.imgur.com/5oN1C8K.gif',
  'https://i.imgur.com/gsoosza.gif',
  'https://i.imgur.com/Z6qZMxj.gif',
  'https://i.imgur.com/Tf6BE4N.gif',
  'https://i.imgur.com/s6k4Y4v.gif',
  'https://i.imgur.com/rUji7HE.gif',
  'https://i.imgur.com/AhOWGfP.gif',
  'https://i.imgur.com/mnFmDMl.gif',
  'https://i.imgur.com/DZVEFlf.gif',
  'https://i.imgur.com/5iNejET.gif',
  'https://i.imgur.com/Uw2h9eG.gif',
  'https://i.imgur.com/XkNbhds.gif',
  'https://i.imgur.com/ppC3R0B.gif',
  'https://i.imgur.com/wsyK0Yy.gif',
  'https://i.imgur.com/cr6KL8b.gif',
  'https://i.imgur.com/IWL4w0g.gif',
  'https://i.imgur.com/ONtZNzW.gif',
  'https://i.imgur.com/4GcJFpT.gif',
  'https://i.imgur.com/a8Mtb2s.gif',
  'https://i.imgur.com/hyABHxi.gif',
  'https://i.imgur.com/q1eBTCD.gif'
];
export const welcomeEmojis = ['💕', '👌', '🙌', '<a:SHROOOOM:1179060921260322886>'];

export async function sticker(interaction: ButtonInteraction, memberId: string) {
  const db = Service('prisma').customWelcomeMessages;
  const buttonMember = interaction.member as GuildMember;

  if (interaction.user.id === memberId) {
    return await interaction.reply({
      content: "You don't need to wave to yourself...",
      ephemeral: true
    });
  }
  await interaction.guild?.members.fetch();
  let memberQuestion = await db.findUnique({
    where: {
      memberId: buttonMember.id
    }
  });
  let option = (arr: string[]) => Math.floor(Math.random() * arr.length);
  let hello = '';
  if (memberQuestion) {
    if (memberQuestion.random && memberQuestion.messagesArray.length >= 2) {
      hello = memberQuestion.messagesArray[option(memberQuestion.messagesArray)];
    } else {
      hello = memberQuestion.singleMessage ?? `:wave: Welcome to ${interaction.guild?.name}, <@${memberId}>`;
    }
  } else {
    const contents = [
      `:wave: Welcome to ${interaction.guild?.name}, <@${memberId}>`,
      `Hi <@${memberId}>! Welcome to our community! Please make yourself at home!`,
      `👋 Hello <@${memberId}>`,
      `I'm glad you're here, <@${memberId}>! Please pass the joint!`
    ];
    hello = contents[option(contents)];
  }
  if (hello.includes('{member}') || hello.includes('{guild}')) {
    hello = hello.replaceAll('{guild}', interaction.guild?.name!);
    hello = hello.replaceAll('{member}', `<@${memberId}>`);
  }
  console.log(hello);
  let img = gifs[option(gifs)];
  await webhookCreate(interaction.channel as TextChannel, buttonMember, hello, img ?? null);
}

export async function webhookCreate(channel: TextChannel, user: GuildMember, msg: string, file?: string) {
  await channel
    .createWebhook({
      name: user.displayName,
      avatar: user.displayAvatarURL()
    })
    .then(async s => {
      if (file) {
        await s.send({
          content: msg,
          files: [file],
          allowedMentions: {
            users: []
          }
        });
      } else {
        await s.send({
          content: msg,
          allowedMentions: {
            users: []
          }
        });
      }

      setTimeout(async () => {
        await s.delete();
      }, 5000);
    });
}
