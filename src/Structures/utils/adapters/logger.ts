import type { Logging, LogPayload } from '@sern/handler';
import { Logger, type LogLevel, type LogStyle } from '@spark.ts/logger';
import { bold, italic } from 'colorette';

export class Sparky implements Logging {
  private _spark!: Logger;
  private _date!: Date;
  constructor(logLevel: LogLevel, logStyle: LogStyle) {
    console.clear();
    this._spark = new Logger({ logLevel, logStyle });
    this._date = new Date();
  }

  public warn = this.warning;
  success(payload: LogPayload<unknown> | any): void {
    payload = payload.message || { payload }.payload;
    this._spark.success(
      bold(
        italic(
          `${this._date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZone: 'America/Chicago'
          })} => ${payload}`
        )
      )
    );
  }
  info(payload: LogPayload<unknown> | any): void {
    payload = payload.message || { payload }.payload;
    this._spark.info(
      bold(
        italic(
          `${this._date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZone: 'America/Chicago'
          })} => ${payload}`
        )
      )
    );
  }
  warning(payload: LogPayload<unknown> | any): void {
    payload = payload.message || { payload }.payload;
    this._spark.warn(
      bold(
        italic(
          `${this._date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZone: 'America/Chicago'
          })} => ${payload}`
        )
      )
    );
  }
  debug(payload: LogPayload<unknown> | any): void {
    payload = payload.message || { payload }.payload;
    this._spark.debug(
      bold(
        italic(
          `${this._date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZone: 'America/Chicago'
          })} => ${payload}`
        )
      )
    );
  }
  error(payload: LogPayload<unknown> | any): void {
    payload = payload.message || { payload }.payload;
    this._spark.error(
      bold(
        italic(
          `${this._date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZone: 'America/Chicago'
          })} => ${payload}`
        )
      )
    );
  }
}

export const logger = new Sparky('debug', 'highlight');
