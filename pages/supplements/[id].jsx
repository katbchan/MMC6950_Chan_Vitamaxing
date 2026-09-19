import Head from "next/head";
import Link from "next/link";
import Header from "../../components/header";

export default function SupplementDetails() {
  return (
    <>
      <Head>
        <title>Supplement Details | Vitamaxing</title>
        <meta
          name="description"
          content="View supplement and ingredient information."
        />
      </Head>

      <Header isLoggedIn={false} />

      <main>
        <h1>Supplement Details</h1>

        <p>Supplement information will appear here.</p>

        <section>
          <h2>Product Information</h2>
          <p>Brand: —</p>
          <p>Serving Size: —</p>
          <p>Form: —</p>
        </section>

        <section>
          <h2>Ingredients</h2>
          <p>Ingredient information will appear here.</p>
        </section>

        <button type="button">Add to My Supplements</button>

        <p>
          <Link href="/">Back to Search</Link>
        </p>
      </main>
    </>
  );
}