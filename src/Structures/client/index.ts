import { BudBot } from '#BudBot';
import { makeDependencies, Sern } from '@sern/handler';
import { logger, Prisma } from '#utils';

await makeDependencies(({ add, swap }) => {
  add('@sern/client', new BudBot());
  swap('@sern/logger', logger);
  add('prisma', new Prisma(logger));
});

Sern.init({ commands: 'dist/commands', events: 'dist/events', defaultPrefix: '?' });
