# Reading List App

The backend uses Node.js and Express 5 to store books in memory, and the frontend uses React with Vite to talk to the API.

## How to Install and Run

### Server
First, go to the `server` folder and install the packages:

```bash
cd server
npm install
```

To run the server:

```bash
npm run dev
```

It runs on port `3000` by default (`PORT` environment variable). The allowed client origin defaults to `http://localhost:5173` (`CLIENT_ORIGIN` environment variable).

### Client
Open another terminal, go to the `client` folder, and install the dependencies:

```bash
cd client
npm install
```

Create a `.env` file from `.env.example` (or set it yourself):

```bash
cp .env.example .env
```

Inside `.env`, set `VITE_API_URL=http://localhost:3000`. Then start the client:

```bash
npm run dev
```

Vite usually starts on `http://localhost:5173`. There is no Vite proxy in this project, so the client calls the server URL directly.

## File Organization

```text
/
├── .gitignore
├── README.md
├── client/
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   ├── public/
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api/
│       │   └── books.js
│       └── components/
│           ├── BookForm.jsx
│           ├── BookList.jsx
│           ├── FilterBar.jsx
│           └── StatsPanel.jsx
└── server/
    ├── package.json
    ├── package-lock.json
    ├── server.js
    ├── booksStore.js
    └── validate.js
```

## Testing Evidence

### 1. 200 List with at least two query parameters
Command:
```bash
curl --include "http://localhost:3000/api/books?genre=science&sort=year&order=desc"
```
Output:
```text
PASTE YOUR CURL OUTPUT HERE
```

### 2. 200 for one book
Command:
```bash
curl --include http://localhost:3000/api/books/1
```
Output:
```text
PASTE YOUR CURL OUTPUT HERE
```

### 3. 201 Create book (with Location header)
Command:
```bash
curl --include -X POST http://localhost:3000/api/books -H "Content-Type: application/json" -d '{"title":"The Left Hand of Darkness","author":"Ursula K. Le Guin","year":1969,"genre":"science","read":true,"rating":5}'
```
Output:
```text
PASTE YOUR CURL OUTPUT HERE
```

### 4. 400 for an invalid body
Command:
```bash
curl --include -X POST http://localhost:3000/api/books -H "Content-Type: application/json" -d '{"title":"","author":"Author","year":900,"genre":"fiction"}'
```
Output:
```text
PASTE YOUR CURL OUTPUT HERE
```

### 5. 400 for a repeated query parameter
Command:
```bash
curl --include "http://localhost:3000/api/books?genre=fiction&genre=history"
```
Output:
```text
PASTE YOUR CURL OUTPUT HERE
```

### 6. 404 for a missing book
Command:
```bash
curl --include http://localhost:3000/api/books/99999
```
Output:
```text
PASTE YOUR CURL OUTPUT HERE
```

### 7. 409 for a duplicate book
Command:
```bash
curl --include -X POST http://localhost:3000/api/books -H "Content-Type: application/json" -d '{"title":"dune","author":"frank herbert","year":1965,"genre":"science"}'
```
Output:
```text
PASTE YOUR CURL OUTPUT HERE
```

### 8. PUT and PATCH on the same book
Command (PATCH):
```bash
curl --include -X PATCH http://localhost:3000/api/books/4 -H "Content-Type: application/json" -d '{"read":true,"rating":4}'
```
Output:
```text
PASTE YOUR CURL OUTPUT HERE
```

Command (PUT):
```bash
curl --include -X PUT http://localhost:3000/api/books/4 -H "Content-Type: application/json" -d '{"title":"The Hobbit","author":"J.R.R. Tolkien","year":1937,"genre":"fantasy","read":false,"rating":null}'
```
Output:
```text
PASTE YOUR CURL OUTPUT HERE
```

### 9. 204 for delete, then 404 for the same delete repeated
Command (first delete):
```bash
curl --include -X DELETE http://localhost:3000/api/books/6
```
Output:
```text
PASTE YOUR CURL OUTPUT HERE
```

Command (second delete):
```bash
curl --include -X DELETE http://localhost:3000/api/books/6
```
Output:
```text
PASTE YOUR CURL OUTPUT HERE
```

