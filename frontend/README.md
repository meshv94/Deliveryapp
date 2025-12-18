# DeliveryApp - Frontend

A modern, production-ready delivery application frontend built with React, Material UI, and Vite.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser
http://localhost:5174/
```

## 📦 Tech Stack

- **React 19.2.0** - Latest UI framework
- **Material UI v5** - Professional component library
- **React Router v6** - Modern routing
- **Axios** - HTTP client with interceptors
- **Vite** - Ultra-fast build tool
- **Emotion** - CSS-in-JS styling

## 📁 Project Structure

```
src/
├── components/
│   ├── VendorCard.jsx          # Vendor card display
│   └── Layout.jsx              # App layout wrapper
├── pages/
│   ├── VendorListPage.jsx      # Vendor listing
│   └── VendorDetailsPage.jsx   # Vendor details (placeholder)
├── hooks/
│   └── useVendors.js           # Custom vendor fetch hook
├── services/
│   └── api.js                  # Axios instance
├── App.jsx                     # Main app component
├── main.jsx                    # Entry point
└── index.css                   # Global styles
```

## 🎨 Features

### Completed (Task 1 & 2)
- ✅ Responsive vendor listing grid
- ✅ Modern Material UI design
- ✅ Professional color scheme (purple gradient)
- ✅ Vendor cards with complete information
- ✅ Loading skeletons
- ✅ Error handling
- ✅ Empty states
- ✅ Hover effects
- ✅ Mobile-responsive layout
- ✅ Image lazy loading
- ✅ NEW vendor badges
- ✅ Operating hours display
- ✅ Distance and delivery info
- ✅ Star ratings
- ✅ Professional header and footer

### To Do
- [ ] Advanced filtering & search
- [ ] Vendor detail page
- [ ] Product listings
- [ ] Shopping cart
- [ ] Checkout
- [ ] Order tracking
- [ ] User authentication
- [ ] Favorites/bookmarks

## 🔌 API Configuration

### Environment Variables

Create `.env.local`:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

### Endpoints Used

- `GET /api/app/vendors/active` - Fetch active vendors

## 🎯 Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | VendorListPage | Vendor listing |
| `/vendors/:vendorId` | VendorDetailsPage | Vendor details |

## 🎨 Design System

### Colors
- **Primary:** #667eea (Modern Purple)
- **Secondary:** #764ba2 (Deep Purple)
- **Success:** #4caf50 (Green)
- **Error:** #d32f2f (Red)
- **Background:** #fafafa (Light Gray)
- **Text:** #1a1a1a (Dark)

### Responsive Breakpoints
- **xs:** 0-600px (1 column)
- **sm:** 600-960px (2 columns)
- **md:** 960-1280px (3 columns)
- **lg:** 1280px+ (4 columns)

## 🚀 Build & Deploy

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📖 Documentation

- [TASK_2_SUMMARY.md](TASK_2_SUMMARY.md) - Task 2 overview
- [UI_IMPROVEMENTS_REPORT.md](UI_IMPROVEMENTS_REPORT.md) - UI features
- [UI_VISUAL_REFERENCE.md](UI_VISUAL_REFERENCE.md) - Design specs
- [COMPONENT_USAGE_GUIDE.md](COMPONENT_USAGE_GUIDE.md) - Component examples
- [SETUP_SUMMARY.md](SETUP_SUMMARY.md) - Initial setup

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Server will auto-switch to next available port
npm run dev
```

### API Connection Issues
- Check `.env.local` VITE_API_BASE_URL
- Ensure backend is running on http://localhost:5000
- Check browser DevTools Network tab

---

**Status:** ✅ Production Ready

**Last Updated:** December 2025

**Current Phase:** Task 2 Complete - UI/UX Improvements
