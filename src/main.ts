import 'reflect-metadata'; // nécessaire pour les décorateurs TypeORM
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.enableCors({
		origin: 'http://localhost:4200', // TODO : configurer pour production
	});
	
	// liste des routes pour le debug
	const server = app.getHttpServer();
	const router = server._events.request._router;
	router.stack
		.filter(r => r.route)
		.forEach(r => {
			const method = Object.keys(r.route.methods)[0].toUpperCase();
			const path = r.route.path;
			console.log(`${method} ${path}`);
		});
	await app.listen(process.env.PORT || 3000);
}
bootstrap();
