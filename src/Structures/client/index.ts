import { BudBot } from '#BudBot';
import { makeDependencies, single, Sern, Service } from '@sern/handler';
import { env, logger } from '../utils/index.js';
import pkg from 'mongoose';

await makeDependencies({
	build: (root) =>
		root
			.add({
				'@sern/client': single(() => {
					return new BudBot();
				}),
			})
			.add({
				mongoose: single(() => pkg.connection),
			})
			.upsert({
				'@sern/logger': single(() => logger),
			})
			.add({process: single(() => process)})
});
//View docs for all options

Sern.init('file');

//MODE in .env should be PROD for Production or DEV for Development
switch (env.MODE) {
	case 'PROD':
		Service('@sern/client').login(env.DISCORD_PROD_TOKEN);
		break;

	case 'DEV':
		Service('@sern/client').login(env.DISCORD_DEV_TOKEN);
		break;
}
