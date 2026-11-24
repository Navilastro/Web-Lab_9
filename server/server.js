import express from "express";
import cors from "cors";
import { getAllBooks, getBookById, addBook, replaceBook, deleteBook } from "./booksStore.js";
import { ALLOWED_GENRES, parsePositiveId, validateCompleteBook, validatePatchBody } from "./validate.js";

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.CLIENT_ORIGIN
].filter(Boolean));

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Origin not allowed"));
    }
  }
}));
app.use(express.json());

function hasDuplicate(books, title, author, excludeId = null) {
  const normTitle = title.trim().toLowerCase();
  const normAuthor = author.trim().toLowerCase();
  return books.some(
    (b) =>
      b.id !== excludeId &&
      b.title.trim().toLowerCase() === normTitle &&
      b.author.trim().toLowerCase() === normAuthor
  );
}

app.get("/api/books/:id", async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid book id" });
  }

  const book = await getBookById(id);
  if (!book) {
    return res.status(404).json({ error: "Book not found" });
  }

  return res.status(200).json(book);
});

app.post("/api/books", async (req, res) => {
  const result = validateCompleteBook(req.body);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  const existingBooks = await getAllBooks();
  if (hasDuplicate(existingBooks, result.data.title, result.data.author)) {
    return res.status(409).json({ error: "A book with the same title and author already exists" });
  }

  const created = await addBook(result.data);
  return res.status(201).location(`/api/books/${created.id}`).json(created);
});

app.put("/api/books/:id", async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid book id" });
  }

  const existing = await getBookById(id);
  if (!existing) {
    return res.status(404).json({ error: "Book not found" });
  }

  const result = validateCompleteBook(req.body);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  const allBooks = await getAllBooks();
  if (hasDuplicate(allBooks, result.data.title, result.data.author, id)) {
    return res.status(409).json({ error: "Another book with the same title and author already exists" });
  }

  const updated = await replaceBook(id, result.data);
  return res.status(200).json(updated);
});

app.patch("/api/books/:id", async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid book id" });
  }

  const existing = await getBookById(id);
  if (!existing) {
    return res.status(404).json({ error: "Book not found" });
  }

  const patchResult = validatePatchBody(req.body);
  if (patchResult.error) {
    return res.status(400).json({ error: patchResult.error });
  }

  const mergedCandidate = { ...existing, ...patchResult.updates };
  if (patchResult.updates.read === false && patchResult.updates.rating === undefined) {
    mergedCandidate.rating = null;
  }

  const validated = validateCompleteBook(mergedCandidate);
  if (validated.error) {
    return res.status(400).json({ error: validated.error });
  }

  const allBooks = await getAllBooks();
  if (hasDuplicate(allBooks, validated.data.title, validated.data.author, id)) {
    return res.status(409).json({ error: "Another book with the same title and author already exists" });
  }

  const updated = await replaceBook(id, validated.data);
  return res.status(200).json(updated);
});

app.delete("/api/books/:id", async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid book id" });
  }

  const deleted = await deleteBook(id);
  if (!deleted) {
    return res.status(404).json({ error: "Book not found" });
  }

  return res.status(204).end();
});

app.get("/api/books", async (req, res) => {
  const allowedParams = ["genre", "read", "q", "sort", "order", "limit", "page"];
  for (const key of Object.keys(req.query)) {
    if (!allowedParams.includes(key)) {
      return res.status(400).json({ error: `Unknown query parameter: ${key}` });
    }
    if (Array.isArray(req.query[key])) {
      return res.status(400).json({ error: `Repeated query parameter: ${key}` });
    }
  }

  const { genre, read, q, sort = "id", order = "asc", limit = "50", page = "1" } = req.query;

  if (genre !== undefined && !ALLOWED_GENRES.includes(genre)) {
    return res.status(400).json({ error: "Invalid genre filter" });
  }
  if (read !== undefined && read !== "true" && read !== "false") {
    return res.status(400).json({ error: "Invalid read filter" });
  }

  const allowedSort = ["id", "title", "author", "year", "rating"];
  if (!allowedSort.includes(sort)) {
    return res.status(400).json({ error: "Invalid sort field" });
  }
  if (order !== "asc" && order !== "desc") {
    return res.status(400).json({ error: "Invalid sort order" });
  }
  if (!/^[1-9]\d*$/.test(String(limit)) || Number(limit) > 50) {
    return res.status(400).json({ error: "Limit must be an integer between 1 and 50" });
  }
  if (!/^[1-9]\d*$/.test(String(page))) {
    return res.status(400).json({ error: "Page must be a positive integer" });
  }

  let result = await getAllBooks();
  if (genre !== undefined) result = result.filter((b) => b.genre === genre);
  if (read !== undefined) result = result.filter((b) => b.read === (read === "true"));
  if (q !== undefined && q.trim() !== "") {
    const needle = q.trim().toLowerCase();
    result = result.filter((b) =>
      b.title.toLowerCase().includes(needle) || b.author.toLowerCase().includes(needle)
    );
  }

  const direction = order === "asc" ? 1 : -1;
  result = [...result].sort((a, b) => {
    if (sort === "rating") {
      if (a.rating === null && b.rating === null) return 0;
      if (a.rating === null) return 1;
      if (b.rating === null) return -1;
      return (a.rating - b.rating) * direction;
    }
    if (sort === "title" || sort === "author") {
      return a[sort].localeCompare(b[sort]) * direction;
    }
    return (a[sort] - b[sort]) * direction;
  });

  const limitNum = Number(limit);
  const pageNum = Number(page);
  const paginated = result.slice((pageNum - 1) * limitNum, pageNum * limitNum);
  return res.status(200).json(paginated);
});

app.get("/api/stats", async (req, res) => {
  const allBooks = await getAllBooks();
  const total = allBooks.length;
  const readCount = allBooks.filter((b) => b.read).length;
  const ratedBooks = allBooks.filter((b) => b.rating !== null);
  const averageRating = ratedBooks.length > 0
    ? Number((ratedBooks.reduce((sum, b) => sum + b.rating, 0) / ratedBooks.length).toFixed(1))
    : null;
  const byGenre = {};
  for (const book of allBooks) {
    byGenre[book.genre] = (byGenre[book.genre] || 0) + 1;
  }
  return res.status(200).json({
    total,
    read: readCount,
    unread: total - readCount,
    averageRating,
    byGenre
  });
});

app.get("/api/crash", async (req, res) => {
  throw new Error("Simulated async failure");
});

app.use("/api", (req, res) => res.status(404).json({ error: "Not found" }));

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ error: "Malformed JSON in request body" });
  }
  console.error(err);
  return res.status(500).json({ error: "Something went wrong" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});