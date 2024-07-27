import { EventType, Service, eventModule } from '@sern/handler';

export default eventModule({
	type: EventType.External,
	emitter: 'mongoose',
	name: 'connecting',
	execute() {
		Service('@sern/logger').info('[DATABASE]- Mongoose is connecting!');
	},
});
