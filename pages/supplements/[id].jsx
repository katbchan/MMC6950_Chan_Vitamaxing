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

  async function handleAddSupplement(status) {
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
            status: status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save supplement.");
      }

      setSaveMessage(
        status === "saved"
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

      <main className="pageContent">
        <h1>Supplement Details</h1>

        {loading && <p>Loading supplement details...</p>}

        {error && <p role="alert">{error}</p>}

        {!loading && !error && supplement && (
          <>
            <div className="supplementDetails">
              <div className="productImage">
                {supplement.thumbnail ? (
                  <img
                    src={supplement.thumbnail}
                    alt={supplement.fullName}
                  />
                ) : (
                  <div className="imagePlaceholder">
                    Product image
                  </div>
                )}
              </div>
              
              <h2 className="supplementTitle">{supplement.fullName}</h2>

              <section className="detailCard productInfo">
                <h3>Product Information</h3>

                <p>
                  <strong>Brand:</strong> {supplement.brandName || "Not available"}
                </p>

                <p>
                  <strong>Serving Size:</strong>{" "}
                  {servingSize
                    ? `${servingSize.minQuantity}${
                        servingSize.unit ? ` ${servingSize.unit}` : ""
                      }${servingSize.notes ? ` (${servingSize.notes})` : ""}`
                    : "Not available"}
                </p>

                <p>
                  <strong>Form:</strong>{" "}
                  {supplement.physicalState?.langualCodeDescription ||
                    "Not available"}
                </p>
              </section>

              <section className="detailCard ingredientsCard">
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
              </section>

              {otherIngredients.length > 0 && (
                <section className="detailCard otherIngredientsCard">
                  <h3>Other Ingredients</h3>

                  <ul>
                    {otherIngredients.map((ingredient) => (
                      <li key={ingredient.ingredientId}>
                        {ingredient.name}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="detailCard addSupplementCard">
                <h3>Add to My Supplements</h3>

                <div className="addSupplementButtons">
                  <button
                    type="button"
                    className="buttonPrimary"
                    onClick={() => {
                      setListChoice("current");
                      handleAddSupplement("current");
                    }}
                    disabled={saving}
                  >
                    Add to Current
                  </button>

                  <button
                    type="button"
                    className="buttonSecondary"
                    onClick={() => {
                      setListChoice("saved");
                      handleAddSupplement("saved");
                    }}
                    disabled={saving}
                  >
                    Add to Saved
                  </button>

                  {saveMessage && <p role="status">{saveMessage}</p>}
                  {saveError && (
                    <p role="alert">
                      {saveError === "Please log in first." ? (
                        <>
                          Please{" "}
                          <Link href={`/login?returnTo=${encodeURIComponent(`/supplements/${id}`)}`} className="directLink">
                            log in
                          </Link>{" "}
                          first to add this supplement.
                        </>
                      ) : (
                        saveError
                      )}
                    </p>
                  )}
                </div>
              </section>
            </div>
          </>
          )}

        <p>
          <Link href="/" className="directLink">Back to Search</Link>
        </p>
      </main>
    </>
  );
}
