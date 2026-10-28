import { useReactiveVar } from '@apollo/client/react'
import AddBusinessOutlined from '@mui/icons-material/AddBusinessOutlined'
import ArrowBack from '@mui/icons-material/ArrowBack'
import ArrowForward from '@mui/icons-material/ArrowForward'
import CloudUploadOutlined from '@mui/icons-material/CloudUploadOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import FormHelperText from '@mui/material/FormHelperText'
import InputLabel from '@mui/material/InputLabel'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { UserRole } from '@types-gen-react-apollo'
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import { defaultAppContext } from '../../contexts/AppContext'
import { getRoleHomePath } from '../../util/auth'
import {
  createEmptySupplierOnboardingDraft,
  parseSupplierOnboardingDraft,
  supplierCountries,
  supplierDocumentKinds,
  supplierOnboardingStorageKey,
  type SupplierDocumentKind,
  type SupplierDocumentMetadata,
  type SupplierOnboardingDraft,
  type SupplierTableRecordDraft,
  type SupplierOnboardingValues,
  toSupplierTableRecord,
} from './supplierOnboardingDraft'

const steps = [
  'Company',
  'Contact & address',
  'Capabilities',
  'Documents',
  'Review',
]

const countryLabels = {
  VIETNAM: 'Vietnam',
  INDIA: 'India',
  CHINA: 'China',
  GLOBAL: 'Global / multiple locations',
} as const

const documentLabels: Record<SupplierDocumentKind, string> = {
  businessRegistration: 'Business registration',
  taxCertificate: 'Tax certificate',
  qualityCertificates: 'Quality certificates',
}

const capabilityOptions = [
  { value: 'metal-fabrication', label: 'Metal fabrication' },
  { value: 'plastic-molding', label: 'Plastic molding' },
  { value: 'machining', label: 'CNC machining' },
  { value: 'electronics', label: 'Electronics assembly' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'logistics', label: 'Logistics & distribution' },
] as const

const loadDraft = (
  storageKey: string
): {
  draft: SupplierOnboardingDraft
  error: string | null
} => {
  try {
    const serializedDraft = window.localStorage.getItem(storageKey)
    return {
      draft: serializedDraft
        ? parseSupplierOnboardingDraft(serializedDraft)
        : createEmptySupplierOnboardingDraft(),
      error: null,
    }
  } catch (error) {
    return {
      draft: createEmptySupplierOnboardingDraft(),
      error: `Unable to restore the saved draft: ${
        error instanceof Error
          ? error.message
          : 'browser storage is unavailable'
      }`,
    }
  }
}

const validateStep = (
  step: number,
  values: SupplierOnboardingValues
): string[] => {
  if (step === 0) {
    const errors: string[] = []
    if (!values.name.trim()) errors.push('Supplier name is required.')
    if (!values.companyName.trim())
      errors.push('Legal company name is required.')
    if (!values.taxId.trim()) errors.push('Tax or registration ID is required.')
    if (!values.country) errors.push('Choose a country or region.')
    return errors
  }
  if (step === 1) {
    const errors: string[] = []
    if (!values.contactName.trim()) errors.push('Contact name is required.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.contactEmail.trim())) {
      errors.push('Enter a valid contact email address.')
    }
    return errors
  }
  if (step === 2 && values.capabilities.length === 0) {
    return ['Choose at least one capability.']
  }
  return []
}

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

const formatSavedTime = (savedAt: string | null) => {
  if (!savedAt) return 'Your progress saves automatically on this device.'
  const date = new Date(savedAt)
  return Number.isNaN(date.getTime())
    ? 'Draft saved on this device.'
    : `Draft saved at ${date.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      })}`
}

const ReviewSection = ({
  title,
  rows,
}: {
  title: string
  rows: Array<{ label: string; value: string }>
}) => (
  <Box component='section' aria-label={title}>
    <Typography
      component='h3'
      variant='subtitle1'
      sx={{ fontWeight: 700, mb: 1 }}
    >
      {title}
    </Typography>
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 1.5,
      }}
    >
      {rows.map(({ label, value }) => (
        <Box key={label}>
          <Typography color='text.secondary' variant='caption'>
            {label}
          </Typography>
          <Typography variant='body2'>{value || 'Not provided'}</Typography>
        </Box>
      ))}
    </Box>
  </Box>
)

