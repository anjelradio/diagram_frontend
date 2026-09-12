import { Montserrat_Alternates } from "next/font/google";

/*
 * Roles tipográficos para toda la aplicación configurados con Montserrat Alternates.
 * Los estilos globales los exponen como las utilidades font-headline, font-sans y font-label.
 */
const headline = Montserrat_Alternates({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--app-font-headline",
});

const body = Montserrat_Alternates({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--app-font-body",
});

const label = Montserrat_Alternates({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--app-font-label",
});

export const appFontVariables = `${headline.variable} ${body.variable} ${label.variable}`;
