# CODING STANDARDS & CONVENTIONS

## Overview
This document establishes coding standards and conventions for the Rival Outranker project to ensure consistency, maintainability, and developer productivity across the codebase.

## General Principles

### 1. **Code Clarity Over Cleverness**
- Write code that is easy to read and understand
- Prefer explicit over implicit behavior
- Use descriptive names for variables, functions, and classes
- Add comments for complex business logic, not obvious code

### 2. **Consistency**
- Follow established patterns throughout the codebase
- Use the same naming conventions across all files
- Maintain consistent code formatting and structure
- Apply the same architectural patterns for similar functionality

### 3. **Separation of Concerns**
- Each file should have a single, well-defined responsibility
- Separate business logic from presentation logic
- Keep data access separate from business rules
- Isolate external dependencies behind interfaces

### 4. **DRY (Don't Repeat Yourself)**
- Extract common functionality into reusable utilities
- Use shared constants instead of magic numbers/strings
- Create reusable components and hooks
- Centralize configuration and error handling

## File Organization Standards

### 1. **File Structure**
```
feature/
├── index.ts                 # Barrel export file
├── feature.controller.ts    # HTTP request handling
├── feature.service.ts       # Business logic
├── feature.repository.ts    # Data access
├── feature.types.ts         # TypeScript types
├── feature.constants.ts     # Feature-specific constants
├── feature.utils.ts         # Feature-specific utilities
└── __tests__/              # Tests for the feature
    ├── feature.controller.test.ts
    ├── feature.service.test.ts
    └── feature.utils.test.ts
```

### 2. **File Size Limits**
- **Maximum file size:** 500 lines
- **Recommended size:** 200-300 lines
- **Exception:** Generated files, large configuration objects
- **Solution for large files:** Split into multiple focused modules

### 3. **Import Organization**
```typescript
// 1. Node modules
import express from 'express';
import { z } from 'zod';

// 2. Internal modules (absolute paths)
import { UserService } from '@/services/user.service';
import { logger } from '@/lib/logger';

// 3. Relative imports (same feature)
import { validateUserInput } from './user.utils';
import { UserRepository } from './user.repository';

// 4. Type-only imports (last)
import type { User, CreateUserRequest } from './user.types';
```

## Naming Conventions

### 1. **Files and Directories**
```typescript
// Use kebab-case for files and directories
user-profile.component.ts
keyword-research.service.ts
seo-analysis/

// Use PascalCase for React components
UserProfile.tsx
KeywordResearchPage.tsx
SEOAnalysisChart.tsx

// Use camelCase for utilities and services  
userProfile.utils.ts
keywordResearch.service.ts
```

### 2. **Variables and Functions**
```typescript
// Use camelCase for variables and functions
const userName = 'john_doe';
const isUserActive = true;
const calculateOverallScore = (scores: number[]) => { };

// Use descriptive names
// ❌ Bad
const d = new Date();
const calc = (x, y) => x + y;

// ✅ Good  
const currentDate = new Date();
const calculateTotalScore = (baseScore: number, bonusScore: number) => baseScore + bonusScore;
```

### 3. **Classes and Interfaces**
```typescript
// Use PascalCase for classes and interfaces
class UserService { }
interface AnalysisResult { }
type ScoreCategory = 'excellent' | 'good' | 'needs-work' | 'poor';

// Use descriptive, specific names
// ❌ Bad
class Manager { }
interface Data { }

// ✅ Good
class UserAccountManager { }
interface SEOAnalysisData { }
```

### 4. **Constants**
```typescript
// Use SCREAMING_SNAKE_CASE for constants
const MAX_RETRIES = 3;
const API_BASE_URL = 'https://api.example.com';
const DEFAULT_TIMEOUT = 5000;

// Group related constants in objects
export const ScoreThresholds = {
  EXCELLENT: 90,
  GOOD: 70,
  NEEDS_WORK: 50,
  POOR: 0
} as const;
```

## TypeScript Standards

### 1. **Type Definitions**
```typescript
// Use specific types over 'any'
// ❌ Bad
function processData(data: any): any {
  return data.result;
}

// ✅ Good
interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

function processData<T>(response: APIResponse<T>): T {
  return response.data;
}
```

### 2. **Interface vs Type**
```typescript
// Use interfaces for object shapes that might be extended
interface User {
  id: string;
  email: string;
  name: string;
}

interface AdminUser extends User {
  role: 'admin';
  permissions: string[];
}

// Use types for unions, primitives, and computed types  
type Status = 'pending' | 'approved' | 'rejected';
type UserWithStatus = User & { status: Status };
```

