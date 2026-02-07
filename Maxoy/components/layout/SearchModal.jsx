import React, { useEffect, useMemo, useState } from "react";
import { AiOutlineSearch } from "react-icons/ai";
import { useRouter } from "next/router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import styles from "./SearchModal.module.scss";
import { t } from "@/constants/i18n";
import { useStateContext } from "@/context/StateContext";
import { fetchSearchSuggestions } from "@/lib/searchService";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";

const SearchModal = ({ open, onClose }) => {
  const router = useRouter();
  const { language } = useStateContext();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setSuggestions([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      const items = await fetchSearchSuggestions(trimmed, 6, language);
      setSuggestions(items);
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, open, language]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push({ pathname: "/search", query: { q: trimmed } });
    onClose?.();
  };

  const handleSuggestionClick = (value) => {
    if (!value) return;
    router.push({ pathname: "/search", query: { q: value } });
    onClose?.();
  };

  const suggestionLabel = useMemo(
    () => ({
      product: t(language, "search.suggestionProduct"),
      category: t(language, "search.suggestionCategory"),
      tag: t(language, "search.suggestionTag"),
    }),
    [language]
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.overlay}
          onClick={onClose}
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }}
        >
          <motion.div
            className={styles.panel}
            onClick={(event) => event.stopPropagation()}
            initial={shouldReduceMotion ? false : { y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={shouldReduceMotion ? { y: 0, opacity: 1 } : { y: 10, opacity: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 26 }}
          >
            <div className={styles.header}>
              <h3>{t(language, "nav.searchTitle")}</h3>
              <button type="button" className={styles.close} onClick={onClose} aria-label={t(language, "nav.close")}>
                &times;
              </button>
            </div>
            <form className={styles.inputRow} onSubmit={handleSubmit}>
              <AiOutlineSearch />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t(language, "nav.searchPlaceholder")}
                autoFocus
              />
              <button type="submit">{t(language, "nav.searchSubmit")}</button>
            </form>
            <p className={styles.hint}>{t(language, "nav.searchHint")}</p>

            <div className={styles.suggestions}>
              {loading && <span className={styles.loading}>{t(language, "search.loading")}</span>}
              {!loading && suggestions.length === 0 && query.trim() && (
                <span className={styles.empty}>{t(language, "search.noSuggestions")}</span>
              )}
              {suggestions.map((item, index) => (
                <button
                  type="button"
                  key={`${item.type}-${item.value}-${index}`}
                  className={styles.suggestion}
                  onClick={() => handleSuggestionClick(item.value)}
                >
                  <span>{suggestionLabel[item.type] || item.type}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchModal;
