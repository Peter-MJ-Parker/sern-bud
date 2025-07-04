import { sticker } from '#utils';
import { commandModule, CommandType } from '@sern/handler';

export default commandModule({
  type: CommandType.Button,
  name: 'welcome-wave',
  description: 'Sends a sticker in chat in response to welcome message.',
  execute: async (i, t) => {
    await i.deferUpdate();
    await sticker(i, t.params!);
  }
});
