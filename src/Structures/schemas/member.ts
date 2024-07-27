import { Schema, model } from 'mongoose';

export default model(
	'Member',
	new Schema({
		memberId: String,
		messageId: String,
	}),
	'Members'
);
