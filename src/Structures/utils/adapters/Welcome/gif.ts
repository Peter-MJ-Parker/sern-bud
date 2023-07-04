import { Service } from "@sern/handler";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
  EmbedBuilder,
  TextChannel,
  User,
} from "discord.js";

const gifs = [
  "https://i.imgur.com/f5DOAFz.gif",
  "https://i.imgur.com/mdFUdn4.gif",
  "https://i.imgur.com/CnQfH1w.gif",
  "https://i.imgur.com/I7gHjTl.gif",
  "https://i.imgur.com/fb5Tl3E.gif",
  "https://i.imgur.com/8IBM9kY.gif",
  "https://i.imgur.com/8yVGhcw.gif",
  "https://i.imgur.com/EOqtlZs.gif",
  "https://i.imgur.com/5S0KTnM.gif",
  "https://i.imgur.com/zb5n4qP.gif",
  "https://i.imgur.com/m074qMp.gif",
  "https://i.imgur.com/Hl2qAoQ.gif",
  "https://i.imgur.com/MIEV4L8.gif",
  "https://i.imgur.com/k4kZShH.gif",
  "https://i.imgur.com/aWyP4Lc.gif",
  "https://i.imgur.com/uHiWMCB.gif",
  "https://i.imgur.com/JL5ogD1.gif",
  "https://i.imgur.com/PYdFdsf.gif",
  "https://i.imgur.com/cVFf21A.gif",
  "https://i.imgur.com/fWQukMs.gif",
  "https://i.imgur.com/5oN1C8K.gif",
  "https://i.imgur.com/gsoosza.gif",
  "https://i.imgur.com/Z6qZMxj.gif",
  "https://i.imgur.com/Tf6BE4N.gif",
  "https://i.imgur.com/s6k4Y4v.gif",
  "https://i.imgur.com/rUji7HE.gif",
  "https://i.imgur.com/AhOWGfP.gif",
  "https://i.imgur.com/mnFmDMl.gif",
  "https://i.imgur.com/DZVEFlf.gif",
  "https://i.imgur.com/5iNejET.gif",
  "https://i.imgur.com/Uw2h9eG.gif",
  "https://i.imgur.com/XkNbhds.gif",
  "https://i.imgur.com/ppC3R0B.gif",
  "https://i.imgur.com/wsyK0Yy.gif",
  "https://i.imgur.com/cr6KL8b.gif",
  "https://astra.ifunny.lol/8dT4ODrgQs.gif",
  "https://i.imgur.com/IWL4w0g.gif",
  "https://i.imgur.com/ONtZNzW.gif",
  "https://i.imgur.com/4GcJFpT.gif",
  "https://i.imgur.com/a8Mtb2s.gif",
  "https://i.imgur.com/hyABHxi.gif",
  "https://i.imgur.com/q1eBTCD.gif",
];
export async function sticker(interaction: ButtonInteraction) {
  let img = gifs[Math.floor(Math.random() * gifs.length) + 1];
  let member = `<@${interaction.message.attachments
    .first()
    ?.name?.split("-")[1]
    .slice(0, -4)}>`;

  const contents = [
    `:wave: Welcome to ${interaction.guild?.name}, ${member}`,
    `${member}, Welcome to ${interaction.guild?.name}. Please leave your negativity at the door.`,
    `Hi ${member}! Welcome to our community! Please make yourself at home!`,
    `👋 Hello ${member}`,
  ];
  let option = Math.floor(Math.random() * contents.length);
  let hello = contents[option];
  const userId = Service("@sern/utils").getId(member);
  if (interaction.user.id === userId) {
    await interaction.reply({
      content: "You don't need to wave to yourself...",
      ephemeral: true,
    });
  }
  await interaction.deferUpdate();
  await webhookCreate(
    interaction.channel as TextChannel,
    interaction.user,
    hello,
    img
  );
}

export async function webhookCreate(
  channel: TextChannel,
  user: User,
  msg: string,
  file?: string
) {
  channel
    .createWebhook({
      name: user.username,
      avatar: user.displayAvatarURL(),
    })
    .then(async (s) => {
      if (file) {
        await s.send({
          content: msg,
          files: [file],
        });
      } else {
        await s.send({
          content: msg,
        });
      }

      setTimeout(async () => {
        await s.delete();
      }, 5000);
    });
}

export async function findEmoji(interaction: ChatInputCommandInteraction) {
  let emos: object[] = [];
  let math: number;
  let newEmo: any;
  await fetch("https://emoji.gg/api/", {
    method: "GET",
  }).then(async (res) => {
    await res
      .json()
      .then(async (data) => {
        data.forEach((e: any) => {
          emos.push({ name: e.title, url: e.image });
          math = Math.floor(Math.random() * emos.length + 1);
          newEmo = emos[math];
        });
        if (interaction.user.id === interaction.guild?.ownerId) {
          const embed1 = new EmbedBuilder({
            title: `${newEmo.name}`,
            image: { url: `${newEmo.url}`, height: 512, width: 512 },
          });
          const embed2 = new EmbedBuilder({
            description: `Would you like to add this emoji to your server?`,
          });

          let row1 = ["✅|Yes", "❌|No"].map((choice) => {
            const [emoji, name] = choice.split("|");
            return new ButtonBuilder({
              type: ComponentType.Button,
              custom_id: `emojiCreate-${name}`,
              label: name.toString(),
              emoji: emoji.toString(),
              style: ButtonStyle.Secondary,
            });
          });
          await interaction.reply({
            embeds: [embed1],
          });
          return await interaction.followUp({
            embeds: [embed2],
            components: [
              new ActionRowBuilder<ButtonBuilder>({
                type: 1,
                components: row1,
              }),
            ],
            ephemeral: true,
          });
        } else {
          return await interaction.reply({
            content: newEmo.url,
          });
        }
      })
      .catch(async (error) => {
        await interaction.reply({
          content: `Sorry I couldn't fetch an emoji. Please try again.\n${error.message}`,
          ephemeral: true,
        });
      });
  });
}
