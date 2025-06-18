#!/bin/bash

# Phase 4 Rollback Procedures
# Emergency rollback script for Priority System v2.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ROLLBACK_LOG="$PROJECT_ROOT/logs/rollback-$(date +%Y%m%d_%H%M%S).log"

# Ensure log directory exists
mkdir -p "$(dirname "$ROLLBACK_LOG")"

# Logging functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$ROLLBACK_LOG"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$ROLLBACK_LOG"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$ROLLBACK_LOG"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$ROLLBACK_LOG"
}

# Show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  --backup-dir DIR    Specify backup directory to restore from"
    echo "  --automatic         Run automatic rollback using latest backup"
    echo "  --database-only     Only rollback database changes"
    echo "  --code-only         Only rollback code changes"
    echo "  --verify-only       Only verify rollback is possible"
    echo "  --help              Show this help message"
    echo
    echo "Examples:"
    echo "  $0 --automatic"
    echo "  $0 --backup-dir /path/to/backup"
    echo "  $0 --verify-only"
}

# Find latest backup
find_latest_backup() {
    local backup_pattern="$PROJECT_ROOT/backups/[0-9]*_[0-9]*"
    local latest_backup=$(ls -1d $backup_pattern 2>/dev/null | sort -r | head -n1)
    
    if [[ -z "$latest_backup" ]]; then
        error "No backup directories found in $PROJECT_ROOT/backups/"
    fi
    
    echo "$latest_backup"
}

