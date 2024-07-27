// @ts-nocheck
/**
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
 */

import {
	CommandControlPlugin,
	controller,
	Context,
	Service,
} from '@sern/handler';

const { env } = Service('@sern/client').utils;
export function ownerOnly(owners?: string[]) {
	return CommandControlPlugin<CommandType.Both>(async (ctx: Context) => {
		const [config] = env.ownerIDs;
		if (!owners) {
			if (!config || config.length < 1) {
				return controller.stop(); //! Important: It stops the execution of command!
			} else owners = config;
		}
		if (owners && owners.includes(ctx.user.id)) {
			return controller.next();
		}
		await ctx.reply('Only bot owners can use this feature!!!');
		return controller.stop(); //! Important: It stops the execution of command!
	});
}
