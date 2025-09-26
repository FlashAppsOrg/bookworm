import { useState, useEffect } from "preact/hooks";
import { User, ClassroomBook, Invitation } from "../utils/db.ts";
import BarcodeScanner from "./BarcodeScanner.tsx";
import BookDisplay from "../components/BookDisplay.tsx";
import type { BookInfo } from "../routes/api/lookup.ts";

interface Props {
  user: User;
  initialBooks: ClassroomBook[];
  teacherName?: string;
}

export default function DashboardContent({ user, initialBooks, teacherName }: Props) {
  const [books, setBooks] = useState<ClassroomBook[]>(initialBooks);
  const [currentBook, setCurrentBook] = useState<BookInfo | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState<'camera' | 'manual' | null>(null);
  const [backingUp, setBackingUp] = useState(false);
  const [showInvitations, setShowInvitations] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [delegates, setDelegates] = useState<User[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [inviteError, setInviteError] = useState("");

  useEffect(() => {
    if (user.role === "teacher") {
      fetchInvitations();
      fetchDelegates();
    }
  }, []);

  const fetchInvitations = async () => {
    try {
      const response = await fetch("/api/invitations/list");
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations || []);
      }
    } catch (err) {
      console.error("Failed to fetch invitations:", err);
    }
  };

  const fetchDelegates = async () => {
    try {
      const response = await fetch("/api/delegates/list");
      if (response.ok) {
        const data = await response.json();
        setDelegates(data.delegates || []);
      }
    } catch (err) {
      console.error("Failed to fetch delegates:", err);
    }
  };

  const handleCreateInvite = async (e: Event) => {
    e.preventDefault();
    setInviteError("");
    setCreatingInvite(true);

    try {
      const response = await fetch("/api/invitations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        setInviteError(data.error || "Failed to create invitation");
        return;
      }

      setInviteEmail("");
      await fetchInvitations();
      setInviteError("");
      alert(`✓ ${data.message}`);
    } catch (err) {
      setInviteError("Network error. Please try again.");
    } finally {
      setCreatingInvite(false);
    }
  };

  const resendInvite = async (email: string) => {
    try {
      const response = await fetch("/api/invitations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✓ Invitation resent to ${email}`);
      } else {
        alert(`✗ ${data.error}`);
      }
    } catch (err) {
      alert("✗ Network error");
    }
  };

  const revokeInvite = async (token: string) => {
    if (!confirm("Are you sure you want to revoke this invitation?")) return;

    try {
      const response = await fetch("/api/invitations/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        await fetchInvitations();
        alert("✓ Invitation revoked");
      } else {
        alert("✗ Failed to revoke invitation");
      }
    } catch (err) {
      alert("✗ Network error");
    }
  };

  const removeDelegate = async (delegateId: string, name: string) => {
    if (!confirm(`Remove ${name} as a helper? This will delete their account.`)) return;

    try {
      const response = await fetch("/api/delegates/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delegateId }),
      });

      if (response.ok) {
        await fetchDelegates();
        alert(`✓ ${name} has been removed`);
      } else {
        alert("✗ Failed to remove helper");
      }
    } catch (err) {
      alert("✗ Network error");
    }
  };

  const handleBookFound = async (book: BookInfo) => {
    setCurrentBook(book);
  };

  const handleAddToClassroom = async () => {
    if (!currentBook) return;

    try {
      const response = await fetch("/api/classroom/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isbn: currentBook.isbn,
          title: currentBook.title,
          authors: currentBook.authors,
          thumbnail: currentBook.thumbnail,
          publisher: currentBook.publisher,
          publishedDate: currentBook.publishedDate,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.duplicate) {
          const increaseQuantity = confirm(
            `${data.message}\n\nIncrease quantity to ${data.existingBook.quantity + 1}?`
          );

          if (increaseQuantity) {
            const updateResponse = await fetch("/api/classroom/update-quantity", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                bookId: data.existingBook.id,
                quantity: data.existingBook.quantity + 1,
              }),
            });

            if (updateResponse.ok) {
              const updateData = await updateResponse.json();
              setBooks(books.map(b => b.id === updateData.book.id ? updateData.book : b));
            }
          }

          setCurrentBook(null);
        } else {
          setBooks([data.book, ...books]);
          setCurrentBook(null);
        }
      }
    } catch (err) {
      console.error("Failed to add book:", err);
    }
  };

  const handleQuantityChange = async (bookId: string, currentQuantity: number, change: number) => {
    const newQuantity = (currentQuantity || 1) + change;

    if (newQuantity <= 0) {
      if (confirm("This will remove the book from your classroom. Continue?")) {
        await handleRemoveBook(bookId);
      }
      return;
    }

    try {
      const response = await fetch("/api/classroom/update-quantity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, quantity: newQuantity }),
      });

      if (response.ok) {
        const data = await response.json();
        setBooks(books.map(b => b.id === bookId ? data.book : b));
      }
    } catch (err) {
      console.error("Failed to update quantity:", err);
    }
  };

  const handleRemoveBook = async (bookId: string) => {
    try {
      const response = await fetch("/api/classroom/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });

      if (response.ok) {
        setBooks(books.filter((b) => b.id !== bookId));
      }
    } catch (err) {
      console.error("Failed to remove book:", err);
    }
  };

  const handleBackupToSheet = async () => {
    setBackingUp(true);
    try {
      const response = await fetch("/api/classroom/backup-to-sheet", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✓ ${data.message}`);
      } else {
        alert(`✗ ${data.error}`);
      }
    } catch (err) {
      alert("✗ Network error. Please try again.");
    } finally {
      setBackingUp(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <div class="min-h-[100dvh] flex flex-col">
      <header class="bg-white dark:bg-gray-800 shadow-md transition-colors">
        <div class="container mx-auto px-4">
          <div class="flex items-center justify-between h-16">
            <span class="text-2xl font-bold text-primary">BookWorm</span>
            <div class="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                class="p-2 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light transition-colors"
                aria-label="Menu"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMenuOpen ? (
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
              {isMenuOpen && (
                <div class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 animate-fade-in z-50">
                  <a
                    href="/settings"
                    class="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div class="flex items-center space-x-3">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Settings</span>
                    </div>
                  </a>
                  <button
                    onClick={handleLogout}
                    class="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div class="flex items-center space-x-3">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Log Out</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main class="flex-1 container mx-auto px-4 py-8">
        <div class="max-w-6xl mx-auto">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                {user.role === "teacher" ? `${user.displayName}'s Classroom` : "Classroom Books"}
              </h1>
              <p class="text-gray-600 dark:text-gray-400 mt-1">
                {books.length} book{books.length !== 1 ? "s" : ""} cataloged
              </p>
            </div>
            <div class="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
              <button
                onClick={() => setScannerMode(scannerMode === 'camera' ? null : 'camera')}
                class="px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold transition-all text-sm whitespace-nowrap"
              >
                📷 {scannerMode === 'camera' ? "Hide" : "Scan"}
              </button>
              <button
                onClick={() => setScannerMode(scannerMode === 'manual' ? null : 'manual')}
                class="px-4 py-2.5 rounded-lg bg-secondary hover:bg-secondary-dark text-white font-semibold transition-all text-sm whitespace-nowrap"
              >
                🔍 {scannerMode === 'manual' ? "Hide" : "Lookup"}
              </button>
              {user.role === "teacher" && (
                <>
                  {user.googleSheetUrl && (
                    <button
                      onClick={handleBackupToSheet}
                      disabled={backingUp || books.length === 0}
                      class="px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                    >
                      📊 {backingUp ? "Backing Up..." : "Backup"}
                    </button>
                  )}
                  <button
                    onClick={() => setShowInvitations(!showInvitations)}
                    class="px-4 py-2.5 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-semibold transition-all text-sm whitespace-nowrap"
                  >
                    👥 Helpers
                  </button>
                </>
              )}
            </div>
          </div>

          {user.role === "delegate" && (
            <div class="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <p class="text-blue-900 dark:text-blue-100 text-sm">
                <strong>Helper Mode:</strong> You're adding books to {teacherName}'s classroom. You cannot remove books or export the list.
              </p>
            </div>
          )}

          {showInvitations && user.role === "teacher" && (
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 mb-6">
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Manage Helpers
              </h2>

              <form onSubmit={handleCreateInvite} class="mb-6">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Invite a Helper
                </label>
                {inviteError && (
                  <div class="bg-error/10 border-2 border-error text-error px-4 py-3 rounded-lg text-sm mb-3">
                    {inviteError}
                  </div>
                )}
                <div class="flex gap-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onInput={(e) => setInviteEmail((e.target as HTMLInputElement).value)}
                    placeholder="helper@example.com"
                    required
                    class="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={creatingInvite}
                    class="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingInvite ? "Creating..." : "Create Invite"}
                  </button>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  An email invitation will be sent with a link to join as a helper
                </p>
              </form>

              <div class="space-y-6">
                <div>
                  <h3 class="font-bold text-gray-900 dark:text-white mb-3">
                    Active Helpers ({delegates.length})
                  </h3>
                  <div class="space-y-2">
                    {delegates.map((delegate) => (
                      <div
                        key={delegate.id}
                        class="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg"
                      >
                        <div class="flex-1 min-w-0">
                          <p class="font-semibold text-gray-900 dark:text-white">
                            {delegate.displayName}
                          </p>
                          <p class="text-xs text-gray-500 dark:text-gray-400">
                            {delegate.email}
                          </p>
                        </div>
                        <button
                          onClick={() => removeDelegate(delegate.id, delegate.displayName)}
                          class="px-3 py-1 text-sm rounded bg-error/10 hover:bg-error/20 text-error font-semibold transition-all"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {delegates.length === 0 && (
                      <p class="text-gray-500 dark:text-gray-400 text-sm">
                        No active helpers
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 class="font-bold text-gray-900 dark:text-white mb-3">
                    Pending Invitations ({invitations.filter(i => !i.used).length})
                  </h3>
                  <div class="space-y-2">
                    {invitations.filter(i => !i.used).map((inv) => (
                      <div
                        key={inv.id}
                        class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div class="flex-1 min-w-0">
                          <p class="font-semibold text-gray-900 dark:text-white">
                            {inv.email}
                          </p>
                          <p class="text-xs text-gray-500 dark:text-gray-400">
                            Expires {new Date(inv.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div class="flex gap-2">
                          {(() => {
                            const lastSent = new Date(inv.lastSentAt);
                            const now = new Date();
                            const minutesSince = (now.getTime() - lastSent.getTime()) / (1000 * 60);
                            const canResend = minutesSince >= 10;
                            const minutesRemaining = canResend ? 0 : Math.ceil(10 - minutesSince);

                            return (
                              <button
                                onClick={() => resendInvite(inv.email)}
                                disabled={!canResend}
                                class="px-3 py-1 text-sm rounded bg-primary hover:bg-primary-dark text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                title={!canResend ? `Wait ${minutesRemaining} more minute${minutesRemaining !== 1 ? 's' : ''}` : ''}
                              >
                                {canResend ? 'Resend' : `Wait ${minutesRemaining}m`}
                              </button>
                            );
                          })()}
                          <button
                            onClick={() => revokeInvite(inv.token)}
                            class="px-3 py-1 text-sm rounded bg-error/10 hover:bg-error/20 text-error font-semibold transition-all"
                          >
                            Revoke
                          </button>
                        </div>
                      </div>
                    ))}
                    {invitations.filter(i => !i.used).length === 0 && (
                      <p class="text-gray-500 dark:text-gray-400 text-sm">
                        No pending invitations
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {scannerMode && (
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 mb-6">
              {currentBook ? (
                <div>
                  <div class="flex gap-3 mb-6">
                    <button
                      onClick={handleAddToClassroom}
                      class="flex-1 py-4 px-6 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold text-lg shadow-lg transition-all transform hover:scale-105 active:scale-95"
                    >
                      ✓ Add to Classroom
                    </button>
                    <button
                      onClick={() => setCurrentBook(null)}
                      class="px-6 py-4 rounded-lg bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-semibold transition-all"
                    >
                      ↻ Scan Another
                    </button>
                  </div>
                  <BookDisplay book={currentBook} onScanAnother={() => setCurrentBook(null)} />
                </div>
              ) : (
                <BarcodeScanner onBookFound={handleBookFound} initialMode={scannerMode} />
              )}
            </div>
          )}

          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <div
                key={book.id}
                class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 transition-colors"
              >
                {book.thumbnail && (
                  <img
                    src={book.thumbnail}
                    alt={book.title}
                    class="w-full h-48 object-contain mb-3"
                  />
                )}
                <h3 class="font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">
                  {book.title}
                </h3>
                {book.authors && book.authors.length > 0 && (
                  <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    by {book.authors.join(", ")}
                  </p>
                )}
                <p class="text-xs text-gray-500 dark:text-gray-500 mb-3">
                  ISBN: {book.isbn}
                </p>
                {user.role === "teacher" && (
                  <div class="space-y-2">
                    <div class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Quantity:</span>
                      <div class="flex items-center gap-2">
                        <button
                          onClick={() => handleQuantityChange(book.id, book.quantity, -1)}
                          class="w-8 h-8 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 font-bold text-gray-700 dark:text-gray-200 transition-all"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span class="text-lg font-bold text-primary dark:text-primary-light min-w-[2rem] text-center">
                          {book.quantity || 1}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(book.id, book.quantity, 1)}
                          class="w-8 h-8 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 font-bold text-gray-700 dark:text-gray-200 transition-all"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveBook(book.id)}
                      class="w-full px-3 py-2 rounded bg-error/10 hover:bg-error/20 text-error text-sm font-semibold transition-all"
                    >
                      Remove Book
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {books.length === 0 && !scannerMode && (
            <div class="text-center py-12">
              <div class="text-6xl mb-4">📚</div>
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No books yet
              </h2>
              <p class="text-gray-600 dark:text-gray-400 mb-6">
                Start scanning books to build your classroom library
              </p>
              <button
                onClick={() => setScannerMode('camera')}
                class="px-6 py-3 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold text-lg shadow-lg transition-all"
              >
                Scan Your First Book
              </button>
            </div>
          )}
        </div>
      </main>

      <footer class="text-center py-4">
        <div class="flex flex-col items-center">
          <div class="relative w-full max-w-xs md:max-w-md px-4">
            <div class="text-lg md:text-2xl font-bold text-primary dark:text-primary-light absolute top-0 left-1/2 transform -translate-x-1/2 z-10">
              BookWorm by
            </div>
            <img src="/flash-apps-horizontal.svg" alt="FlashApps" class="w-full" />
          </div>
        </div>
      </footer>
    </div>
  );
}