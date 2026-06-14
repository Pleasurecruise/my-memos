export function applyTheme(dark: boolean, button?: HTMLElement | null, duration = 500) {
  const root = document.documentElement;

  if (!button || typeof document.startViewTransition !== "function") {
    const s = document.createElement("style");
    s.textContent = "*, *::before, *::after { transition: none !important }";
    document.head.appendChild(s);
    root.classList.toggle("dark", dark);
    void root.offsetWidth;
    requestAnimationFrame(() => s.remove());
    return;
  }

  const { top, left, width, height } = button.getBoundingClientRect();
  const cx = left + width / 2;
  const cy = top + height / 2;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const maxR = Math.hypot(Math.max(cx, vw - cx), Math.max(cy, vh - cy));

  root.style.setProperty("--vt-duration", `${duration}ms`);

  const transition = document.startViewTransition(() => {
    root.classList.toggle("dark", dark);
  });

  transition.ready.then(() => {
    root.animate(
      {
        clipPath: [`circle(0px at ${cx}px ${cy}px)`, `circle(${maxR}px at ${cx}px ${cy}px)`],
      },
      {
        duration,
        easing: "ease-in-out",
        fill: "forwards",
        pseudoElement: "::view-transition-new(root)",
      },
    );
  });

  transition.finished.finally(() => {
    root.style.removeProperty("--vt-duration");
  });
}
