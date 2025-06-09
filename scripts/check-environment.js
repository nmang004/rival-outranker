#!/usr/bin/env node

/**
 * Environment Configuration Validator
 * 
 * Validates environment variables and provides setup guidance
 * Usage: npm run check:env
 */

const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Environment variable definitions
const envVars = {
  required: {
    NODE_ENV: {
      description: 'Application environment',
      allowed: ['development', 'staging', 'production'],
      default: 'development'
    },
    DATABASE_URL: {
      description: 'PostgreSQL database connection string',
      pattern: /^postgresql:\/\/.+/,
      required: true,
      security: 'critical'
    }
  },
  
  security: {
    JWT_SECRET: {
      description: 'JWT signing secret',
      minLength: 32,
      required: true,
      security: 'critical'
    },
    SESSION_SECRET: {
      description: 'Session encryption secret',
      minLength: 32,
      required: true,
      security: 'critical'
    }
  },
  
  apis: {
    OPENAI_API_KEY: {
      description: 'OpenAI API key for AI features',
      pattern: /^sk-(proj-)?[a-zA-Z0-9]+/,
      security: 'high'
    },
    DATAFORSEO_API_LOGIN: {
      description: 'DataForSEO username for keyword research',
      security: 'medium'
    },
    DATAFORSEO_API_PASSWORD: {
      description: 'DataForSEO password for keyword research',
      security: 'medium'
    },
    GOOGLE_API_KEY: {
      description: 'Google API key for PageSpeed Insights',
      security: 'medium'
    }
  },
  
  optional: {
    PORT: {
      description: 'Server port',
      type: 'number',
      default: 5001
    },
    API_BASE_URL: {
      description: 'Base URL for API',
      pattern: /^https?:\/\/.+/,
      default: 'http://localhost:5001'
    },
    FRONTEND_URL: {
      description: 'Frontend application URL',
      pattern: /^https?:\/\/.+/,
      default: 'http://localhost:5173'
    },
    CORS_ORIGIN: {
      description: 'Allowed CORS origins',
      default: 'http://localhost:5173'
    },
    LOG_LEVEL: {
      description: 'Application log level',
      allowed: ['error', 'warn', 'info', 'debug'],
      default: 'info'
    }
  }
};

class EnvironmentValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
    this.success = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colorCode = colors[type === 'error' ? 'red' : type === 'warning' ? 'yellow' : type === 'success' ? 'green' : 'cyan'];
    console.log(`${colorCode}${message}${colors.reset}`);
  }

  validateEnvFile() {
    const envPath = path.join(process.cwd(), '.env');
    
    if (!fs.existsSync(envPath)) {
      this.errors.push('.env file not found');
      this.log('❌ .env file not found', 'error');
      this.log('   Create .env file by copying from .env.local.example:', 'info');
      this.log('   cp .env.local.example .env', 'info');
      return false;
    }
    
    this.success.push('.env file exists');
    this.log('✅ .env file found', 'success');
    return true;
  }

  validateVariable(category, name, config) {
    const value = process.env[name];
    const prefix = category === 'required' ? '🔴' : category === 'security' ? '🔒' : category === 'apis' ? '🔑' : '⚙️';
    
    // Check if variable exists
    if (!value) {
      if (config.required) {
        this.errors.push(`${name} is required but not set`);
        this.log(`${prefix} ❌ ${name}: Required but not set`, 'error');
        this.log(`   ${config.description}`, 'info');
      } else {
        this.warnings.push(`${name} not set (optional)`);
        this.log(`${prefix} ⚠️  ${name}: Not set (using default: ${config.default || 'none'})`, 'warning');
      }
      return false;
    }

    // Check value length for security variables
    if (config.minLength && value.length < config.minLength) {
      this.errors.push(`${name} is too short (minimum ${config.minLength} characters)`);
      this.log(`${prefix} ❌ ${name}: Too short (${value.length} chars, need ${config.minLength})`, 'error');
      return false;
    }

    // Check pattern matching
    if (config.pattern && !config.pattern.test(value)) {
      this.errors.push(`${name} format is invalid`);
      this.log(`${prefix} ❌ ${name}: Invalid format`, 'error');
      return false;
    }

    // Check allowed values
    if (config.allowed && !config.allowed.includes(value)) {
      this.errors.push(`${name} has invalid value`);
      this.log(`${prefix} ❌ ${name}: Invalid value (allowed: ${config.allowed.join(', ')})`, 'error');
      return false;
    }

    // Check for development defaults in production
    if (process.env.NODE_ENV === 'production' && this.isDevelopmentDefault(name, value)) {
      this.errors.push(`${name} appears to be a development default in production`);
      this.log(`${prefix} ❌ ${name}: Using development default in production`, 'error');
      return false;
    }

    this.success.push(`${name} is properly configured`);
    this.log(`${prefix} ✅ ${name}: OK`, 'success');
    return true;
  }

  isDevelopmentDefault(name, value) {
    const devDefaults = [
      'development_jwt_secret',
      'development_session_secret',
      'your-api-key-here',
      'localhost',
      'password',
      'test_key'
    ];
    
    return devDefaults.some(def => value.toLowerCase().includes(def));
  }

  validateDatabaseConnection() {
    if (!process.env.DATABASE_URL) {
      this.warnings.push('Database connection cannot be tested (DATABASE_URL not set)');
      return false;
    }

    try {
      const url = new URL(process.env.DATABASE_URL);
      
      if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
        this.errors.push('DATABASE_URL must use postgresql:// protocol');
        return false;
      }

      if (!url.hostname || !url.port || !url.pathname) {
        this.errors.push('DATABASE_URL is missing required components');
        return false;
      }

      this.success.push('Database URL format is valid');
      this.log('🗄️  ✅ Database URL format: OK', 'success');
      return true;
    } catch (error) {
      this.errors.push(`DATABASE_URL format is invalid: ${error.message}`);
      this.log('🗄️  ❌ Database URL format: Invalid', 'error');
      return false;
    }
  }

  validateApiEndpoints() {
    const apis = [
      { name: 'API_BASE_URL', env: 'API_BASE_URL' },
      { name: 'Frontend URL', env: 'FRONTEND_URL' }
    ];

    apis.forEach(api => {
      const url = process.env[api.env];
      if (url) {
        try {
          new URL(url);
          this.success.push(`${api.name} format is valid`);
          this.log(`🌐 ✅ ${api.name}: OK`, 'success');
        } catch (error) {
          this.errors.push(`${api.name} is not a valid URL`);
          this.log(`🌐 ❌ ${api.name}: Invalid URL format`, 'error');
        }
      }
    });
  }

  checkSecurityBestPractices() {
    this.log('\n🔒 Security Best Practices Check:', 'info');
    
    const jwtSecret = process.env.JWT_SECRET;
    const sessionSecret = process.env.SESSION_SECRET;
    
    // Check if JWT and Session secrets are different
    if (jwtSecret && sessionSecret && jwtSecret === sessionSecret) {
      this.warnings.push('JWT_SECRET and SESSION_SECRET should be different');
      this.log('⚠️  JWT_SECRET and SESSION_SECRET are the same (should be different)', 'warning');
    }

    // Check environment-specific security settings
    if (process.env.NODE_ENV === 'production') {
      const prodChecks = [
        { env: 'SECURE_COOKIES', expected: 'true', message: 'SECURE_COOKIES should be true in production' },
        { env: 'DEBUG_MODE', expected: 'false', message: 'DEBUG_MODE should be false in production' },
        { env: 'LOG_LEVEL', allowed: ['error', 'warn'], message: 'LOG_LEVEL should be error or warn in production' }
      ];

      prodChecks.forEach(check => {
        const value = process.env[check.env];
        if (check.expected && value !== check.expected) {
          this.warnings.push(check.message);
          this.log(`⚠️  ${check.message}`, 'warning');
        }
        if (check.allowed && value && !check.allowed.includes(value)) {
          this.warnings.push(check.message);
          this.log(`⚠️  ${check.message}`, 'warning');
        }
      });
    }
  }

  generateReport() {
    this.log('\n' + '='.repeat(60), 'info');
    this.log('🔍 ENVIRONMENT VALIDATION REPORT', 'info');
    this.log('='.repeat(60), 'info');

    // Summary
    const totalChecks = this.errors.length + this.warnings.length + this.success.length;
    this.log(`\n📊 Summary:`, 'info');
    this.log(`   ✅ Passed: ${this.success.length}`, 'success');
    this.log(`   ⚠️  Warnings: ${this.warnings.length}`, 'warning');
    this.log(`   ❌ Errors: ${this.errors.length}`, 'error');

    // Detailed results
    if (this.errors.length > 0) {
      this.log('\n❌ ERRORS (Must fix):', 'error');
      this.errors.forEach(error => this.log(`   • ${error}`, 'error'));
    }

    if (this.warnings.length > 0) {
      this.log('\n⚠️  WARNINGS (Recommended fixes):', 'warning');
      this.warnings.forEach(warning => this.log(`   • ${warning}`, 'warning'));
    }

    // Recommendations
    this.log('\n💡 RECOMMENDATIONS:', 'info');
    
    if (this.errors.length > 0) {
      this.log('   1. Fix all errors before deploying to production', 'info');
    }
    
    if (!process.env.OPENAI_API_KEY) {
      this.log('   2. Add OPENAI_API_KEY for AI-powered content analysis', 'info');
    }
    
    if (!process.env.DATAFORSEO_API_LOGIN) {
      this.log('   3. Add DataForSEO credentials for real keyword data', 'info');
    }

    // Setup instructions
    this.log('\n📚 SETUP INSTRUCTIONS:', 'info');
    this.log('   • Documentation: docs/development/ENVIRONMENT_SETUP.md', 'info');
    this.log('   • Security Guide: docs/development/SECURITY_GUIDELINES.md', 'info');
    this.log('   • API Setup: docs/development/API_SETUP_GUIDES.md', 'info');

    return this.errors.length === 0;
  }

  async run() {
    this.log('🔍 Starting environment validation...', 'info');
    this.log(`📍 Environment: ${process.env.NODE_ENV || 'not set'}`, 'info');
    this.log(`📂 Working directory: ${process.cwd()}`, 'info');

    // Check for .env file
    if (!this.validateEnvFile()) {
      return this.generateReport();
    }

    // Validate all variable categories
    Object.entries(envVars).forEach(([category, variables]) => {
      this.log(`\n${category.toUpperCase()} Variables:`, 'info');
      Object.entries(variables).forEach(([name, config]) => {
        this.validateVariable(category, name, config);
      });
    });

    // Additional validations
    this.log('\n🔧 Additional Validations:', 'info');
    this.validateDatabaseConnection();
    this.validateApiEndpoints();
    this.checkSecurityBestPractices();

    // Generate final report
    const isValid = this.generateReport();
    
    if (isValid) {
      this.log('\n🎉 Environment validation passed!', 'success');
      process.exit(0);
    } else {
      this.log('\n❌ Environment validation failed. Please fix the errors above.', 'error');
      process.exit(1);
    }
  }
}

// Run validator if called directly
if (require.main === module) {
  const validator = new EnvironmentValidator();
  validator.run().catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}

module.exports = EnvironmentValidator;