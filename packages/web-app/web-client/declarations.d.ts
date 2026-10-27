import '@mui/material'

// Augment the createTheme() parameter to accept tertiary color
declare module '@mui/material/styles' {
  interface Palette {
    tertiary: Palette['primary']
    secondaryVariant: Palette['primary']
    tertiaryVariant: Palette['primary']
  }
  interface PaletteOptions {
    tertiary?: PaletteOptions['primary']
    secondaryVariant?: PaletteOptions['primary']
    tertiaryVariant?: PaletteOptions['primary']
  }
}

// Augment the Button component to accept tertiary color
declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    tertiary: true
    secondaryVariant: true
    tertiaryVariant: true
  }
}
declare module '@mui/material/IconButton' {
  interface IconButtonPropsColorOverrides {
    tertiary: true
    secondaryVariant: true
    tertiaryVariant: true
  }
}
export {}
