
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

function findSupplementOverlaps(supplements) {
  const overlaps = [];

  supplements.forEach((supplement, index) => {
    supplements.slice(index + 1).forEach((otherSupplement) => {
      const sharedIngredients = [];

      (supplement.ingredients || []).forEach((ingredient) => {
        const matchingIngredient = (otherSupplement.ingredients || []).find(
          (other) =>
            normalizeIngredientName(other.name) ===
            normalizeIngredientName(ingredient.name)
        );

        if (matchingIngredient) {
          sharedIngredients.push(ingredient.name.trim());
        }
      });

      if (sharedIngredients.length > 0) {
        overlaps.push({
          dsldId: supplement.dsldId,
          fullName: supplement.fullName,
          overlaps: [
            {
              dsldId: otherSupplement.dsldId,
              fullName: otherSupplement.fullName,
              ingredients: sharedIngredients,
            },
          ],
        });
      }
    });
  });

  return overlaps;
}

function findSavedSupplementOverlaps(
  currentSupplements,
  savedSupplements
) {
  const overlaps = [];

  savedSupplements.forEach((savedSupplement) => {
    const supplementOverlaps = [];

    currentSupplements.forEach((currentSupplement) => {
      const sharedIngredients = [];

      (savedSupplement.ingredients || []).forEach((ingredient) => {
        const matchingIngredient = (currentSupplement.ingredients || []).find(
          (other) =>
            normalizeIngredientName(other.name) ===
            normalizeIngredientName(ingredient.name)
        );

        if (matchingIngredient) {
          sharedIngredients.push(ingredient.name.trim());
        }
      });

      if (sharedIngredients.length > 0) {
        supplementOverlaps.push({
          dsldId: currentSupplement.dsldId,
          fullName: currentSupplement.fullName,
          ingredients: sharedIngredients,
        });
      }
    });

    if (supplementOverlaps.length > 0) {
      overlaps.push({
        dsldId: savedSupplement.dsldId,
        fullName: savedSupplement.fullName,
        overlaps: supplementOverlaps,
      });
    }
  });

  return overlaps;
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
      <li className="supplementCard" key={supplement.dsldId}>
        <div className="supplementInfo">
          <h3>
            <Link
              href={`/supplements/${supplement.dsldId}`}
              className="supplementLink"
            >
              {supplement.fullName}
            </Link>
          </h3>

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
            <Link href ={`/supplements/${supplement.dsldId}`} className="directLink">
              View Details
            </Link>
          </p>
        </div>

        <div className="supplementActions">
          <button
            className="buttonPrimary"
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
                ? "Move to Current"
                : "Move to Saved"}
          </button>

          <button
            className="buttonSecondary"
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
        </div>
      </li>
    );
  }

  const currentSupplements = supplements.filter(
    (supplement) => supplement.status !== "saved"
  );

  const savedSupplements = supplements.filter(
    (supplement) => supplement.status === "saved"
  );

  const currentOverlaps = findSupplementOverlaps(
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

      <main className="pageContent">
        <h1>My Supplements</h1>

        <p>
          Welcome, {props.username}! Manage your current and
          saved supplements here.
        </p>

        <p>
          <Link href="/" className="directLink">Search Supplements</Link>
        </p>
        {message && <p role="status">{message}</p>}
        {error && <p role="alert">{error}</p>}

        <section className="dashboardSection">
          <h2>Current Supplement Overlaps</h2>

          <div className="overlapCard"> 
            {currentOverlaps.length === 0 ? (
              <p className="overlapStatus success">
                <span className="statusIcon">✓</span>
                No overlapping ingredients detected among your
                current supplements.
              </p>
            ) : (
              <>
                <p className="overlapSummary">
                  <span className="statusIcon warning">⚠</span>
                  <span>
                  The following ingredients appear in more than
                  one current supplement:
                  </span>
                </p>

                <ul className="overlapDetails">
                  {currentOverlaps.map((supplement) => (
                    <li key={supplement.dsldId}>
                      <h3>
                        <Link href={`/supplements/${supplement.dsldId}`}
                        className="overlapSupplementName"
                        >
                          {supplement.fullName}
                        </Link>
                        {" "}({supplement.overlaps.reduce(
                          (total, overlap) =>
                            total + overlap.ingredients.length,
                          0
                        )} Overlaps)
                      </h3>

                      <ul>
                        {supplement.overlaps.map((overlap) => (
                          <li key={overlap.dsldId}>
                            <p>
                              Overlaps with:{" "}
                              <Link 
                                href={`/supplements/${overlap.dsldId}`} 
                                className="overlapSupplementName">
                                {overlap.fullName}
                              </Link>
                            </p>

                            <p>
                              Ingredients: {overlap.ingredients.join(", ")}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>

        <section className="dashboardSection">
          <h2>Current Supplements</h2>
          {currentSupplements.length === 0 ? (
            <p>No current supplements yet.</p>
          ) : (
            <ul>
              {currentSupplements.map(renderSupplement)}
            </ul>
          )}
        </section>

        <section className="dashboardSection">
          <h2>Saved Supplement Overlaps</h2>

          <div className="overlapCard">
            {savedOverlaps.length === 0 ? (
              <p className="overlapStatus success">
                <span className="statusIcon">✓</span>
                No overlapping ingredients detected between your
                saved and current supplements.
              </p>
            ) : (
              <>
                <p className="overlapSummary">
                  <span className="statusIcon warning">⚠</span>
                  <span>
                  Saved supplements share ingredients with current supplements.
                  </span>
                </p>

                <ul className="overlapDetails">
                  {savedOverlaps.map((supplement) => (
                    <li key={supplement.dsldId}>
                      <h3>
                        <Link href={`/supplements/${supplement.dsldId}`}
                        className="overlapSupplementName">
                          {supplement.fullName}
                        </Link>
                        {" "}({supplement.overlaps.reduce(
                          (total, overlap) =>
                            total + overlap.ingredients.length,
                          0
                        )} Overlaps)
                      </h3>

                      <ul>
                        {supplement.overlaps.map((overlap) => (
                          <li key={overlap.dsldId}>
                            <p>
                              Overlaps with:{" "}
                              <Link 
                                href={`/supplements/${overlap.dsldId}`} 
                                className="overlapSupplementName">
                                {overlap.fullName}
                              </Link>
                            </p>

                            <p>
                              Ingredients: {overlap.ingredients.join(", ")}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>


        <section className="dashboardSection">
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
          <strong>Disclaimer:</strong> Overlap warnings identify shared ingredients only—they do not assess safety.
        </p>
      </main>
    </>
  );
}
