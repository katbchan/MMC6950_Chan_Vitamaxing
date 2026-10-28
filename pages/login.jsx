import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";
import { withIronSessionSsr } from "iron-session/next";
import sessionOptions from "../config/session";
import Header from "../components/header";

export const getServerSideProps = withIronSessionSsr(
  async function getServerSideProps({ req }) {
    const user = req.session.user;

    if (user) {
      return {
        redirect: {
          destination: "/dashboard",
          permanent: false,
        },
      };
    }

    return {
      props: {
        isLoggedIn: false,
      },
    };
  },
  sessionOptions
);

export default function Login(props) {
  const router = useRouter();

  const [{ username, password }, setForm] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(e) {
    setForm({
      username,
      password,
      [e.target.name]: e.target.value,
    });
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (res.status === 200) {
        router.push("/dashboard");
        return;
      }

      const data = await res.json();
      setError(data.error || "Unable to log in. Please try again.");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Head>
        <title>Login | Vitamaxing</title>
        <meta
          name="description"
          content="Log in to your Vitamaxing account to manage your supplements."
        />
      </Head>

      <Header
        isLoggedIn={props.isLoggedIn}
      />

      <main className="pageContent">
        <h1>Welcome Back! </h1>
        <h2>Login to Your Account</h2>

        <p>
          Log in to access your personal supplement lists and
          ingredient overlap warnings.
        </p>
        
        
        <form onSubmit={handleLogin} className="authForm">
          <div className="authField">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              name="username"
              id="username"
              autoComplete="username"
              required
              value={username}
              onChange={handleChange}
            />
          </div>

          <div className="authField">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              name="password"
              id="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="buttonPrimary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>

          {error && <p role="alert">{error}</p>}
        </form>


        <p>
          New Here?{" "}
          <Link href="/signup" className="authLink">
            Create an account
          </Link>
        </p>
      </main>
    </>
  );
}
