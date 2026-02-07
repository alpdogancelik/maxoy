import "../styles/global.scss";
import "../styles/_utility.scss";
import { Layout } from "../components";
import { StateContext } from "../context/StateContext";
import { ThemeProvider } from "../context/ThemeContext";
import { Toaster } from "react-hot-toast";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import ErrorBoundary from "../components/feedback/ErrorBoundary";

function MyApp({ Component, pageProps, router }) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <ThemeProvider>
      <StateContext>
        <Layout>
          <Toaster />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={router.asPath}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.25, ease: "easeOut" }}
            >
              <ErrorBoundary>
                <Component {...pageProps} />
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </Layout>
      </StateContext>
    </ThemeProvider>
  );
}

export default MyApp;
