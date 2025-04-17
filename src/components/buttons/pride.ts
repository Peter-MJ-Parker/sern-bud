import { CommandType, commandModule } from '@sern/handler';

export default commandModule({
  type: CommandType.Button,
  async execute(ctx) {
    const member = await ctx.guild?.members.fetch(ctx.user.id)!;
    const bot = await ctx.guild?.members.fetch(ctx.client.user.id)!;
    await ctx.deferUpdate();
    if (member.roles.highest.position >= bot.roles.highest.position) {
      return await ctx.followUp({
        content: 'Sorry, your highest role above mine! I cannot set your nickname!',
        flags: 64
      });
    }
    await member
      ?.setNickname(`🌈 ${member.displayName}`)
      .then(() =>
        ctx.followUp({
          content: `Your nickname has been changed to include 🌈.`,
          flags: 64
        })
      )
      .catch((error: any) => {
        console.log('Error in pride button:', error);
        if (error.code === 50013) {
          return ctx.followUp({
            content: 'I do not have permission to change your nickname.',
            flags: 64
          });
        }
        if (error.code === 50035) {
          return ctx.followUp({
            content: 'Your nickname is too long.',
            flags: 64
          });
        }
        ctx.followUp({
          content: 'unknown error, please message the bot owner.',
          flags: 64
        });
      });
  }
});
