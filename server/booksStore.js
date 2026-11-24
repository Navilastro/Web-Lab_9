const delay = () => new Promise((resolve) => setTimeout(resolve, 10));

let nextId = 7;

let books = [
  { id: 1, title: "Dune", author: "Frank Herbert", year: 1965, genre: "science", read: true, rating: 5 },
  { id: 2, title: "1984", author: "George Orwell", year: 1949, genre: "fiction", read: true, rating: 5 },
  { id: 3, title: "Sapiens", author: "Yuval Noah Harari", year: 2011, genre: "history", read: true, rating: 4 },
  { id: 4, title: "The Hobbit", author: "J.R.R. Tolkien", year: 1937, genre: "fantasy", read: false, rating: null },
  { id: 5, title: "Atomic Habits", author: "James Clear", year: 2018, genre: "non-fiction", read: true, rating: 4 },
  { id: 6, title: "Neuromancer", author: "William Gibson", year: 1984, genre: "science", read: false, rating: null }
];

export async function getAllBooks() {
  await delay();
  return books.map((book) => ({ ...book }));
}

export async function getBookById(id) {
  await delay();
  const found = books.find((b) => b.id === id);
  return found ? { ...found } : null;
}

export async function addBook(bookData) {
  await delay();
  const newBook = {
    id: nextId++,
    ...bookData
  };
  books = [...books, newBook];
  return { ...newBook };
}

export async function replaceBook(id, bookData) {
  await delay();
  const exists = books.some((b) => b.id === id);
  if (!exists) return null;

  const updatedBook = { id, ...bookData };
  books = books.map((b) => (b.id === id ? updatedBook : b));
  return { ...updatedBook };
}

export async function deleteBook(id) {
  await delay();
  const exists = books.some((b) => b.id === id);
  if (!exists) return false;

  books = books.filter((b) => b.id !== id);
  return true;
}