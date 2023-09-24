import { Schema, model } from 'mongoose';

export default model(
	'Guild',
	new Schema({
		gID: { type: String, required: true },
		gName: { type: String },
		prefix: { type: String, default: '?' },
		modC: { type: String, default: '' },
		verifiedRole: { type: String, default: '' },
		welcomeC: { type: String, default: '' },
		leaveC: { type: String, default: '' },
		introC: { type: String, default: '' },
		userCount: { type: Number, default: 0 },
		botCount: { type: Number, default: 0 },
		allCount: { type: Number, default: 0 },
		userCountChan: { type: String, default: '' },
		botCountChan: { type: String, default: '' },
		allCountChan: { type: String, default: '' },
	}),
	'Guild'
);
