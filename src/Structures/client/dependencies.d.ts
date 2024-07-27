import type { CoreDependencies } from '@sern/handler';
import { Sparky } from '../utils/index.js';
import { BudBot } from '#BudBot';
import pkg from 'mongoose';

declare global {
  interface Dependencies extends CoreDependencies {
    '@sern/client': BudBot;
    '@sern/logger': Sparky;
    'mongoose': pkg.Connection;
  }
}

export {};
