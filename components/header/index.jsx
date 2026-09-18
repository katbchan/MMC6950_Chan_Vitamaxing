import styles from "./style.module.css";
import Link from "next/link";
import useLogout from "../../hooks/useLogout";

export default function Header(props) {
  const logout = useLogout();

  return (
    <header className={styles.container}>
      <p>
        <Link href="/">Vitamaxing</Link>
      </p>

      <nav>
        <Link href="/">Home</Link>

        {props.isLoggedIn ? (
          <>
            <Link href="/dashboard">My Supplements</Link>
            <span onClick={logout} style={{ cursor: "pointer" }}>
              Logout
            </span>
          </>
        ) : (
          <>
            <Link href="/login">Login</Link>
            <Link href="/signup">Create Account</Link>
          </>
        )}
      </nav>
    </header>
  );
}