export function scrollToSection(hash: string) {
  // Remove # if present
  const id = hash.replace('#', '');
  const element = document.getElementById(id);
  
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

export function handleAnchorClick(e: React.MouseEvent<HTMLAnchorElement>, href?: string) {
  if (!href) return;
  
  // Check if it's an anchor link (starts with #)
  if (href.startsWith('#')) {
    e.preventDefault();
    scrollToSection(href);
  }
}
