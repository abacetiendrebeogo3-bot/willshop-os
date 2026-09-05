/**
 * WILLShop OS — Customer Identification & Normalization Service
 * Application Layer.
 */

import { ICustomerRepository } from '../../domain/interfaces/IDataCoreRepositories';
import { Customer } from '../../domain/entities/DataCoreEntities';

export class CustomerIdentificationService {
  constructor(private readonly customerRepo: ICustomerRepository) {}

  /**
   * Normalizes phone number into E.164 standard format.
   */
  normalizePhoneNumber(phone: string): string {
    const cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) return cleaned;
    if (cleaned.startsWith('00')) return `+${cleaned.substring(2)}`;
    // Default Burkina Faso prefix if missing country code
    if (cleaned.length === 8) return `+226${cleaned}`;
    return `+${cleaned}`;
  }

  /**
   * Identifies or creates a customer profile by phone number safely under server org context.
   */
  async identifyOrCreateCustomer(
    orgId: string,
    rawPhone: string,
    fallbackFirstName = 'Client',
    fallbackLastName = 'WhatsApp'
  ): Promise<{ customer: Customer; isNewCustomer: boolean }> {
    const normalizedPhone = this.normalizePhoneNumber(rawPhone);
    const existing = await this.customerRepo.findByPhone(normalizedPhone, orgId);

    if (existing) {
      return { customer: existing, isNewCustomer: false };
    }

    const newCustomer = await this.customerRepo.create({
      organizationId: orgId,
      firstName: fallbackFirstName,
      lastName: fallbackLastName,
      phone: normalizedPhone,
      whatsappPhone: normalizedPhone,
      city: 'Ouagadougou',
      source: 'WHATSAPP_INBOUND',
      status: 'PROSPECT',
    });

    return { customer: newCustomer, isNewCustomer: true };
  }
}
