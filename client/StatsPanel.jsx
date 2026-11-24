export default function StatsPanel({ stats }) {
  if (!stats) return null;

  const genreEntries = Object.entries(stats.byGenre || {});

  return (
    <section className="panel stats-panel">
      <h2>Reading Statistics</h2>
      <div className="stats-grid">
        <div className="stat-box">
          <span className="stat-label">Total</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="stat-box">
          <span className="stat-label">Read</span>
          <strong>{stats.read}</strong>
        </div>
        <div className="stat-box">
          <span className="stat-label">Unread</span>
          <strong>{stats.unread}</strong>
        </div>
        <div className="stat-box">
          <span className="stat-label">Avg Rating</span>
          <strong>{stats.averageRating !== null ? stats.averageRating : "N/A"}</strong>
        </div>
      </div>
      {genreEntries.length > 0 && (
        <p className="genre-summary">
          By genre: {genreEntries.map(([g, count]) => `${g} (${count})`).join(", ")}
        </p>
      )}
    </section>
  );
}