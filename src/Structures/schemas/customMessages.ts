import { Schema, model } from 'mongoose';

export default model(
	'Custom Welcome Messages',
	new Schema({
		memberId: String,
		welcomeMessage: [],
	}),
	'Custom Welcome Messages'
);