### 3. **Generic Constraints**
```typescript
// Use generic constraints for better type safety
interface Repository<T extends { id: string }> {
  findById(id: string): Promise<T | null>;
  create(data: Omit<T, 'id'>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
}
```

## Function Standards

### 1. **Function Size and Complexity**
```typescript
// Maximum function length: 30-40 lines
// Maximum cyclomatic complexity: 10
// Maximum parameters: 5

// ❌ Bad - too many parameters
function createUser(name: string, email: string, password: string, role: string, 
                   department: string, manager: string, startDate: Date) { }

// ✅ Good - use object parameter
interface CreateUserParams {
  name: string;
  email: string;
  password: string;
  role: string;
  department: string;
  manager: string;
  startDate: Date;
}

function createUser(params: CreateUserParams): Promise<User> { }
```

### 2. **Pure Functions**
```typescript
// Prefer pure functions when possible
// ❌ Bad - side effects
let totalScore = 0;
function addScore(score: number) {
  totalScore += score; // Modifies global state
  console.log(`Added score: ${score}`); // Side effect
}

// ✅ Good - pure function
function calculateNewTotal(currentTotal: number, scoreToAdd: number): number {
  return currentTotal + scoreToAdd;
}
```

### 3. **Error Handling**
```typescript
// Use consistent error handling patterns
// ❌ Bad - inconsistent error handling
function riskyOperation(): string | null {
  try {
    // operation
    return result;
  } catch {
    return null; // Information loss
  }
}

// ✅ Good - explicit error handling
class OperationError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'OperationError';
  }
}

async function riskyOperation(): Promise<string> {
  try {
    // operation
    return result;
  } catch (error) {
    logger.error('Operation failed', { error, context: 'riskyOperation' });
    throw new OperationError('Operation failed', 'OPERATION_ERROR');
  }
}
```

## React Component Standards

### 1. **Component Structure**
```typescript
// Consistent component file structure
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import type { User } from '@/types/user.types';

interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

export function UserProfile({ userId, onUpdate }: UserProfileProps) {
  // 1. State declarations
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  
  // 2. Custom hooks
  const { currentUser } = useAuth();
  
  // 3. Effects
  useEffect(() => {
    loadUser(userId);
  }, [userId]);
  
  // 4. Event handlers
  const handleSave = async (data: Partial<User>) => {
    // implementation
  };
  
  // 5. Helper functions
  const loadUser = async (id: string) => {
    // implementation
  };
  
  // 6. Early returns
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;
  
  // 7. Main render
  return (
    <div className="user-profile">
      {/* Component JSX */}
    </div>
  );
}
```

### 2. **Custom Hooks**
```typescript
// Extract reusable logic into custom hooks
export function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(response.statusText);
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [url]);
  
  useEffect(() => {
    refetch();
  }, [refetch]);
  
  return { data, loading, error, refetch };
}
```

### 3. **Component Props**
```typescript
// Use specific prop types
// ❌ Bad
interface Props {
  data: any;
  onClick: Function;
}

// ✅ Good
interface UserCardProps {
  user: User;
  onEdit: (userId: string) => void;
  onDelete: (userId: string) => Promise<void>;
  className?: string;
  showActions?: boolean;
}
```

## Service Layer Standards

### 1. **Service Class Structure**
```typescript
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService,
    private readonly logger: LoggerService
  ) {}
  
  async createUser(userData: CreateUserRequest): Promise<User> {
    // 1. Validation
    await this.validateUserData(userData);
    
    // 2. Business logic
    const hashedPassword = await this.hashPassword(userData.password);
    const user = {
      ...userData,
      password: hashedPassword,
      createdAt: new Date()
    };
    
    // 3. Data persistence
    const createdUser = await this.userRepository.create(user);
    
    // 4. Side effects
    await this.emailService.sendWelcomeEmail(createdUser);
    this.logger.info('User created', { userId: createdUser.id });
    
    return createdUser;
  }
  
  private async validateUserData(userData: CreateUserRequest): Promise<void> {
    // Validation logic
  }
  
  private async hashPassword(password: string): Promise<string> {
    // Password hashing logic
  }
}
```

### 2. **Repository Pattern**
```typescript
export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(users); // Drizzle model
  }
  
  async findByEmail(email: string): Promise<User | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    return result[0] || null;
  }
  
  async findActiveUsers(): Promise<User[]> {
    return await this.db
      .select()
      .from(users)
      .where(eq(users.isActive, true))
      .orderBy(users.createdAt);
  }
}
```

## API Standards

