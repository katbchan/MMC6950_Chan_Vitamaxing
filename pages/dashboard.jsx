
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

export default function Dashboard(props) {
  const [supplements, setSupplements] = useState(
    props.supplements
  );
  const [removingId, setRemovingId] = useState(null);
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

  return (
    <>
      <Head>
        <title>My Supplements | Vitamaxing</title>
        <meta
          name="description"
          content="Manage your supplements with Vitamaxing."
        />
      </Head>

      <Header
        isLoggedIn={props.isLoggedIn}
        username={props.username}
      />

      <main>
        <h1>My Supplements</h1>

        <p>
          Welcome, {props.username}! This is where you will
          manage your personal supplement list.
        </p>

        <section>
          <h2>Your Supplements</h2>

          {message && <p role="status">{message}</p>}
          {error && <p role="alert">{error}</p>}

          {supplements.length === 0 ? (
            <p>No supplements have been added yet.</p>
          ) : (
            <ul>
              {supplements.map((supplement) => (
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
                    Ingredients:{" "}
                    {supplement.ingredients?.length || 0}
                  </p>

                  <p>
                    <Link
                      href={`/supplements/${supplement.dsldId}`}
                    >
                      View Details
                    </Link>
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      handleRemove(supplement.dsldId)
                    }
                    disabled={removingId === supplement.dsldId}
                  >
                    {removingId === supplement.dsldId
                      ? "Removing..."
                      : "Remove"}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <p>
            <Link href="/">Search for a Supplement</Link>
          </p>
        </section>
      </main>
    </>
  );
}
