import { BudBot } from '#BudBot';
import { makeDependencies, single, Sern, Service } from '@sern/handler';
import { Sparky, env } from '../utils/index.js';

await makeDependencies({
	build: (root) =>
		root
			.add({
				'@sern/client': single(() => {
					return new BudBot();
				}),
			})
			.upsert({
				'@sern/logger': single(() => new Sparky('debug', 'highlight')),
			}),
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
