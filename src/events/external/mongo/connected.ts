import { EventType, Service, eventModule } from '@sern/handler';

export default eventModule({
	type: EventType.External,
	emitter: 'mongoose',
	name: 'connected',
	execute() {
		Service('@sern/logger').success(
			'[DATABASE]- Mongoose has successfully connected!'
		);
	},
});
