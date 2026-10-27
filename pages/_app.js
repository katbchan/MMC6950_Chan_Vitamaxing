
import "../styles/globals.css";
import Head from "next/head";

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link
          rel="stylesheet"
          href="https://use.typekit.net/bmf4kak.css"
        />
        <link
          rel="icon"
          type="image/png"
          href="/Vitamaxing_Submark.png"
        />
      </Head>

      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
