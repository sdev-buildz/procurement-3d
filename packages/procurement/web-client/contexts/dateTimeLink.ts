import { ApolloLink, Observable } from '@apollo/client'

/** Matches serialized ISO 8601 timestamps without treating date-only strings as dates. */
const dateTimePattern =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/

/** Recursively converts serialized ISO 8601 timestamps in GraphQL responses to Dates. */
export const convertDateTimeValues = (value: unknown): unknown => {
  if (value instanceof Date) {
    return value
  }

  if (typeof value === 'string' && dateTimePattern.test(value)) {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date
  }

  if (Array.isArray(value)) {
    return value.map(convertDateTimeValues)
  }

  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        convertDateTimeValues(nestedValue),
      ])
    )
  }

  return value
}

/**
 * Intercepts responses from server and replaces all date or timestamp strings into {@link Date}
 */
export const dateTimeLink = new ApolloLink(
  (operation, forward) =>
    new Observable((observer) =>
      forward(operation).subscribe({
        next: (result) => {
          const { data, ...metadata } = result
          observer.next(
            data === undefined
              ? metadata
              : {
                  ...metadata,
                  data: convertDateTimeValues(data) as Exclude<
                    typeof data,
                    undefined
                  >,
                }
          )
        },
        error: (error: Error) => observer.error(error),
        complete: () => observer.complete(),
      })
    )
)
