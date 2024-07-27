import mongoose from "mongoose";
import { Service } from "@sern/handler";
import {
  ActionRowBuilder,
  BaseGuildVoiceChannel,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Guild,
  InteractionResponse,
  Message,
  ModalBuilder,
  Snowflake,
  SnowflakeUtil,
  TextChannel,
  TextInputBuilder
} from "discord.js";
import axios from "axios";
import { webhookCreate, welcomeCreate, sticker, env, logger } from "./index.js";

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

  /**
   *
   * @param time Amount of time in seconds to wait before going to next line in code.
   * @description Waits a certain time before going to next function.
   */
  public async delay(time: number) {
    (await import("node:timers/promises")).setTimeout(time * 1000);
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
    let id = "";
    if (mention.includes("@") && !mention.includes("&")) {
      id += mention.replaceAll(/[<@>]/g, "");
    }
    if (mention.includes("#")) {
      id += mention.replaceAll(/[<#>]/g, "");
    }
    if (mention.includes("@&")) {
      id += mention.replaceAll(/[<@&>]/g, "");
    }
    return this.isValidSnowflake(id)
      ? id
      : logger.error(`**${id}** is not a valid snowflake.`);
  }

  /**
   *
   * @param mongoURI Mongoose connection string - If no string is present, your process will exit.
   * @returns {Promise} Promise of Mongoose Connection
   */
  public async mongoConnect(mongoURI: string): Promise<mongoose.Connection> {
    const { connect, connection, set } = mongoose;

    if (!mongoURI) {
      logger.warn("No database connection string present!");
      return process.exit(1);
    }

    const HOSTS_REGEX =
      /^(?<protocol>[^/]+):\/\/(?:(?<username>[^:@]*)(?::(?<password>[^@]*))?@)?(?<hosts>(?!:)[^/?@]*)(?<rest>.*)/;
    const match = mongoURI.match(HOSTS_REGEX);
    if (!match) {
      logger.error(`[DATABASE]- Invalid connection string "${mongoURI}"`);
      return process.exit(1);
    }

    set("strictQuery", true);
    await connect(mongoURI, {
      autoIndex: true,
      connectTimeoutMS: 10000,
      family: 4
    });

    return connection;
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
        .split(" ")
        .map((str) => str.slice(0, 1).toUpperCase() + str.slice(1))
        .join(" ");
    }
    return text.slice(0, 1).toUpperCase() + text.slice(1);
  }

  /**
   *
   * @param guild Instance of Guild
   * @description Updates user counts in Database and sets name of channels in specified guild to the correct number of users.
   */
  public async channelUpdater(guild: Guild): Promise<any> {
    const client = Service("@sern/client");
    const db = await (
      await import("#schemas/guild")
    ).default.findOne({
      gID: guild.id
    });
    if (!db)
      return logger.error(
        "No database entry! Please re-add me to the specified guild to create the entry."
      );

    if (!client) return logger.error("No client provided!");
    if (!client.guilds.cache.has(guild.id))
      return logger.error("Guild not found in my cache!");

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
      total: Number(guild.memberCount),
      users: Number(guild.members.cache.filter((m) => !m.user.bot).size),
      bots: Number(guild.members.cache.filter((m) => m.user.bot).size)
    };

    const total = guild?.channels.cache.get(
      db.allCountChan!
    ) as BaseGuildVoiceChannel;
    const users = guild?.channels.cache.get(
      db.userCountChan!
    ) as BaseGuildVoiceChannel;
    const bots = guild?.channels.cache.get(
      db.botCountChan!
    ) as BaseGuildVoiceChannel;

    const amounts = {
      total: Number(total.name.split(": ")[1]),
      users: Number(users.name.split(": ")[1]),
      bots: Number(bots.name.split(": ")[1])
    };

    try {
      for (const key in counts) {
        const countsValue = counts[key as keyof typeof counts];
        const amountsValue = Number(amounts[key as keyof typeof amounts]);

        if (countsValue !== amountsValue) {
          await db
            .updateOne({ $set: { [key]: countsValue } })
            .then(async () => {
              switch (key) {
                case "total":
                  await total.setName(
                    `Total Members: ${countsValue.toLocaleString()}`
                  );
                  break;
                case "users":
                  await users.setName(`Users: ${countsValue.toLocaleString()}`);
                  break;
                case "bots":
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
  public createModal(
    custom_id: string,
    title: string,
    components: TextInputBuilder[]
  ): ModalBuilder {
    if (components.length < 1) {
      throw new Error("Please provide at least one TextInputBuilder!");
    }
    if (components.length > 5) {
      throw new Error("You have too many TextInputBuilders! Max is 5!");
    }

    const rows: ActionRowBuilder<TextInputBuilder>[] = components.map(
      (field) => {
        return new ActionRowBuilder<TextInputBuilder>({
          components: [field]
        });
      }
    );
    return new ModalBuilder({
      custom_id: custom_id.toString(),
      title: this.capitalise(title).toString(),
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
  public async deleteOnTimeout(
    messages: Message | Message[] | InteractionResponse,
    timeout: number
  ): Promise<void> {
    setTimeout(async () => {
      Array.isArray(messages)
        ? messages.forEach(async (m) => {
            await m.delete();
          })
        : await messages.delete();
    }, timeout);
  }

  /**
   *
   * @param channel The text channel where the function is being used.
   * @param i The interaction being used.
   * @returns Interaction Response
   */
  public async getMeme(
    channel: TextChannel,
    i: ChatInputCommandInteraction | ButtonInteraction
  ): Promise<InteractionResponse<boolean> | undefined> {
    if (channel.id !== "678652650140598294")
      return await i.reply({
        ephemeral: true,
        content:
          "Unable to execute this command in this channel! Please move to <#678652650140598294>."
      });
    const response = await axios.get("https://reddit.com/r/memes/random/.json");
    if (response.status === 200) {
      try {
        const { data } = response;
        const fetchedMeme = data[0].data.children[0].data;
        let nsfw: any[] = [];
        let non_nsfw: any[] = [];
        if (fetchedMeme.over_18 === true) {
          nsfw.push(fetchedMeme);
        } else non_nsfw.push(fetchedMeme);

        let meme: any;
        if (channel.nsfw === true) {
          meme = nsfw[Math.floor(Math.random() * nsfw.length)];
        }
        if (channel.nsfw === false) {
          meme = non_nsfw[Math.floor(Math.random() * non_nsfw.length)];
        }
        const { author, downs, permalink, subreddit, title, ups, url } = meme;
        if (i.isChatInputCommand()) {
          if (meme.over_18 === true)
            return await i.reply({
              content:
                "I have found an nsfw meme. Please try again as I do not support showing these memes.",
              embeds: [],
              ephemeral: true
            });
          if (meme.is_video === true)
            return await i.reply({
              content: url,
              embeds: [],
              ephemeral: true
            });
          await i.reply({
            content: "",
            embeds: [
              new EmbedBuilder()
                .setColor("NotQuiteBlack")
                .setURL("https://reddit.com" + permalink)
                .setTitle(title)
                .setDescription(
                  `🤖 **Sub-Reddit**: \`r/${subreddit}\`\n⬆️ **Upvotes**: \`${ups}\` - ⬇️ **Downvotes**: \`${downs}\``
                )
                .setFooter({ text: `Meme by ${author}` })
                .setImage(url)
            ],
            components: [
              new ActionRowBuilder<ButtonBuilder>({
                components: [
                  new ButtonBuilder({
                    custom_id: "meme-next",
                    label: "Next Meme",
                    style: ButtonStyle.Success
                  }),
                  new ButtonBuilder({
                    custom_id: "meme-stop",
                    label: "STOP",
                    style: ButtonStyle.Danger
                  })
                ]
              })
            ]
          });
        } else if (i.isButton()) {
          meme.is_video === false
            ? await i.update({
                content: "",
                embeds: [
                  new EmbedBuilder()
                    .setColor("NotQuiteBlack")
                    .setURL("https://reddit.com" + permalink)
                    .setTitle(title)
                    .setDescription(
                      `🤖 **Sub-Reddit**: \`r/${subreddit}\`\n⬆️ **Upvotes**: \`${ups}\` - ⬇️ **Downvotes**: \`${downs}\``
                    )
                    .setFooter({ text: `Meme by ${author}` })
                    .setImage(url)
                ]
              })
            : await i.update({
                content: url,
                embeds: []
              });
        }
      } catch (err: any) {
        logger.error(err);
        await i.reply({
          embeds: [],
          content: `Failed to fetch meme. Please try again.\nError Code: ${err.message}`,
          ephemeral: true
        });
      }
    }
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
