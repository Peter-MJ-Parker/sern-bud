import { EventType, eventModule } from '@sern/handler';
import { Events, GuildMember, MessageReaction, PartialMessageReaction, User } from 'discord.js';
import guildSchema from '#schemas/guild';

export default eventModule({
  type: EventType.Discord,
  name: Events.MessageReactionRemove,
  execute: async (reaction: MessageReaction | PartialMessageReaction, user: User) => {
    if (!reaction.message.inGuild()) return;
    if (reaction.message.guild.id !== '678398938046267402') return;
    let msg = reaction.message;

    if (msg.partial) await msg.fetch();
    if (reaction.partial) await reaction.fetch();

    if (user.bot) return;

    if (msg.id === '744940669834887218' && reaction.emoji.toString()) {
      const Guild = await guildSchema.findOne({
        gID: msg.guild.id
      });
      let verifiedRole = Guild?.verifiedRole;
      if (!verifiedRole) return;

      let lilbud = msg.guild.roles.cache.get(verifiedRole);
      if (lilbud) {
        let mem = (await msg.guild.members.fetch(user)) as GuildMember;
        if (mem.roles.cache.has(lilbud.id) && mem.moderatable === true) {
          console.log(user.username + ' removed reaction ' + reaction.emoji.name + 'and lost role: ' + lilbud.name);
        } else {
          console.log(user.username + ' removed reaction ' + reaction.emoji.name);
        }
      } else return console.log('non-existent role');
    }
  }
});
