import { commandModule, CommandType } from '@sern/handler';

export default commandModule({
  type: CommandType.Text,
  plugins: [],
  description: 'Manually bans a user before entering guild.',
  execute: async ({ message }, tbd) => {}
});
