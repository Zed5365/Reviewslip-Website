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
}: PageProps<"/[lang]/login">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return buildPageMetadata(lang, "/login", getDictionary(lang).seo.login);
}

export default async function LoginPage({
  params,
}: PageProps<"/[lang]/login">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const t = getDictionary(lang);
  const a = t.auth.login;

  return (
    <section className={styles.section}>
      <div className={`wrap ${styles.grid}`}>
        <div className={styles.copy}>
          <span className="eyebrow">{a.eyebrow}</span>
          <h1 className={styles.title}>{a.title}</h1>
          <p className="lede">{a.lede}</p>
          <div className={styles.platforms}>
            <PlatformStrip lang={lang} />
          </div>
        </div>

        <div className={styles.formCol}>
          <AuthForm
            mode="login"
            lang={lang}
            auth={t.auth}
            form={t.contact.form}
          />
        </div>
      </div>
    </section>
  );
}
