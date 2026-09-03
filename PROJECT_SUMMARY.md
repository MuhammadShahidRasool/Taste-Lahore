# Taste Lahore Website Project Summary

## Overview
This project is a restaurant-themed landing page for a food business named Taste Lahore. It includes a modern dark-and-red visual style, hero banner, promotions, featured food cards, and a food menu section with category tabs.

## Main Files
- `index.html` — page structure and content
- `style.css` — all design, layout, and responsive styling
- `script.js` — interactive behavior such as menu tabs, carousel controls, and animations
- `backend/server.js` — Express server, health check, and order placement API
- `backend/supabaseClient.js` — Supabase client initialization using environment variables
- `backend/importProducts.js` — one-time script for importing the 107 frontend products
- `backend/.env` — local Supabase URL and service key configuration; ignored by Git
- `.gitignore` — excludes environment files and dependencies from Git

## Website Sections Included
- Top utility bar with location/time and social links
- Sticky main navigation with brand, menu links, search, and order button
- Hero slider with large food imagery and call-to-action text
- Popular food carousel
- Promo card section
- Best-selling dishes card grid
- Food menu section with category tabs
- Special offer section
- Footer with contact information and newsletter signup

## Styling Approach
- Luxury dark theme with warm red/orange accents
- Montserrat typography for a modern restaurant aesthetic
- Responsive layout using CSS Grid and Flexbox
- Buttons, badges, overlays, and hover states for a polished UI
- Mobile, tablet, and desktop media queries to adapt the design

## Interactive Features
- Food menu category tabs that switch menu content
- Smooth scrolling to the menu section
- Hero slider controls for navigation
- Popular food marquee/carousel animation
- Hover effects and transitions on cards and buttons
- Mobile navigation toggle
- Cart management with quantity controls, item removal, and local storage persistence
- Checkout form validation for customer name, Pakistani phone number, and delivery address
- Checkout summary with subtotal, zero delivery fee, and total
- Frontend order submission through `POST http://localhost:3000/api/orders`
- Existing checkout confirmation modal displays the submitted order ID and total

## Backend and Supabase Integration
- Backend stack: Node.js, Express, and Supabase PostgreSQL
- Installed packages: `express`, `@supabase/supabase-js`, and `dotenv`
- Supabase tables: `products`, `orders`, and `order_items`
- `GET /api/health` tests the Supabase connection with a query against `products`
- `POST /api/orders` validates checkout data, calculates totals, creates a pending order, and inserts its order items
- The current delivery fee is `0` in both the frontend and backend
- Failed order-item insertion triggers cleanup of the newly created order row
- Local browser origins are allowed to call the backend API through restricted CORS handling

## Product Import
- The 107 products originate from the grouped `menuItems` data in `script.js`
- `backend/importProducts.js` reads and transforms that data without modifying the frontend
- The script inserts all products in one Supabase request with `available: true`
- It is a manual one-time operation and is not run when the server starts

## Local Development
Start the backend from the `backend` directory:

```powershell
npm start
```

Open `index.html` in a browser, add an item to the cart, proceed to checkout, complete the customer form, and select **Place Order**. A successful submission displays the order ID and total, clears the cart, and creates matching rows in `orders` and `order_items`.

The product import can be run manually with:

```powershell
node importProducts.js
```

## Fixes and Layout Improvements Applied
- Adjusted menu tab layout to maintain proper grouping and visibility
- Ensured menu rows stay centered and content remains visible without breaking the layout
- Fixed horizontal overflow issues by tightening viewport-restricted layout rules
- Added safeguards so wrappers and card sections do not exceed the browser width

## Notes
The website is built as a single-page restaurant ordering experience with a connected Express and Supabase backend. Supabase credentials belong only in the ignored `backend/.env` file and must never be placed in frontend code.
