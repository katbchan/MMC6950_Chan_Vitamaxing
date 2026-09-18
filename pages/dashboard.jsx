import Head from "next/head";
import Link from "next/link";
import { withIronSessionSsr } from "iron-session/next";
import sessionOptions from "../config/session";
import Header from "../components/header";

export const getServerSideProps = withIronSessionSsr(
  async function getServerSideProps({ req }) {
    const user = req.session.user;
    const props = {};

    if (user) {
      props.user = user;
      props.isLoggedIn = true;
    } else {
      props.isLoggedIn = false;
    }

    return { props };
  },
  sessionOptions
);

export default function Dashboard(props) {
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
        username={props.user?.username}
      />

      <main>
        <h1>My Supplements</h1>

        <p>
          Welcome, {props.user?.username}! This is where you will manage your
          personal supplement list.
        </p>

        <section>
          <h2>Your Supplements</h2>
          <p>No supplements have been added yet.</p>

          <Link href="/">Search for a Supplement</Link>
        </section>
      </main>
    </>
  );
}