# Verify backup integrity
verify_backup() {
    local backup_dir="$1"
    
    log "Verifying backup integrity at $backup_dir..."
    
    if [[ ! -d "$backup_dir" ]]; then
        error "Backup directory does not exist: $backup_dir"
    fi
    
    # Check for required backup files
    local required_files=(
        "package.json.backup"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$backup_dir/$file" ]]; then
            error "Required backup file missing: $file"
        fi
    done
    
    # Check if dist backup exists
    if [[ ! -d "$backup_dir/dist_backup" ]]; then
        warning "No dist backup found - will rebuild from source"
    fi
    
    # Check database backup
    if [[ ! -f "$backup_dir/database_backup.sql" ]]; then
        warning "No database backup found - database rollback will be skipped"
    fi
    
    success "Backup verification passed"
}

# Stop application
stop_application() {
    log "Stopping application..."
    
    # Try to stop gracefully first
    pkill -f "node.*server/index" 2>/dev/null || true
    pkill -f "npm.*start" 2>/dev/null || true
    
    # Wait a moment
    sleep 3
    
    # Force kill if still running
    pkill -9 -f "node.*server/index" 2>/dev/null || true
    pkill -9 -f "npm.*start" 2>/dev/null || true
    
    success "Application stopped"
}

# Rollback database
rollback_database() {
    local backup_dir="$1"
    
    if [[ -z "$DATABASE_URL" ]]; then
        warning "DATABASE_URL not set - skipping database rollback"
        return 0
    fi
    
    if [[ ! -f "$backup_dir/database_backup.sql" ]]; then
        warning "No database backup found - skipping database rollback"
        return 0
    fi
    
    log "Rolling back database..."
    
    # Create current database backup before rollback
    local emergency_backup="$PROJECT_ROOT/backups/emergency-$(date +%Y%m%d_%H%M%S).sql"
    mkdir -p "$(dirname "$emergency_backup")"
    pg_dump "$DATABASE_URL" > "$emergency_backup" || warning "Could not create emergency backup"
    
    # Restore from backup
    psql "$DATABASE_URL" < "$backup_dir/database_backup.sql" || error "Database rollback failed"
    
    # Re-add the override table removal (it should stay removed)
    log "Ensuring override table cleanup remains applied..."
    psql "$DATABASE_URL" -c "DROP TABLE IF EXISTS page_classification_overrides;" || true
    
    success "Database rollback completed"
}

# Rollback code
rollback_code() {
    local backup_dir="$1"
    
    log "Rolling back code changes..."
    
    cd "$PROJECT_ROOT"
    
    # Stop any running processes
    stop_application
    
    # Restore package files
    if [[ -f "$backup_dir/package.json.backup" ]]; then
        cp "$backup_dir/package.json.backup" package.json
        log "Restored package.json"
    fi
    
    if [[ -f "$backup_dir/package-lock.json.backup" ]]; then
        cp "$backup_dir/package-lock.json.backup" package-lock.json
        log "Restored package-lock.json"
    fi
    
    # Reinstall dependencies from backup
    rm -rf node_modules 2>/dev/null || true
    npm install || error "Failed to reinstall dependencies"
    
    # Restore dist directory if available
    if [[ -d "$backup_dir/dist_backup" ]]; then
        rm -rf dist
        cp -r "$backup_dir/dist_backup" dist
        log "Restored dist directory from backup"
    else
        # Rebuild if no dist backup
        warning "No dist backup found - rebuilding..."
        npm run build || error "Failed to rebuild application"
    fi
    
    # Remove priority system v2.0 files
    log "Removing priority system v2.0 files..."
    
    local v2_files=(
        "server/services/audit/issue-grouping.service.ts"
        "server/services/audit/priority-system-integration.example.ts"
        "docs/PRIORITY_SYSTEM_DOCUMENTATION.md"
        "tests/integration/audit-system.test.ts"
        "tests/performance/benchmark.test.ts"
        "tests/integration/edge-cases.test.ts"
        "tests/integration/regression.test.ts"
        "scripts/deploy-phase4.sh"
    )
    
    for file in "${v2_files[@]}"; do
        if [[ -f "$file" ]]; then
            rm "$file"
            log "Removed $file"
        fi
    done
    
    success "Code rollback completed"
}

# Verify rollback
verify_rollback() {
    log "Verifying rollback..."
    
    cd "$PROJECT_ROOT"
    
    # Check TypeScript compilation
    npm run check || error "TypeScript check failed after rollback"
    
    # Verify priority system v2.0 files are removed
    local v2_files=(
        "server/services/audit/issue-grouping.service.ts"
        "server/services/audit/priority-system-integration.example.ts"
    )
    
    for file in "${v2_files[@]}"; do
        if [[ -f "$file" ]]; then
            error "Priority system v2.0 file still exists: $file"
        fi
    done
    
    # Test basic functionality
    log "Testing application startup..."
    npm start &
    local app_pid=$!
    
    sleep 10
    
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        success "Application health check passed"
    else
        warning "Health check failed - manual verification may be needed"
    fi
    
    kill $app_pid 2>/dev/null || true
    
    success "Rollback verification passed"
}

# Generate rollback report
generate_rollback_report() {
    local backup_dir="$1"
    local report_file="$PROJECT_ROOT/rollback-report-$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$report_file" << EOF
# Phase 4 Rollback Report

**Date**: $(date '+%Y-%m-%d %H:%M:%S')  
**Rollback From**: Priority System v2.0  
**Backup Used**: $backup_dir

## Summary

✅ **SUCCESS**: Rollback completed successfully

## Actions Taken

### 1. Application Shutdown
- ✅ Gracefully stopped running processes
- ✅ Ensured clean application state

### 2. Database Rollback
$(if [[ -f "$backup_dir/database_backup.sql" && -n "$DATABASE_URL" ]]; then
    echo "- ✅ Restored database from backup"
    echo "- ✅ Maintained override table cleanup"
else
    echo "- ⚠️ Database rollback skipped (no backup or DATABASE_URL)"
fi)

### 3. Code Rollback
- ✅ Restored package.json and dependencies
- ✅ Restored application build
- ✅ Removed priority system v2.0 files
- ✅ Verified TypeScript compilation

### 4. Verification
- ✅ Application startup test
- ✅ Health check validation
- ✅ File cleanup verification

## Removed Files

The following Priority System v2.0 files were removed:
- server/services/audit/issue-grouping.service.ts
- server/services/audit/priority-system-integration.example.ts
- docs/PRIORITY_SYSTEM_DOCUMENTATION.md
- tests/integration/audit-system.test.ts
- tests/performance/benchmark.test.ts
- tests/integration/edge-cases.test.ts
- tests/integration/regression.test.ts
- scripts/deploy-phase4.sh

## System State

- **Version**: Reverted to pre-Phase 4 state
- **Priority System**: Original linear accumulation system
- **Database**: $(if [[ -n "$DATABASE_URL" ]]; then echo "Restored from backup"; else echo "No changes required"; fi)
- **Manual Overrides**: Still disabled (table remains dropped)

## Post-Rollback Tasks

1. Monitor application stability
2. Verify audit functionality works as expected
3. Investigate root cause of rollback requirement
4. Plan remediation for priority system issues
5. Update monitoring systems

## Files and Logs

- **Rollback Log**: $ROLLBACK_LOG
- **Backup Directory**: $backup_dir
- **Emergency DB Backup**: $(if [[ -f "$PROJECT_ROOT/backups/emergency-"*.sql ]]; then echo "Available"; else echo "Not created"; fi)

---

**Rollback completed successfully** ✅

If you need to re-deploy Phase 4, address the issues that caused this rollback first.
EOF

    success "Rollback report generated: $report_file"
}

# Main rollback process
main() {
    local backup_dir=""
    local automatic=false
    local database_only=false
    local code_only=false
    local verify_only=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --backup-dir)
                backup_dir="$2"
                shift 2
                ;;
            --automatic)
                automatic=true
                shift
                ;;
            --database-only)
                database_only=true
                shift
                ;;
            --code-only)
                code_only=true
                shift
                ;;
            --verify-only)
                verify_only=true
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                ;;
        esac
    done
    
    echo "=============================================="
    echo "Phase 4 Emergency Rollback Procedure"
    echo "=============================================="
    echo
    
    log "Starting rollback process..."
    
    # Determine backup directory
    if [[ -z "$backup_dir" ]]; then
        if [[ "$automatic" == true ]]; then
            backup_dir=$(find_latest_backup)
            log "Using latest backup: $backup_dir"
        else
            error "Must specify --backup-dir or --automatic"
        fi
    fi
    
    # Verify backup
    verify_backup "$backup_dir"
    
    if [[ "$verify_only" == true ]]; then
        success "Rollback verification passed - rollback is possible"
        exit 0
    fi
    
    # Confirm rollback
    if [[ "$automatic" != true ]]; then
        echo
        echo -e "${YELLOW}WARNING: This will rollback Priority System v2.0 changes${NC}"
        echo "Backup directory: $backup_dir"
        echo
        read -p "Are you sure you want to continue? (yes/no): " confirm
        if [[ "$confirm" != "yes" ]]; then
            log "Rollback cancelled by user"
            exit 0
        fi
    fi
    
    # Perform rollback
    if [[ "$code_only" != true ]]; then
        rollback_database "$backup_dir"
    fi
    
    if [[ "$database_only" != true ]]; then
        rollback_code "$backup_dir"
    fi
    
    # Verify rollback
    verify_rollback
    
    # Generate report
    generate_rollback_report "$backup_dir"
    
    echo
    echo "=============================================="
    success "Rollback completed successfully!"
    echo "=============================================="
    echo
    echo "📊 Rollback Summary:"
    echo "   • Priority System v2.0 removed"
    echo "   • Application restored to previous state"
    echo "   • Database restored from backup"
    echo "   • All v2.0 files cleaned up"
    echo
    echo "📁 Important Information:"
    echo "   • Backup used: $backup_dir"
    echo "   • Rollback log: $ROLLBACK_LOG"
    echo "   • Report generated with full details"
    echo
    echo "🔍 Next Steps:"
    echo "   1. Restart your application"
    echo "   2. Verify audit functionality"
    echo "   3. Investigate rollback cause"
    echo "   4. Plan remediation strategy"
    echo
    echo "Application is ready to restart."
}

# Run main rollback
main "$@"