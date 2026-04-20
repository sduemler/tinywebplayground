import { useState } from "react";
import { CATEGORIES, getBarWidth, type Category, type MaintenanceItem } from "./data";
import styles from "./HumanMaintenanceGuide.module.css";

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="4 6 8 10 12 6" />
    </svg>
  );
}

function CategorySection({
  category,
  isOpen,
  onToggle,
}: {
  category: Category;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const listId = `category-list-${category.id}`;

  return (
    <div className={styles.category}>
      <button
        className={styles.categoryHeader}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={listId}
      >
        <span className={styles.categoryEmoji} aria-hidden="true">
          {category.emoji}
        </span>
        <span className={styles.categoryName}>{category.name}</span>
        <span className={styles.itemCount}>{category.items.length} items</span>
        <ChevronIcon
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
        />
      </button>

      <div
        id={listId}
        className={`${styles.itemList} ${isOpen ? styles.itemListOpen : ""}`}
      >
        <div className={styles.itemListInner}>
          <ul className={styles.items}>
            {category.items.map((item: MaintenanceItem, i: number) => (
              <li key={i} className={styles.item}>
                <div
                  className={styles.barFill}
                  style={{ width: `${getBarWidth(item, category.items)}%` }}
                  aria-hidden="true"
                />
                <span className={styles.taskName}>{item.task}</span>
                <span className={styles.intervalBadge}>{item.interval}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function HumanMaintenanceGuide() {
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    () => new Set<string>()
  );

  function toggleCategory(id: string) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className={styles.container}>
      <p className={styles.intro}>
        How often should you actually do the things that keep life running? This is a reference guide — not personalized advice. Intervals are general guidelines; your situation may vary.
      </p>
      {CATEGORIES.map((category) => (
        <CategorySection
          key={category.id}
          category={category}
          isOpen={openCategories.has(category.id)}
          onToggle={() => toggleCategory(category.id)}
        />
      ))}
    </div>
  );
}
