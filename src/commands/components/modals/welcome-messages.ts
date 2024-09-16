import { commandModule, CommandType } from '@sern/handler';
import { Prisma } from '@prisma/client';

type CustomWelcomeMessagesCreateInput = Prisma.CustomWelcomeMessagesCreateInput;
type CustomWelcomeMessagesUpdateInput = Prisma.CustomWelcomeMessagesUpdateInput;

export default commandModule({
  type: CommandType.Modal,
  async execute(ctx, { deps, params }) {
    if (!params) return;
    const db = deps.prisma;
    const memberId = ctx.user.id;
    const random = params === 'random';

    let updateData: CustomWelcomeMessagesUpdateInput;
    let createData: CustomWelcomeMessagesCreateInput;
    let responseMessage: string;

    if (params === 'one') {
      const m = ctx.fields.getTextInputValue('custom_message');
      updateData = {
        random,
        singleMessage: m,
        messagesArray: []
      };
      createData = {
        memberId,
        random,
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
      updateData = {
        random,
        messagesArray,
        singleMessage: null
      };
      createData = {
        memberId,
        random,
        messagesArray,
        singleMessage: null
      };
      responseMessage = `I have saved your messages to reply to new users as:\n**${messagesArray.join('\n')}**`;
    }

    await db.customWelcomeMessages.upsert({
      where: { memberId },
      update: updateData,
      create: createData
    });

    return await ctx.reply({
      content: responseMessage,
      ephemeral: true
    });
  }
});
