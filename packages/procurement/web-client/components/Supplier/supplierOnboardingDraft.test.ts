import { describe, expect, it } from 'vitest'
import {
  createEmptySupplierOnboardingDraft,
  parseSupplierOnboardingDraft,
  toSupplierTableRecord,
} from './supplierOnboardingDraft'

describe('supplier onboarding drafts', () => {
  it('restores form values and document metadata from serialized draft data', () => {
    const draft = createEmptySupplierOnboardingDraft()
    draft.currentStep = 3
    draft.values.companyName = 'Acme Manufacturing'
    draft.values.country = 'INDIA'
    draft.documents.taxCertificate = [
      { name: 'tax-certificate.pdf', mimeType: 'application/pdf', size: 1200 },
    ]

    expect(parseSupplierOnboardingDraft(JSON.stringify(draft))).toEqual(draft)
  })

  it('rejects unsupported and malformed saved drafts', () => {
    const invalidStep = createEmptySupplierOnboardingDraft()
    invalidStep.currentStep = 5

    expect(() => parseSupplierOnboardingDraft('{"version":2}')).toThrow(
      'unsupported format'
    )
    expect(() =>
      parseSupplierOnboardingDraft(JSON.stringify(invalidStep))
    ).toThrow('incomplete or invalid')
    expect(() => parseSupplierOnboardingDraft('not-json')).toThrow()
  })

  it('maps profile fields and document metadata to a single Supplier row', () => {
    const draft = createEmptySupplierOnboardingDraft()
    draft.values.name = 'Acme'
    draft.values.companyName = 'Acme Manufacturing Pvt Ltd'
    draft.values.taxId = 'GST-123'
    draft.values.country = 'INDIA'
    draft.values.capabilities = ['metal-fabrication']
    draft.documents.businessRegistration = [
      {
        name: 'registration.pdf',
        mimeType: 'application/pdf',
        size: 2048,
      },
    ]

    expect(toSupplierTableRecord(draft)).toMatchObject({
      name: 'Acme',
      companyName: 'Acme Manufacturing Pvt Ltd',
      taxId: 'GST-123',
      country: 'INDIA',
      complianceStatus: 'PENDING',
      onboardingData: {
        capabilities: ['metal-fabrication'],
        documents: {
          businessRegistration: [
            {
              name: 'registration.pdf',
              mimeType: 'application/pdf',
              size: 2048,
            },
          ],
        },
      },
    })
  })
})
