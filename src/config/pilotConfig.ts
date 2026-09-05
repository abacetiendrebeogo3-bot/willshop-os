/**
 * WILLShop OS — Production Pilot Configuration & Environment Manager
 * Centralized configuration validator, environment indicator, and safety guardrails.
 */

export type OperatingEnvironment = 'LOCAL' | 'DEVELOPMENT' | 'STAGING' | 'PILOT' | 'PRODUCTION';

export interface PilotEnvironmentConfig {
  environment: OperatingEnvironment;
  isPilot: boolean;
  isProduction: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
  metaWhatsAppTokenConfigured: boolean;
  metaPhoneIdConfigured: boolean;
  openAIConfigured: boolean;
  maxPilotDailyOrdersLimit: number;
  maxPilotSingleOrderValueLimit: number;
  strictDomainIsolationEnabled: boolean;
  aiSafetyGuardrailsEnabled: boolean;
}

export class PilotConfigManager {
  private static config: PilotEnvironmentConfig | null = null;

  public static getEnvironmentConfig(): PilotEnvironmentConfig {
    if (this.config) return this.config;

    const rawEnv = (process.env.ENVIRONMENT || process.env.NODE_ENV || 'LOCAL').toUpperCase();
    let environment: OperatingEnvironment = 'LOCAL';

    if (rawEnv.includes('PROD')) environment = 'PRODUCTION';
    else if (rawEnv.includes('PILOT')) environment = 'PILOT';
    else if (rawEnv.includes('STAG')) environment = 'STAGING';
    else if (rawEnv.includes('DEV')) environment = 'DEVELOPMENT';

    this.config = {
      environment,
      isPilot: environment === 'PILOT',
      isProduction: environment === 'PRODUCTION',
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key',
      metaWhatsAppTokenConfigured: Boolean(process.env.META_WHATSAPP_TOKEN),
      metaPhoneIdConfigured: Boolean(process.env.META_WHATSAPP_PHONE_ID),
      openAIConfigured: Boolean(process.env.OPENAI_API_KEY),
      maxPilotDailyOrdersLimit: 50,
      maxPilotSingleOrderValueLimit: 500000, // 500k XOF single order cap for pilot
      strictDomainIsolationEnabled: true,
      aiSafetyGuardrailsEnabled: true,
    };

    return this.config;
  }

  public static isSecretConfigured(secretName: string): boolean {
    return Boolean(process.env[secretName]);
  }
}
