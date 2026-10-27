import Head from "next/head";
import { useState } from "react";
import Link from "next/link";
import { withIronSessionSsr } from "iron-session/next";
import sessionOptions from "../config/session";
import Header from "../components/header";
import styles from "../styles/Home.module.css";

export const getServerSideProps = withIronSessionSsr(
  async function getServerSideProps({ req }) {
    const user = req.session.user;

    return {
      props: {
        isLoggedIn: !!user,
        username: user?.username || "",
      },
    };
  },
  sessionOptions
);

export default function Home(props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState({});
  const [addFeedback, setAddFeedback] = useState({});

  async function handleSearch(event) {
    event.preventDefault();

    if (!searchTerm.trim()) {
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);
    setAddFeedback({});

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

  async function handleAddSupplement(result, status) {
    const supplementId = result._id;

    // If signed out, show a login prompt instead of calling the API.
    if (!props.isLoggedIn) {
      setAddFeedback((previous) => ({
        ...previous,
        [supplementId]: {
          type: "login",
          message: "Please log in to add this supplement to your list.",
        },
      }));
      return;
    }

    setAdding((previous) => ({
      ...previous,
      [supplementId]: true,
    }));

    setAddFeedback((previous) => ({
      ...previous,
      [supplementId]: null,
    }));

    try {
      const response = await fetch("/api/supplements/my-supplements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dsldId: supplementId,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to add supplement.");
      }

      setAddFeedback((previous) => ({
        ...previous,
        [supplementId]: {
          type: "success",
          message:
            status === "current"
              ? "Added to Current Supplements."
              : "Added to Saved Supplements.",
        },
      }));
    } catch (error) {
      setAddFeedback((previous) => ({
        ...previous,
        [supplementId]: {
          type: "error",
          message: error.message,
        },
      }));
    } finally {
      setAdding((previous) => ({
        ...previous,
        [supplementId]: false,
      }));
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

      <Header
        isLoggedIn={props.isLoggedIn}
        username={props.username}
      />

      <main className="pageContent">
        <h1>Search for Supplements</h1>

        <p>Find supplements, see ingredients, and keep track of what’s in your routine.</p>

        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={styles.searchInputWrapper}>
            <span className={styles.searchIcon} aria-hidden="true">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="10.5" cy="10.5" r="7.5" />
                <path d="m16 16 5 5" />
              </svg>
            </span>

            <input
              type="text"
              className={styles.searchInput}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by supplement name or brand..."
              aria-label="Search by supplement name or brand"
            />
          </div>

          <button type="submit" className={`buttonPrimary ${styles.searchButton}`}>
            Search
          </button>
        </form>

        
        <section className={styles.searchResults}>
          <h2>Search Results</h2>

          {loading && <p>Searching...</p>}

          {error && <p role="alert">{error}</p>}

          {!loading && !error && results.length === 0 && (
            <p>No supplements searched yet.</p>
          )}

          {results.length > 0 && (
            <>
              <p className={styles.resultsSummary}>
                Showing results for “{searchTerm}”
              </p>

              <div className={styles.resultsList}>
                {results.map((result) => {
                  const supplementId = result._id;
                  const feedback = addFeedback[supplementId];
                  const isAdding = !!adding[supplementId];

                  return (
                    <article
                      key={supplementId}
                      className={styles.resultCard}
                    >
                      <div className={styles.productImage}>
                        Product image
                      </div>

                      <div className={styles.resultInfo}>
                        <h3 className={styles.resultTitle}>
                          <Link href={`/supplements/${supplementId}`}>
                            {result._source.fullName}
                          </Link>
                        </h3>

                        <p>
                          <strong>Brand:</strong>{" "}
                          {result._source.brandName || "Not available"}
                        </p>

                        <p>
                          <strong>Form:</strong>{" "}
                          {result._source.physicalState?.langualCodeDescription ||
                            "Not available"}
                        </p>

                        {feedback && (
                          <p
                            className={
                              feedback.type === "error"
                                ? styles.feedbackError
                                : styles.feedbackMessage
                            }
                            role={
                              feedback.type === "error" ? "alert" : "status"
                            }
                          >
                            {feedback.type === "login" ? (
                              <>
                                Please <Link href="/login">log in</Link> to add
                                this supplement to your list.
                              </>
                            ) : (
                              feedback.message
                            )}
                          </p>
                        )}
                      </div>

                      <div className={styles.resultActions}>
                        <button
                          type="button"
                          className={`buttonPrimary ${styles.addCurrentButton}`}
                          onClick={() =>
                            handleAddSupplement(result, "current")
                          }
                          disabled={isAdding}
                        >
                          {isAdding ? "Adding..." : "Add to Current"}
                        </button>

                        <button
                          type="button"
                          className={`buttonSecondary ${styles.addSavedButton}`}
                          onClick={() =>
                            handleAddSupplement(result, "saved")
                          }
                          disabled={isAdding}
                        >
                          {isAdding ? "Adding..." : "Add to Saved"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>

      </main>
    </>
  );
}