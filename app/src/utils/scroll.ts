export function scrollToSection(hash: string) {
  const id = hash.replace('#', '');
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

export function handleAnchorClick(e: React.MouseEvent<HTMLAnchorElement>, href?: string) {
  if (!href) return;
  if (href.startsWith('#')) {
    e.preventDefault();
    scrollToSection(href);
  }
}
