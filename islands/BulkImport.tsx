import { useState } from "preact/hooks";

interface ImportResult {
  success: boolean;
  errors: string[];
  stats: {
    schoolsCreated: number;
    teachersCreated: number;
    booksCreated: number;
    rowsProcessed: number;
  };
}

export default function BulkImport() {
  const [csvData, setCsvData] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [message, setMessage] = useState("");

  async function handleImport() {
    if (!csvData.trim()) {
      setMessage("✗ Please paste CSV data");
      return;
    }

    setImporting(true);
    setMessage("");
    setResult(null);

    try {
      const response = await fetch("/api/admin/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvData }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        setMessage("✓ Import completed successfully");
        setCsvData("");
      } else {
        setMessage(`✗ Import completed with ${data.errors.length} error(s)`);
      }
    } catch (error) {
      setMessage("✗ Import failed");
    } finally {
      setImporting(false);
    }
  }

  function handleFileUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvData(text);
    };
    reader.readAsText(file);
  }

  function downloadTemplate() {
    const template = `schoolName,schoolSlug,teacherName,teacherEmail,teacherUsername,isbn,title,authors,publisher,publishedDate,description,categories,pageCount,quantity
Wake County Public Schools,wcpss,Ms. Smith,teacher@wcpss.net,msmith,9780545582889,Harry Potter and the Sorcerer's Stone,J.K. Rowling,Scholastic,1998-09-01,A young wizard's journey begins,Fantasy;Young Adult,309,2
Wake County Public Schools,wcpss,Ms. Smith,teacher@wcpss.net,msmith,9780439023481,The Hunger Games,Suzanne Collins,Scholastic,2008-09-14,A dystopian survival story,Science Fiction;Young Adult,374,1`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bookworm-import-template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div class="space-y-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">
            Bulk Import Books
          </h2>
          <button
            onClick={downloadTemplate}
            class="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Template
          </button>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Import schools, teachers, and books from a CSV file. Download the template above to get started with the correct format.
        </p>
        <div class="bg-gray-50 dark:bg-gray-700 rounded p-4 mb-4 font-mono text-xs">
          <p class="text-gray-900 dark:text-white mb-2">Required columns:</p>
          <ul class="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
            <li>teacherName (required)</li>
            <li>title (required)</li>
          </ul>
          <p class="text-gray-900 dark:text-white mt-3 mb-2">Optional columns:</p>
          <ul class="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
            <li>schoolName, schoolSlug</li>
            <li>teacherEmail, teacherUsername</li>
            <li>isbn, authors (semicolon-separated), publisher, publishedDate</li>
            <li>description, categories (semicolon-separated), pageCount, quantity</li>
          </ul>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Upload CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              class="block w-full text-sm text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Or Paste CSV Data
            </label>
            <textarea
              value={csvData}
              onInput={(e) => setCsvData((e.target as HTMLTextAreaElement).value)}
              placeholder="schoolName,teacherName,teacherEmail,title,isbn,authors,quantity..."
              rows={10}
              class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white font-mono text-sm"
            />
          </div>

          <button
            onClick={handleImport}
            disabled={importing || !csvData.trim()}
            class="w-full py-3 px-6 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? "Importing..." : "Import Data"}
          </button>

          {message && (
            <p class={`text-sm ${message.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>
              {message}
            </p>
          )}
        </div>
      </div>

      {result && (
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Import Results
          </h3>

          <div class="grid md:grid-cols-4 gap-4 mb-4">
            <div class="bg-blue-50 dark:bg-blue-900/20 rounded p-4">
              <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {result.stats.rowsProcessed}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Rows Processed</div>
            </div>
            <div class="bg-green-50 dark:bg-green-900/20 rounded p-4">
              <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                {result.stats.schoolsCreated}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Schools Created</div>
            </div>
            <div class="bg-purple-50 dark:bg-purple-900/20 rounded p-4">
              <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {result.stats.teachersCreated}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Teachers Created</div>
            </div>
            <div class="bg-orange-50 dark:bg-orange-900/20 rounded p-4">
              <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {result.stats.booksCreated}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Books Imported</div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div class="bg-red-50 dark:bg-red-900/20 rounded p-4">
              <h4 class="text-sm font-semibold text-red-800 dark:text-red-400 mb-2">
                Errors ({result.errors.length})
              </h4>
              <ul class="list-disc list-inside text-sm text-red-700 dark:text-red-300 space-y-1 max-h-60 overflow-y-auto">
                {result.errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}