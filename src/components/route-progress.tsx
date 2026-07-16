"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

/**
 * Slim top progress bar that appears during every route transition.
 *
 * Strategy:
 * - Intercept in-app <a> clicks to kick the bar to ~30-85% instantly (so the
 *   click feels immediate).
 * - When `usePathname` / `useSearchParams` finally update (nav complete),
 *   jump to 100% and fade out.
 * - Also expose `window.__routeProgress.start()` so programmatic navigations
 *   (via `router.push`) can trigger the bar from inside `useTransition` calls.
 */
function ProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const activeTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const settled = useRef(true);

  function clearTimers() {
    activeTimers.current.forEach(clearTimeout);
    activeTimers.current = [];
  }

  function start() {
    if (!settled.current) return; // already running
    settled.current = false;
    clearTimers();
    setVisible(true);
    setProgress(20);
    activeTimers.current.push(setTimeout(() => setProgress(45), 120));
    activeTimers.current.push(setTimeout(() => setProgress(70), 280));
    activeTimers.current.push(setTimeout(() => setProgress(88), 600));
  }

  function complete() {
    clearTimers();
    setProgress(100);
    settled.current = true;
    activeTimers.current.push(
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300),
    );
  }

  // Expose start() to the rest of the app.
  useEffect(() => {
    (window as unknown as { __routeProgress?: { start: () => void; complete: () => void } }).__routeProgress = {
      start,
      complete,
    };
  }, []);

  // Kick off on in-app link clicks.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;
      if (
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        anchor.getAttribute("rel")?.includes("external")
      )
        return;
      const href = anchor.getAttribute("href");
      if (!href) return;
      if (href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        try {
          const url = new URL(href, window.location.href);
          if (url.origin !== window.location.origin) return;
        } catch {
          return;
        }
      }
      if (href.startsWith("#")) return;
      // Same-origin nav — start.
      start();
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Complete when the route actually settles.
  useEffect(() => {
    if (settled.current) return;
    complete();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5"
    >
      <div
        className="h-full bg-gradient-to-r from-brand-500 via-brand-400 to-emerald-400 shadow-[0_0_8px_rgba(99,102,241,0.6)] transition-[width,opacity] duration-300 ease-out"
        style={{ width: `${progress}%`, opacity: progress === 100 ? 0 : 1 }}
      />
    </div>
  );
}

export function RouteProgress() {
  // useSearchParams needs a Suspense boundary during static rendering.
  return (
    <Suspense fallback={null}>
      <ProgressBarInner />
    </Suspense>
  );
}
