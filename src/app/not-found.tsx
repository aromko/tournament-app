import Link from "next/link";

export default function NotFound() {
  return (
    <div>
      <h2>Not Found</h2>
      <p>Could not find requested resource</p>
      <Link className="text-primary-neon-green" href="/">
        Return Home
      </Link>
    </div>
  );
}
