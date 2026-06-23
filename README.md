# Abada

Infraestructura legal para venture capital en Colombia. Plataforma de preparación para inversión y debida diligencia, con revisión de abogados de Balam Legal.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS v4
- **Claude** (Anthropic) para la asistente de IA
- **i18n**: español colombiano por defecto (`es-CO`), inglés con toggle

## Inicio rápido

```bash
npm install
cp .env.example .env.local   # opcional: añade ANTHROPIC_API_KEY
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Sin `ANTHROPIC_API_KEY`, la asistente responde con respuestas demo alineadas al tono de Balam Legal.

## Vistas

| Ruta | Rol |
|------|-----|
| `/` | Sitio público |
| `/fundador` | Dashboard fundador |
| `/inversionista` | Dashboard inversionista |
| `/abogado` | Cola de revisión (Balam Legal) |

Usa las pestañas del header o el toggle de idioma (Español / English).

## Tema

Diseño propio (no copia del mockup de Netlify):

- Tipografía: **Plus Jakarta Sans**
- Paleta: teal profundo + ámbar cálido sobre fondo stone/cream
- Componentes: botones con gradiente, tarjetas redondeadas, badges de riesgo

Tokens en `src/app/globals.css`.

## IA

- Prompts en `src/lib/ai/prompts.ts` — tres registros (fundador, inversionista, abogado)
- API: `POST /api/ai/chat` con `{ messages, locale, audience }`
- Idioma de la IA sigue el locale del usuario

## Estructura

```
src/
  app/           # Rutas y páginas
  components/    # UI, layout, asistente
  data/          # Datos mock
  lib/ai/        # Claude + prompts
  lib/i18n/      # Traducciones es-CO / en
  messages/      # Archivos JSON de traducción
```

## Próximos pasos (MVP)

- Autenticación (Clerk u otro)
- Flujos guiados de los 5 documentos de investment-readiness
- Pagos Wompi
- Sala de datos con watermarking
- Multi-tenant para Balam Legal y futuras firmas
