# 🐾 Plug N Paw (Web)

**Plug N Paw** is a fast, accessible, and user-friendly web application designed to help pet owners locate nearby veterinary clinics globally. Built with Next.js 16 App Router, React Leaflet, Tailwind CSS, and Geoapify.

---

## 🌟 Key Features

- **Dual Search Modes**: Search by free-text query (city, address, or clinic name) or pinpoint nearby clinics using browser **Geolocation** (`"Use my location"`).
- **Synchronized Map & List**: Live bi-directional interaction between interactive map markers and dynamic card lists.
- **Smart Name-Boost Re-ranking**: Upstream places results are client-reranked to surface exact business name matches (e.g., _"Banfield Pet Hospital"_) ahead of closer, unrelated clinics.
- **Server-Side Key Protection**: Geoapify API keys are consumed strictly server-side via Next.js Route Handlers.
- **Adaptive Mobile & Desktop UI**:
  - **Desktop (≥ md)**: Split view with a fixed-width scrollable list panel and full-height map.
  - **Mobile (< md)**: Fullscreen interactive map with a draggable bottom sheet (`shadcn/ui` Drawer via `vaul`).
- **Built-in Resilience**: Built-in timeout budgets (`AbortSignal.timeout`), structured server logging with unique `requestId` tracking, and edge-like response caching (15-minute revalidation).

---

## 🏗 Architecture & Data Flow

---

## 📖 Instructions for Users

1. **Accessing the Search Page**: Navigate to `/find-vet` in your web browser.
2. **Finding Clinics via Text**:
   - Type a city name, full address, or specific clinic name (e.g., _"Quezon City"_ or _"VCA Animal Hospital"_) into the search box.
   - Press **Enter** or click **Search**.
3. **Finding Clinics via Location**:
   - Click **Use my location**.
   - When prompted by your browser, grant location access. The app will center the map and fetch veterinary clinics within a 20 km radius of your location.
4. **Interacting with Results**:
   - Click any card in the list to highlight and center its corresponding map pin.
   - Click any map pin to automatically scroll to and highlight its clinic card in the list.
   - On mobile devices, drag the bottom sheet up or down to reveal or minimize the list of clinics.

---

## 🛠 Developer Quickstart & Setup Instructions (Yarn)

### Prerequisites

- **Node.js**: `v20.x` or higher
- **Package Manager**: `yarn` (`v1` classic or `v4+` berry)
- **Geoapify Account**: Free API key required from [geoapify.com](https://www.geoapify.com/) (No credit card needed).

---

### Step-by-Step Installation

1. **Clone the Repository & Install Dependencies**:
   ```bash
   git clone [https://github.com/your-username/plug-n-paw-web.git](https://github.com/your-username/plug-n-paw-web.git)
   cd plug-n-paw-web
   yarn install
   ```
