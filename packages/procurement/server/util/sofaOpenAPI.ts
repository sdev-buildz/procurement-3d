import type { useSofa } from 'sofa-api'

/** OpenAPI authentication settings for SOFA REST routes. */
export const sofaOpenAPI = {
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
      },
    },
  },
  security: [{ bearerAuth: [] }],
} satisfies NonNullable<Parameters<typeof useSofa>[0]['openAPI']> & {
  security: { bearerAuth: string[] }[]
}
