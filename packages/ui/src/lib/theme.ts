export function applyTheme(dark: boolean) {
  const s = document.createElement("style");
  s.textContent = "*, *::before, *::after { transition: none !important }";
  document.head.appendChild(s);
  document.documentElement.classList.toggle("dark", dark);
  void document.documentElement.offsetWidth;
  requestAnimationFrame(() => s.remove());
}
