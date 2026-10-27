import {
  getPaletteSync,
  getSwatchesSync,
  type Color,
  type HSL,
} from 'colorthief'

/**
 *  Gets {@link https://m3.material.io/styles/color/dynamic/content-based-source | Content-based Color} from image.
 */
export const getImgColor = (img: HTMLImageElement): string => {
  const swatches = getSwatchesSync(img, { colorSpace: 'oklch' })
  let choosenColor: Color | undefined = undefined

  //  Choose vibrant color if present
  if (swatches.Vibrant) {
    choosenColor = swatches.Vibrant.color
  }
  if (!choosenColor) {
    const palette = getPaletteSync(img, { colorSpace: 'oklch' })

    //  Choose a non-grey color
    for (const color of palette!) {
      // const rgb = color.rgb()
      const hsl = color.hsl()
      if (hsl.s < 10) continue
      choosenColor = color
      break
    }

    // If no vibrant or non-grey colors are present, choose a random color
    if (!choosenColor) {
      choosenColor = palette?.[0]
    }
  }

  const hsl: HSL = choosenColor?.hsl() ?? { h: 20, s: 100, l: 50 }
  hsl.l = 50

  return `hsl( ${hsl.h} ${hsl.s}% ${hsl.l}% / 18% )`
}
