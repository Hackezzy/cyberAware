/**
 * Loads the shared nav/footer partials into any page that includes this
 * script, then wires up all their interactive behavior. This is the
 * plain-HTML equivalent of Astro's automatic <Nav /> / <Footer />
 * component reuse — since plain HTML has no built-in way to share markup
 * across files, this does it with a `fetch()` + injection at page-load
 * time instead.
 *
 * Ported directly from src/components/Nav.astro, including both bugs
 * that were found and fixed there — see the comments below at the exact
 * points those fixes apply.
 */

async function loadPartial(url, mountSelector) {
  const mount = document.querySelector(mountSelector);
  if (!mount) return;
  const response = await fetch(url);
  const html = await response.text();
  mount.outerHTML = html;
}

function normalizePath(path) {
  return path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;
}

function highlightCurrentNavLink() {
  const currentPath = normalizePath(window.location.pathname);
  document.querySelectorAll("[data-nav-href]").forEach((link) => {
    const linkPath = normalizePath(new URL(link.dataset.navHref, window.location.origin).pathname);
    const isCurrent = currentPath === linkPath || (linkPath !== "/" && currentPath.startsWith(linkPath));
    if (isCurrent) {
      link.classList.add("is-current");
      link.setAttribute("aria-current", "page");
    }
  });
}

function wireHamburgerMenu() {
  const toggle = document.getElementById("nav-toggle");
  const menu = document.getElementById("nav-menu");
  const toggleIconPath = document.querySelector("#nav-toggle-icon path");
  if (!toggle || !menu) return;

  const HAMBURGER_PATH = "M3 5h14M3 10h14M3 15h14";
  const CLOSE_PATH = "M5 5l10 10M15 5L5 15";

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    if (toggleIconPath) toggleIconPath.setAttribute("d", isOpen ? CLOSE_PATH : HAMBURGER_PATH);
  });
}

function wireExploreDropdown() {
  const exploreWrapper = document.getElementById("explore-wrapper");
  const exploreToggle = document.getElementById("explore-toggle");
  const exploreMenu = document.getElementById("explore-menu");
  if (!exploreWrapper || !exploreToggle || !exploreMenu) return;

  // Tracks whether the menu is open only because of a hover, as opposed to
  // a deliberate click/keydown. BUG #1 (found on the Astro version): a real
  // mouse click always fires "mouseenter" on its target immediately before
  // the "click" event itself — so hover opens the menu first, and a naive
  // click-to-toggle handler then sees it already open and instantly closes
  // it again, on the very click meant to use it. This flag is the fix.
  let openedViaHover = false;
  let closeTimer = null;

  function cancelPendingClose() {
    if (closeTimer !== null) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
  }

  function openMenu(viaHover) {
    cancelPendingClose();
    exploreMenu.hidden = false;
    exploreToggle.setAttribute("aria-expanded", "true");
    openedViaHover = Boolean(viaHover);
  }

  function closeMenu() {
    cancelPendingClose();
    exploreMenu.hidden = true;
    exploreToggle.setAttribute("aria-expanded", "false");
    openedViaHover = false;
  }

  // BUG #2 (also found on the Astro version): moving the mouse from the
  // toggle button down into the dropdown crosses a small gap where the
  // cursor is briefly over neither element, firing "mouseleave" and
  // closing the menu before a click can land. Fix: a short, cancellable
  // delay before a hover-triggered close actually happens. (The other
  // half of that original fix — using padding *inside* the dropdown's box
  // instead of a margin *outside* it — lives in components.css, since
  // that's a layout fix, not a JS one.)
  function scheduleClose() {
    cancelPendingClose();
    closeTimer = setTimeout(closeMenu, 250);
  }

  exploreToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    if (exploreMenu.hidden) {
      openMenu(false);
    } else if (openedViaHover) {
      cancelPendingClose();
      openedViaHover = false;
    } else {
      closeMenu();
    }
  });

  exploreWrapper.addEventListener("mouseenter", () => openMenu(true));
  exploreWrapper.addEventListener("mouseleave", scheduleClose);

  exploreWrapper.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
      exploreToggle.focus();
    }
  });

  exploreWrapper.addEventListener("focusout", (event) => {
    const nextFocus = event.relatedTarget;
    if (!nextFocus || !exploreWrapper.contains(nextFocus)) {
      closeMenu();
    }
  });

  document.addEventListener("click", (event) => {
    if (!exploreWrapper.contains(event.target)) {
      closeMenu();
    }
  });
}

function wireThemeToggle() {
  const themeToggle = document.getElementById("theme-toggle");
  if (!themeToggle) return;

  function resolvedTheme() {
    const explicit = document.documentElement.getAttribute("data-theme");
    if (explicit === "light" || explicit === "dark") return explicit;
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  function updateToggleButton(theme) {
    themeToggle.setAttribute("aria-pressed", String(theme === "light"));
    themeToggle.innerHTML =
      theme === "light"
        ? '<span aria-hidden="true">&#127769;</span> Dark'
        : '<span aria-hidden="true">&#9728;&#65039;</span> Light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("cyberaware:theme", theme);
    } catch {}
    updateToggleButton(theme);
  }

  themeToggle.addEventListener("click", () => {
    applyTheme(resolvedTheme() === "light" ? "dark" : "light");
  });

  updateToggleButton(resolvedTheme());
}

function wireArrowKeyBackForward() {
  const FORM_CONTROL_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

  document.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

    const target = event.target;
    if (FORM_CONTROL_TAGS.has(target.tagName) || target.isContentEditable) return;

    window.setTimeout(() => {
      if (event.defaultPrevented) return;
      if (event.key === "ArrowLeft") history.back();
      else history.forward();
    }, 0);
  });
}

async function initSite() {
  await loadPartial("/partials/nav.html", "#nav-mount");
  await loadPartial("/partials/footer.html", "#footer-mount");

  highlightCurrentNavLink();
  wireHamburgerMenu();
  wireExploreDropdown();
  wireThemeToggle();
  wireArrowKeyBackForward();

  const yearEl = document.getElementById("footer-year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
}

initSite();
