# Security Guidelines for Environment Variables

Comprehensive security guidelines for managing environment variables and secrets in Rival Outranker.

## Table of Contents

- [Security Principles](#security-principles)
- [Environment Variable Classification](#environment-variable-classification)
- [Secret Generation](#secret-generation)
- [Storage and Access Control](#storage-and-access-control)
- [Rotation Policies](#rotation-policies)
- [Monitoring and Auditing](#monitoring-and-auditing)
- [Platform-Specific Guidelines](#platform-specific-guidelines)
- [Security Checklist](#security-checklist)
- [Incident Response](#incident-response)

## Security Principles

### 1. Principle of Least Privilege
- Grant minimum necessary access to environment variables
- Separate development, staging, and production access
- Use role-based access control (RBAC) when available

### 2. Defense in Depth
- Never rely on a single security mechanism
- Use multiple layers of protection
- Implement comprehensive monitoring

### 3. Zero Trust
- Verify every access request
- Never trust, always verify
- Implement proper authentication and authorization

### 4. Regular Rotation
- Rotate secrets on a regular schedule
- Implement automated rotation where possible
- Maintain audit trails of rotation activities

## Environment Variable Classification

### Critical Secrets (Highest Security)
Variables that provide direct access to sensitive systems or data.

**Examples:**
- `DATABASE_URL` - Full database access
- `JWT_SECRET` - Authentication bypass
- `SESSION_SECRET` - Session hijacking
- Production API keys with billing access

**Security Requirements:**
- Minimum 32 characters, cryptographically secure
- Rotate every 90 days
- Never log or display
- Store in secure vault systems
- Restrict access to production team only

### Sensitive Configuration (High Security)
Variables that could compromise security if exposed but don't provide direct system access.

**Examples:**
- API keys for external services
- Email service credentials
- Third-party service tokens

**Security Requirements:**
- Strong passwords/keys (24+ characters)
- Rotate every 180 days
- Restrict access by role
- Monitor usage patterns

### Configuration Settings (Medium Security)
Variables that configure application behavior but don't contain secrets.

**Examples:**
- `NODE_ENV`
- `LOG_LEVEL`
- Feature flags
- Rate limiting settings

**Security Requirements:**
- Document allowed values
- Validate input ranges
- Monitor for unauthorized changes

### Public Configuration (Low Security)
Variables that can be safely exposed in client-side code.

**Examples:**
- `FRONTEND_URL`
- Public API endpoints
- CDN URLs

**Security Requirements:**
- Still avoid hardcoding in public repositories
- Validate format and content

## Secret Generation

### JWT Secrets

```bash
# Generate JWT secret (minimum 32 characters)
openssl rand -base64 32

# Alternative using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Verify strength
echo "YOUR_SECRET" | wc -c  # Should be 32+ characters
```

### Session Secrets

```bash
# Generate session secret (different from JWT)
openssl rand -base64 32

# For additional entropy
openssl rand -base64 48
```

### Database Passwords

```bash
# Generate secure database password
openssl rand -base64 24 | tr '+/' '-_'

# Remove special characters that might cause issues
openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
```

### API Key Generation

```bash
# For internal API keys
uuidgen | tr -d '-' | tr '[:upper:]' '[:lower:]'

# For webhook tokens
openssl rand -hex 32
```

### Secret Validation

```bash
# Check secret entropy
python3 -c "
import math
secret = 'YOUR_SECRET_HERE'
entropy = len(set(secret)) * math.log2(len(set(secret)))
print(f'Entropy: {entropy:.2f} bits')
print(f'Strength: {\"Strong\" if entropy > 64 else \"Weak\"}')"
```

## Storage and Access Control

### Local Development

**DO:**
- Use `.env` files (gitignored)
- Use development-specific secrets
- Never use production secrets locally

**DON'T:**
- Commit `.env` files to version control
- Share `.env` files via email/chat
- Use production secrets in development

```bash
# Proper local setup
cp .env.local.example .env
# Edit .env with development values only
```

### Staging Environment

**Platform Secret Management:**
```bash
# Railway
railway variables set JWT_SECRET=staging_secret_123

# Netlify
netlify env:set JWT_SECRET staging_secret_123

# AWS
aws ssm put-parameter --name "/app/staging/JWT_SECRET" --value "staging_secret_123" --type SecureString
```

### Production Environment

**DO:**
- Use managed secret services (AWS Secrets Manager, Azure Key Vault, etc.)
- Implement secret rotation
- Use different secrets than staging
- Implement comprehensive monitoring

**DON'T:**
- Store secrets in plain text
- Use the same secrets across environments
- Grant broad access to production secrets

### Access Control Matrix

| Role | Development | Staging | Production |
|------|-------------|---------|------------|
| **Developer** | Read/Write | Read Only | No Access |
| **DevOps** | Read/Write | Read/Write | Read Only |
| **Security** | Read Only | Read/Write | Read/Write |
| **Operations** | No Access | Read Only | Read/Write |

## Rotation Policies

### Rotation Schedule

| Secret Type | Frequency | Trigger Events |
|-------------|-----------|----------------|
| **JWT/Session Secrets** | 90 days | Security incident, team changes |
| **Database Passwords** | 180 days | Access changes, suspected compromise |
| **API Keys** | 365 days | Provider recommendations, incidents |
| **Webhook Tokens** | 180 days | Integration changes |

### Rotation Process

#### 1. Pre-Rotation Planning
```bash
# Document current secrets
echo "Current JWT secret ends with: $(echo $JWT_SECRET | tail -c 5)"

# Prepare new secrets
NEW_JWT_SECRET=$(openssl rand -base64 32)
NEW_SESSION_SECRET=$(openssl rand -base64 32)
```

#### 2. Staged Rollout
```bash
# Stage 1: Update staging environment
railway variables set JWT_SECRET=$NEW_JWT_SECRET --environment staging

# Stage 2: Test staging thoroughly
npm run test:staging

# Stage 3: Update production during maintenance window
railway variables set JWT_SECRET=$NEW_JWT_SECRET --environment production

# Stage 4: Verify production functionality
npm run test:production
```

#### 3. Post-Rotation Cleanup
```bash
# Revoke old secrets
# Update documentation
# Notify team of successful rotation
```

### Automated Rotation

```bash
# Example rotation script
#!/bin/bash
set -euo pipefail

ENVIRONMENT=${1:-staging}
SECRET_NAME=${2:-JWT_SECRET}

# Generate new secret
NEW_SECRET=$(openssl rand -base64 32)

# Update secret in platform
railway variables set $SECRET_NAME="$NEW_SECRET" --environment $ENVIRONMENT

# Restart application to pick up new secret
railway redeploy --environment $ENVIRONMENT

# Log rotation event
echo "$(date): Rotated $SECRET_NAME in $ENVIRONMENT" >> rotation.log
```

## Monitoring and Auditing

### Secret Access Monitoring

```javascript
// Log secret access attempts
const sensitiveVars = ['JWT_SECRET', 'DATABASE_URL', 'OPENAI_API_KEY'];

function getEnvVar(name) {
  if (sensitiveVars.includes(name)) {
    console.log(`Access to sensitive variable: ${name} at ${new Date().toISOString()}`);
    // Log to security monitoring system
    logSecurityEvent('env_var_access', { variable: name, timestamp: Date.now() });
  }
  return process.env[name];
}
```

### Audit Logging

```bash
# Example audit log entry
{
  "timestamp": "2024-01-15T10:30:00Z",
  "event": "env_var_rotation",
  "user": "devops@company.com",
  "environment": "production",
  "variable": "JWT_SECRET",
  "success": true,
  "ip_address": "192.168.1.100"
}
```

### Security Metrics

Track these metrics:
- Secret rotation compliance
- Failed authentication attempts
- Unusual API usage patterns
- Environment variable access frequency
- Secret exposure incidents

### Alerting Rules

```yaml
# Example alerting configuration
alerts:
  - name: "Overdue Secret Rotation"
    condition: "secret_age > 90_days"
    severity: "high"
    
  - name: "Multiple Failed Auth Attempts"
    condition: "failed_auth_count > 10 in 5_minutes"
    severity: "critical"
    
  - name: "Unusual API Usage"
    condition: "api_requests > baseline * 5"
    severity: "medium"
```

## Platform-Specific Guidelines

### Railway

**Security Features:**
- Encrypted variable storage
- Role-based access control
- Audit logging
- Team permissions

**Best Practices:**
```bash
# Set variables securely
railway variables set JWT_SECRET="$(openssl rand -base64 32)"

# Use different secrets per environment
railway variables set JWT_SECRET="$DEV_SECRET" --environment development
railway variables set JWT_SECRET="$PROD_SECRET" --environment production

# Review access logs
railway logs --environment production | grep "variable"
```

### AWS

**Security Features:**
- AWS Secrets Manager
- IAM policies
- CloudTrail logging
- KMS encryption

**Best Practices:**
```bash
# Store secrets in Secrets Manager
aws secretsmanager create-secret \
  --name "rival-outranker/production/jwt-secret" \
  --secret-string "$(openssl rand -base64 32)"

# Access secrets in application
aws secretsmanager get-secret-value \
  --secret-id "rival-outranker/production/jwt-secret" \
  --query SecretString --output text
```

### Netlify

**Security Features:**
- Encrypted environment variables
- Team access controls
- Build-time variable injection

**Best Practices:**
```bash
# Set variables via CLI
netlify env:set JWT_SECRET "$(openssl rand -base64 32)"

# Use different values per site
netlify env:set JWT_SECRET "$STAGING_SECRET" --site staging-site
netlify env:set JWT_SECRET "$PROD_SECRET" --site production-site
```

### Docker/Kubernetes

**Security Features:**
- Kubernetes Secrets
- Pod security policies
- RBAC integration

**Best Practices:**
```yaml
# kubernetes-secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: rival-outranker-secrets
type: Opaque
data:
  JWT_SECRET: <base64-encoded-secret>
  DATABASE_URL: <base64-encoded-url>
```

## Security Checklist

### Development Setup
- [ ] `.env` files are gitignored
- [ ] No production secrets in development
- [ ] Development secrets are weak/obvious
- [ ] Local database uses test data only

### Staging Setup
- [ ] Separate secrets from production
- [ ] Monitoring is configured
- [ ] Access is restricted to team members
- [ ] Testing covers secret rotation

### Production Setup
- [ ] All secrets are cryptographically secure (32+ chars)
- [ ] Secrets are stored in managed service
- [ ] Access is restricted by role
- [ ] Rotation schedule is documented
- [ ] Monitoring and alerting are active
- [ ] Backup and recovery procedures exist

### Ongoing Security
- [ ] Regular rotation schedule followed
- [ ] Access reviews conducted quarterly
- [ ] Security training completed by team
- [ ] Incident response plan tested
- [ ] Audit logs reviewed monthly

## Incident Response

### Secret Compromise Response

#### Immediate Actions (0-1 hour)
1. **Assess Scope**
   - Identify compromised secrets
   - Determine potential impact
   - Document timeline of events

2. **Contain Breach**
   - Rotate compromised secrets immediately
   - Revoke access tokens
   - Monitor for unauthorized usage

3. **Secure Environment**
   - Update all related secrets
   - Restart affected services
   - Verify system integrity

#### Short-term Actions (1-24 hours)
1. **Investigation**
   - Review access logs
   - Identify root cause
   - Document findings

2. **Communication**
   - Notify stakeholders
   - Update incident tracking
   - Coordinate response efforts

#### Long-term Actions (1-30 days)
1. **Process Improvement**
   - Update security procedures
   - Enhance monitoring
   - Conduct lessons learned session

2. **Prevention**
   - Implement additional controls
   - Update training materials
   - Review and update policies

### Incident Communication Template

```
Subject: Security Incident - Environment Variable Compromise

Timeline: [DATE] [TIME]
Severity: [HIGH/MEDIUM/LOW]
Status: [INVESTIGATING/CONTAINED/RESOLVED]

SUMMARY:
[Brief description of incident]

AFFECTED SYSTEMS:
- [List affected environments/services]

ACTIONS TAKEN:
- [List immediate response actions]

NEXT STEPS:
- [List planned follow-up actions]

ESTIMATED RESOLUTION:
[Time estimate]

CONTACT:
[Security team contact information]
```

### Recovery Procedures

```bash
#!/bin/bash
# Emergency secret rotation script

set -euo pipefail

echo "Emergency secret rotation initiated at $(date)"

# Generate new secrets
NEW_JWT=$(openssl rand -base64 32)
NEW_SESSION=$(openssl rand -base64 32)
NEW_DB_PASS=$(openssl rand -base64 24 | tr '+/' '-_')

# Update production secrets
railway variables set JWT_SECRET="$NEW_JWT" --environment production
railway variables set SESSION_SECRET="$NEW_SESSION" --environment production

# Restart services
railway redeploy --environment production

# Verify services are healthy
sleep 30
curl -f https://api.yourdomain.com/health || echo "Health check failed"

echo "Emergency rotation completed at $(date)"
```

## Compliance and Standards

### Regulatory Requirements

**SOC 2 Compliance:**
- Implement access controls
- Maintain audit trails
- Regular security reviews
- Incident response procedures

**GDPR Compliance:**
- Data encryption at rest and in transit
- Access logging and monitoring
- Right to be forgotten procedures
- Data processing agreements

### Industry Standards

**NIST Cybersecurity Framework:**
- Identify: Asset inventory and risk assessment
- Protect: Access controls and data security
- Detect: Monitoring and anomaly detection
- Respond: Incident response procedures
- Recover: Recovery planning and improvements

**OWASP Guidelines:**
- Secure secret storage
- Principle of least privilege
- Defense in depth
- Secure development lifecycle

## Tools and Resources

### Secret Management Tools
- **HashiCorp Vault** - Enterprise secret management
- **AWS Secrets Manager** - AWS native solution
- **Azure Key Vault** - Azure native solution
- **Google Secret Manager** - GCP native solution

### Monitoring Tools
- **Sentry** - Error monitoring and alerting
- **DataDog** - Infrastructure and application monitoring
- **New Relic** - Application performance monitoring
- **CloudWatch** - AWS native monitoring

### Security Scanning
- **GitGuardian** - Secret scanning in repositories
- **TruffleHog** - Secret detection in Git history
- **Snyk** - Vulnerability scanning
- **SonarQube** - Code quality and security

### Documentation Templates
- Secret rotation runbooks
- Incident response playbooks
- Security review checklists
- Training materials

Remember: Security is an ongoing process, not a one-time setup. Regular reviews, updates, and improvements are essential for maintaining a secure environment.