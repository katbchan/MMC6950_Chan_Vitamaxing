import Head from "next/head";
import { useState } from "react";
import Link from "next/link";
import Header from "../components/header";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(event) {
    event.preventDefault();

    if (!searchTerm.trim()) {
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const response = await fetch(
        `/api/supplements/search?q=${encodeURIComponent(searchTerm)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to search for supplements.");
      }

      setResults(data.hits || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Vitamaxing | Supplement Search</title>
        <meta
          name="description"
          content="Search for supplements with Vitamaxing."
        />
      </Head>

      <Header isLoggedIn={false} />

      <main>
        <h1>Search for Supplements</h1>

        <p>Search our supplement database.</p>

        <form onSubmit={handleSearch}>
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search for a supplement"
            aria-label="Search for a supplement"
          />

          <button type="submit">Search</button>
        </form>

        <section>
          <h2>Search Results</h2>

          {loading && <p>Searching...</p>}

          {error && <p>{error}</p>}

          {!loading && !error && results.length === 0 && (
            <p>No supplements searched yet.</p>
          )}

          {results.map((result) => (
            <article key={result._id}>
              <h3>
                <Link href={`/supplements/${result._id}`}>
                  {result._source.fullName}
                </Link>
              </h3>

              <p>
                <strong>Brand:</strong> {result._source.brandName}
              </p>

              <p>
                <strong>Form:</strong>{" "}
                {result._source.physicalState?.langualCodeDescription}
              </p>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}