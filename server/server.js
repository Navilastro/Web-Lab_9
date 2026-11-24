import express from "express";
import cors from "cors";
import { getAllBooks, getBookById, addBook, replaceBook, deleteBook } from "./booksStore.js";
import { parsePositiveId, validateCompleteBook, validatePatchBody } from "./validate.js";

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: CLIENT_ORIGIN }));
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});