import { useState } from "react";
import styles from "./style.module.css";
import Link from "next/link";
import { useRouter } from "next/router";
import useLogout from "../../hooks/useLogout";

export default function Header(props) {
  const logout = useLogout();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const isSearchPage =
    router.pathname === "/" ||
    router.pathname.startsWith("/supplements");

  function navClass(isActive) {
    return isActive
      ? `${styles.navLink} ${styles.active}`
      : styles.navLink;
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className={styles.container}>
      <Link
        href="/"
        className={styles.logoLink}
        onClick={closeMenu}
      >
        <img
          src="/Vitamaxing_Logo.png"
          alt="Vitamaxing"
          className={styles.logo}
        />
      </Link>

      <button
        type="button"
        className={styles.menuToggle}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={menuOpen}
        aria-controls="main-navigation"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <nav
        id="main-navigation"
        aria-label="Main navigation"
        className={`${styles.nav} ${
          menuOpen ? styles.navOpen : ""
        }`}
      >
        <Link
          href="/"
          className={navClass(isSearchPage)}
          onClick={closeMenu}
        >
          Search Supplements
        </Link>

        {props.isLoggedIn ? (
          <>
            <Link
              href="/dashboard"
              className={navClass(
                router.pathname === "/dashboard"
              )}
              onClick={closeMenu}
            >
              My Supplements
            </Link>

            <button
              type="button"
              onClick={() => {
                closeMenu();
                logout();
              }}
              className={styles.logoutButton}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className={navClass(
                router.pathname === "/login"
              )}
              onClick={closeMenu}
            >
              Login
            </Link>

            <Link
              href="/signup"
              className={navClass(
                router.pathname === "/signup"
              )}
              onClick={closeMenu}
            >
              Create Account
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
