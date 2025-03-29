import { CommandType, commandModule } from '@sern/handler';

export default commandModule({
  type: CommandType.Button,
  async execute(ctx) {
    const member = await ctx.guild?.members.fetch(ctx.user.id);
    await ctx.deferUpdate();
    await member?.setNickname(`🌈 ${member.displayName}`).catch(() => {
      ctx.followUp({
        content: 'Sorry, your highest role above mine! I cannot set your nickname!',
        flags: 64,
      });
    });
  }
});
