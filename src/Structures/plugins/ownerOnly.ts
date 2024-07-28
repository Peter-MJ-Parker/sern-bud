/**
 * @plugin
 * This is OwnerOnly plugin, it allows only bot owners to run the command, like eval.
 *
 * @author @EvolutionX-10 [<@697795666373640213>]
 * @version 1.2.0
 * @example
 * ```ts
 * import { ownerOnly } from "../plugins/ownerOnly";
 * import { commandModule } from "@sern/handler";
 * export default commandModule({
 *  plugins: [ ownerOnly() ], // can also pass array of IDs to override default owner IDs
 *  execute: (ctx) => {
 * 		//your code here
 *  }
 * })
 * ```
 * @end
 */

import { CommandType, CommandControlPlugin, controller } from '@sern/handler';
export function ownerOnly(override?: string[]) {
  return CommandControlPlugin<CommandType.Both>((ctx, { deps }) => {
    const utils = deps['@sern/client'].utils;
    if ((override ?? utils.owners).includes(ctx.user.id)) return controller.next();
    return controller.stop();
  });
}
