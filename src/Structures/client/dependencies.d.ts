import type { CoreDependencies } from '@sern/handler';
import { TaskLogger, Sparky } from '#utils';
import { BudBot } from '#BudBot';
import { PrismaClient } from '@prisma/client';
import { Publisher } from '@sern/publisher';

declare global {
  interface Dependencies extends CoreDependencies {
    '@sern/client': BudBot;
    '@sern/logger': Sparky;
    'prisma': PrismaClient;
    'publisher': Publisher;
    'task-logger': TaskLogger;
  }
}

export {};
