import { useEffect } from 'react';

export default function useScrollReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('vis');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.rev').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}
