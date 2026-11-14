import type { CSSProperties } from 'react'
import { fontSizes, fontWeights, letterSpacings, lineHeights } from '../primitive/typography'

export const typography = {
  h1: {
    fontFamily: 'var(--font-family)',
    fontSize: fontSizes[32],
    lineHeight: lineHeights[42],
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacings.tighter,
  },
  h2: {
    fontFamily: 'var(--font-family)',
    fontSize: fontSizes[24],
    lineHeight: lineHeights[32],
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacings.tight,
  },
  h3: {
    fontFamily: 'var(--font-family)',
    fontSize: fontSizes[20],
    lineHeight: lineHeights[28],
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacings.tight,
  },
  body1Medium: {
    fontFamily: 'var(--font-family)',
    fontSize: fontSizes[16],
    lineHeight: lineHeights[26],
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacings.tight,
  },
  body1Regular: {
    fontFamily: 'var(--font-family)',
    fontSize: fontSizes[16],
    lineHeight: lineHeights[26],
    fontWeight: fontWeights.regular,
    letterSpacing: letterSpacings.tight,
  },
  body2Medium: {
    fontFamily: 'var(--font-family)',
    fontSize: fontSizes[14],
    lineHeight: lineHeights[22],
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacings.tight,
  },
  body2Regular: {
    fontFamily: 'var(--font-family)',
    fontSize: fontSizes[14],
    lineHeight: lineHeights[22],
    fontWeight: fontWeights.regular,
    letterSpacing: letterSpacings.tight,
  },
  label1Semibold: {
    fontFamily: 'var(--font-family)',
    fontSize: fontSizes[16],
    lineHeight: lineHeights[24],
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacings.tight,
  },
  label1Medium: {
    fontFamily: 'var(--font-family)',
    fontSize: fontSizes[16],
    lineHeight: lineHeights[24],
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacings.tight,
  },
  label2Semibold: {
    fontFamily: 'var(--font-family)',
    fontSize: fontSizes[14],
    lineHeight: lineHeights[20],
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacings.tight,
  },
  label2Medium: {
    fontFamily: 'var(--font-family)',
    fontSize: fontSizes[14],
    lineHeight: lineHeights[20],
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacings.tight,
  },
  label3Semibold: {
    fontFamily: 'var(--font-family)',
    fontSize: fontSizes[12],
    lineHeight: lineHeights[16],
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacings.normal,
  },
  label3Medium: {
    fontFamily: 'var(--font-family)',
    fontSize: fontSizes[12],
    lineHeight: lineHeights[16],
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacings.normal,
  },
  caption: {
    fontFamily: 'var(--font-family)',
    fontSize: fontSizes[12],
    lineHeight: lineHeights[18],
    fontWeight: fontWeights.regular,
    letterSpacing: letterSpacings.normal,
  },
} as const satisfies Record<string, CSSProperties>

export type TypographyVariant = keyof typeof typography
