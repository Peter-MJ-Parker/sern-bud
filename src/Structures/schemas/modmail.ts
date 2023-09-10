import { model, Schema } from 'mongoose';

const name = 'ModMails';
export default model(
	name,
	new Schema({
		userId: String,
		guildId: String,
		channelId: String,
		timestamp: Number,
	}),
	name
);
