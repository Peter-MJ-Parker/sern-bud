import { PrismaClient } from '@prisma/client';
import { Sparky } from './logger.js';

export class Prisma extends PrismaClient {
  constructor(private logger: Sparky) {
    super();
    this.connect();
  }
  private connect() {
    this.$connect()
      .then(() => this.logger.success('Connected to PrismaClientDB.'))
      .catch(err => this.logger.error('Failed to connect to PrismaClientDB,' + err));
  }
}
