# RakshaSetu

RakshaSetu is a national crisis safety platform designed to provide real-time emergency response, reporting, and tracking. Built for the citizens of India, it offers a comprehensive suite of safety tools accessible through a modern, responsive web interface.

---

## Features

- **SOS Alerts** -- One-tap emergency SOS activation with automatic location sharing and contact notification
- **Incident Reporting** -- File detailed safety reports with text descriptions, categorized incident types, and severity levels
- **Live Location Tracking** -- Real-time GPS tracking during emergencies with shareable tracking links for contacts and authorities
- **Evidence Upload** -- Capture and upload photos, videos, and audio recordings as digital evidence during incidents
- **Community Safety System** -- Community-driven safety forums, buddy system pairing, and collaborative location safety ratings
- **Safe Route Navigation** -- Safety-aware route suggestions using incident heatmap data and Google Maps Directions API
- **Emergency Map** -- Interactive map displaying nearby police stations, hospitals, and safe zones using Google Places API
- **Legal Aid Directory** -- Searchable directory of nearby legal aid centers and NGOs with map integration
- **Multi-Language Support** -- Full interface localization in English, Hindi, Bengali, Tamil, and Telugu
- **Voice-Activated SOS** -- Hands-free emergency activation using Web Speech Recognition API
- **Safety Analytics** -- Visual dashboards with incident statistics, safety scores, and trend analysis
- **Geofencing Zones** -- Define and monitor custom safety zones with automatic alerts on boundary crossing
- **Fake Call Screen** -- Discreet personal safety feature simulating incoming phone calls
- **Admin Dashboard** -- Administrative panel with analytics, incident management, and system monitoring

---

## Technologies Used

### Google Technologies

**Google Maps JavaScript API**
Used for rendering interactive maps throughout the application. The Emergency Map, Safe Routes, Live Tracking, Legal Aid Directory, and CCTV Map components all use the Google Maps JavaScript API to display map tiles, markers, polylines, and heatmap visualizations. The API is loaded dynamically via the `useGoogleMapsLoader` hook with the Places, Marker, Visualization, and Geometry libraries.

**Google Maps Places API**
Used for searching nearby points of interest such as police stations, hospitals, fire stations, pharmacies, and legal aid centers. The `useGoogleMaps` hook invokes the Places API through a server-side proxy to find nearby services based on user location, with support for text search and place type filtering.

**Google Maps Geocoding API**
Used for converting GPS coordinates to human-readable addresses (reverse geocoding) and converting addresses to coordinates (forward geocoding). This powers the location display in SOS alerts and the address search functionality across the platform.

**Google Maps Directions API**
Used in the Safe Routes component to calculate and display walking routes between two points. Multiple route alternatives are requested and evaluated against incident data to recommend the safest path.

**Google Maps Autocomplete API**
Used for location search with predictive text input. As users type addresses, the autocomplete service returns matching place predictions that can be selected to center the map or set navigation endpoints.

**Google Fonts**
The application uses the Noto Sans font family loaded from Google Fonts, providing consistent and readable typography across all supported languages including Devanagari, Bengali, Tamil, and Telugu scripts.

**Google OAuth**
Used for social authentication, allowing users to sign in with their Google accounts through the OAuth 2.0 flow.

### Core Stack

- **React 19** -- UI component library
- **TypeScript** -- Type-safe JavaScript
- **Vite 7** -- Build tool and development server
- **TanStack Router** -- File-based routing with type-safe navigation
- **TanStack React Query** -- Server state management and data fetching
- **Tailwind CSS 4** -- Utility-first CSS framework
- **Supabase** -- Backend-as-a-Service for authentication, PostgreSQL database, real-time subscriptions, storage, and edge functions
- **Radix UI** -- Accessible, unstyled component primitives
- **Recharts** -- Charting library for analytics dashboards
- **Lucide React** -- Icon library
- **Zod** -- Schema validation
- **jsPDF** -- Client-side PDF report generation
- **Cloudflare Workers** -- Edge deployment target via Wrangler

---

## Project Structure

```
src/
  components/    -- Reusable UI components (SOS, Maps, Reports, etc.)
  hooks/         -- Custom React hooks (Google Maps, Auth, Tracking, etc.)
  integrations/  -- Third-party service clients (Supabase, OAuth)
  routes/        -- File-based route definitions (pages)
  i18n/          -- Localization files (en, hi, bn, ta, te)
  lib/           -- Utility functions (location, SMS, database)
  utils/         -- Server functions (Maps API key management)
  assets/        -- Static assets
  styles.css     -- Global styles and design tokens
```

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or bun package manager

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root with the following variables:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:8080/`.

### Production Build

```bash
npm run build
npm run preview
```

---

## License

This project is proprietary and confidential. All rights reserved.
