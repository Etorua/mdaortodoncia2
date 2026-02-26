
import "./globals.css";
import { UpdateProvider } from './components/hooks/useEventUpdates';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '🦷 Sistema Interno - Consultorio Dental',
  description: 'Sistema de Gestión y Mantenimiento - Consultorio Dental',
  keywords: 'sistema, mantenimiento, equipos, dental, cosultorio, interno',
  authors: [{ name: 'Consultorio Dental' }],
  creator: 'Consultorio Dental',
  publisher: 'Consultorio Dental',
  robots: 'noindex, nofollow', // Sistema interno, no indexar
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: '🦷 Sistema Interno - Consultorio Dental 🔧',
    description: 'Sistema de Gestión y Mantenimiento - Consultorio Dental',
    type: 'website',
    locale: 'es_MX',
  },
  twitter: {
    card: 'summary',
    title: '🦷 Sistema Interno - Consultorio Dental 🔧',
    description: 'Sistema de Gestión y Mantenimiento - Consultorio Dental',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <title>🦷 Sistema Interno - Consultorio Dental</title>
        <meta name="description" content="Sistema de Gestión y Mantenimiento - Consultorio Dental" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <UpdateProvider>
          {children}
        </UpdateProvider>
      </body>
    </html>
  );
}
