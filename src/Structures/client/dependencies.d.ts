import type { CoreDependencies } from '@sern/handler';
import { Sparky } from '../utils/index.js';
import { BudBot } from '#BudBot';
import { PrismaClient } from '@prisma/client';

declare global {
  interface Dependencies extends CoreDependencies {
    '@sern/client': BudBot;
    '@sern/logger': Sparky;
    'prisma': PrismaClient;
  }
}

export {};
