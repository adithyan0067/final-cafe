# Canteen Pre-Order – GitHub Pages + Firebase
web url:-https://adithyan0067.github.io/final-cafe/
Static site (HTML/CSS/JS modules) hosted on **GitHub Pages**, using **Firebase** for:
- **Authentication** – email + password for students and the admin
- **Cloud Firestore** – menu, branding, student profiles and orders (shared by everyone)

## Files
- `firebase-config.js` – paste your Firebase web config here (only file you must edit)
- `common.js` – Firebase init + shared helpers (replaces old `data.js`)
- `default-products.js` – starter menu (uploaded from the admin dashboard)
- `firestore.rules` – security rules to paste in the Firebase console
- Page scripts: `login.js`, `register.js`, `menu.js`, `cart.js`, `orders.js`, `home.js`, `admin.js`, `admin-login.js`

## Firestore data
| Collection | Document | Purpose |
|---|---|---|
| `products` | auto id | menu items (admin writes, everyone reads) |
| `settings` | `site` | college name / logo |
| `users` | user uid | student name, phone, email |
| `orders` | auto id | orders (student creates, admin updates status) |
| `admins` | admin uid | **existence of this doc = admin** (create manually) |

## Run locally
ES modules do not work from `file://`. Use VS Code "Live Server" or `python -m http.server`.

## Deploy
Push everything to the GitHub repo (Pages enabled). In Firebase → Authentication → Settings →
**Authorized domains**, add `YOUR-USERNAME.github.io`.

## Security notes
- The Firebase config is public by design; Firestore rules are what protect data.
- Order totals are computed in the browser. For a real production system, move that to a Cloud Function.
