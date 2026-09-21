import { useEffect, useRef } from 'react';
import { animate, onScroll, stagger } from 'animejs';

/**
 * Respect the user's motion preference. When reduced, we never animate — the
 * CSS media query in landing.css also guarantees revealed content is visible.
 */
export function prefersReducedMotion(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) {
        return false;
    }

    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Reveal every `[data-reveal]` descendant once it scrolls into view, using
 * anime.js v4's `onScroll` observer. Children sharing a `[data-reveal-group]`
 * ancestor are staggered; everything else fades up individually.
 *
 * Returns a ref to attach to the page/section root.
 */
export function useRevealOnScroll<T extends HTMLElement = HTMLDivElement>() {
    const root = useRef<T>(null);

    useEffect(() => {
        const el = root.current;
        if (!el) {
            return;
        }

        const targets = Array.from(el.querySelectorAll<HTMLElement>('[data-reveal]'));

        // Reduced motion (or no targets): show immediately, skip animation.
        if (prefersReducedMotion() || targets.length === 0) {
            targets.forEach((t) => t.classList.add('is-revealed'));
            return;
        }

        const observers = targets.map((target) => {
            const group = target.closest<HTMLElement>('[data-reveal-group]');
            const siblings = group
                ? Array.from(group.querySelectorAll<HTMLElement>('[data-reveal]'))
                : [];
            const index = siblings.indexOf(target);
            const delay = index > 0 ? index * 70 : 0;

            return onScroll({
                target,
                enter: 'bottom top-=90',
                onEnter: () => {
                    target.classList.add('is-revealed');
                    animate(target, {
                        opacity: [0, 1],
                        y: [24, 0],
                        duration: 620,
                        delay,
                        ease: 'outCubic',
                    });
                },
            });
        });

        return () => {
            observers.forEach((o) => o.revert());
        };
    }, []);

    return root;
}

/**
 * Animate a numeric counter from 0 to `value` the first time it enters view.
 * Falls back to writing the final value instantly under reduced motion.
 */
export function useCounter(
    target: HTMLElement | null,
    value: number,
    { duration = 1400, suffix = '' }: { duration?: number; suffix?: string } = {},
) {
    useEffect(() => {
        if (!target) {
            return;
        }

        if (prefersReducedMotion()) {
            target.textContent = `${value}${suffix}`;
            return;
        }

        const proxy = { n: 0 };
        const observer = onScroll({
            target,
            enter: 'bottom top-=60',
            onEnter: () => {
                animate(proxy, {
                    n: value,
                    duration,
                    ease: 'outExpo',
                    onUpdate: () => {
                        target.textContent = `${Math.round(proxy.n).toLocaleString('id-ID')}${suffix}`;
                    },
                });
            },
        });

        return () => observer.revert();
    }, [target, value, duration, suffix]);
}

/**
 * Hero entrance + ambient mesh motion, played once on mount.
 * Returns a ref for the hero root.
 */
export function useHeroIntro<T extends HTMLElement = HTMLDivElement>() {
    const root = useRef<T>(null);

    useEffect(() => {
        const el = root.current;
        if (!el) {
            return;
        }

        const base = el.querySelectorAll<HTMLElement>('[data-hero]');
        if (prefersReducedMotion()) {
            base.forEach((t) => t.classList.add('is-revealed'));
            return;
        }

        const tl = animate(el.querySelectorAll<HTMLElement>('[data-hero]'), {
            opacity: [0, 1],
            y: [26, 0],
            duration: 700,
            delay: stagger(110, { start: 120 }),
            ease: 'outCubic',
            onBegin: () => {
                el.querySelectorAll<HTMLElement>('[data-hero]').forEach((t) =>
                    t.classList.add('is-revealed'),
                );
            },
        });

        const mesh = el.querySelector<HTMLElement>('.landing-mesh');
        let meshAnim: ReturnType<typeof animate> | null = null;
        if (mesh) {
            meshAnim = animate(mesh, {
                scale: [1.08, 1],
                duration: 2400,
                ease: 'outExpo',
            });
        }

        return () => {
            tl.revert();
            meshAnim?.revert();
        };
    }, []);

    return root;
}