import { useState, useEffect, useCallback } from "react";
import { fetchBooks, fetchStats, createBook, updateBook, patchBook, removeBook } from "./api/books.js";
import StatsPanel from "./components/StatsPanel.jsx";
import FilterBar from "./components/FilterBar.jsx";
import BookForm from "./components/BookForm.jsx";
import BookList from "./components/BookList.jsx";

export default function App() {
  const [books, setBooks] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    q: "",
    genre: "",
    read: "",
    sort: "id",
    order: "asc"
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingBook, setEditingBook] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const loadBooksAndStats = useCallback(async (currentFilters, signal) => {
    setLoading(true);
    setError("");
    try {
      const [booksData, statsData] = await Promise.all([
        fetchBooks(currentFilters, signal),
        fetchStats(signal)
      ]);
      setBooks(booksData);
      setStats(statsData);
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadBooksAndStats(filters, controller.signal);
    return () => controller.abort();
  }, [filters, loadBooksAndStats]);

  async function refreshCurrentData() {
    const [booksData, statsData] = await Promise.all([
      fetchBooks(filters),
      fetchStats()
    ]);
    setBooks(booksData);
    setStats(statsData);
  }

  async function handleFormSubmit(payload) {
    setIsSubmitting(true);
    setError("");
    try {
      if (editingBook) {
        await updateBook(editingBook.id, payload);
        setEditingBook(null);
      } else {
        await createBook(payload);
      }
      await refreshCurrentData();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleRead(book) {
    setBusyId(book.id);
    setError("");
    try {
      const nextRead = !book.read;
      const patchPayload = nextRead ? { read: true } : { read: false, rating: null };
      await patchBook(book.id, patchPayload);
      await refreshCurrentData();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleRate(book, newRating) {
    setBusyId(book.id);
    setError("");
    try {
      await patchBook(book.id, { rating: newRating });
      await refreshCurrentData();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id) {
    setBusyId(id);
    setError("");
    try {
      await removeBook(id);
      if (editingBook && editingBook.id === id) {
        setEditingBook(null);
      }
      await refreshCurrentData();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="container">
      <header>
        <h1>Reading List</h1>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <StatsPanel stats={stats} />

      <BookForm
        editingBook={editingBook}
        onSubmit={handleFormSubmit}
        onCancelEdit={() => setEditingBook(null)}
        isSubmitting={isSubmitting}
      />

      <FilterBar filters={filters} onFilterChange={setFilters} />

      <BookList
        books={books}
        loading={loading}
        onEdit={setEditingBook}
        onToggleRead={handleToggleRead}
        onRate={handleRate}
        onDelete={handleDelete}
        busyId={busyId}
      />
    </main>
  );
}