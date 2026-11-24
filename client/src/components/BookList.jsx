export default function BookList({ books, loading, onEdit, onToggleRead, onRate, onDelete, busyId }) {
  if (loading) {
    return <p className="status-text">Loading books...</p>;
  }

  if (books.length === 0) {
    return <p className="status-text">No books match your current filters.</p>;
  }

  return (
    <div className="book-list">
      {books.map((book) => {
        const isBusy = busyId === book.id;
        return (
          <article key={book.id} className="panel book-card">
            <div className="book-info">
              <h3>
                {book.title} <span className="book-year">({book.year})</span>
              </h3>
              <p>
                by <strong>{book.author}</strong> — <span className="badge">{book.genre}</span>
              </p>
              <p className="book-meta">
                Status: <strong>{book.read ? "Read" : "Unread"}</strong> | Rating:{" "}
                <strong>{book.rating !== null ? `${book.rating} / 5` : "Unrated"}</strong>
              </p>
            </div>

            <div className="book-actions">
              <button
                type="button"
                disabled={isBusy}
                onClick={() => onToggleRead(book)}
              >
                {book.read ? "Mark Unread" : "Mark Read"}
              </button>

              {book.read && (
                <select
                  aria-label="Rate book"
                  disabled={isBusy}
                  value={book.rating !== null ? String(book.rating) : ""}
                  onChange={(e) => onRate(book, e.target.value === "" ? null : Number(e.target.value))}
                >
                  <option value="">No Rating</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              )}

              <button type="button" disabled={isBusy} onClick={() => onEdit(book)}>
                Edit
              </button>

              <button
                type="button"
                className="danger"
                disabled={isBusy}
                onClick={() => onDelete(book.id)}
              >
                Delete
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}