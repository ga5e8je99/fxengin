import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MarketModule } from './market/market.module';
import { AnalystModule } from './analyst/analyst.module';
import { CommonModule } from './common/common.module';
import { AdminModule } from './admin/admin.module';
import { CoursesModule } from './courses/courses.module';
import { LiveModule } from './live/live.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { CouponsModule } from './coupons/coupons.module';
import { MailModule } from './mail/mail.module';
import { AdsModule } from './ads/ads.module';
import { SignalsModule } from './signals/signals.module';
import { ContactModule } from './contact/contact.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { TestimonialsModule } from './testimonials/testimonials.module';
import { SettingsModule } from './settings/settings.module';
import { ArticlesModule } from './articles/articles.module';
import { BrokersModule } from './brokers/brokers.module';
import { CmsModule } from './cms/cms.module';
import { OrdersModule } from './orders/orders.module';
import { ActivationModule } from './activation/activation.module';
import { PaymentsModule } from './payments/payments.module';
import { TradingModule } from './trading/trading.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    CommonModule,
    PrismaModule,
    MailModule,
    AdsModule,
    AuthModule,
    MarketModule,
    AnalystModule,
    AdminModule,
    CoursesModule,
    LiveModule,
    SubscriptionsModule,
    CouponsModule,
    SignalsModule,
    ContactModule,
    NewsletterModule,
    TestimonialsModule,
    SettingsModule,
    ArticlesModule,
    BrokersModule,
    CmsModule,
    OrdersModule,
    ActivationModule,
    PaymentsModule,
    TradingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

