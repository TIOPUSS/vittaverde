// PM2 Ecosystem Configuration - VittaVerde Production

module.exports = {
  apps: [
    {
      name: 'vittaverde',
      script: 'npm',
      args: 'start',
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster', // Cluster mode for load balancing
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_file: '.env.production',
      
      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Auto restart
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Memory management
      max_memory_restart: '500M',
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Watch (disabled in production)
      watch: false,
      
      // Additional settings
      time: true,
      instance_var: 'INSTANCE_ID'
    }
  ],

  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'deploy',
      host: 'vittaverde.com',
      ref: 'origin/main',
      repo: 'git@github.com:vittaverde/platform.git',
      path: '/var/www/vittaverde',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
