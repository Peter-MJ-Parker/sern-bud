import { BaseTaskLogger, Birthdays } from '#utils';

export class TaskLogger extends BaseTaskLogger {
  private static _bdays: Birthdays;
  constructor() {
    super();
    if (!TaskLogger._bdays) {
      TaskLogger._bdays = new Birthdays();
    }
  }

  get bdays() {
    return TaskLogger._bdays;
  }
}

//Add more tasks in here the same way to be available upon startup.
