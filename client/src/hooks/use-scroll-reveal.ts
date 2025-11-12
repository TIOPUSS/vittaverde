import { useEffect, useRef } from 'react';

export function useScrollReveal<T extends HTMLElement>(options = {}) {
  const ref = useRef<T>(null);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
        ...options,
      }
    );

    const children = element.querySelectorAll('.reveal');
    children.forEach((child, index) => {
      (child as HTMLElement).style.transitionDelay = `${index * 0.1}s`;
      observer.observe(child);
    });

    return () => {
      children.forEach((child) => observer.unobserve(child));
    };
  }, []);

  return ref;
}
