"use client";

import Link from "next/link";
import DemoSlip from "@/components/marketing/DemoSlip";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import inner from "../inner.module.css";

export default function HowItWorksPage() {
  const { t } = useLocale();

  return (
    <>
      <header className={inner.header}>
        <div className={`wrap ${inner.headerInner}`}>
          <span className="eyebrow">{t.how.eyebrow}</span>
          <h1 className={inner.h1}>{t.how.title}</h1>
          <p className="lede">{t.how.lede}</p>
        </div>
      </header>

      <section className="section">
        <div
          className="wrap"
          style={{
            display: "grid",
            gap: "3rem",
            gridTemplateColumns: "1fr",
            alignItems: "start",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {t.how.steps.map((s, i) => (
              <div
                key={s.title}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: "1.25rem",
                  alignItems: "start",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--display)",
                    fontSize: "2rem",
                    color: "var(--jade)",
                    opacity: 0.7,
                    minWidth: "2.5rem",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3
                    style={{
                      fontFamily: "var(--ui)",
                      fontWeight: 600,
                      fontSize: "1.15rem",
                      color: "var(--cream)",
                      marginBottom: "0.35rem",
                    }}
                  >
                    {s.title}
                  </h3>
                  <p style={{ color: "var(--cream-soft)" }}>{s.body}</p>
                </div>
              </div>
            ))}
            <Link
              href="/contact"
              className="btn btn-go"
              style={{ alignSelf: "flex-start", marginTop: "0.5rem" }}
            >
              {t.common.getInTouch}
            </Link>
          </div>

          <div className={inner.demoWrap}>
            <DemoSlip autoStart />
            <p className={inner.demoNote}>{t.how.demoNote}</p>
          </div>
        </div>
      </section>
    </>
  );
}
