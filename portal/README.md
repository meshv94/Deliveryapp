# DeliveryApp Admin Portal

Admin panel for managing the DeliveryApp platform.

## Features

- **Dashboard**: Overview with statistics and charts
- **Vendors Management**: View, add, edit, and delete vendors
- **Modules Configuration**: Enable/disable application modules
- **Settings**: Profile and application settings

## Tech Stack

- **React 18** with Vite
- **Material-UI (MUI)** for UI components
- **React Router** for navigation
- **Responsive Design** for all screen sizes

## Getting Started

### Installation

```bash
cd portal
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## Project Structure

```
portal/
├── src/
│   ├── components/
│   │   └── Layout.jsx          # Main layout with sidebar
│   ├── pages/
│   │   ├── Dashboard.jsx       # Dashboard page
│   │   ├── Vendors.jsx         # Vendors management
│   │   ├── Modules.jsx         # Modules configuration
│   │   └── Settings.jsx        # Settings page
│   ├── App.jsx                 # Main app with routing
│   └── main.jsx               # Entry point
├── package.json
└── vite.config.js
```

## Theme

The application uses a custom Material-UI theme with:
- Primary color: #667eea (Purple gradient)
- Secondary color: #764ba2
- Custom component styling for buttons, cards, and papers
