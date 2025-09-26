import type { BookInfo } from "../routes/api/lookup.ts";

interface Props {
  book: BookInfo;
  onScanAnother: () => void;
}

export default function BookDisplay({ book, onScanAnother }: Props) {
  return (
    <div class="book-display">
      <div class="book-card">
        {book.thumbnail && (
          <img
            src={book.thumbnail}
            alt={`Cover of ${book.title}`}
            class="book-thumbnail"
          />
        )}
        <div class="book-info">
          <h2 class="book-title">{book.title}</h2>
          <p class="book-authors">by {book.authors.join(", ")}</p>

          {book.publisher && (
            <p class="book-meta">
              <strong>Publisher:</strong> {book.publisher}
            </p>
          )}

          {book.publishedDate && (
            <p class="book-meta">
              <strong>Published:</strong> {book.publishedDate}
            </p>
          )}

          <div class="isbn-info">
            <p class="book-meta">
              <strong>ISBN:</strong> {book.isbn}
            </p>
            {book.industryIdentifiers && book.industryIdentifiers.length > 0 && (
              <div class="all-identifiers">
                {book.industryIdentifiers.map((id) => (
                  <span key={id.identifier} class="identifier-badge">
                    {id.type}: {id.identifier}
                  </span>
                ))}
              </div>
            )}
          </div>

          {book.description && (
            <details class="book-description">
              <summary>Description</summary>
              <p>{book.description}</p>
            </details>
          )}
        </div>
      </div>

      <button onClick={onScanAnother} class="btn btn-primary">
        Scan Another Book
      </button>
    </div>
  );
}