
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Header from "../../components/header";

export default function SupplementDetails() {
  const router = useRouter();
  const { id } = router.query;

  const [supplement, setSupplement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

      <Header isLoggedIn={false} />

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
          </>
        )}

        <button type="button" disabled>
          Add to My Supplements (not implemented yet)
        </button>

        <p>
          <Link href="/">Back to Search</Link>
        </p>
      </main>
    </>
  );
}
