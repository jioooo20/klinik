import { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';

/** True when the user prefers reduced motion (or matchMedia is unavailable). */
function prefersReducedMotion(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) {
        return false;
    }

    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Staggered entrance for auth screens: every `[data-auth]` element inside the
 * returned ref fades up on mount. Elements are made visible via the
 * `.is-revealed` class so the page stays usable even without animation.
 */
export function useAuthIntro<T extends HTMLElement = HTMLDivElement>() {
    const root = useRef<T>(null);

    useEffect(() => {
        const el = root.current;
        if (!el) {
            return;
        }

        const targets = Array.from(el.querySelectorAll<HTMLElement>('[data-auth]'));
        if (targets.length === 0) {
            return;
        }

        targets.forEach((t) => t.classList.add('is-revealed'));

        if (prefersReducedMotion()) {
            return;
        }

        const animation = animate(targets, {
            opacity: [0, 1],
            y: [18, 0],
            duration: 620,
            delay: stagger(90, { start: 80 }),
            ease: 'outCubic',
        });

        return () => {
            animation.revert();
        };
    }, []);

    return root;
}