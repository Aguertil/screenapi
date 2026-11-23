export interface ApiKeyData {
  id: string;
  key: string;
  userId: string;
  isActive: boolean;
  rateLimit: number;
  expiresAt: Date | null;
  signingSecret?: string | null;
}

export interface IApiKeyRepository {
  /**
   * Find an API key by its key value
   */
  findByKey(key: string): Promise<ApiKeyData | null>;

  /** Find an API key by its public id (signed URLs) */
  findById(id: string): Promise<ApiKeyData | null>;

  /**
   * Update the last used timestamp for an API key
   */
  updateLastUsed(keyId: string): Promise<void>;

  /**
   * Check if an API key exists and is active
   */
  isValid(key: string): Promise<boolean>;
}
