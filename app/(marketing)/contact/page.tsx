"use client";

import DemoSlip from "@/components/marketing/DemoSlip";
import { CONTACT_EMAIL, CONTACT_MAILTO } from "@/lib/site";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import inner from "../inner.module.css";

export default function ContactPage() {
  const { t } = useLocale();
  const c = t.contact;

  return (
    <>
      <header className={inner.header}>
        <div className={`wrap ${inner.headerInner}`}>
          <span className="eyebrow">{c.eyebrow}</span>
          <h1 className={inner.h1}>{c.title}</h1>
          <p className="lede">{c.lede}</p>
        </div>
      </header>

      <section className="section">
        <div
          className="wrap"
          style={{
            display: "grid",
            gap: "3rem",
            gridTemplateColumns: "1fr",
            alignItems: "center",
          }}
        >
          <div className={inner.prose} style={{ margin: 0 }}>
            <h2>{c.h1}</h2>
            <p>{c.p1}</p>
            <p>
              <a href={CONTACT_MAILTO} className="btn btn-go">
                {c.button.replace("{email}", CONTACT_EMAIL)}
              </a>
            </p>
            <div className={inner.callout}>
              <strong>{c.calloutLead}</strong> {c.callout}
            </div>
          </div>

          <div className={inner.demoWrap}>
            <DemoSlip venue={c.demoVenue} />
            <p className={inner.demoNote}>{c.demoNote}</p>
          </div>
        </div>
      </section>
    </>
  );
}
