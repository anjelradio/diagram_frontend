import { Hanken_Grotesk, Inter, JetBrains_Mono } from "next/font/google";

/*
 * Roles tipográficos para toda la aplicación. app/theme.css los expone como
 * las utilidades Tailwind font-headline, font-sans y font-label.
 */
const headline = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--app-font-headline",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--app-font-body",
});

const label = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--app-font-label",
});

export const appFontVariables = `${headline.variable} ${body.variable} ${label.variable}`;
