const GENRES = ["fiction", "non-fiction", "science", "history", "fantasy", "other"];

export default function FilterBar({ filters, onFilterChange }) {
  function handleChange(field, value) {
    onFilterChange({ ...filters, [field]: value });
  }

  return (
    <section className="panel filter-bar">
      <input
        type="text"
        placeholder="Search title or author..."
        value={filters.q}
        onChange={(e) => handleChange("q", e.target.value)}
      />

      <select value={filters.genre} onChange={(e) => handleChange("genre", e.target.value)}>
        <option value="">All Genres</option>
        {GENRES.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>

      <select value={filters.read} onChange={(e) => handleChange("read", e.target.value)}>
        <option value="">All Status</option>
        <option value="true">Read</option>
        <option value="false">Unread</option>
      </select>

      <select value={filters.sort} onChange={(e) => handleChange("sort", e.target.value)}>
        <option value="id">Sort: Default (ID)</option>
        <option value="title">Sort: Title</option>
        <option value="author">Sort: Author</option>
        <option value="year">Sort: Year</option>
        <option value="rating">Sort: Rating</option>
      </select>

      <select value={filters.order} onChange={(e) => handleChange("order", e.target.value)}>
        <option value="asc">Ascending</option>
        <option value="desc">Descending</option>
      </select>
    </section>
  );
}