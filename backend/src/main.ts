import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule, SwaggerCustomOptions } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';

function configureApp(app: any) {
  // High-Performance Response Compression (Gzip / Deflate)
  app.use(compression());

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Swagger UI requires inline styles
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginOpenerPolicy: false,
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: [
      'https://fxengin.com',
      'https://www.fxengin.com',
      'https://core.fxengin.com',
      'https://fxengen.com',
      'https://www.fxengen.com',
      'https://core.fxengen.com',
      'https://admin.fxengen.com',
      'https://dashboard.fxengen.com',
      'https://admin.srv1867849.hstgr.cloud',
      'https://dashboard.srv1867849.hstgr.cloud',
      'http://186.240.145.87:3005',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
      /^https?:\/\/[a-z0-9-]+\.fxengen\.com$/,
      /^https?:\/\/[a-z0-9-]+\.srv1867849\.hstgr\.cloud$/,
      /^https?:\/\/186\.240\.145\.87(:\d+)?$/,
      'https://fx-engin.vercel.app',
      'https://fxengin-admin-wimr.vercel.app',
      /^https:\/\/(fx-?engin|fxengin-admin)[a-z0-9-]*\.vercel\.app$/,
    ],
    credentials: true,
  });

  // ==========================================
  // SWAGGER API DOCUMENTATION SETUP
  // ==========================================
  const swaggerConfig = new DocumentBuilder()
    .setTitle('FXENGIN Core Engine API')
    .setDescription(
      `## Enterprise Forex Ecosystem & Algorithmic Trading Core API
      
      Welcome to the official **FXENGIN** API documentation. This interactive portal provides access to all public, authentication, user management, MT5 robot licensing, and crypto payment gateway endpoints.

      ### 🔐 Authentication Flow
      1. Register via \`POST /auth/register\` or sign in via \`POST /auth/login\`.
      2. Copy the returned \`accessToken\`.
      3. Click the **Authorize 🔓** button below and enter \`Bearer <accessToken>\`.
      `,
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT access token formatted as: Bearer <token>',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Health & Core', 'System status, health probes, and engine telemetry')
    .addTag('Authentication', 'Trader sign-up, sign-in, JWT tokens, and user profile management')
    .addTag(
      'Live Streaming & Interactive Broadcasts',
      'Proprietary sovereign live streaming directory, server-synchronized countdown timer, ephemeral play tickets, and real-time SSE chat',
    )
    .addTag(
      'Live Streaming Ingestion & Media Server Webhooks',
      'SRS media server authentication callbacks (on_publish, on_unpublish, on_dvr) for OBS Studio and vMix live stream ingestion',
    )
    .addTag(
      'Admin Live Broadcast Studio',
      'Broadcast control studio, OBS Studio credentials generator (RTMP/SRT/WHIP), real-time scheduling, and session lifecycle controls',
    )
    .addTag(
      'Forex Academy & Courses',
      'Enterprise LMS curriculum, tier paywall gating, anti-leak video chunk streaming (Range 206), and quiz evaluation engine',
    )
    .addTag(
      'Admin LMS & Courses Management',
      'Curriculum orchestration, video upload tickets, lesson sequencing, resources, and quiz builders',
    )
    .addTag(
      'Admin Cloud Storage',
      'MinIO & S3 presigned direct upload URL generation and external streaming link validation',
    )
    .addTag(
      'Admin Authentication & Security',
      'Super Administrator authentication, cryptographic session management, and system security controls',
    )
    .addTag(
      'Admin User Management & Institutional Control',
      'Institutional enterprise trader and administrator management, filtering, session forensics, and status controls',
    )
    .addTag(
      'Subscription Plans & User Entitlements',
      'Public pricing catalog, platform feature permissions, user active subscription status, and plan subscription',
    )
    .addTag(
      'Admin Subscription Plans & Feature Permissions',
      'Admin plan management, feature permissions mapping, manual subscription assignments, and subscriber statistics',
    )
    .build();


  const customSwaggerOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
      displayRequestDuration: true,
    },
    customSiteTitle: 'FXENGIN Core API — Interactive Swagger UI',
    customCss: `
      body {
        background-color: #080E1C !important;
        color: #F3F3F6 !important;
      }
      .swagger-ui {
        color: #CBD5E1 !important;
      }
      .swagger-ui .topbar {
        background-color: #0B132B !important;
        border-bottom: 2px solid #FC8702 !important;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5) !important;
      }
      .swagger-ui .topbar .topbar-wrapper .link {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #FFFFFF !important;
        font-weight: 800;
        font-size: 1.2rem;
      }
      .swagger-ui .info .title {
        color: #FC8702 !important;
        font-weight: 900 !important;
      }
      .swagger-ui .info h2, .swagger-ui .info h3 {
        color: #047FF8 !important;
      }
      .swagger-ui .scheme-container {
        background-color: #0C152B !important;
        box-shadow: none !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
        border-radius: 12px !important;
        margin-bottom: 20px !important;
      }
      .swagger-ui .opblock {
        background: rgba(14, 21, 38, 0.7) !important;
        border-radius: 10px !important;
        border: 1px solid rgba(255, 255, 255, 0.06) !important;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3) !important;
      }
      .swagger-ui .opblock .opblock-summary-method {
        border-radius: 6px !important;
        font-weight: 800 !important;
      }
      .swagger-ui .opblock-tag {
        color: #FFFFFF !important;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
        font-weight: 800 !important;
      }
      .swagger-ui .btn.authorize {
        background: linear-gradient(135deg, #FC8702 0%, #FB5902 100%) !important;
        color: #FFFFFF !important;
        border-color: #FC8702 !important;
        font-weight: 800 !important;
        border-radius: 8px !important;
        box-shadow: 0 4px 14px rgba(252, 135, 2, 0.35) !important;
      }
      .swagger-ui .btn.authorize svg {
        fill: #FFFFFF !important;
      }
      .swagger-ui select, .swagger-ui input[type=text] {
        background-color: #090E1A !important;
        color: #FFFFFF !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        border-radius: 6px !important;
      }
      .swagger-ui .response-col_status {
        color: #00E676 !important;
        font-weight: 700 !important;
      }
    `,
  };

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, customSwaggerOptions);
  SwaggerModule.setup('api/docs', app, document, customSwaggerOptions);
  SwaggerModule.setup('swagger', app, document, customSwaggerOptions);
}

let cachedServer: any;

export async function bootstrapServer() {
  if (!cachedServer) {
    const app = await NestFactory.create(AppModule);
    configureApp(app);
    await app.init();
    cachedServer = app.getHttpAdapter().getInstance();
  }
  return cachedServer;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  const port = process.env.PORT || 5000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 FXENGIN Core Engine is running on port ${port}`);
  console.log(`📘 Swagger UI is live at http://localhost:${port}/docs`);
}

if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME && require.main === module) {
  bootstrap();
}

export default async function handler(req: any, res: any) {
  const server = await bootstrapServer();
  return new Promise((resolve, reject) => {
    res.on('finish', resolve);
    res.on('error', reject);
    server(req, res);
  });
}

