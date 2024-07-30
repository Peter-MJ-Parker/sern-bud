import { BudBot } from '#BudBot';
import { makeDependencies, Sern } from '@sern/handler';
import { logger, TaskLogger, Prisma } from '#utils';
import { Publisher } from '@sern/publisher';

await makeDependencies(({ add, swap }) => {
  add('@sern/client', new BudBot());
  swap('@sern/logger', logger);
  add('prisma', new Prisma(logger));
  add('publisher', deps => new Publisher(deps['@sern/modules'], deps['@sern/emitter'], deps['@sern/logger']));
  add('task-logger', deps => new TaskLogger(deps['@sern/client'], deps.prisma));
});

Sern.init({ commands: 'dist/commands', events: 'dist/events', defaultPrefix: '?', tasks: 'dist/tasks' });
