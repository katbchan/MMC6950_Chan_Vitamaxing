
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { withIronSessionSsr } from "iron-session/next";
import sessionOptions from "../config/session";
import Header from "../components/header";
import dbConnect from "../db/connection";
import User from "../db/models/user";

export const getServerSideProps = withIronSessionSsr(
  async function getServerSideProps({ req }) {
    const user = req.session.user;

    if (!user) {
      return {
        redirect: {
          destination: "/login",
          permanent: false,
        },
      };
    }

    await dbConnect();

    const dbUser = await User.findById(user._id)
      .select("supplements")
      .lean();

    const supplements = JSON.parse(
      JSON.stringify(dbUser?.supplements || [])
    );

    return {
      props: {
        username: user.username,
        supplements,
        isLoggedIn: true,
      },
    };
  },
  sessionOptions
);

function normalizeIngredientName(name) {
  return (name || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function findIngredientOverlaps(supplements) {
  const ingredientMap = new Map();

  supplements.forEach((supplement) => {
    (supplement.ingredients || []).forEach((ingredient) => {
      const key = normalizeIngredientName(ingredient.name);

      if (!key) return;

      if (!ingredientMap.has(key)) {
        ingredientMap.set(key, {
          name: ingredient.name.trim(),
          supplements: [],
        });
      }

      ingredientMap.get(key).supplements.push({
        dsldId: supplement.dsldId,
        fullName: supplement.fullName,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
      });
    });
  });

  return Array.from(ingredientMap.values()).filter(
    (ingredient) => ingredient.supplements.length > 1
  );
}

function findSavedSupplementOverlaps(
  currentSupplements,
  savedSupplements
) {
  const currentIngredients = new Map();

  currentSupplements.forEach((supplement) => {
    (supplement.ingredients || []).forEach((ingredient) => {
      const key = normalizeIngredientName(ingredient.name);

      if (!key) return;

      if (!currentIngredients.has(key)) {
        currentIngredients.set(key, {
          name: ingredient.name.trim(),
          supplements: [],
        });
      }

      const existing = currentIngredients.get(key);

      if (
        !existing.supplements.some(
          (item) => item.dsldId === supplement.dsldId
        )
      ) {
        existing.supplements.push({
          dsldId: supplement.dsldId,
          fullName: supplement.fullName,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
        });
      }
    });
  });

  return savedSupplements.map((savedSupplement) => {
    const overlaps = new Map();

    (savedSupplement.ingredients || []).forEach((ingredient) => {
      const key = normalizeIngredientName(ingredient.name);

      if (!key || !currentIngredients.has(key)) return;

      overlaps.set(key, {
        name: currentIngredients.get(key).name,
        currentSupplements: currentIngredients.get(key).supplements,
        savedQuantity: ingredient.quantity,
        savedUnit: ingredient.unit,
      });
    });

    return {
      dsldId: savedSupplement.dsldId,
      fullName: savedSupplement.fullName,
      overlaps: Array.from(overlaps.values()),
    };
  }).filter((savedSupplement) => savedSupplement.overlaps.length > 0);
}

export default function Dashboard(props) {
  const [supplements, setSupplements] = useState(
    props.supplements
  );
  const [removingId, setRemovingId] = useState(null);
  const [movingId, setMovingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleRemove(dsldId) {
    setRemovingId(dsldId);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        "/api/supplements/my-supplements",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ dsldId }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to remove supplement."
        );
      }

      setSupplements((current) =>
        current.filter(
          (supplement) => supplement.dsldId !== dsldId
        )
      );

      setMessage("Supplement removed successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setRemovingId(null);
    }
  }

  async function handleMove(dsldId, status) {
    setMovingId(dsldId);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        "/api/supplements/my-supplements",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ dsldId, status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to move supplement."
        );
      }

      setSupplements((current) =>
        current.map((supplement) =>
          supplement.dsldId === dsldId
            ? { ...supplement, status }
            : supplement
        )
      );

      setMessage(
        status === "saved"
          ? "Supplement moved to Saved Supplements."
          : "Supplement moved to Current Supplements."
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setMovingId(null);
    }
  }

  function renderSupplement(supplement) {
    const isSaved = supplement.status === "saved";

    return (
      <li key={supplement.dsldId}>
        <h3>{supplement.fullName}</h3>

        <p>
          Brand: {supplement.brandName || "Not available"}
        </p>

        <p>
          Form: {supplement.form || "Not available"}
        </p>

        <p>
          Serving Size:{" "}
          {supplement.servingSize || "Not available"}
        </p>

        <p>
          Ingredients: {supplement.ingredients?.length || 0}
        </p>

        <p>
          <Link href={`/supplements/${supplement.dsldId}`}>
            View Details
          </Link>
        </p>

        <button
          type="button"
          onClick={() =>
            handleMove(
              supplement.dsldId,
              isSaved ? "current" : "saved"
            )
          }
          disabled={
            movingId === supplement.dsldId ||
            removingId === supplement.dsldId
          }
        >
          {movingId === supplement.dsldId
            ? "Moving..."
            : isSaved
              ? "Move to Current Supplements"
              : "Move to Saved Supplements"}
        </button>

        {" "}

        <button
          type="button"
          onClick={() => handleRemove(supplement.dsldId)}
          disabled={
            removingId === supplement.dsldId ||
            movingId === supplement.dsldId
          }
        >
          {removingId === supplement.dsldId
            ? "Removing..."
            : "Remove"}
        </button>
      </li>
    );
  }

  const currentSupplements = supplements.filter(
    (supplement) => supplement.status !== "saved"
  );

  const savedSupplements = supplements.filter(
    (supplement) => supplement.status === "saved"
  );

  const currentOverlaps = findIngredientOverlaps(
    currentSupplements
  );

  const savedOverlaps = findSavedSupplementOverlaps(
    currentSupplements,
    savedSupplements
  );

  return (
    <>
      <Head>
        <title>My Supplements | Vitamaxing</title>
        <meta
          name="description"
          content="Manage your supplements and identify overlapping ingredients with Vitamaxing."
        />
      </Head>

      <Header
        isLoggedIn={props.isLoggedIn}
        username={props.username}
      />

      <main>
        <h1>My Supplements</h1>

        <p>
          Welcome, {props.username}! Manage your current and
          saved supplements here.
        </p>

        {message && <p role="status">{message}</p>}
        {error && <p role="alert">{error}</p>}

        <section>
          <h2>Current Supplement Overlaps</h2>

          {currentOverlaps.length === 0 ? (
            <p>
              No overlapping ingredients detected among your
              current supplements.
            </p>
          ) : (
            <>
              <p>
                The following ingredients appear in more than
                one current supplement:
              </p>

              <ul>
                {currentOverlaps.map((overlap) => (
                  <li key={normalizeIngredientName(overlap.name)}>
                    <h3>{overlap.name}</h3>

                    <p>
                      Found in {overlap.supplements.length} current
                      supplements.
                    </p>

                    <ul>
                      {overlap.supplements.map((item) => (
                        <li key={item.dsldId}>
                          <Link href={`/supplements/${item.dsldId}`}>
                            {item.fullName}
                          </Link>
                          {item.quantity !== null &&
                          item.quantity !== undefined
                            ? ` — ${item.quantity}${item.unit ? ` ${item.unit}` : ""}`
                            : ""}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section>
          <h2>Current Supplements</h2>

          {currentSupplements.length === 0 ? (
            <p>No current supplements yet.</p>
          ) : (
            <ul>
              {currentSupplements.map(renderSupplement)}
            </ul>
          )}
        </section>

        <section>
          <h2>Saved Supplement Overlaps</h2>

          {savedOverlaps.length === 0 ? (
            <p>
              No overlapping ingredients detected between your
              saved and current supplements.
            </p>
          ) : (
            <ul>
              {savedOverlaps.map((savedSupplement) => (
                <li key={savedSupplement.dsldId}>
                  <h3>
                    <Link
                      href={`/supplements/${savedSupplement.dsldId}`}
                    >
                      {savedSupplement.fullName}
                    </Link>
                  </h3>

                  <p>
                    Shares ingredients with your current
                    supplements:
                  </p>

                  <ul>
                    {savedSupplement.overlaps.map((overlap) => (
                      <li
                        key={normalizeIngredientName(overlap.name)}
                      >
                        <strong>{overlap.name}</strong>

                        {overlap.savedQuantity !== null &&
                        overlap.savedQuantity !== undefined
                          ? ` — Saved supplement: ${overlap.savedQuantity}${overlap.savedUnit ? ` ${overlap.savedUnit}` : ""}`
                          : ""}

                        <ul>
                          {overlap.currentSupplements.map((item) => (
                            <li key={item.dsldId}>
                              Also found in{" "}
                              <Link
                                href={`/supplements/${item.dsldId}`}
                              >
                                {item.fullName}
                              </Link>
                              {item.quantity !== null &&
                              item.quantity !== undefined
                                ? ` — ${item.quantity}${item.unit ? ` ${item.unit}` : ""}`
                                : ""}
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2>Saved Supplements</h2>

          {savedSupplements.length === 0 ? (
            <p>No saved supplements yet.</p>
          ) : (
            <ul>
              {savedSupplements.map(renderSupplement)}
            </ul>
          )}
        </section>

        <p>
          <Link href="/">Search Supplements</Link>
        </p>

        <p>
          <strong>Disclaimer:</strong> Overlap warnings identify shared ingredients only—they do not assess safety.
        </p>
      </main>
    </>
  );
}
