import { commandModule, CommandType } from '@sern/handler';
import { Prisma } from '@prisma/client';

type CustomWelcomeMessagesCreateInput = Prisma.CustomWelcomeMessagesCreateInput;
type CustomWelcomeMessagesUpdateInput = Prisma.CustomWelcomeMessagesUpdateInput;

export default commandModule({
  type: CommandType.Modal,
  async execute(ctx, { deps, params }) {
    if (!params) return;
    const db = deps.prisma.customWelcomeMessages;

    const memberId = ctx.user.id;
    const random = params === 'random';

    let updateData: CustomWelcomeMessagesUpdateInput = { random };
    let createData: CustomWelcomeMessagesCreateInput = { memberId, random };
    let responseMessage: string = '';

    let _current = await db.findUnique({
      where: {
        memberId: ctx.user.id
      }
    });

    switch (params) {
      case 'one':
        const singleMessage = ctx.fields.getTextInputValue('custom_message');
        if (singleMessage === _current?.singleMessage) {
          responseMessage = `No changes detected. Your current configuration is being used.`;
          break;
        }
        updateData.singleMessage = singleMessage;
        createData.singleMessage = singleMessage;
        responseMessage = `I have saved your single message to reply to new users as:\n**${singleMessage}**`;
        break;

      case 'random':
        const [m1, m2, m3, m4, m5] = [
          ctx.fields.getTextInputValue('custom_message_one'),
          ctx.fields.getTextInputValue('custom_message_two'),
          ctx.fields.getTextInputValue('custom_message_three'),
          ctx.fields.getTextInputValue('custom_message_four'),
          ctx.fields.getTextInputValue('custom_message_five')
        ];
        const messagesArray = [m1, m2, m3, m4, m5].filter(m => m !== '');
        if (messagesArray === _current?.messagesArray) {
          responseMessage = `No changes detected. Your current configuration is being used.`;
          break;
        }
        updateData.messagesArray = messagesArray;
        createData.messagesArray = messagesArray;
        responseMessage = `I have saved your multiple messages to reply to new users as:\n**${messagesArray.join(
          '\n'
        )}**`;
        break;
    }

    if (_current?.random !== random) {
      responseMessage += `\nI have switched to using **${random ? 'random messages' : 'a single message'}** for you.`;
    }

    await db.upsert({
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
