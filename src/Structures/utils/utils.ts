import { Context, Service } from '@sern/handler';
import {
  ActionRowBuilder,
  BaseGuildVoiceChannel,
  Guild,
  InteractionResponse,
  Message,
  ModalBuilder,
  Snowflake,
  SnowflakeUtil,
  TextChannel,
  TextInputBuilder
} from 'discord.js';
import { logger } from './adapters/logger.js';
import { env } from './adapters/load.js';

export enum IntegrationContextType {
  GUILD = 0,
  BOT_DM = 1,
  PRIVATE_CHANNEL = 2
}

export function getUser() {}

export const owners = env.ownerIDs.split(',');
/**
 *
 * @param time Amount of time in seconds to wait before going to next line in code.
 * @description Waits a certain time before going to next function.
 */
export async function delay(time: number) {
  (await import('node:timers/promises')).setTimeout(time * 1000);
}

export function getRandomMessage(names: string[]): string {
  const birthdayMessages = [
    '🎉 Happy Birthday, {names}! May your day be filled with joy and laughter!',
    "🎂 Wishing a fantastic birthday to {names}! Here's to another year of awesome!",
    "🥳 It's party time for {names}! Happy Birthday and make it a great one!",
    "🎈 Happy Birthday to the amazing {names}! Let's make some noise for the birthday crew!",
    '🌟 Special day alert! Happy Birthday, {names}! Time to celebrate you!',
    '🍰 Cake, candles, and good times await! Happy Birthday, {names}!',
    '🎊 Another year, another adventure! Happy Birthday to the wonderful {names}!',
    '🥂 Cheers to {names} on their birthday! Wishing you all the best today and always!',
    "🎁 Surprise! It's a birthday bonanza for {names}! Hope it's the best one yet!",
    '🌈 Happy Birthday to the one and only {names}! Your awesomeness deserves a celebration!'
  ];
  const randomIndex = Math.floor(Math.random() * birthdayMessages.length);
  let message = birthdayMessages[randomIndex];

  if (names.length === 1) {
    message = message.replace('{names}', names[0]);
  } else if (names.length === 2) {
    message = message.replace('{names}', `${names[0]} and ${names[1]}`);
  } else {
    const lastPerson = names.pop();
    message = message.replace('{names}', `${names.join(', ')}, and ${lastPerson}`);
  }

  return message;
}

export async function bdayAnnouncement(ctx: Context, names: string[]) {
  if (!ctx.inGuild) return;
  const _guild = await Service('prisma').guild.findFirst({
    where: {
      gID: ctx.guildId!
    }
  });
  if (!_guild) return;
  const channel = ctx.guild?.channels.cache.get(_guild.birthdayAnnounceChan)! as TextChannel;
  const message = `@everyone, We have ${names.length > 1 ? `birthdays` : `a birthday`} today!\n${getRandomMessage(
    names
  )}`;
  await channel.send(message).then(msg => {
    msg.react('🎉').catch(err => logger.error(`Failed to react with 🎉: ${err}`));
  });
}

const date = new Date();
const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, '0');
const day = String(date.getDate()).padStart(2, '0');
export const today = `${month}/${day}`;

/**
 *
 * @param {string} mention The stringified mention to destructure.
 * @example ```ts
 * this.getId(<#1148024469210808341>);
 * > output: 1148024469210808341
 * ```
 * @returns {Snowflake}
 */
export function getId(mention: string): Snowflake | void {
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
  return isValidSnowflake(id) ? id : logger.error(`**${id}** is not a valid snowflake.`);
}
export async function uploadApplicationEmoji(name: string, imageUrl: string) {
  const client = Service('@sern/client');
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const form = new FormData();
  form.append('image', new Blob([buffer]), 'emoji.png');
  form.append('name', name);

  try {
    const res = await fetch(`https://discord.com/api/v10/applications/${client.application!.id}/emojis`, {
      method: 'POST',
      body: form,
      headers: {
        Authorization: `Bot ${client.token}`
      }
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const emoji = await res.json();
    console.log(`Created new application emoji with name ${emoji.name}`);
    return emoji;
  } catch (error) {
    console.error('Error creating application emoji:', error);
  }
}

/**
 *
 * @param messages The message(s) to delete.
 * @param timeout How long to wait before deleting bot's response.
 * @returns Promise
 */
export async function deleteOnTimeout(
  messages: Message | Message[] | InteractionResponse,
  timeout: number
): Promise<void> {
  setTimeout(async () => {
    Array.isArray(messages)
      ? messages.forEach(async m => {
          await m.delete();
        })
      : await messages.delete();
  }, timeout);
}

/**
 * Check if a string is a valid Discord Snowflake.
 *
 * @param id The ID to check.
 * @return Is the ID a valid Discord Snowflake?
 */
export function isValidSnowflake(id: Snowflake): boolean {
  // Discord Epoch (January 1, 2015) 1420070400000
  const deconstructed = SnowflakeUtil.deconstruct(id);
  return deconstructed.timestamp >= 1420070400000 ? true : false;
}

/**
 *
 * @param {string} custom_id Custom ID of the Modal
 * @param {string} title Title of the Modal
 * @param {TextInputBuilder[]} components Array of Text Inputs to attach to the Modal
 * @requires 1-5 components
 * @returns {ModalBuilder} ModalBuilder
 */
export function createModal(custom_id: string, title: string, components: TextInputBuilder[]): ModalBuilder {
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
 *
 * @param guild Instance of Guild
 * @description Updates user counts in Database and sets name of channels in specified guild to the correct number of users.
 */
export async function channelUpdater(guild: Guild): Promise<any> {
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
      return logger.error(`${chanId} does not exist in database. Please check channel id's in database and try again!`);
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
export function capitalise(text: string, boolean: boolean = false) {
  if (boolean === true) {
    return text
      .split(' ')
      .map(str => str.slice(0, 1).toUpperCase() + str.slice(1))
      .join(' ');
  }
  return text.slice(0, 1).toUpperCase() + text.slice(1);
}
