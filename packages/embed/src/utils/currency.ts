/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Supported Currencies
 */
export type TargetCurrency = 'USD' | 'VND' | 'CNY'

interface ConversionOptions {
  amountInUSD: number
  targetCurrency: TargetCurrency
}

// Sample conversion rates (1 USD to Target)
const EXCHANGE_RATES: Record<TargetCurrency, number> = {
  VND: 25450, // 1 USD = 25,450 VND
  CNY: 7.25, // 1 USD = 7.25 CNY
  USD: 1,
}

// Map target currency to its appropriate locale
const LOCALE_MAP: Record<TargetCurrency, string> = {
  VND: 'vi-VN',
  CNY: 'zh-CN',
  USD: 'en-US',
}

/**
 * Converts USD to a target currency and returns a localized, formatted string.
 */
export function formatCurrencyFromUSD({
  amountInUSD,
  targetCurrency,
}: ConversionOptions): string {
  const rate = EXCHANGE_RATES[targetCurrency]
  const convertedAmount = amountInUSD * rate
  const locale = LOCALE_MAP[targetCurrency]

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: targetCurrency,
  }).format(convertedAmount)
}

// --- Sample Outputs ---
const usdAmount = 100

const formattedVND = formatCurrencyFromUSD({
  amountInUSD: usdAmount,
  targetCurrency: 'VND',
})
console.log(formattedVND)
// Output: "2.545.000 ₫" (or "₫2,545,000" depending on the runtime environment configuration)

const formattedCNY = formatCurrencyFromUSD({
  amountInUSD: usdAmount,
  targetCurrency: 'CNY',
})
console.log(formattedCNY)
// Output: "¥725.00"
