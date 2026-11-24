export const ALLOWED_GENRES = ["fiction", "non-fiction", "science", "history", "fantasy", "other"];

export function parsePositiveId(rawId) {
  if (!/^[1-9]\d*$/.test(String(rawId))) {
    return null;
  }
  return Number(rawId);
}

export function validateCompleteBook(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be a JSON object" };
  }

  const { title, author, year, genre } = body;
  const read = body.read === undefined ? false : body.read;
  const rating = body.rating === undefined ? null : body.rating;

  if (typeof title !== "string" || title.trim().length < 1 || title.trim().length > 100) {
    return { error: "Title must be a string between 1 and 100 characters" };
  }

  if (typeof author !== "string" || author.trim().length < 1 || author.trim().length > 100) {
    return { error: "Author must be a string between 1 and 100 characters" };
  }

  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(year) || year < 1000 || year > currentYear) {
    return { error: `Year must be an integer between 1000 and ${currentYear}` };
  }

  if (typeof genre !== "string" || !ALLOWED_GENRES.includes(genre)) {
    return { error: `Genre must be one of: ${ALLOWED_GENRES.join(", ")}` };
  }

  if (typeof read !== "boolean") {
    return { error: "Read status must be a boolean" };
  }

  if (rating !== null) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return { error: "Rating must be an integer between 1 and 5, or null" };
    }
    if (!read) {
      return { error: "Rating is only allowed when read is true" };
    }
  }

  return {
    data: {
      title: title.trim(),
      author: author.trim(),
      year,
      genre,
      read,
      rating
    }
  };
}

export function validatePatchBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be a JSON object" };
  }

  const allowedKeys = ["title", "author", "year", "genre", "read", "rating"];
  const updates = {};

  for (const key of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      updates[key] = body[key];
    }
  }

  return { updates };
}

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

  if (genre !== undefined) {
    result = result.filter((b) => b.genre === genre);
  }

  if (read !== undefined) {
    const isRead = read === "true";
    result = result.filter((b) => b.read === isRead);
  }

  if (q !== undefined && q.trim() !== "") {
    const needle = q.trim().toLowerCase();
    result = result.filter(
      (b) =>
        b.title.toLowerCase().includes(needle) ||
        b.author.toLowerCase().includes(needle)
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
  const startIndex = (pageNum - 1) * limitNum;
  const paginated = result.slice(startIndex, startIndex + limitNum);

  return res.status(200).json(paginated);
});

app.get("/api/stats", async (req, res) => {
  const allBooks = await getAllBooks();
  const total = allBooks.length;
  const readCount = allBooks.filter((b) => b.read).length;
  const unreadCount = total - readCount;

  const ratedBooks = allBooks.filter((b) => b.rating !== null);
  const averageRating =
    ratedBooks.length > 0
      ? Number((ratedBooks.reduce((sum, b) => sum + b.rating, 0) / ratedBooks.length).toFixed(1))
      : null;

  const byGenre = {};
  for (const book of allBooks) {
    byGenre[book.genre] = (byGenre[book.genre] || 0) + 1;
  }

  return res.status(200).json({
    total,
    read: readCount,
    unread: unreadCount,
    averageRating,
    byGenre
  });
});

app.get("/api/crash", async (req, res) => {
  throw new Error("Simulated async failure");
});

app.use("/api", (req, res) => {
  return res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ error: "Malformed JSON in request body" });
  }
  console.error(err);
  return res.status(500).json({ error: "Something went wrong" });
});