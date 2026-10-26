// Common Result type for functional error handling
export type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

export const success = <T>(value: T): Result<T, never> => ({
  success: true,
  value,
});

export const failure = <E>(error: E): Result<never, E> => ({
  success: false,
  error,
});

// Domain primitives
export type UUID = string & { readonly __brand: 'UUID' };
export type Email = string & { readonly __brand: 'Email' };
export type URL = string & { readonly __brand: 'URL' };
export type Slug = string & { readonly __brand: 'Slug' };
export type ApiKey = string & { readonly __brand: 'ApiKey' };

// Common enums
export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TEST = 'test',
}

export enum SubscriptionPlan {
  FREE = 'FREE',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELED = 'CANCELED',
  EXPIRED = 'EXPIRED',
  TRIALING = 'TRIALING',
  PAST_DUE = 'PAST_DUE',
}

// Common interfaces
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TimePeriod {
  startDate: Date;
  endDate: Date;
}

// Error types
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found`, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = 'Forbidden') {
    super(message, 'FORBIDDEN');
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, 'CONFLICT');
  }
}
