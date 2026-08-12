import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AuthForm from "@/components/marketing/AuthForm";
import PlatformStrip from "@/components/marketing/PlatformStrip";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { buildPageMetadata } from "@/lib/i18n/metadata";
import styles from "../auth.module.css";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/signup">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return buildPageMetadata(lang, "/signup", getDictionary(lang).seo.signup);
}

export default async function SignupPage({
  params,
}: PageProps<"/[lang]/signup">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const t = getDictionary(lang);
  const a = t.auth.signup;

  return (
    <section className={styles.section}>
      <div className={`wrap ${styles.grid}`}>
        <div className={styles.copy}>
          <span className="eyebrow">{a.eyebrow}</span>
          <h1 className={styles.title}>{a.title}</h1>
          <p className="lede">{a.lede}</p>
          <ul className={styles.points}>
            {a.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <div className={styles.platforms}>
            <PlatformStrip lang={lang} />
          </div>
        </div>

        <div className={styles.formCol}>
          <AuthForm
            mode="signup"
            lang={lang}
            auth={t.auth}
            form={t.contact.form}
          />
        </div>
      </div>
    </section>
  );
}
