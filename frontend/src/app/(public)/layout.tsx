import PublicFooter from "@/components/PublicFooter";
import PublicHeader from "@/components/PublicHeader";
import styles from "./layout.module.css";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.page}>
      <PublicHeader />
      <main className={styles.main}>{children}</main>
      <PublicFooter />
    </div>
  );
}
