import { Controller, Get, Post, Body, Req, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AppService } from './app.service';
import { ReportErrorDto } from './dto/report-error.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiTags('Health & Core')
  @ApiOperation({
    summary: 'Backend Engine Root Dashboard & Status',
    description: 'Serves an interactive high-tech visual dashboard for web browsers or JSON status for API clients.',
  })
  @ApiResponse({ status: 200, description: 'Backend operational dashboard or JSON payload.' })
  async getRoot(@Req() req: any, @Res() res: any) {
    const health = await this.appService.getHealthStatus();
    const acceptsHtml = req.headers.accept && req.headers.accept.includes('text/html');

    if (acceptsHtml) {
      return res
        .status(HttpStatus.OK)
        .header('Content-Type', 'text/html; charset=utf-8')
        .send(this.appService.getDashboardHtml(health));
    }

    return res.status(HttpStatus.OK).json(health);
  }

  @Get('health')
  @ApiTags('Health & Core')
  @ApiOperation({
    summary: 'Engine Health Check Endpoint',
    description: 'Returns real-time health telemetry of database, cache, and system uptime.',
  })
  @ApiResponse({ status: 200, description: 'Detailed health telemetry JSON.' })
  async getHealth() {
    return this.appService.getHealthStatus();
  }

  @Get('system/locales')
  @ApiTags('System & Telemetry')
  @ApiOperation({
    summary: 'Get Supported Locales & Platform Languages',
    description: 'Returns available languages (EN, AR), default locale, text directions, and localization configurations.',
  })
  @ApiResponse({ status: 200, description: 'Platform locales configuration payload.' })
  getLocales() {
    return {
      success: true,
      defaultLocale: 'EN',
      supportedLocales: [
        { code: 'EN', name: 'English', dir: 'ltr', isDefault: true },
        { code: 'AR', name: 'العربية', dir: 'rtl', isDefault: false },
      ],
      timestamp: new Date().toISOString(),
    };
  }

  @Post('system/report-error')
  @ApiTags('System & Telemetry')
  @ApiOperation({
    summary: 'Report Client Telemetry / Error Event',
    description: 'Receives and logs 404, 401, 403, and 500 client crash/failure telemetry for diagnostics and admin alerts.',
  })
  @ApiBody({ type: ReportErrorDto })
  @ApiResponse({ status: 201, description: 'Error telemetry successfully recorded.' })
  reportError(@Body() dto: ReportErrorDto) {
    console.warn(`[Client Telemetry Alert] Code: ${dto.errorCode} on Path: ${dto.path} - ${dto.message || 'N/A'}`);
    return {
      success: true,
      message: 'Telemetry logged into cluster monitoring stream',
      reportedAt: new Date().toISOString(),
      record: {
        errorCode: dto.errorCode,
        path: dto.path,
      },
    };
  }
}
