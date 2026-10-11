
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { withIronSessionSsr } from "iron-session/next";
import sessionOptions from "../../config/session";
import Header from "../../components/header";

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

export default function SupplementDetails(props) {
  const router = useRouter();
  const { id } = router.query;
  const [supplement, setSupplement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [listChoice, setListChoice] = useState("current");

  useEffect(() => {
    if (!router.isReady || !id) return;

    async function fetchSupplement() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/supplements/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load supplement.");
        }

        setSupplement(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchSupplement();
  }, [router.isReady, id]);

  async function handleAddSupplement() {
    setSaving(true);
    setSaveMessage("");
    setSaveError("");

    try {
      const response = await fetch(
        "/api/supplements/my-supplements",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dsldId: id,
            status: listChoice,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save supplement.");
      }

      setSaveMessage(
        listChoice === "saved"
          ? "Supplement added to Saved Supplements!"
          : "Supplement added to Current Supplements!"
      );
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setSaving(false);
    }
  }

  const servingSize = supplement?.servingSizes?.[0];
  const ingredients = supplement?.ingredientRows || [];
  const otherIngredients =
    supplement?.otheringredients?.ingredients || [];

  return (
    <>
      <Head>
        <title>
          {supplement?.fullName || "Supplement Details"} | Vitamaxing
        </title>
        <meta
          name="description"
          content="View supplement and ingredient information."
        />
      </Head>

      <Header
        isLoggedIn={props.isLoggedIn}
        username={props.username}
      />

      <main>
        <h1>Supplement Details</h1>

        {loading && <p>Loading supplement details...</p>}

        {error && <p role="alert">{error}</p>}

        {!loading && !error && supplement && (
          <>
            <h2>{supplement.fullName}</h2>

            <section>
              <h3>Product Information</h3>
              <p>Brand: {supplement.brandName || "Not available"}</p>
              <p>
                Serving Size:{" "}
                {servingSize
                  ? `${servingSize.minQuantity}${
                      servingSize.unit ? ` ${servingSize.unit}` : ""
                    }${servingSize.notes ? ` (${servingSize.notes})` : ""}`
                  : "Not available"}
              </p>
              <p>
                Form:{" "}
                {supplement.physicalState?.langualCodeDescription ||
                  "Not available"}
              </p>
            </section>

            <section>
              <h3>Ingredients</h3>

              {ingredients.length > 0 ? (
                <ul>
                  {ingredients.map((ingredient) => {
                    const quantity = ingredient.quantity?.[0];

                    return (
                      <li key={ingredient.ingredientId}>
                        {ingredient.name}
                        {quantity
                          ? ` — ${quantity.quantity} ${quantity.unit}`
                          : ""}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p>No ingredient information available.</p>
              )}

              {otherIngredients.length > 0 && (
                <>
                  <h4>Other Ingredients</h4>
                  <ul>
                    {otherIngredients.map((ingredient) => (
                      <li key={ingredient.ingredientId}>
                        {ingredient.name}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>

            <section>
              <h3>Add to My Supplements</h3>

              <p>Choose which list to add this supplement to:</p>

              <label>
                <input
                  type="radio"
                  name="listChoice"
                  value="current"
                  checked={listChoice === "current"}
                  onChange={() => setListChoice("current")}
                />
                Current Supplements
              </label>

              <br />

              <label>
                <input
                  type="radio"
                  name="listChoice"
                  value="saved"
                  checked={listChoice === "saved"}
                  onChange={() => setListChoice("saved")}
                />
                Saved Supplements
              </label>

              <br />

              <button
                type="button"
                onClick={handleAddSupplement}
                disabled={saving || loading || !!error}
              >
                {saving ? "Adding..." : "Add to My Supplements"}
              </button>
            </section>
          </>
        )}

        {saveMessage && <p role="status">{saveMessage}</p>}
        {saveError && <p role="alert">{saveError}</p>}

        <p>
          <Link href="/">Back to Search</Link>
        </p>
      </main>
    </>
  );
}
