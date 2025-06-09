import { eq, SQL, and, or, desc, asc, count } from 'drizzle-orm';
import { PgTableWithColumns, TableConfig } from 'drizzle-orm/pg-core';
import { db } from '../db';

/**
 * Base repository class providing common database operations
 */
export abstract class BaseRepository<
  T extends Record<string, any>,
  TInsert extends Record<string, any> = Partial<T>
> {
  protected constructor(protected table: any) {}

  /**
   * Find record by ID
   */
  async findById(id: string | number): Promise<T | null> {
    const idColumn = this.getIdColumn();
    const result = await db
      .select()
      .from(this.table)
      .where(eq(idColumn, id))
      .limit(1);
    
    return result[0] || null;
  }

  /**
   * Find all records with optional filtering
   */
  async findMany(options?: {
    where?: SQL;
    orderBy?: SQL[];
    limit?: number;
    offset?: number;
  }): Promise<T[]> {
    let query = db.select().from(this.table);

    if (options?.where) {
      query = query.where(options.where);
    }

    if (options?.orderBy) {
      query = query.orderBy(...options.orderBy);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.offset(options.offset);
    }

    return await query;
  }

  /**
   * Find single record with optional filtering
   */
  async findOne(where: SQL): Promise<T | null> {
    const result = await db
      .select()
      .from(this.table)
      .where(where)
      .limit(1);
    
    return result[0] || null;
  }

  /**
   * Create a new record
   */
  async create(data: TInsert): Promise<T> {
    const result = await db
      .insert(this.table)
      .values(data)
      .returning();
    
    return result[0];
  }

  /**
   * Create multiple records
   */
  async createMany(data: TInsert[]): Promise<T[]> {
    const result = await db
      .insert(this.table)
      .values(data)
      .returning();
    
    return result;
  }

  /**
   * Update record by ID
   */
  async updateById(id: string | number, data: Partial<TInsert>): Promise<T | null> {
    const idColumn = this.getIdColumn();
    const result = await db
      .update(this.table)
      .set(data)
      .where(eq(idColumn, id))
      .returning();
    
    return result[0] || null;
  }

  /**
   * Update records with custom where clause
   */
  async updateWhere(where: SQL, data: Partial<TInsert>): Promise<T[]> {
    const result = await db
      .update(this.table)
      .set(data)
      .where(where)
      .returning();
    
    return result;
  }

  /**
   * Delete record by ID
   */
  async deleteById(id: string | number): Promise<boolean> {
    const idColumn = this.getIdColumn();
    const result = await db
      .delete(this.table)
      .where(eq(idColumn, id))
      .returning();
    
    return result.length > 0;
  }

  /**
   * Delete records with custom where clause
   */
  async deleteWhere(where: SQL): Promise<number> {
    const result = await db
      .delete(this.table)
      .where(where)
      .returning();
    
    return result.length;
  }

  /**
   * Count records with optional filtering
   */
  async count(where?: SQL): Promise<number> {
    let query = db.select({ count: count() }).from(this.table);
    
    if (where) {
      query = query.where(where);
    }
    
    const result = await query;
    return result[0]?.count || 0;
  }

  /**
   * Check if record exists
   */
  async exists(where: SQL): Promise<boolean> {
    const result = await this.count(where);
    return result > 0;
  }

  /**
   * Get paginated results
   */
  async paginate(options: {
    page: number;
    pageSize: number;
    where?: SQL;
    orderBy?: SQL[];
  }): Promise<{
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const { page, pageSize, where, orderBy } = options;
    const offset = (page - 1) * pageSize;

    const [data, totalResult] = await Promise.all([
      this.findMany({
        where,
        orderBy,
        limit: pageSize,
        offset
      }),
      this.count(where)
    ]);

    const total = totalResult;
    const totalPages = Math.ceil(total / pageSize);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages
    };
  }

  /**
   * Get the ID column for the table
   * Override in child classes if using different ID column name
   */
  protected getIdColumn(): any {
    // Default to 'id' column, override in child classes if needed
    return (this.table as any).id;
  }
}

/**
 * Repository interface for type safety
 */
export interface IRepository<T, TInsert = Partial<T>> {
  findById(id: string | number): Promise<T | null>;
  findMany(options?: any): Promise<T[]>;
  findOne(where: SQL): Promise<T | null>;
  create(data: TInsert): Promise<T>;
  createMany(data: TInsert[]): Promise<T[]>;
  updateById(id: string | number, data: Partial<TInsert>): Promise<T | null>;
  updateWhere(where: SQL, data: Partial<TInsert>): Promise<T[]>;
  deleteById(id: string | number): Promise<boolean>;
  deleteWhere(where: SQL): Promise<number>;
  count(where?: SQL): Promise<number>;
  exists(where: SQL): Promise<boolean>;
}