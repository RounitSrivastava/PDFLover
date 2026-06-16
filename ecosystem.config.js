module.exports = {
  apps: [
    {
      name: "pdf-convertor",
      script: "node_modules/.bin/next",
      args: "start",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
