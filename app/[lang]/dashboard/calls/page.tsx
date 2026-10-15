import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PageHeader from "@/components/app-shell/PageHeader";
import { call, currentStaff, sessionToken } from "@/lib/customer";
import { isLocale } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: "Calls",
  robots: { index: false, follow: false, nocache: true },
};

type Status = "open" | "voicemail" | "off";

interface ReviewslipLines {
  sales: Status;
  support: Status;
  phoneUrl: string;
  people: {
    id: number;
    name: string;
    email: string;
    you: boolean;
    onDuty: boolean;
    presence: "online" | "call" | "offline";
    sales: boolean;
    support: boolean;
  }[];
}

const STATUS: Record<Status, { text: string; tone: string }> = {
  open: { text: "Answering", tone: "var(--success)" },
  voicemail: { text: "Taking messages", tone: "var(--warning)" },
  off: { text: "Nobody answers yet", tone: "var(--muted-foreground)" },
};

/**
 * Reviewslip's own lines, for admins: Call Sales on the Contact page and Call
 * Support in the dashboard ring every admin on duty who takes that line.
 * Which lines each person takes is chosen on the phone itself.
 */
export default async function ReviewslipCallsPage({ params }: PageProps<"/[lang]/dashboard/calls">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  if (!(await currentStaff())) notFound();

  const token = await sessionToken();
  const data = await call<ReviewslipLines>("/voice/reviewslip", { token });

  const presence = (p: ReviewslipLines["people"][number]) =>
    p.presence === "call" ? "On a call" : p.onDuty ? (p.presence === "online" ? "On duty, phone open" : "On duty, phone closed") : "Off duty";

  return (
    <>
      <PageHeader title="Calls" sub="Reviewslip Sales and Support">
        <a className="btn btn-go" href="/api/phone" target="_blank" rel="noopener">
          Open the Phone
        </a>
      </PageHeader>
      <div className="page-body is-narrow">
        <section className="group-box" aria-labelledby="lines-title">
          <h2 id="lines-title">Lines</h2>
          <div className="admin-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Line</th>
                  <th>Rings From</th>
                  <th>Now</th>
                </tr>
              </thead>
              <tbody>
                {(["sales", "support"] as const).map((line) => (
                  <tr key={line}>
                    <td className="primary">{line === "sales" ? "Sales" : "Support"}</td>
                    <td>{line === "sales" ? "Call Sales on the Contact page" : "Call Support in the dashboard"}</td>
                    <td style={{ color: STATUS[data[line]].tone }}>{STATUS[data[line]].text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="group-box" aria-labelledby="people-title">
          <h2 id="people-title">Who Answers</h2>
          {data.people.length ? (
            <div className="admin-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Takes</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.people.map((p) => (
                    <tr key={p.id}>
                      <td className="primary">
                        {p.name}
                        {p.you ? " (you)" : ""}
                      </td>
                      <td>{[p.sales && "Sales", p.support && "Support"].filter(Boolean).join(", ") || "Neither"}</td>
                      <td>{presence(p)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ margin: 0, color: "var(--muted-foreground)" }}>
              No admin has opened the phone yet. Until someone does, the Call buttons stay hidden.
            </p>
          )}
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted-foreground)" }}>
            Every admin account can answer. Each person picks Sales, Support or both under Taking calls for on the
            phone.
          </p>
        </section>
      </div>
    </>
  );
}
