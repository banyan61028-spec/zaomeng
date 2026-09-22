import type { NextConfig } from "next";

const backendApiUrl = (process.env.BACKEND_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

const nextConfig: NextConfig = {
  agentRules: false,
  // Next 16 默认只信任 localhost；用 127.0.0.1 访问时 "/_next/*" 资源会被判为跨源并返回 403，
  // 导致客户端 JS 不加载、页面无法 hydration。显式放行本机开发源。
  allowedDevOrigins: ['127.0.0.1', 'localhost', '192.168.110.27'],
  async rewrites() {
    return [
      { source: '/code/:path*', destination: `${backendApiUrl}/code/:path*` },
      { source: '/api/:path*', destination: `${backendApiUrl}/api/:path*` },
    ];
  },
};

export default nextConfig;
