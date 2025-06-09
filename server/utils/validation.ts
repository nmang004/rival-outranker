import { z, ZodError, ZodSchema, ZodTypeAny, ZodUnion } from 'zod';
import { ValidationError } from './errors';

/**
 * Common validation utilities
 */

/**
 * Validate data against a Zod schema and throw ValidationError on failure
 */
export function validateSchema<T>(schema: ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const fields: Record<string, string[]> = {};
      
      error.issues.forEach(issue => {
        const path = issue.path.join('.');
        if (!fields[path]) {
          fields[path] = [];
        }
        fields[path].push(issue.message);
      });

      throw new ValidationError('Validation failed', fields);
    }
    throw error;
  }
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // ID validation
  id: z.number().int().positive('ID must be a positive integer'),
  
  // String validations
  nonEmptyString: z.string().min(1, 'Field cannot be empty'),
  email: z.string().email('Invalid email format'),
  url: z.string().url('Invalid URL format'),
  
  // Pagination
  pagination: z.object({
    page: z.number().int().min(1, 'Page must be at least 1').default(1),
    pageSize: z.number().int().min(1).max(100, 'Page size must be between 1 and 100').default(20)
  }),
  
  // Date range
  dateRange: z.object({
    startDate: z.date().optional(),
    endDate: z.date().optional()
  }).refine(
    data => !data.startDate || !data.endDate || data.startDate <= data.endDate,
    { message: 'Start date must be before or equal to end date' }
  ),
  
  // Search query
  searchQuery: z.object({
    q: z.string().min(1, 'Search query cannot be empty').max(200, 'Search query too long')
  }),
  
  // User role
  userRole: z.enum(['user', 'admin'], {
    errorMap: () => ({ message: 'Role must be either user or admin' })
  }),
  
  // Analysis status
  analysisStatus: z.enum(['pending', 'in_progress', 'completed', 'failed'], {
    errorMap: () => ({ message: 'Invalid analysis status' })
  }),
  
  // SEO score
  seoScore: z.number().int().min(0, 'Score cannot be negative').max(100, 'Score cannot exceed 100'),
  
  // Keyword difficulty
  keywordDifficulty: z.number().int().min(0).max(100),
  
  // Search volume
  searchVolume: z.number().int().min(0),
  
  // Password strength
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password cannot exceed 128 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  
  // Username
  username: z.string()
    .min(3, 'Username must be at least 3 characters long')
    .max(50, 'Username cannot exceed 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
  
  // Project name
  projectName: z.string()
    .min(1, 'Project name cannot be empty')
    .max(100, 'Project name cannot exceed 100 characters')
    .trim(),
  
  // Keyword
  keyword: z.string()
    .min(1, 'Keyword cannot be empty')
    .max(200, 'Keyword cannot exceed 200 characters')
    .trim(),
  
  // URL normalization
  normalizedUrl: z.string().transform((url) => {
    let normalized = url.toLowerCase().trim();
    
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized;
    }
    
    try {
      const urlObj = new URL(normalized);
      if (urlObj.pathname.length > 1 && urlObj.pathname.endsWith('/')) {
        urlObj.pathname = urlObj.pathname.slice(0, -1);
      }
      return urlObj.toString();
    } catch {
      throw new Error('Invalid URL format');
    }
  }),
  
  // File size validation (in bytes)
  fileSize: (maxSize: number) => z.number().max(maxSize, `File size cannot exceed ${Math.round(maxSize / 1024 / 1024)}MB`),
  
  // Array with length validation
  arrayWithLength: (min: number, max: number) => z.array(z.any())
    .min(min, `Array must contain at least ${min} items`)
    .max(max, `Array cannot contain more than ${max} items`),
  
  // Optional boolean with default
  optionalBooleanDefault: (defaultValue: boolean) => z.boolean().optional().default(defaultValue),
  
  // JSON string validation
  jsonString: z.string().refine((str) => {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }, 'Invalid JSON string'),
  
  // Language code (ISO 639-1)
  languageCode: z.string().length(2, 'Language code must be 2 characters').toLowerCase(),
  
  // Country code (ISO 3166-1 alpha-2)
  countryCode: z.string().length(2, 'Country code must be 2 characters').toUpperCase(),
  
  // Timezone
  timezone: z.string().min(1, 'Timezone cannot be empty'),
  
  // Color hex code
  hexColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format'),
  
  // Phone number (basic validation)
  phoneNumber: z.string().regex(/^\+?[\d\s\-\(\)\.]{10,15}$/, 'Invalid phone number format'),
  
  // Slug (URL-friendly string)
  slug: z.string()
    .min(1, 'Slug cannot be empty')
    .max(100, 'Slug cannot exceed 100 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
};

/**
 * Create a conditional schema based on a condition
 */
export function conditionalSchema<T, U>(
  condition: (data: any) => boolean,
  trueSchema: ZodSchema<T>,
  falseSchema: ZodSchema<U>
): ZodSchema<T | U> {
  return z.any().superRefine((data, ctx) => {
    try {
      if (condition(data)) {
        return trueSchema.parse(data);
      } else {
        return falseSchema.parse(data);
      }
    } catch (error) {
      if (error instanceof ZodError) {
        error.issues.forEach(issue => {
          ctx.addIssue(issue);
        });
      }
    }
  });
}

/**
 * Create a union schema with better error messages
 */
export function betterUnion<T extends readonly [ZodTypeAny, ZodTypeAny, ...ZodTypeAny[]]>(
  schemas: T,
  message?: string
): ZodUnion<T> {
  return z.union(schemas, {
    errorMap: () => ({
      message: message || 'Value does not match any of the allowed formats'
    })
  });
}

/**
 * Validate request parameters (path, query, body)
 */
export function validateRequest<
  TParams = {},
  TQuery = {},
  TBody = {}
>(schemas: {
  params?: ZodSchema<TParams>;
  query?: ZodSchema<TQuery>;
  body?: ZodSchema<TBody>;
}) {
  return {
    params: (data: unknown): TParams => {
      if (!schemas.params) return {} as TParams;
      return validateSchema(schemas.params, data);
    },
    query: (data: unknown): TQuery => {
      if (!schemas.query) return {} as TQuery;
      return validateSchema(schemas.query, data);
    },
    body: (data: unknown): TBody => {
      if (!schemas.body) return {} as TBody;
      return validateSchema(schemas.body, data);
    }
  };
}

/**
 * Sanitize and validate HTML input
 */
export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization (in production, use a proper library like DOMPurify)
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '');
}

/**
 * Validate and normalize file upload
 */
export function validateFileUpload(options: {
  maxSize?: number;
  allowedTypes?: string[];
  requiredFields?: string[];
}) {
  return z.object({
    originalname: z.string().min(1, 'Filename is required'),
    mimetype: z.string().refine(
      (type) => !options.allowedTypes || options.allowedTypes.includes(type),
      `File type must be one of: ${options.allowedTypes?.join(', ')}`
    ),
    size: options.maxSize ? commonSchemas.fileSize(options.maxSize) : z.number(),
    buffer: z.instanceof(Buffer)
  });
}

/**
 * Create a schema for environment variables
 */
export function createEnvSchema<T extends Record<string, ZodSchema>>(schemas: T) {
  return z.object(schemas).parse(process.env);
}