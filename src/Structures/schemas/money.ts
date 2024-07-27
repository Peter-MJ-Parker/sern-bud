import { Schema, model } from 'mongoose';

export default model(
	'Money',
	new Schema({
		username: { type: String },
		nickname: String,
		userID: { type: String, required: true },
		guildName: { type: String, required: true },
		serverID: { type: String, required: true },
		wallet: { type: Number, default: 0 },
		bank: { type: Number, default: 0 },
	}),
	'Money'
);
