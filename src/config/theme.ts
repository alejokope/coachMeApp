// Paleta de colores centralizada para toda la aplicación
// Modifica estos valores para cambiar la paleta de colores globalmente

export const theme = {
  // Colores principales (gradientes)
  primary: {
    dark: '#1B4079',      // Azul oscuro principal
    main: '#4D7C8A',      // Azul turquesa
    light: '#7F9C96',     // Verde azulado
    lighter: '#8FAD88',   // Verde claro
    lightest: '#C7DB94',  // Verde muy claro
  },

  // Colores de fondo
  background: {
    primary: '#F8FAFC',   // Fondo principal (gris muy claro)
    secondary: '#FFFFFF', // Fondo de cards
    tertiary: '#F1F5F9',  // Fondo de separadores
  },

  // Colores de texto
  text: {
    primary: '#0F172A',   // Texto principal (casi negro)
    secondary: '#64748B', // Texto secundario (gris)
    tertiary: '#94A3B8', // Texto terciario (gris claro)
    white: '#FFFFFF',     // Texto blanco
    whiteAlpha: {
      90: 'rgba(255, 255, 255, 0.9)',
      80: 'rgba(255, 255, 255, 0.8)',
      25: 'rgba(255, 255, 255, 0.25)',
      20: 'rgba(255, 255, 255, 0.2)',
    },
  },

  // Colores de acento y estados
  accent: {
    success: '#8FAD88',
    warning: '#C7DB94',
    info: '#4D7C8A',
  },

  // Fondos de iconos y badges
  iconBackground: {
    primary: 'rgba(255, 255, 255, 0.25)',
    secondary: 'rgba(255, 255, 255, 0.2)',
    light: '#F0F9F4',
    lighter: '#F7FCF5',
    tertiary: '#E0F2F1',
    quaternary: '#E8F5E9',
  },

  // Sombras
  shadow: {
    color: '#000000',
    primary: '#1B4079',
    secondary: '#4D7C8A',
    tertiary: '#7F9C96',
  },

  // Gradientes predefinidos
  gradients: {
    header: ['#1B4079', '#4D7C8A'],
    primary: ['#4D7C8A', '#7F9C96'],
    secondary: ['#7F9C96', '#8FAD88'],
    accent: ['#1B4079', '#4D7C8A'],
  },

  // Espaciado y tamaños
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 28,
  },

  // Tipografía
  typography: {
    h1: {
      fontSize: 34,
      fontWeight: '800' as const,
      letterSpacing: -1,
    },
    h2: {
      fontSize: 22,
      fontWeight: '700' as const,
      letterSpacing: -0.4,
    },
    h3: {
      fontSize: 18,
      fontWeight: '700' as const,
      letterSpacing: -0.3,
    },
    body: {
      fontSize: 15,
      fontWeight: '500' as const,
    },
    caption: {
      fontSize: 12,
      fontWeight: '500' as const,
    },
    small: {
      fontSize: 11,
      fontWeight: '500' as const,
    },
  },

  // Bordes
  borderRadius: {
    sm: 12,
    md: 14,
    lg: 18,
    xl: 20,
  },
};

export type Theme = typeof theme;
