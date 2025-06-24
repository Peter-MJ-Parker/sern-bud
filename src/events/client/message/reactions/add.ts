import { EventType, Service, eventModule } from '@sern/handler';
import { EmbedBuilder, Events, TextChannel } from 'discord.js';
import { channelUpdater, welcomeCreate } from '#utils';

export default eventModule({
  type: EventType.Discord,
  name: Events.MessageReactionAdd,
  execute: async (reaction, user) => {
    if (!reaction.message.inGuild()) return;
    let message = reaction.message;
    if (message.partial) await message.fetch();
    if (reaction.partial) await reaction.fetch();
    const prisma = Service('prisma');

    if (reaction.emoji.name === '🎉') {
      await message.react('<:flame_party:1285284996264886352>');
    }
    const counts = {
      users: message.guild.members.cache.filter(m => !m.user.bot).size!,
      bots: message.guild.members.cache.filter(m => m.user.bot).size!,
      total: message.guild.memberCount!
    };

    if (user.bot) return;
    if (!reaction.message.guild) return;
    let mmm = reaction.message.guild.members.cache.get(user.id)!;
    const Guild = await prisma.guild.findFirst({
      where: {
        gID: mmm.guild.id
      }
    });
    if (!Guild) return;
    if (message.id === Guild.reactionMessageID && reaction.emoji.toString()) {
      let vRole = message.guild?.roles.cache.get(Guild.verifiedRole);
      if (!vRole) return;
      if (!mmm.roles.cache.has(vRole.id)) {
        if (mmm.guild.memberCount === Guild.allCount) return;
        await message.guild.members.cache
          .get(user.id)
          ?.roles.add(vRole)
          .catch(err => console.log(err));
        console.log(`${user.username} reacted with ${reaction.emoji.name} and gained role: ${vRole.name}.`);
        await message.channel
          .send(
            `${mmm}, You may now go to <#${Guild.introC}> to introduce yourself and get your roles in <#${Guild.rolesChannelId}>.`
          )
          .then(async m => {
            setTimeout(() => {
              m.delete().catch(err => {
                console.log("Regular Error. Couldn't Delete the message.\n" + err);
              });
            }, 5 * 1000);
          });
        const WelcomeChannel = mmm.guild.channels.cache.get(Guild.welcomeC) as TextChannel;
        await welcomeCreate(mmm, mmm.guild.name, counts.users, mmm.guild.systemChannel ?? WelcomeChannel, {
          intro: Guild.introC,
          roles: Guild.rolesChannelId
        }).then(async () => {
          const Verification = await prisma.member.findFirst({
            where: { memberId: mmm.id }
          });
          if (!Verification) return;
          const channel = (await message.guild?.channels.fetch(Guild.modC)) as TextChannel;
          const msg = await channel.messages.fetch(Verification.messageId);
          await msg
            .edit({
              components: [],
              embeds: [
                EmbedBuilder.from(msg.embeds[0])
                  .setFields([
                    {
                      name: 'Verification: ',
                      value: `✅ - ${mmm} successfully verified!`
                    }
                  ])
                  .setFooter(null)
              ]
            })
            .then(async () => {
              await prisma.member.delete({ where: { id: Verification.id } });
            })
            .finally(async () => {
              await channelUpdater(mmm.guild);
            });
        });
      }
    }
  }
});
