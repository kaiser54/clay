import styles from "./interface-pills.module.css";

type InterfacePillsProps = {
  names: string[];
  selected: string;
  onSelect: (name: string) => void;
};

export function InterfacePills({ names, selected, onSelect }: InterfacePillsProps) {
  if (names.length <= 1) return null;

  return (
    <div className={styles.ifaceSelector}>
      <span className={styles.ifaceLabel}>Generate</span>
      <div className={styles.ifacePills}>
        {names.map((name) => (
          <button
            key={name}
            type="button"
            className={`${styles.ifacePill} ${selected === name ? styles.ifacePillActive : ""}`}
            onClick={() => onSelect(name)}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
