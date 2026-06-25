import { formatHash } from "./router.js";

export function createSidebar(container, manifest, onSelect) {
  container.innerHTML = "";
  const links = new Map();
  for (const lesson of manifest) {
    const a = document.createElement("a");
    a.href = formatHash(lesson.id);
    a.textContent = lesson.name;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      onSelect(lesson.id);
    });
    container.appendChild(a);
    links.set(lesson.id, a);
  }
  return {
    setActive(id) {
      for (const [lid, a] of links) a.classList.toggle("active", lid === id);
    },
  };
}
