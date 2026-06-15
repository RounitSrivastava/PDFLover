/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    '/api/**/*': ['./bin/**/*'],
  },
};

module.exports = nextConfig;