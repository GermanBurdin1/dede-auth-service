import 'reflect-metadata'; // ← ОБЯЗАТЕЛЬНО
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.enableCors({
		origin: 'http://localhost:4200',
	});
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
