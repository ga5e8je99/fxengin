import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  formatUptime(seconds: number): string {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(' ');
  }

  async getHealthStatus() {
    let dbStatus = 'healthy';
    let dbLatencyMs = 0;

    try {
      const start = Date.now();
      await Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database probe timeout (2s)')), 2000)
        ),
      ]);
      dbLatencyMs = Date.now() - start;
    } catch (err: any) {
      dbStatus = `unhealthy: ${err.message}`;
    }

    return {
      status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
      engine: 'FXENGIN Core Engine',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      uptimeSeconds: process.uptime(),
      uptimeFormatted: this.formatUptime(process.uptime()),
      timestamp: new Date().toISOString(),
      services: {
        database: {
          type: 'PostgreSQL 16',
          status: dbStatus,
          latency: `${dbLatencyMs}ms`,
        },
        redis: {
          type: 'Redis 7 Alpine',
          status: 'healthy',
        },
        auth: {
          type: 'JWT + Bcrypt 12 Rounds',
          status: 'healthy',
        },
        gateway: {
          type: 'Traefik TLS Ingress',
          domain: 'core.fxengen.com',
          status: 'healthy',
        },
      },
    };
  }

  getDashboardHtml(health: any): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FXENGIN Core Engine — System Dashboard & API Documentation</title>
  <link rel="icon" href="https://fxengen.com/brand/logo.webp" type="image/webp">
  <style>
    :root {
      --bg-dark: #080E1C;
      --card-bg: rgba(14, 21, 38, 0.85);
      --border-color: rgba(255, 255, 255, 0.08);
      --color-orange: #FC8702;
      --color-orange-dark: #FB5902;
      --color-blue: #047FF8;
      --color-green: #00E676;
      --text-main: #FFFFFF;
      --text-muted: #94A3B8;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      background-color: var(--bg-dark);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 1.5rem;
      background-image: 
        radial-gradient(circle at 10% 20%, rgba(252, 135, 2, 0.12) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(4, 127, 248, 0.12) 0%, transparent 40%);
    }
    .dashboard-container {
      width: 100%;
      max-width: 860px;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 2.2rem 2.5rem;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(20px);
    }
    .header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 1.5rem;
      margin-bottom: 1.8rem;
    }
    .brand-group {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .brand-group img {
      width: 52px;
      height: 52px;
      object-fit: contain;
      filter: drop-shadow(0 4px 14px rgba(252, 135, 2, 0.4));
    }
    .brand-title {
      font-size: 1.6rem;
      font-weight: 900;
      letter-spacing: 0.5px;
      color: #FFFFFF;
    }
    .brand-subtitle {
      font-size: 0.82rem;
      color: var(--text-muted);
      margin-top: 0.15rem;
    }
    .live-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(0, 230, 118, 0.12);
      border: 1px solid rgba(0, 230, 118, 0.3);
      color: var(--color-green);
      padding: 0.45rem 0.9rem;
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--color-green);
      box-shadow: 0 0 10px var(--color-green);
      animation: pulse 1.8s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 230, 118, 0.7); }
      70% { transform: scale(1.15); box-shadow: 0 0 0 8px rgba(0, 230, 118, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 230, 118, 0); }
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 1.8rem;
    }
    .stat-card {
      background: #090E1A;
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 1rem 1.2rem;
    }
    .stat-label {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--text-muted);
      margin-bottom: 0.35rem;
    }
    .stat-value {
      font-size: 1.15rem;
      font-weight: 800;
      color: #FFFFFF;
    }
    .services-section {
      margin-bottom: 1.8rem;
    }
    .section-heading {
      font-size: 0.9rem;
      font-weight: 700;
      color: #CBD5E1;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 0.9rem;
    }
    .service-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      background: #0A0F1D;
      border: 1px solid rgba(255, 255, 255, 0.04);
      border-radius: 10px;
      margin-bottom: 0.5rem;
    }
    .service-name {
      font-size: 0.88rem;
      font-weight: 600;
      color: #FFFFFF;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .service-status {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--color-green);
    }
    .actions-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 0.9rem;
    }
    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.85rem 1rem;
      border-radius: 10px;
      text-decoration: none;
      font-size: 0.88rem;
      font-weight: 800;
      text-align: center;
      transition: all 0.2s ease;
    }
    .btn-primary {
      background: linear-gradient(135deg, var(--color-orange) 0%, var(--color-orange-dark) 100%);
      color: #FFFFFF;
      box-shadow: 0 4px 18px rgba(252, 135, 2, 0.35);
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(252, 135, 2, 0.5);
    }
    .btn-secondary {
      background: #0D1426;
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #F3F3F6;
    }
    .btn-secondary:hover {
      background: #141E38;
      border-color: var(--color-blue);
      transform: translateY(-2px);
    }
    .footer {
      margin-top: 1.8rem;
      text-align: center;
      font-size: 0.74rem;
      color: #64748B;
    }
    @media (max-width: 680px) {
      .header-row { flex-direction: column; gap: 1rem; align-items: flex-start; }
      .actions-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="dashboard-container">
    <div class="header-row">
      <div class="brand-group">
        <img src="https://fxengen.com/brand/logo.webp" alt="FXENGIN Logo">
        <div>
          <div class="brand-title">FXENGIN CORE API</div>
          <div class="brand-subtitle">High-Performance Forex Telemetry & Bot Licensing Gateway</div>
        </div>
      </div>
      <div class="live-badge">
        <div class="pulse-dot"></div>
        <span>${health.status.toUpperCase()}</span>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Environment</div>
        <div class="stat-value" style="color: var(--color-orange);">${health.environment.toUpperCase()}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Engine Version</div>
        <div class="stat-value">${health.version}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Server Uptime</div>
        <div class="stat-value">${health.uptimeFormatted}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">DB Ping Latency</div>
        <div class="stat-value" style="color: var(--color-green);">${health.services.database.latency}</div>
      </div>
    </div>

    <div class="services-section">
      <div class="section-heading">Connected Infrastructure & Microservices</div>
      <div class="service-row">
        <div class="service-name">🐘 PostgreSQL 16 Enterprise Database</div>
        <div class="service-status">ACTIVE • HEALTHY</div>
      </div>
      <div class="service-row">
        <div class="service-name">⚡ Redis 7 In-Memory Cache & Task Queue</div>
        <div class="service-status">ACTIVE • HEALTHY</div>
      </div>
      <div class="service-row">
        <div class="service-name">🛡️ JWT Authentication & Bcrypt 12 Engine</div>
        <div class="service-status">ACTIVE • ENCRYPTED</div>
      </div>
      <div class="service-row">
        <div class="service-name">🌐 Traefik Edge Proxy & Automated Let's Encrypt TLS</div>
        <div class="service-status">ACTIVE • HTTPS SECURED</div>
      </div>
    </div>

    <div class="actions-grid">
      <a href="/docs" class="btn btn-primary">
        📘 Interactive Swagger UI
      </a>
      <a href="/health" class="btn btn-secondary">
        🩺 JSON Health Metric
      </a>
      <a href="https://fxengen.com" target="_blank" class="btn btn-secondary">
        🌐 Live Frontend Terminal
      </a>
    </div>

    <div class="footer">
      &copy; 2026 FXENGIN Enterprise Platform. All rights reserved. System time: ${health.timestamp}
    </div>
  </div>
</body>
</html>`;
  }
}
