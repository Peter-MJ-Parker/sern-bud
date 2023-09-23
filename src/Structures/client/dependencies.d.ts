import { CoreDependencies, Singleton } from '@sern/handler';
import { Sparky } from '../utils/index';
import { BudBot } from '#BudBot';
import pkg from 'mongoose';

declare global {
	interface Dependencies extends CoreDependencies {
		'@sern/client': Singleton<BudBot>;
		'@sern/logger': Singleton<Sparky>;
		mongoose: Singleton<pkg.Connection>;
	}
}

export {};
