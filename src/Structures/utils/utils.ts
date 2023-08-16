import mongoose from 'mongoose';
import { Service } from '@sern/handler';
import {
	ActionRowBuilder,
	BaseGuildVoiceChannel,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	ChatInputCommandInteraction,
	EmbedBuilder,
	Guild,
	ModalBuilder,
	TextChannel,
	TextInputBuilder,
} from 'discord.js';
import axios from 'axios';
import { webhookCreate, welcomeCreate, sticker } from '#utils';

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

	public getId(mention: string) {
		let reg: RegExp;
		if (mention.includes('@') && !mention.includes('&')) {
			reg = new RegExp(/([<@>])+/g);
			return mention.replaceAll(reg, '');
		}
		if (mention.includes('#')) {
			reg = new RegExp(/([<#>])+/g);
			return mention.replaceAll(reg, '');
		}
		if (mention.includes('@&')) {
			reg = new RegExp(/([<@&>])+/g);
			return mention.replaceAll(reg, '');
		}
	}
	public async mongoConnect(CONNECT: string) {
		const { connect, connection, set } = mongoose;
		const dbOptions = {
			autoIndex: true,
			connectTimeoutMS: 10000,
			family: 4,
		};

		if (!CONNECT)
			return Service('@sern/logger').warning(
				'No database connection string present!'
			);
		const HOSTS_REGEX =
			/^(?<protocol>[^/]+):\/\/(?:(?<username>[^:@]*)(?::(?<password>[^@]*))?@)?(?<hosts>(?!:)[^/?@]*)(?<rest>.*)/;
		const match = CONNECT.match(HOSTS_REGEX);
		if (!match) {
			return Service('@sern/logger').error(
				`[DATABASE]- Invalid connection string "${CONNECT}"`
			);
		}

		connection.on('connecting', () => {
			Service('@sern/logger').info('[DATABASE]- Mongoose is connecting...');
		});

		connect(CONNECT, dbOptions);
		Promise = Promise;
		set('strictQuery', true);

		connection.on('connected', () => {
			Service('@sern/logger').success(
				'[DATABASE]- Mongoose has successfully connected!'
			);
		});

		connection.on('err', (err) => {
			Service('@sern/logger').error(
				`[DATABASE]- Mongoose connection error: \n${err.stack}`
			);
		});

		connection.on('disconnected', () => {
			Service('@sern/logger').warning('[DATABASE]- Mongoose connection lost');
		});
	}
	public capitalise(string: string) {
		return string
			.split(' ')
			.map((str) => str.slice(0, 1).toUpperCase() + str.slice(1))
			.join(' ');
	}
	public async channelUpdater(guild: Guild) {
		const counts = {
			users: guild.members.cache.filter((m) => !m.user.bot).size,
			bots: guild.members.cache.filter((m) => m.user.bot).size,
			total: guild.memberCount,
		};
		setInterval(async () => {
			const chan1 = guild.channels.cache.get(
				'825555222281060363'
			) as BaseGuildVoiceChannel;
			const chan2 = guild.channels.cache.get(
				'825555223321640970'
			) as BaseGuildVoiceChannel;
			const chan3 = guild.channels.cache.get(
				'825555224147263549'
			) as BaseGuildVoiceChannel;
			await chan1.setName(`Total Members: ${counts.total.toLocaleString()}`);
			await chan2.setName(`Users: ${counts.users.toLocaleString()}`);
			await chan3.setName(`Bots: ${counts.bots.toLocaleString()}`);
		});
	}
	public createModal(
		custom_id: string,
		title: string,
		components: TextInputBuilder[]
	) {
		if (components.length < 1) {
			throw new Error('Please provide at least one TextInputBuilder!');
		}
		if (components.length > 5) {
			throw new Error('You have too many TextInputBuilders! Max is 5!');
		}

		const rows: ActionRowBuilder<TextInputBuilder>[] = components.map(
			(field) => {
				return new ActionRowBuilder<TextInputBuilder>({
					components: [field],
				});
			}
		);
		return new ModalBuilder({
			custom_id: custom_id.toString(),
			title: this.capitalise(title).toString(),
			components: rows,
		});
	}
	public async getMeme(
		channel: TextChannel,
		interact: ChatInputCommandInteraction | ButtonInteraction
	) {
		try {
			const response = await axios.get('https://reddit.com/r/memes.json');
			const data = response.data.data.children;

			let nsfw: any[] = [];
			let non_nsfw: any[] = [];
			if (data.length > 0) {
				data.forEach((meme: any) => {
					if (meme.data.over_18 === true) {
						nsfw.push(meme.data);
					} else non_nsfw.push(meme.data);
				});
			}
			let meme: any;
			if (channel.nsfw === true) {
				meme = nsfw[Math.floor(Math.random() * nsfw.length)];
			}
			if (channel.nsfw === false) {
				meme = non_nsfw[Math.floor(Math.random() * non_nsfw.length)];
			}
			if (interact.isChatInputCommand()) {
				if (!meme)
					return await interact.reply({
						content:
							"I don't support NSFW memes. Please run this command in a non-nsfw channel.",
						embeds: [],
						ephemeral: true,
					});
				await interact.reply({
					embeds: [
						new EmbedBuilder()
							.setColor('NotQuiteBlack')
							.setURL('https://reddit.com' + meme.permalink)
							.setTitle(meme.title)
							.setDescription(
								`🤖 **Sub-Reddit**: \`r/${meme.subreddit}\`\n⬆️ **Upvotes**: \`${meme.ups}\` - ⬇️ **Downvotes**: \`${meme.downs}\``
							)
							.setFooter({ text: `Meme by ${meme.author}` })
							.setImage(meme.url),
					],
					components: [
						new ActionRowBuilder<ButtonBuilder>({
							components: [
								new ButtonBuilder({
									custom_id: 'meme-next',
									label: 'Next Meme',
									style: ButtonStyle.Success,
								}),
								new ButtonBuilder({
									custom_id: 'meme-stop',
									label: 'STOP',
									style: ButtonStyle.Danger,
								}),
							],
						}),
					],
				});
			} else if (interact.isButton()) {
				return new EmbedBuilder()
					.setColor('NotQuiteBlack')
					.setURL('https://reddit.com' + meme.permalink)
					.setTitle(meme.title)
					.setDescription(
						`🤖 **Sub-Reddit**: \`r/${meme.subreddit}\`\n⬆️ **Upvotes**: \`${meme.ups}\` - ⬇️ **Downvotes**: \`${meme.downs}\``
					)
					.setFooter({ text: `Meme by ${meme.author}` })
					.setImage(meme.url);
			}
		} catch (error: any) {
			console.error;
			await interact.reply({
				embeds: [],
				content: `Failed to fetch meme. Please try again.\nError Code: ${error.message}`,
				ephemeral: true,
			});
		}
	}
}
