import { commandModule, CommandType } from '@sern/handler';
import { Prisma } from '@prisma/client';

type CustomWelcomeMessagesCreateInput = Prisma.CustomWelcomeMessagesCreateInput;
type CustomWelcomeMessagesUpdateInput = Prisma.CustomWelcomeMessagesUpdateInput;

export default commandModule({
  type: CommandType.Modal,
  async execute(ctx, { deps, params }) {
    if (!params) return;
    const db = deps.prisma;

    const baseData: Pick<CustomWelcomeMessagesCreateInput, 'memberId' | 'random'> = {
      memberId: ctx.user.id,
      random: params === 'random'
    };

    let data: CustomWelcomeMessagesCreateInput & CustomWelcomeMessagesUpdateInput;
    let responseMessage: string;

    if (params === 'one') {
      const m = ctx.fields.getTextInputValue('custom_message');
      data = {
        ...baseData,
        singleMessage: m,
        messagesArray: []
      };
      responseMessage = `I have saved your message to reply to new users as:\n**${m}**`;
    } else {
      params = 'random';
      const [m1, m2, m3, m4, m5] = [
        ctx.fields.getTextInputValue('custom_message_one'),
        ctx.fields.getTextInputValue('custom_message_two'),
        ctx.fields.getTextInputValue('custom_message_three'),
        ctx.fields.getTextInputValue('custom_message_four'),
        ctx.fields.getTextInputValue('custom_message_five')
      ];
      const messagesArray = [m1, m2, m3, m4, m5].filter(m => m !== '');
      data = {
        ...baseData,
        messagesArray,
        singleMessage: null
      };
      responseMessage = `I have saved your messages to reply to new users as:\n**${messagesArray.join('\n')}**`;
    }

    await db.customWelcomeMessages.upsert({
      where: { memberId: ctx.user.id },
      update: data,
      create: data
    });

    return await ctx.reply({
      content: responseMessage,
      ephemeral: true
    });
  }
});
