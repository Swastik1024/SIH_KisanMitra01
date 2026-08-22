import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/globals.css';
import useAuthStore from '../store/authStore';
import { LanguageProvider } from '../context/LanguageContext';
import { Toaster } from 'react-hot-toast';

const morphVariants = {
  initial: {
    opacity: 0,
    scale: 0.92,
    borderRadius: '36px',
    filter: 'blur(8px)',
  },
  animate: {
    opacity: 1,
    scale: 1,
    borderRadius: '0px',
    filter: 'blur(0px)',
  },
  exit: {
    opacity: 0,
    scale: 1.06,
    borderRadius: '36px',
    filter: 'blur(8px)',
  },
};

const morphSpring = {
  type: 'spring',
  stiffness: 220,
  damping: 24,
  mass: 0.85,
};

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const hydrate = useAuthStore((state) => state.hydrate);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    hydrate();
    setMounted(true);
  }, [hydrate]);

  return (
    <LanguageProvider>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={router.asPath}
          variants={morphVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={morphSpring}
          style={{ width: '100%', minHeight: '100vh', overflowX: 'hidden' }}
        >
          <Component {...pageProps} />
        </motion.div>
      </AnimatePresence>
      {mounted && <Toaster position="bottom-center" />}
    </LanguageProvider>
  );
}