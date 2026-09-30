import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * The header every screen in the app gets (05-frontend.md, Page header).
 *
 * Back, then two title lines — always two, so the header is the same 56px on
 * every screen and moving between them never shifts the page. The second line
 * says what the screen is showing: the venue on a dashboard, a summary of the
 * record on an Edit View.
 *
 * `children` is the action toolbar on the right. A screen puts at most one
 * primary button there.
 */
export default function PageHeader({
  title,
  sub,
  back,
  children,
}: {
  title: string;
  /** The second line. Required: a blank one would collapse the header's height. */
  sub: string;
  /** Where Back goes. A List View's Back goes to the dashboard above it. */
  back?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="page-header">
      {back ? (
        <Link href={back} className="icon-btn" aria-label="Back" title="Back">
          <ArrowLeft size={16} aria-hidden="true" />
        </Link>
      ) : null}

      <div className="page-title">
        <h1>{title}</h1>
        <span className="page-sub" title={sub}>
          {sub}
        </span>
      </div>

      {children ? <div className="page-actions">{children}</div> : null}
    </header>
  );
}