### 1. **Request/Response Format**
```typescript
// Consistent API response structure
interface APIResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  requestId: string;
}

// Example usage
app.post('/api/users', async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    
    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id']
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'USER_CREATION_FAILED',
        message: error.message
      },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id']
    });
  }
});
```

### 2. **Validation**
```typescript
// Use Zod for consistent validation
const CreateUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  role: z.enum(['user', 'admin']).default('user')
});

type CreateUserRequest = z.infer<typeof CreateUserSchema>;

// Validation middleware
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors
          }
        });
      }
      next(error);
    }
  };
};
```

## Testing Standards

### 1. **Test Structure**
```typescript
describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockEmailService: jest.Mocked<EmailService>;
  
  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    mockEmailService = createMockEmailService();
    userService = new UserService(mockUserRepository, mockEmailService);
  });
  
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123'
      };
      const expectedUser = { ...userData, id: '123', createdAt: new Date() };
      mockUserRepository.create.mockResolvedValue(expectedUser);
      
      // Act
      const result = await userService.createUser(userData);
      
      // Assert
      expect(result).toEqual(expectedUser);
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: userData.name,
          email: userData.email,
          password: expect.any(String) // Hashed password
        })
      );
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(expectedUser);
    });
    
    it('should throw error for invalid email', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'Password123'
      };
      
      // Act & Assert
      await expect(userService.createUser(userData))
        .rejects
        .toThrow('Invalid email format');
    });
  });
});
```

### 2. **Test Coverage**
- **Minimum coverage:** 80% overall
- **Critical paths:** 100% coverage
- **Edge cases:** Cover error scenarios and boundary conditions
- **Integration tests:** Test service interactions

## Documentation Standards

### 1. **Code Comments**
```typescript
/**
 * Calculates the overall SEO score based on individual component scores.
 * 
 * The overall score is a weighted average where technical SEO and content
 * quality have higher weights than meta tags and keyword optimization.
 * 
 * @param scores - Individual component scores (0-100)
 * @returns Overall score rounded to nearest integer (0-100)
 * 
 * @example
 * ```typescript
 * const scores = {
 *   technical: 85,
 *   content: 90,
 *   keywords: 75,
 *   meta: 80
 * };
 * const overall = calculateOverallScore(scores); // Returns 83
 * ```
 */
export function calculateOverallScore(scores: ComponentScores): number {
  const weights = {
    technical: 0.3,
    content: 0.3,
    keywords: 0.2,
    meta: 0.2
  };
  
  const weightedSum = Object.entries(scores).reduce((sum, [component, score]) => {
    return sum + (score * weights[component as keyof typeof weights]);
  }, 0);
  
  return Math.round(weightedSum);
}
```

### 2. **README Structure**
```markdown
# Feature Name

## Overview
Brief description of what this feature does.

## Usage
```typescript
// Basic usage example
const result = await featureService.doSomething(params);
```

## API Reference
### Methods
- `method(param: Type): ReturnType` - Description

## Configuration
Required environment variables and configuration options.

## Testing
How to run tests for this feature.

## Contributing
Guidelines for contributing to this feature.
```

## Performance Standards

### 1. **Database Queries**
```typescript
// Use efficient database queries
// ❌ Bad - N+1 query problem
const users = await userRepository.findAll();
for (const user of users) {
  user.posts = await postRepository.findByUserId(user.id);
}

// ✅ Good - single query with joins
const usersWithPosts = await userRepository.findAllWithPosts();
```

### 2. **Bundle Optimization**
```typescript
// Use dynamic imports for code splitting
// ❌ Bad - everything in main bundle
import { HeavyComponent } from './HeavyComponent';

// ✅ Good - lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

## Security Standards

### 1. **Input Validation**
```typescript
// Always validate and sanitize input
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>&"']/g, (char) => ({
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&#x27;'
    }[char] || char));
};
```

### 2. **Environment Variables**
```typescript
// Never hardcode secrets
// ❌ Bad
const apiKey = 'sk-1234567890abcdef';

// ✅ Good
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}
```

## Enforcement

### 1. **Linting Configuration**
```json
// .eslintrc.json
{
  "extends": [
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "max-len": ["error", { "code": 100 }],
    "max-lines": ["error", 500],
    "complexity": ["error", 10],
    "max-params": ["error", 5],
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/no-any": "error"
  }
}
```

### 2. **Pre-commit Hooks**
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ]
  }
}
```

### 3. **CI/CD Checks**
- ESLint with no warnings
- TypeScript compilation with no errors
- Test coverage above 80%
- Bundle size analysis
- Performance regression tests

These coding standards ensure consistency, maintainability, and high code quality across the Rival Outranker project. All team members should follow these guidelines and review them regularly for updates.