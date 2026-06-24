"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const firebase_admin_1 = require("./firebase/firebase-admin");
async function bootstrap() {
    // Initialize Firebase Admin before the app starts
    (0, firebase_admin_1.initializeFirebaseAdmin)();
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const port = process.env.PORT ? Number(process.env.PORT) : 3001;
    app.enableCors({
        origin: ['http://localhost:3000'],
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
    }));
    await app.listen(port);
    console.log(`Backend running on http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map