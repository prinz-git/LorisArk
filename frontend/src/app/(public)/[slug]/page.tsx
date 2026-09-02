import Link from "next/link";
import { notFound } from "next/navigation";
import { footerLinkGroups, footerPages } from "@/lib/footer-pages";
import styles from "./page.module.css";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return Object.keys(footerPages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const page = footerPages[slug];
  if (!page) {
    return {};
  }
  return {
    title: `${page.title} | LorisArk`,
    description: page.summary,
  };
}

export default async function FooterInfoPage({ params }: PageProps) {
  const { slug } = await params;
  const page = footerPages[slug];

  if (!page) {
    notFound();
  }

  const currentGroup = footerLinkGroups.find((group) =>
    group.links.some((link) => link.href === `/${slug}`)
  );

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>{page.eyebrow}</p>
        <h1>{page.title}</h1>
        <p className={styles.summary}>{page.summary}</p>
      </section>

      <section className={styles.content}>
        <div className={styles.sections}>
          {page.sections.map((section) => (
            <article key={section.heading} className={styles.section}>
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
            </article>
          ))}
        </div>

        <aside className={styles.aside}>
          <p className={styles.asideTitle}>
            {currentGroup ? currentGroup.title : "LorisArk"}
          </p>
          <div className={styles.asideLinks}>
            {(currentGroup?.links ?? footerLinkGroups.flatMap((group) => group.links)).map(
              (link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={link.href === `/${slug}` ? styles.active : ""}
                >
                  {link.label}
                </Link>
              )
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
