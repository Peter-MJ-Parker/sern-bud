import { BudBot } from '#BudBot';
import { makeDependencies, Sern } from '@sern/handler';
import { logger } from '../utils/index.js';
import pkg from 'mongoose';

await makeDependencies(({ add, swap }) => {
  add('@sern/client', new BudBot());
  swap('@sern/logger', logger);
  add('mongoose', pkg.connection);
});

Sern.init({ commands: 'dist/commands', events: 'dist/events', defaultPrefix: '?' });
