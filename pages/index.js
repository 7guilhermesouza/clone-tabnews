import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>Site em construção</title>
        <meta charSet="UTF-8" />
      </Head>
      <div className="rule-top"></div>
      <span className="kicker">— Em breve</span>
      <h1>
        Site em
        <br />
        construção
      </h1>
      <div className="bar"></div>
      <p>Uma nova versão está a caminho.</p>
      <div className="rule-bottom"></div>
    </>
  );
}
