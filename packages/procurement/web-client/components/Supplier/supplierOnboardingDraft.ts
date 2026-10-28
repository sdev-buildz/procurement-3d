/** Browser storage key used to resume the supplier's onboarding draft. */
export const supplierOnboardingStorageKey = 'supplier-onboarding-draft-v1'

/** Country codes supported by the current Supplier Prisma enum. */
export const supplierCountries = [
  'VIETNAM',
  'INDIA',
  'CHINA',
  'GLOBAL',
] as const

type SupplierCountry = (typeof supplierCountries)[number]

/** Document categories shown in the onboarding compliance step. */
export const supplierDocumentKinds = [
  'businessRegistration',
  'taxCertificate',
  'qualityCertificates',
] as const

/** Stable keys for supplier document metadata. */
export type SupplierDocumentKind = (typeof supplierDocumentKinds)[number]

/** Metadata retained for selected files; file contents are never persisted. */
export interface SupplierDocumentMetadata {
  name: string
  mimeType: string
  size: number
}

/** Editable supplier details, including fields stored in the onboarding JSON. */
export interface SupplierOnboardingValues {
  name: string
  companyName: string
  taxId: string
  country: SupplierCountry | ''
  contactName: string
  contactEmail: string
  contactPhone: string
  website: string
  addressLine1: string
  addressLine2: string
  city: string
  stateProvince: string
  postalCode: string
  businessType: string
  capabilities: string[]
  productCategories: string
  annualCapacity: string
}

/** Versioned browser draft so saved sessions can be validated on restore. */
export interface SupplierOnboardingDraft {
  version: 1
  currentStep: number
  values: SupplierOnboardingValues
  documents: Record<SupplierDocumentKind, SupplierDocumentMetadata[]>
  updatedAt: string | null
  completedAt: string | null
}

/** Shape of the one-row payload that can be used to create a Supplier. */
export interface SupplierTableRecordDraft {
  name: string
  companyName: string
  taxId: string
  country: SupplierCountry
  complianceStatus: 'PENDING'
  onboardingData: {
    contactName: string
    contactEmail: string
    contactPhone: string
    website: string
    addressLine1: string
    addressLine2: string
    city: string
    stateProvince: string
    postalCode: string
    businessType: string
    capabilities: string[]
    productCategories: string
    annualCapacity: string
    documents: Record<SupplierDocumentKind, SupplierDocumentMetadata[]>
  }
}

/** Create a fresh draft with all form fields initialized. */
export const createEmptySupplierOnboardingDraft =
  (): SupplierOnboardingDraft => ({
    version: 1,
    currentStep: 0,
    values: {
      name: '',
      companyName: '',
      taxId: '',
      country: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      website: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      stateProvince: '',
      postalCode: '',
      businessType: '',
      capabilities: [],
      productCategories: '',
      annualCapacity: '',
    },
    documents: {
      businessRegistration: [],
      taxCertificate: [],
      qualityCertificates: [],
    },
    updatedAt: null,
    completedAt: null,
  })

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isString = (value: unknown): value is string => typeof value === 'string'

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isString)

const isSupplierOnboardingStep = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= 0 &&
  value <= 4

const isSupplierCountry = (value: unknown): value is SupplierCountry =>
  typeof value === 'string' &&
  supplierCountries.some((country) => country === value)

const isDocumentMetadataArray = (
  value: unknown
): value is SupplierDocumentMetadata[] =>
  Array.isArray(value) &&
  value.every(
    (item) =>
      isRecord(item) &&
      isString(item.name) &&
      isString(item.mimeType) &&
      typeof item.size === 'number' &&
      Number.isFinite(item.size) &&
      item.size >= 0
  )

const isSupplierOnboardingValues = (
  value: unknown
): value is SupplierOnboardingValues => {
  if (!isRecord(value)) return false
  const stringFields: Array<
    keyof Omit<SupplierOnboardingValues, 'country' | 'capabilities'>
  > = [
    'name',
    'companyName',
    'taxId',
    'contactName',
    'contactEmail',
    'contactPhone',
    'website',
    'addressLine1',
    'addressLine2',
    'city',
    'stateProvince',
    'postalCode',
    'businessType',
    'productCategories',
    'annualCapacity',
  ]

  return (
    stringFields.every((field) => isString(value[field])) &&
    (value.country === '' || isSupplierCountry(value.country)) &&
    isStringArray(value.capabilities)
  )
}

const isSupplierDocuments = (
  value: unknown
): value is Record<SupplierDocumentKind, SupplierDocumentMetadata[]> =>
  isRecord(value) &&
  supplierDocumentKinds.every((kind) => isDocumentMetadataArray(value[kind]))

/**
 * Validate persisted data before using it; local storage can contain stale or
 * manually edited values from an earlier version of this take-home app.
 */
export const parseSupplierOnboardingDraft = (
  serializedDraft: string
): SupplierOnboardingDraft => {
  const parsed: unknown = JSON.parse(serializedDraft)
  if (!isRecord(parsed) || parsed.version !== 1) {
    throw new Error('The saved supplier draft has an unsupported format.')
  }

  if (
    !isSupplierOnboardingStep(parsed.currentStep) ||
    !isSupplierOnboardingValues(parsed.values) ||
    !isSupplierDocuments(parsed.documents) ||
    !(parsed.updatedAt === null || isString(parsed.updatedAt)) ||
    !(parsed.completedAt === null || isString(parsed.completedAt))
  ) {
    throw new Error('The saved supplier draft is incomplete or invalid.')
  }

  return {
    version: 1,
    currentStep: parsed.currentStep,
    values: parsed.values,
    documents: parsed.documents,
    updatedAt: parsed.updatedAt,
    completedAt: parsed.completedAt,
  }
}

/**
 * Build a single-row Supplier payload; supporting onboarding details and
 * document metadata are nested JSON so no related tables are required.
 */
export const toSupplierTableRecord = (
  draft: SupplierOnboardingDraft
): SupplierTableRecordDraft => {
  const { values, documents } = draft
  if (!isSupplierCountry(values.country)) {
    throw new Error('Choose a country before creating a supplier record.')
  }

  return {
    name: values.name.trim(),
    companyName: values.companyName.trim(),
    taxId: values.taxId.trim(),
    country: values.country,
    complianceStatus: 'PENDING',
    onboardingData: {
      contactName: values.contactName.trim(),
      contactEmail: values.contactEmail.trim(),
      contactPhone: values.contactPhone.trim(),
      website: values.website.trim(),
      addressLine1: values.addressLine1.trim(),
      addressLine2: values.addressLine2.trim(),
      city: values.city.trim(),
      stateProvince: values.stateProvince.trim(),
      postalCode: values.postalCode.trim(),
      businessType: values.businessType.trim(),
      capabilities: [...values.capabilities],
      productCategories: values.productCategories.trim(),
      annualCapacity: values.annualCapacity.trim(),
      documents,
    },
  }
}
