import { useState, useEffect } from "react";

const GENRES = ["fiction", "non-fiction", "science", "history", "fantasy", "other"];

export default function BookForm({ editingBook, onSubmit, onCancelEdit, isSubmitting }) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState("");
  const [genre, setGenre] = useState("fiction");
  const [read, setRead] = useState(false);
  const [rating, setRating] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setFormError("");
    if (editingBook) {
      setTitle(editingBook.title);
      setAuthor(editingBook.author);
      setYear(String(editingBook.year));
      setGenre(editingBook.genre);
      setRead(editingBook.read);
      setRating(editingBook.rating !== null ? String(editingBook.rating) : "");
    } else {
      setTitle("");
      setAuthor("");
      setYear("");
      setGenre("fiction");
      setRead(false);
      setRating("");
    }
  }, [editingBook]);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    const payload = {
      title,
      author,
      year: Number(year),
      genre,
      read,
      rating: read && rating !== "" ? Number(rating) : null
    };

    try {
      await onSubmit(payload);
      if (!editingBook) {
        setTitle("");
        setAuthor("");
        setYear("");
        setGenre("fiction");
        setRead(false);
        setRating("");
      }
    } catch (err) {
      setFormError(err.message);
    }
  }

  return (
    <form className="panel book-form" onSubmit={handleSubmit}>
      <h2>{editingBook ? `Edit Book #${editingBook.id}` : "Add New Book"}</h2>
      {formError && <p className="error-banner">{formError}</p>}

      <div className="form-grid">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          required
        />
        <select value={genre} onChange={(e) => setGenre(e.target.value)}>
          {GENRES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={read}
            onChange={(e) => {
              const checked = e.target.checked;
              setRead(checked);
              if (!checked) setRating("");
            }}
          />
          Read
        </label>

        <select
          value={rating}
          disabled={!read}
          onChange={(e) => setRating(e.target.value)}
        >
          <option value="">No Rating</option>
          <option value="1">1 - Poor</option>
          <option value="2">2 - Fair</option>
          <option value="3">3 - Good</option>
          <option value="4">4 - Great</option>
          <option value="5">5 - Excellent</option>
        </select>
      </div>

      <div className="form-actions">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : editingBook ? "Save Changes" : "Add Book"}
        </button>
        {editingBook && (
          <button type="button" onClick={onCancelEdit} disabled={isSubmitting}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}