/**
 * Provides a resumable supplier profile wizard and a single-row Supplier payload.
 */
export const SupplierOnboarding = () => {
  const isLoggedIn = useReactiveVar(defaultAppContext.isLoggedIn)
  const user = useReactiveVar(defaultAppContext.user)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  // Keep draft data separate when multiple supplier accounts share a browser.
  const storageKey = `${supplierOnboardingStorageKey}:${user?.id ?? 'unknown'}`
  const [initialLoad] = useState(() => loadDraft(storageKey))
  const [draft, setDraft] = useState(initialLoad.draft)
  const [storageError, setStorageError] = useState(initialLoad.error)
  const [preparedSupplierRecord, setPreparedSupplierRecord] =
    useState<SupplierTableRecordDraft | null>(() => {
      const restoredDraft = initialLoad.draft
      return restoredDraft.completedAt &&
        validateStep(0, restoredDraft.values).length === 0 &&
        validateStep(1, restoredDraft.values).length === 0 &&
        validateStep(2, restoredDraft.values).length === 0
        ? toSupplierTableRecord(restoredDraft)
        : null
    })
  const [hasEdited, setHasEdited] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState(initialLoad.draft.updatedAt)
  const [showStepErrors, setShowStepErrors] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const activeStep = draft.currentStep
  const currentStepErrors = validateStep(activeStep, draft.values)

  useEffect(() => {
    if (!hasEdited) return

    const updatedAt = new Date().toISOString()
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ ...draft, updatedAt })
      )
      setLastSavedAt(updatedAt)
      setStorageError(null)
    } catch (error) {
      setStorageError(
        `Unable to save the supplier draft: ${
          error instanceof Error
            ? error.message
            : 'browser storage is unavailable'
        }`
      )
    }
  }, [draft, hasEdited, storageKey])

  function updateValue<K extends keyof SupplierOnboardingValues>(
    key: K,
    value: SupplierOnboardingValues[K]
  ) {
    setHasEdited(true)
    setPreparedSupplierRecord(null)
    setDraft((current) => ({
      ...current,
      completedAt: null,
      values: { ...current.values, [key]: value },
    }))
  }

  const updateDocuments = (
    kind: SupplierDocumentKind,
    files: FileList | null
  ) => {
    const metadata: SupplierDocumentMetadata[] = Array.from(files ?? []).map(
      (file) => ({
        name: file.name,
        mimeType: file.type,
        size: file.size,
      })
    )
    setHasEdited(true)
    setPreparedSupplierRecord(null)
    setDraft((current) => ({
      ...current,
      completedAt: null,
      documents: { ...current.documents, [kind]: metadata },
    }))
  }

  const goToNextStep = () => {
    if (currentStepErrors.length > 0) {
      setShowStepErrors(true)
      return
    }
    setShowStepErrors(false)
    goToStep(Math.min(activeStep + 1, steps.length - 1))
  }

  const goToStep = (step: number) => {
    setHasEdited(true)
    setDraft((current) => ({ ...current, currentStep: step }))
  }

  const completeOnboarding = () => {
    if (validateStep(0, draft.values).length > 0) {
      goToStep(0)
      setShowStepErrors(true)
      return
    }
    if (validateStep(1, draft.values).length > 0) {
      goToStep(1)
      setShowStepErrors(true)
      return
    }
    if (validateStep(2, draft.values).length > 0) {
      goToStep(2)
      setShowStepErrors(true)
      return
    }
    if (!confirmed) {
      setShowStepErrors(true)
      return
    }

    setPreparedSupplierRecord(toSupplierTableRecord(draft))
    setHasEdited(true)
    setDraft((current) => ({
      ...current,
      completedAt: new Date().toISOString(),
    }))
    setShowStepErrors(false)
  }

  if (!isLoggedIn || !user) return <Navigate to='/login' replace />
  if (user.role !== UserRole.Supplier) {
    return <Navigate to={getRoleHomePath(user.role)} replace />
  }

  const values = draft.values
  const selectedCapabilities = capabilityOptions
    .filter(({ value }) => values.capabilities.includes(value))
    .map(({ label }) => label)
    .join(', ')

  return (
    <Container component='main' maxWidth='lg' sx={{ flexGrow: 1, py: 5 }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
          }}
        >
          <Stack spacing={0.75}>
            <Typography color='text.secondary' variant='overline'>
              SUPPLIER PROFILE
            </Typography>
            <Typography component='h1' variant='h4'>
              Supplier onboarding
            </Typography>
            <Typography color='text.secondary' variant='body1'>
              Build your profile once to help buyers find the right partner.
            </Typography>
          </Stack>
          <Stack
            direction='row'
            spacing={1}
            aria-live='polite'
            sx={{ alignItems: 'center' }}
          >
            <Typography color='text.secondary' variant='body2'>
              {draft.completedAt
                ? 'Onboarding complete'
                : formatSavedTime(lastSavedAt)}
            </Typography>
          </Stack>
        </Stack>

        {storageError ? (
          <Alert severity='error' role='alert'>
            {storageError}
          </Alert>
        ) : null}
        {draft.completedAt ? (
          <Alert severity='success' role='status'>
            Your profile is marked complete in this demo. No information or
            files have been sent to a server.
          </Alert>
        ) : null}
        {preparedSupplierRecord ? (
          <Paper component='section' variant='outlined' sx={{ p: 2 }}>
            <Typography
              component='h2'
              variant='subtitle1'
              sx={{ fontWeight: 700 }}
            >
              Supplier row payload prepared
            </Typography>
            <Typography color='text.secondary' variant='body2' sx={{ mb: 1 }}>
              The fields below map to one Supplier row. Additional onboarding
              details and document metadata are nested under
              <code> onboardingData</code>.
            </Typography>
            <details>
              <summary>View Supplier payload</summary>
              <Box
                component='pre'
                sx={{
                  m: 0,
                  mt: 1,
                  maxHeight: 320,
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontSize: '0.75rem',
                }}
              >
                {JSON.stringify(preparedSupplierRecord, null, 2)}
              </Box>
            </details>
          </Paper>
        ) : null}

        <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 } }}>
          <Stack spacing={4}>
            <Box>
              <Stack
                direction='row'
                sx={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1,
                }}
              >
                <Typography color='text.secondary' variant='body2'>
                  Step {activeStep + 1} of {steps.length}
                </Typography>
                <Typography color='text.secondary' variant='body2'>
                  {Math.round(((activeStep + 1) / steps.length) * 100)}%
                </Typography>
              </Stack>
              <LinearProgress
                aria-label='Onboarding progress'
                value={((activeStep + 1) / steps.length) * 100}
                variant='determinate'
              />
            </Box>

            <Stepper
              activeStep={activeStep}
              alternativeLabel={!isMobile}
              orientation={isMobile ? 'vertical' : 'horizontal'}
            >
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Stack spacing={3} aria-live='polite'>
              {activeStep === 0 ? (
                <>
                  <Stack spacing={0.5}>
                    <Typography component='h2' variant='h5'>
                      Company details
                    </Typography>
                    <Typography color='text.secondary' variant='body2'>
                      Add the legal and public-facing details buyers will use to
                      identify your business.
                    </Typography>
                  </Stack>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      gap: 2,
                    }}
                  >
                    <TextField
                      autoComplete='organization'
                      error={showStepErrors && !values.name.trim()}
                      helperText={
                        showStepErrors && !values.name.trim()
                          ? 'Supplier name is required.'
                          : 'Public-facing name shown to buyers.'
                      }
                      label='Supplier name'
                      onChange={(event) =>
                        updateValue('name', event.target.value)
                      }
                      required
                      value={values.name}
                    />
                    <TextField
                      autoComplete='organization'
                      error={showStepErrors && !values.companyName.trim()}
                      helperText={
                        showStepErrors && !values.companyName.trim()
                          ? 'Legal company name is required.'
                          : undefined
                      }
                      label='Legal company name'
                      onChange={(event) =>
                        updateValue('companyName', event.target.value)
                      }
                      required
                      value={values.companyName}
                    />
                    <TextField
                      error={showStepErrors && !values.taxId.trim()}
                      helperText={
                        showStepErrors && !values.taxId.trim()
                          ? 'Tax or registration ID is required.'
                          : 'Tax ID, VAT number, or local registration number.'
                      }
                      label='Tax / registration ID'
                      onChange={(event) =>
                        updateValue('taxId', event.target.value)
                      }
                      required
                      value={values.taxId}
                    />
                    <FormControl
                      error={showStepErrors && !values.country}
                      required
                    >
                      <InputLabel id='supplier-country-label'>
                        Country / region
                      </InputLabel>
                      <Select
                        label='Country / region'
                        labelId='supplier-country-label'
                        onChange={(event) => {
                          const country = event.target.value
                          const validCountry = supplierCountries.find(
                            (item) => item === country
                          )
                          updateValue('country', validCountry ?? '')
                        }}
                        value={values.country}
                      >
                        <MenuItem value=''>
                          <em>Select a location</em>
                        </MenuItem>
                        {supplierCountries.map((country) => (
                          <MenuItem key={country} value={country}>
                            {countryLabels[country]}
                          </MenuItem>
                        ))}
                      </Select>
                      {showStepErrors && !values.country ? (
                        <FormHelperText>
                          Choose a country or region.
                        </FormHelperText>
                      ) : null}
                    </FormControl>
                  </Box>
                </>
              ) : null}

              {activeStep === 1 ? (
                <>
                  <Stack spacing={0.5}>
                    <Typography component='h2' variant='h5'>
                      Contact & location
                    </Typography>
                    <Typography color='text.secondary' variant='body2'>
                      Tell buyers who to contact and where your business is
                      based.
                    </Typography>
                  </Stack>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      gap: 2,
                    }}
                  >
                    <TextField
                      autoComplete='name'
                      error={showStepErrors && !values.contactName.trim()}
                      helperText={
                        showStepErrors && !values.contactName.trim()
                          ? 'Contact name is required.'
                          : undefined
                      }
                      label='Primary contact'
                      onChange={(event) =>
                        updateValue('contactName', event.target.value)
                      }
                      required
                      value={values.contactName}
                    />
                    <TextField
                      autoComplete='email'
                      error={
                        showStepErrors &&
                        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                          values.contactEmail.trim()
                        )
                      }
                      helperText={
                        showStepErrors &&
                        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                          values.contactEmail.trim()
                        )
                          ? 'Enter a valid contact email address.'
                          : undefined
                      }
                      label='Contact email'
                      onChange={(event) =>
                        updateValue('contactEmail', event.target.value)
                      }
                      required
                      type='email'
                      value={values.contactEmail}
                    />
                    <TextField
                      autoComplete='tel'
                      label='Phone number'
                      onChange={(event) =>
                        updateValue('contactPhone', event.target.value)
                      }
                      value={values.contactPhone}
                    />
                    <TextField
                      autoComplete='url'
                      label='Company website'
                      onChange={(event) =>
                        updateValue('website', event.target.value)
                      }
                      placeholder='https://example.com'
                      value={values.website}
                    />
                    <TextField
                      autoComplete='address-line1'
                      label='Address line 1'
                      onChange={(event) =>
                        updateValue('addressLine1', event.target.value)
                      }
                      value={values.addressLine1}
                    />
                    <TextField
                      autoComplete='address-line2'
                      label='Address line 2'
                      onChange={(event) =>
                        updateValue('addressLine2', event.target.value)
                      }
                      value={values.addressLine2}
                    />
                    <TextField
                      autoComplete='address-level2'
                      label='City'
                      onChange={(event) =>
                        updateValue('city', event.target.value)
                      }
                      value={values.city}
                    />
                    <TextField
                      autoComplete='address-level1'
                      label='State / province'
                      onChange={(event) =>
                        updateValue('stateProvince', event.target.value)
                      }
                      value={values.stateProvince}
                    />
                    <TextField
                      autoComplete='postal-code'
                      label='Postal code'
                      onChange={(event) =>
                        updateValue('postalCode', event.target.value)
                      }
                      value={values.postalCode}
                    />
                    <TextField
                      label='Business type'
                      onChange={(event) =>
                        updateValue('businessType', event.target.value)
                      }
                      placeholder='Manufacturer, distributor, service provider…'
                      value={values.businessType}
                    />
                  </Box>
                </>
              ) : null}

              {activeStep === 2 ? (
                <>
                  <Stack spacing={0.5}>
                    <Typography component='h2' variant='h5'>
                      Capabilities
                    </Typography>
                    <Typography color='text.secondary' variant='body2'>
                      Select the services your team can deliver and share a
                      little more about your capacity.
                    </Typography>
                  </Stack>
                  <FormControl
                    component='fieldset'
                    error={showStepErrors && values.capabilities.length === 0}
                  >
                    <Typography component='legend' variant='subtitle2'>
                      What can your business provide? *
                    </Typography>
                    <FormGroup
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: '1fr',
                          sm: '1fr 1fr',
                          md: '1fr 1fr 1fr',
                        },
                        mt: 1,
                      }}
                    >
                      {capabilityOptions.map(({ value, label }) => (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={values.capabilities.includes(value)}
                              onChange={(event) => {
                                const nextCapabilities = event.target.checked
                                  ? [...values.capabilities, value]
                                  : values.capabilities.filter(
                                      (item) => item !== value
                                    )
                                updateValue('capabilities', nextCapabilities)
                              }}
                            />
                          }
                          key={value}
                          label={label}
                        />
                      ))}
                    </FormGroup>
                    {showStepErrors && values.capabilities.length === 0 ? (
                      <FormHelperText>
                        Choose at least one capability.
                      </FormHelperText>
                    ) : null}
                  </FormControl>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      gap: 2,
                    }}
                  >
                    <TextField
                      label='Product categories'
                      onChange={(event) =>
                        updateValue('productCategories', event.target.value)
                      }
                      placeholder='e.g. brackets, housings, fasteners'
                      value={values.productCategories}
                    />
                    <TextField
                      label='Estimated annual capacity'
                      onChange={(event) =>
                        updateValue('annualCapacity', event.target.value)
                      }
                      placeholder='e.g. 25,000 units'
                      value={values.annualCapacity}
                    />
                  </Box>
                </>
              ) : null}

              {activeStep === 3 ? (
                <>
                  <Stack spacing={0.5}>
                    <Typography component='h2' variant='h5'>
                      Compliance documents
                    </Typography>
                    <Typography color='text.secondary' variant='body2'>
                      Add documents buyers may request during supplier
                      qualification. You can continue without attaching files.
                    </Typography>
                  </Stack>
                  {supplierDocumentKinds.map((kind) => (
                    <Stack key={kind} spacing={1}>
                      <Typography variant='subtitle2'>
                        {documentLabels[kind]}
                      </Typography>
                      <TextField
                        fullWidth
                        slotProps={{
                          htmlInput: {
                            accept:
                              '.pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx',
                            'aria-label': `Upload ${documentLabels[kind]}`,
                            multiple: true,
                          },
                        }}
                        onChange={(event) => {
                          const input = event.currentTarget
                          if (input instanceof HTMLInputElement) {
                            updateDocuments(kind, input.files)
                            // Browsers cannot restore file inputs after a reload; saved names remain as a reselect reminder.
                            input.value = ''
                          }
                        }}
                        type='file'
                      />
                      {draft.documents[kind].length > 0 ? (
                        <Stack
                          direction='row'
                          spacing={1}
                          useFlexGap
                          aria-label={`Selected ${documentLabels[kind]}`}
                          sx={{ flexWrap: 'wrap' }}
                        >
                          {draft.documents[kind].map((file, index) => (
                            <Chip
                              icon={<CloudUploadOutlined />}
                              key={`${file.name}-${file.size}-${index}`}
                              label={`${file.name} · ${formatFileSize(file.size)}`}
                              size='small'
                              variant='outlined'
                            />
                          ))}
                        </Stack>
                      ) : null}
                    </Stack>
                  ))}
                  <Alert severity='info'>
                    This take-home stores file names, types, and sizes in the
                    draft only. File contents are not uploaded or persisted;
                    after reloading, reselect any files you want to attach.
                  </Alert>
                </>
              ) : null}

              {activeStep === 4 ? (
                <>
                  <Stack spacing={0.5}>
                    <Typography component='h2' variant='h5'>
                      Review your profile
                    </Typography>
                    <Typography color='text.secondary' variant='body2'>
                      Confirm these details before marking onboarding complete.
                    </Typography>
                  </Stack>
                  <Stack spacing={3}>
                    <ReviewSection
                      title='Company'
                      rows={[
                        { label: 'Supplier name', value: values.name },
                        {
                          label: 'Legal company name',
                          value: values.companyName,
                        },
                        { label: 'Tax / registration ID', value: values.taxId },
                        {
                          label: 'Country / region',
                          value: values.country
                            ? countryLabels[values.country]
                            : '',
                        },
                      ]}
                    />
                    <ReviewSection
                      title='Contact & location'
                      rows={[
                        { label: 'Primary contact', value: values.contactName },
                        { label: 'Contact email', value: values.contactEmail },
                        { label: 'Phone', value: values.contactPhone },
                        { label: 'Website', value: values.website },
                        {
                          label: 'Address',
                          value: [
                            values.addressLine1,
                            values.addressLine2,
                            values.city,
                            values.stateProvince,
                            values.postalCode,
                          ]
                            .filter(Boolean)
                            .join(', '),
                        },
                        { label: 'Business type', value: values.businessType },
                      ]}
                    />
                    <ReviewSection
                      title='Capabilities'
                      rows={[
                        { label: 'Services', value: selectedCapabilities },
                        {
                          label: 'Product categories',
                          value: values.productCategories,
                        },
                        {
                          label: 'Annual capacity',
                          value: values.annualCapacity,
                        },
                      ]}
                    />
                    <Box component='section' aria-label='Documents'>
                      <Typography
                        component='h3'
                        variant='subtitle1'
                        sx={{ fontWeight: 700, mb: 1 }}
                      >
                        Documents
                      </Typography>
                      <Stack spacing={1}>
                        {supplierDocumentKinds.map((kind) => {
                          const files = draft.documents[kind]
                          return (
                            <Typography key={kind} variant='body2'>
                              <strong>{documentLabels[kind]}:</strong>{' '}
                              {files.length
                                ? files.map(({ name }) => name).join(', ')
                                : 'None selected'}
                            </Typography>
                          )
                        })}
                      </Stack>
                    </Box>
                  </Stack>
                  <FormControl error={showStepErrors && !confirmed}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={confirmed}
                          onChange={(event) =>
                            setConfirmed(event.target.checked)
                          }
                        />
                      }
                      label='I confirm these supplier details are accurate.'
                    />
                    {showStepErrors && !confirmed ? (
                      <FormHelperText>
                        Confirm the information before completing onboarding.
                      </FormHelperText>
                    ) : null}
                  </FormControl>
                  <Alert severity='info'>
                    Completing this demo marks the profile ready and prepares a
                    single Supplier record with additional details in its
                    onboardingData JSON field. No API request is made.
                  </Alert>
                </>
              ) : null}

              {showStepErrors && currentStepErrors.length > 0 ? (
                <Alert severity='error' role='alert'>
                  {currentStepErrors[0]}
                </Alert>
              ) : null}
            </Stack>

            <Stack
              direction={{ xs: 'column-reverse', sm: 'row' }}
              spacing={1.5}
              sx={{ justifyContent: 'space-between' }}
            >
              <Button
                disabled={activeStep === 0}
                onClick={() => {
                  setShowStepErrors(false)
                  goToStep(Math.max(activeStep - 1, 0))
                }}
                startIcon={<ArrowBack />}
                variant='outlined'
              >
                Back
              </Button>
              {activeStep < steps.length - 1 ? (
                <Button
                  onClick={goToNextStep}
                  endIcon={<ArrowForward />}
                  variant='contained'
                >
                  Continue
                </Button>
              ) : (
                <Button
                  onClick={completeOnboarding}
                  startIcon={<AddBusinessOutlined />}
                  variant='contained'
                >
                  {draft.completedAt
                    ? 'Update completed profile'
                    : 'Complete onboarding'}
                </Button>
              )}
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  )
}