### 10. GET /api/stats before and after a change
Command (before):
```bash
curl --include http://localhost:3000/api/stats
```
Output:
```text
PASTE YOUR CURL OUTPUT HERE
```

Command (after adding or deleting a book):
```bash
curl --include http://localhost:3000/api/stats
```
Output:
```text
PASTE YOUR CURL OUTPUT HERE
```

### CORS Preflight Evidence
When I added or edited a book in the browser from `http://localhost:5173` to `http://localhost:3000`, I saw an `OPTIONS` request in the DevTools Network tab before the actual request. The request had `Origin: http://localhost:5173` and `Access-Control-Request-Method: POST` (or `PUT` / `PATCH`), and the server replied with status `204` and `Access-Control-Allow-Origin: http://localhost:5173`.

*(Optional: you can also add a screenshot of the Network tab here.)*

## Reasoning Questions

### 1. Parameters
In `/api/books/:id`, `id` is a route parameter because it points to one specific book in the list. Things like `genre` and `sort` are query parameters because they are optional filters or sorting choices for the list. If `id` were in the query string instead of the path, the URLs for getting one book and getting a filtered list would look confusing and less like standard REST routes.

### 2. Body parsing
When I moved `app.use(express.json())` below the routes, `req.body` was `undefined` inside the `POST` handler. Because there was no parsed JSON body, my validation checks failed and the server returned `400`. Putting `app.use(express.json())` before the routes fixed it so JSON bodies get parsed before reaching the handlers.

### 3. One response
When I removed `return` before an early `404` response, the function did not stop there and kept running the rest of the code. Later in the handler, it tried to send another response, which caused an error because an HTTP request can only have one response. Adding `return` makes sure the handler exits right after sending the `404`.

### 4. PUT and PATCH
In this app, `PATCH` is better when toggling `read` or changing a book's `rating` with one click, because we only need to send the changed fields. `PUT` is better when saving the full edit form for a book, because all fields of the book are sent together to replace the record. Using `PATCH` for small updates avoids sending unnecessary data every time.

### 5. CORS
When I set `CLIENT_ORIGIN` to a wrong value, the browser console showed a CORS error and blocked the React app from reading the response. However, the server still received and logged the request because CORS is checked by the browser, not by stopping incoming packets on the server. `curl` still worked because `curl` is a command-line tool and does not follow browser CORS rules.

### 6. Validation
Client-side checks in the form only help the user see mistakes faster while typing. Someone can still send bad data directly to the API using `curl` or browser tools, or bypass form rules. That is why the server must validate everything on its own to keep the data valid.

### 7. State
When I restarted the server, all my changes were gone and the books went back to the initial seed list. This shows the data is only stored in memory (`booksStore.js`) while the Node process is running. To keep data permanently across restarts, we would need a database or file storage.

## Self-Study Notes

- **`URLSearchParams`:** I checked how `URLSearchParams` works in JavaScript and used it in `client/src/api/books.js` to build query strings cleanly. It handles encoding spaces and special characters properly so I do not have to glue strings together by hand.
- **`localeCompare`:** Normal string comparisons with `<` or `>` can sort uppercase and lowercase letters in a weird order based on character codes. Using `localeCompare` helped sort titles and authors more naturally as text.
- **`import.meta.env` and `VITE_`:** In Vite, environment variables are read from `import.meta.env` instead of `process.env`. Variables need the `VITE_` prefix so Vite exposes them to the client code safely.
- **Empty `204` in Express 5:** For `DELETE`, `204` means success with no response body, so I used `res.status(204).end()` on the server. In `client/src/api/books.js`, I checked for `response.status === 204` before calling `response.json()` so it would not crash on an empty body.
- **Cancelling `fetch` with `AbortError`:** When typing quickly in the search box, old requests can finish late and overwrite newer results. Using `AbortController` in `useEffect` cancels the previous request, and checking `err.name === "AbortError"` lets me ignore the expected abort error instead of showing a fake error message.

## Challenges Faced

At first, keeping track of `PATCH` rules was a bit tricky—for example, if a book had a rating and I marked it as unread, I had to make sure the validation and state update stayed consistent. Another thing that took some trial and error was wiring `AbortController` with `useEffect` and updating the stats panel right after changes without updating the UI before the server answered.