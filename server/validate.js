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