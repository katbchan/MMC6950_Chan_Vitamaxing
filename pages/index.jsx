import Head from "next/head";
import { useState } from "react";
import Link from "next/link";
import { withIronSessionSsr } from "iron-session/next";
import sessionOptions from "../config/session";
import Header from "../components/header";

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

          {error && <p role="alert">{error}</p>}

          {!loading && !error && results.length === 0 && (
            <p>No supplements searched yet.</p>
          )}

          {results.map((result) => {
            const supplementId = result._id;
            const feedback = addFeedback[supplementId];
            const isAdding = !!adding[supplementId];

            return (
              <article key={supplementId}>
                <h3>
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

                <div>
                  <button
                    type="button"
                    onClick={() => handleAddSupplement(result, "current")}
                    disabled={isAdding}
                  >
                    {isAdding
                      ? "Adding..."
                      : "Add to Current Supplements"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddSupplement(result, "saved")}
                    disabled={isAdding}
                  >
                    {isAdding
                      ? "Adding..."
                      : "Add to Saved Supplements"}
                  </button>
                </div>

                {feedback && (
                  <p
                    role={
                      feedback.type === "error" ? "alert" : "status"
                    }
                  >
                    {feedback.type === "login" ? (
                      <>
                        Please{" "}
                        <Link href="/login">log in</Link>{" "}
                        to add this supplement to your list.
                      </>
                    ) : (
                      feedback.message
                    )}
                  </p>
                )}
              </article>
            );
          })}
        </section>
      </main>
    </>
  );
}