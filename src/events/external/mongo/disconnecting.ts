import { EventType, Service, eventModule } from '@sern/handler';

export default eventModule({
	type: EventType.External,
	emitter: 'mongoose',
	name: 'disconnecting',
	execute() {
		Service('@sern/logger').warn(
			'[DATABASE]- Mongoose is losing connection...'
		);
	},
});
