import { Service } from '@sern/handler';
import {
  ActionRowBuilder,
  BaseGuildVoiceChannel,
  Guild,
  InteractionResponse,
  Message,
  ModalBuilder,
  Snowflake,
  SnowflakeUtil,
  TextInputBuilder
} from 'discord.js';
import { webhookCreate, welcomeCreate, sticker, env, logger } from './index.js';

/**
 * Class that holds most functions used in different files by the client.
 */
export class Utils {
  constructor() {}
  get welcomeCreate() {
    return welcomeCreate;
  }
  get sticker() {
    return sticker;
  }
  get webhookCreate() {
    return webhookCreate;
  }

  get env() {
    return env;
  }
  public owners = env.ownerIDs[0].replaceAll(/[\[\]"]/g, '').split(', ');
  /**
   *
   * @param time Amount of time in seconds to wait before going to next line in code.
   * @description Waits a certain time before going to next function.
   */
  public async delay(time: number) {
    (await import('node:timers/promises')).setTimeout(time * 1000);
  }
  /**
   *
   * @param {string} mention The stringified mention to destructure.
   * @example ```ts
   * this.getId(<#1148024469210808341>);
   * > output: 1148024469210808341
   * ```
   * @returns {Snowflake}
   */
  public getId(mention: string): Snowflake | void {
    let id = '';
    if (mention.includes('@') && !mention.includes('&')) {
      id += mention.replaceAll(/[<@>]/g, '');
    }
    if (mention.includes('#')) {
      id += mention.replaceAll(/[<#>]/g, '');
    }
    if (mention.includes('@&')) {
      id += mention.replaceAll(/[<@&>]/g, '');
    }
    return this.isValidSnowflake(id) ? id : logger.error(`**${id}** is not a valid snowflake.`);
  }

  /**
   *
   * @param string The text you wish to capitalise. This will only capitalise the first letter in the string.
   * @param boolean If true, each word in the string will be capitalized. Else only first word will be capitalized.
   * @example ```ts
   * this.capitalise("string");
   * > output: "String"
   * ```
   * @example ```ts
   * this.capitalise("i'm a string", true);
   * > output: "I'm A String"
   * ```
   * @returns Capitalized string
   */
  public capitalise(text: string, boolean?: boolean) {
    if (boolean === true) {
      return text
        .split(' ')
        .map(str => str.slice(0, 1).toUpperCase() + str.slice(1))
        .join(' ');
    }
    return text.slice(0, 1).toUpperCase() + text.slice(1);
  }

  /**
   *
   * @param guild Instance of Guild
   * @description Updates user counts in Database and sets name of channels in specified guild to the correct number of users.
   */
  public async channelUpdater(guild: Guild): Promise<any> {
    const client = Service('@sern/client');
    const prisma = Service('prisma');
    const db = await prisma.guild.findFirst({ where: { gID: guild.id } });
    if (!db) return logger.error('No database entry! Please re-add me to the specified guild to create the entry.');

    if (!client) return logger.error('No client provided!');
    if (!client.guilds.cache.has(guild.id)) return logger.error('Guild not found in my cache!');

    const channelIds = [db.allCountChan, db.botCountChan, db.userCountChan];
    for (const chanId of channelIds) {
      if (chanId) {
        const result = await guild.channels.fetch(chanId);
        if (!result) {
          return logger.error(
            `${chanId} does not exist in guild [${guild.name} - ${guild.id}]. Please check channel id's in database and try again!`
          );
        }
      } else
        return logger.error(
          `${chanId} does not exist in database. Please check channel id's in database and try again!`
        );
    }

    const counts = {
      allCount: Number(guild.memberCount),
      userCount: Number(guild.members.cache.filter(m => !m.user.bot).size),
      botCount: Number(guild.members.cache.filter(m => m.user.bot).size)
    };

    const total = guild?.channels.cache.get(db.allCountChan!) as BaseGuildVoiceChannel;
    const users = guild?.channels.cache.get(db.userCountChan!) as BaseGuildVoiceChannel;
    const bots = guild?.channels.cache.get(db.botCountChan!) as BaseGuildVoiceChannel;

    const amounts = {
      allCount: Number(total.name.split(': ')[1]),
      userCount: Number(users.name.split(': ')[1]),
      botCount: Number(bots.name.split(': ')[1])
    };

    try {
      for (const key in counts) {
        const countsValue = counts[key as keyof typeof counts];
        const amountsValue = Number(amounts[key as keyof typeof amounts]);

        if (countsValue !== amountsValue) {
          await prisma.guild
            .update({
              where: { id: db.id },
              data: { [key]: countsValue }
            })
            .then(async () => {
              switch (key) {
                case 'allCount':
                  await total.setName(`Total Members: ${countsValue.toLocaleString()}`);
                  break;
                case 'userCount':
                  await users.setName(`Users: ${countsValue.toLocaleString()}`);
                  break;
                case 'botCount':
                  await bots.setName(`Bots: ${countsValue.toLocaleString()}`);
                  break;
              }
            });
        }
      }
    } catch (err) {
      return logger.error(err);
    }
  }

  /**
   *
   * @param {string} custom_id Custom ID of the Modal
   * @param {string} title Title of the Modal
   * @param {TextInputBuilder[]} components Array of Text Inputs to attach to the Modal
   * @requires 1-5 components
   * @returns {ModalBuilder} ModalBuilder
   */
  public createModal(custom_id: string, title: string, components: TextInputBuilder[]): ModalBuilder {
    if (components.length < 1) {
      throw new Error('Please provide at least one TextInputBuilder!');
    }
    if (components.length > 5) {
      throw new Error('You have too many TextInputBuilders! Max is 5!');
    }

    const rows: ActionRowBuilder<TextInputBuilder>[] = components.map(field => {
      return new ActionRowBuilder<TextInputBuilder>({
        components: [field]
      });
    });
    return new ModalBuilder({
      custom_id,
      title,
      components: rows
    });
  }
  /**
   * Check if a string is a valid Discord Snowflake.
   *
   * @param id The ID to check.
   * @return Is the ID a valid Discord Snowflake?
   */
  public isValidSnowflake(id: Snowflake): boolean {
    // Discord Epoch (January 1, 2015) 1420070400000
    const deconstructed = SnowflakeUtil.deconstruct(id);
    return deconstructed.timestamp >= 1420070400000 ? true : false;
  }

  /**
   *
   * @param messages The message(s) to delete.
   * @param timeout How long to wait before deleting bot's response.
   * @returns Promise
   */
  public async deleteOnTimeout(messages: Message | Message[] | InteractionResponse, timeout: number): Promise<void> {
    setTimeout(async () => {
      Array.isArray(messages)
        ? messages.forEach(async m => {
            await m.delete();
          })
        : await messages.delete();
    }, timeout);
  }

  /** Economy Functions */
  public async getUser() {}

  /** *MORE FUNCTIONS TO COME */
}

export enum IntegrationContextType {
  GUILD = 0,
  BOT_DM = 1,
  PRIVATE_CHANNEL = 2
}
