import { commandModule, CommandType } from '@sern/handler';
import { Channel, ChannelType, Collection, EmbedBuilder, Message, Snowflake, TextChannel } from 'discord.js';

export default commandModule({
  type: CommandType.Text,
  plugins: [],
  description: 'Manually verifies a user.',
  execute: async (ctx, { deps }) => {
    const [{ utils }, prisma] = [deps['@sern/client'], deps['prisma']];
    const { channelUpdater, deleteOnTimeout, isValidSnowflake, welcomeCreate } = utils;
    const guild = await prisma.guild.findFirst({ where: { gID: ctx.guildId! } });
    if (!guild) return;
    if (!ctx.options[0]) {
      const msg = await ctx.reply({
        content: `You need to provide the message id that was sent in <#${guild.modC}>.\nUsage: \`?verify <messageID>\` (replace <messageID> with the corresponding id.)`
      });
      return await deleteOnTimeout([msg, ctx.message], 5000);
    }
    try {
      if (isValidSnowflake(ctx.options[0]) === false) {
        let errorMsg = await ctx.reply({
          content: `${ctx.options[0]} is not a valid message id. Please try again <t:${Date.now() + 5000}:R>.`
        });
        await deleteOnTimeout(errorMsg, 6000);
      }

      if (ctx.channel!.isTextBased()) {
        const role = await ctx.message.guild?.roles.fetch(guild.verifiedRole);
        if (!role) {
          return;
        }
        const chan = ctx.message.guild?.channels.cache.get(guild.modC) as TextChannel;

        if (ctx.message.channel.type === ChannelType.GuildText) {
          ctx.message.guild?.channels.cache.each(async (channel: Channel) => {
            if (channel.isTextBased() && channel === chan) {
              const textChannel = channel as TextChannel;
              const messages: Collection<Snowflake, Message> = await textChannel.messages.fetch({ limit: 5 });
              if (messages.has(ctx.options[0])) {
                const msgToEdit = await chan.messages.fetch(ctx.options[0]);
                if (
                  msgToEdit.author.id !== ctx.message.guild?.members.me?.id &&
                  msgToEdit.embeds.length < 1 &&
                  isValidSnowflake(msgToEdit.embeds[0].footer?.text!) === false
                )
                  return;
                const memberId = msgToEdit.embeds[0].footer?.text!;
                const member = (await ctx.message.guild?.members.fetch())?.get(memberId)!;
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
                      value: `Manually passed by ${ctx.message.member}`
                    }
                  ],
                  footer: { text: '' }
                });
                await msgToEdit.edit({
                  embeds: [newEmbed],
                  components: []
                });
                const welcome = (await ctx.message.guild?.channels.fetch(guild.welcomeC)) as TextChannel;
                await prisma.member.delete({ where: { memberId: memberId } });
                const userCount = member.guild?.members.cache.filter(m => !m.user.bot).size!;

                await welcomeCreate(member, member.guild.name, userCount, welcome).then(async () => {
                  await channelUpdater(member.guild);
                });
              }
            }
          });
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
});
