import styles from "./app-header.module.css";

export function AppHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <span className={styles.logo}>Clay</span>
        <span className={styles.tagline}>TypeScript → realistic mock data</span>
      </div>
      <kbd className={styles.shortcut}>⌘ Enter</kbd>
    </header>
  );
}
