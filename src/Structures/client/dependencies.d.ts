import { CoreDependencies, Singleton } from '@sern/handler';
import { Sparky, Utils } from '#utils';
import { BudBot } from '#BudBot';

declare global {
	interface Dependencies extends CoreDependencies {
		'@sern/client': Singleton<BudBot>;
		'@sern/logger': Singleton<Sparky>;
		'@sern/utils': Singleton<Utils>;
	}
}

export {};
