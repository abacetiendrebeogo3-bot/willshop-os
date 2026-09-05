/**
 * WILLShop OS — Organization Entity
 * Pure Domain Layer.
 */

export interface OrganizationSettings {
  theme?: 'dark' | 'light';
  features?: Record<string, boolean>;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  country: string;
  currency: string;
  timezone: string;
  settings: OrganizationSettings;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  deletedAt?: Date | null;
}
