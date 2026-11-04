import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty-state">
      <span className="heading-decoration">✧</span>
      <h1>Denne luka finnes ikke.</h1>
      <p>La oss finne tilbake til noe fint.</p>
      <Link className="button primary" href="/">
        Til oversikten
      </Link>
    </div>
  );
}
