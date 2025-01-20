export function html2node(html: string) {
  const range = document.createRange();
  const fragment = range.createContextualFragment(html);
  return fragment;
}
