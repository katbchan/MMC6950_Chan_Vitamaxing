
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";
import Header from "../components/header";

export default function Signup() {
  const router = useRouter();

  const [{ username, password, "confirm-password": confirmPassword }, setForm] =
    useState({
      username: "",
      password: "",
      "confirm-password": "",
    });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleCreateAccount(e) {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Please enter a username.");
      return;
    }

    if (!password) {
      setError("Please enter a password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (res.status === 200) {
        router.push("/dashboard");
        return;
      }

      const data = await res.json();
      setError(data.error || "Unable to create account. Please try again.");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Head>
        <title>Create Account | Vitamaxing</title>
        <meta
          name="description"
          content="Create a Vitamaxing account to manage your supplements."
        />
      </Head>

      <Header isLoggedIn={false} />

      <main className="pageContent">
        <h1>Create Account</h1>

        <p>
          Create an account to manage your personal supplement lists and check
          for ingredient overlaps.
        </p>

        
        <form onSubmit={handleCreateAccount} className="authForm">
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
              autoComplete="new-password"
              required
              value={password}
              onChange={handleChange}
            />
          </div>

          <div className="authField">
            <label htmlFor="confirm-password">Confirm Password:</label>
            <input
              type="password"
              name="confirm-password"
              id="confirm-password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="buttonPrimary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating Account..." : "Create Account"}
          </button>

          {error && <p role="alert">{error}</p>}
        </form>


        <p>
          Already have an account?{" "} 
          <Link href="/login" className="directLink">
            Log in
          </Link>
        </p>
      </main>
    </>
  );
}
