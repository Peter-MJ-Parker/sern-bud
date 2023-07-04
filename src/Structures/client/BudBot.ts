import { Client } from 'discord.js';
import { clientOptions } from '#utils';

export class BudBot extends Client {
	constructor() {
		super(clientOptions);
	}
}
