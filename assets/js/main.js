(function () {
  try {
    const storedTheme = localStorage.getItem("preferred-theme");
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = storedTheme || (prefersDark ? "dark" : "light");
    document.documentElement.dataset.theme = initialTheme;
    document.documentElement.style.colorScheme = initialTheme;
  } catch (error) {
    /* no-op */
  }
})();

// Smooth scrolling with dynamic offset for fixed nav
const navEl = document.querySelector("nav");
const themeToggle = document.getElementById("themeToggle");

const THEME_KEY = "preferred-theme";
const prefersDark = window.matchMedia
  ? window.matchMedia("(prefers-color-scheme: dark)")
  : null;

const getStoredTheme = () => {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch (error) {
    return null;
  }
};

const setStoredTheme = (value) => {
  try {
    localStorage.setItem(THEME_KEY, value);
  } catch (error) {
    /* no-op */
  }
};

const applyTheme = (theme) => {
  const next = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = next;
  if (document.body) {
    document.body.dataset.theme = next;
  }
  document.documentElement.style.colorScheme = next;
  if (themeToggle) {
    const isDark = next === "dark";
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute(
      "aria-label",
      isDark ? "Switch to light mode" : "Switch to dark mode"
    );
    themeToggle.innerHTML = isDark
      ? '<i class="fa-solid fa-sun"></i>'
      : '<i class="fa-solid fa-moon"></i>';
  }
};

const initialTheme =
  getStoredTheme() || (prefersDark && prefersDark.matches ? "dark" : "light");
applyTheme(initialTheme);
themeToggle?.addEventListener("click", () => {
  const currentTheme =
    document.documentElement.dataset.theme || document.body.dataset.theme;
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  setStoredTheme(nextTheme);
  applyTheme(nextTheme);
});

const handleSystemThemeChange = (event) => {
  if (!getStoredTheme()) {
    applyTheme(event.matches ? "dark" : "light");
  }
};

if (prefersDark?.addEventListener) {
  prefersDark.addEventListener("change", handleSystemThemeChange);
} else if (prefersDark?.addListener) {
  prefersDark.addListener(handleSystemThemeChange);
}

const scroll = new SmoothScroll('a[href*="#"]', {
  speed: 200,
  offset: () => navEl.offsetHeight || 0,
});

// IntersectionObserver to reveal elements on view (more efficient than scroll listener)
const ioOptions = { threshold: 0.15 };
const onIntersect = (entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
};
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(onIntersect, ioOptions);
  document
    .querySelectorAll(".skill-card, .project-card, #about-content")
    .forEach((el) => observer.observe(el));
}

// Active nav link + nav shadow + back-to-top visibility
const sections = [...document.querySelectorAll("section")];
const navLinks = [...document.querySelectorAll("nav a")];
const backToTop = document.getElementById("backToTop");

function setActiveLink() {
  const scrollPos = window.scrollY + (navEl.offsetHeight || 0) + 10;
  let currentId = sections[0]?.id;
  for (const sec of sections) {
    const top = sec.offsetTop;
    if (scrollPos >= top) currentId = sec.id;
  }
  navLinks.forEach((a) => {
    a.classList.toggle(
      "active",
      a.getAttribute("href") === `#${currentId}`
    );
    a.setAttribute(
      "aria-current",
      a.classList.contains("active") ? "page" : "false"
    );
  });
}

window.addEventListener(
  "scroll",
  () => {
    // nav shadow
    if (window.scrollY > 10) navEl.classList.add("scrolled");
    else navEl.classList.remove("scrolled");

    // active nav link
    setActiveLink();

    // back to top button
    if (window.scrollY > 600) backToTop.classList.add("show");
    else backToTop.classList.remove("show");
  },
  { passive: true }
);

backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// Existing scroll-based reveal as a fallback (kept, harmless if IO already ran)
const about = document.getElementById("about-content");
window.addEventListener(
  "scroll",
  () => {
    const rect = about.getBoundingClientRect();
    if (rect.top < window.innerHeight - 100) {
      about.classList.add("visible");
    }

    document.querySelectorAll(".project-card").forEach((card) => {
      const rectCard = card.getBoundingClientRect();
      if (rectCard.top < window.innerHeight - 50) {
        card.classList.add("visible");
      }
    });

    document.querySelectorAll(".skill-card").forEach((skill) => {
      const rectSkill = skill.getBoundingClientRect();
      if (rectSkill.top < window.innerHeight - 50) {
        skill.classList.add("visible");
      }
    });
  },
  { passive: true }
);

// Toast helper
const toast = document.getElementById("toast");
function showToast(msg = "Message sent! I’ll be in touch 🔥") {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

// Contact form mock + basic UX niceties
const contactForm = document.getElementById("contactForm");
const sendBtn = document.getElementById("sendBtn");

// Persist form inputs between refreshes (tiny UX candy)
const LS_KEY = "contactDraft";
const saveDraft = () => {
  const data = Object.fromEntries(new FormData(contactForm));
  localStorage.setItem(LS_KEY, JSON.stringify(data));
};
const loadDraft = () => {
  try {
    const data = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
    for (const [k, v] of Object.entries(data)) {
      const el = contactForm.elements[k];
      if (el) el.value = v;
    }
  } catch {}
};
contactForm.addEventListener("input", saveDraft);
loadDraft();

contactForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Honeypot check
  if (
    contactForm._botcheck &&
    contactForm._botcheck.value.trim() !== ""
  ) {
    return; // silently ignore bots
  }

  // Very light client-side validation
  const formData = new FormData(contactForm);
  const name = formData.get("name")?.trim();
  const email = formData.get("email")?.trim();
  const message = formData.get("message")?.trim();
  if (!name || !email || !message) {
    showToast("Please fill out all fields ✍️");
    return;
  }

  sendBtn.disabled = true;
  sendBtn.style.opacity = "0.7";

  try {
    // post to Formspree
    const res = await fetch("https://formspree.io/f/meozygld", {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      showToast("Message sent! I’ll be in touch 🔥");
      contactForm.reset();
      localStorage.removeItem(LS_KEY);
    } else {
      const data = await res.json().catch(() => ({}));
      showToast(data.error || "Submission failed — please try again");
    }
  } catch (err) {
    showToast("Network error — please try again");
  } finally {
    sendBtn.disabled = false;
    sendBtn.style.opacity = "1";
  }
});

// Copy email to clipboard
const emailText = document.getElementById("emailText");
emailText.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(emailText.textContent.trim());
    showToast("Email copied to clipboard 📋");
  } catch {
    showToast("Couldn’t copy email. Long-press to copy.");
  }
});

// Responsive nav toggle
(function () {
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.getElementById("primary-navigation");
  if (!navToggle || !navLinks) return;

  function closeNav() {
    navLinks.classList.remove("show");
    navToggle.setAttribute("aria-expanded", "false");
  }

  function openNav() {
    navLinks.classList.add("show");
    navToggle.setAttribute("aria-expanded", "true");
  }

  navToggle.addEventListener("click", () => {
    if (navLinks.classList.contains("show")) closeNav();
    else openNav();
  });

  // close when a link is clicked (good for single-page nav)
  navLinks.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      // small delay to allow SmoothScroll to calculate offset
      setTimeout(closeNav, 100);
    })
  );

  // ensure menu resets on resize to larger view
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      navLinks.classList.remove("show");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
})();

// Enhanced cursor following effect with particles and animations
(function () {
  const pointerQuery = window.matchMedia
    ? window.matchMedia("(pointer: fine)")
    : null;
  const reduceMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

  if (!pointerQuery || !pointerQuery.matches || reduceMotion?.matches) {
    return;
  }

  const orb = document.getElementById("cursorOrb");
  const cursorDot = document.getElementById("cursorDot");
  const cursorRing = document.getElementById("cursorRing");
  
  if (!orb || !cursorDot || !cursorRing) {
    return;
  }

  // Main cursor positions
  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;
  let rafId = 0;
  const ease = 0.14;

  // Ring positions (slower follow)
  let ringX = targetX;
  let ringY = targetY;
  const ringEase = 0.08;

  // Particle trail system
  const particles = [];
  const maxParticles = 12;
  let particleIndex = 0;

  // Create particle elements
  for (let i = 0; i < maxParticles; i++) {
    const particle = document.createElement('div');
    particle.className = 'cursor-particle';
    document.body.appendChild(particle);
    particles.push({
      element: particle,
      x: targetX,
      y: targetY,
      targetX: targetX,
      targetY: targetY,
      delay: i * 0.02
    });
  }

  const updatePosition = () => {
    // Update main orb
    currentX += (targetX - currentX) * ease;
    currentY += (targetY - currentY) * ease;
    orb.style.left = `${currentX}px`;
    orb.style.top = `${currentY}px`;

    // Update cursor dot (fast follow)
    cursorDot.style.left = `${targetX}px`;
    cursorDot.style.top = `${targetY}px`;

    // Update ring (slow follow)
    ringX += (targetX - ringX) * ringEase;
    ringY += (targetY - ringY) * ringEase;
    cursorRing.style.left = `${ringX}px`;
    cursorRing.style.top = `${ringY}px`;

    // Update particles with trailing effect
    particles.forEach((particle, index) => {
      const delay = 1 - (index / maxParticles) * 0.9;
      particle.x += (targetX - particle.x) * ease * delay;
      particle.y += (targetY - particle.y) * ease * delay;
      
      particle.element.style.transform = `translate(${particle.x}px, ${particle.y}px) translate(-50%, -50%)`;
      particle.element.style.opacity = 0.6 * (1 - index / maxParticles);
    });

    rafId = requestAnimationFrame(updatePosition);
  };

  const start = () => {
    if (rafId) {
      return;
    }
    rafId = requestAnimationFrame(updatePosition);
  };

  const stop = () => {
    if (!rafId) {
      return;
    }
    cancelAnimationFrame(rafId);
    rafId = 0;
  };

  document.addEventListener("pointermove", (event) => {
    if (event.isPrimary === false) {
      return;
    }
    targetX = event.clientX;
    targetY = event.clientY;
    
    orb.classList.add("active");
    cursorDot.classList.add("active");
    cursorRing.classList.add("active");
    particles.forEach(p => p.element.classList.add("active"));
    
    start();
  });

  document.addEventListener("pointerleave", () => {
    orb.classList.remove("active");
    cursorDot.classList.remove("active");
    cursorRing.classList.remove("active");
    particles.forEach(p => p.element.classList.remove("active"));
    stop();
  });

  // Click animation - expanding ring
  document.addEventListener("click", () => {
    cursorRing.classList.add("clicked");
    setTimeout(() => {
      cursorRing.classList.remove("clicked");
    }, 500);
  });

  // Handle interactive elements hover
  const interactiveElements = document.querySelectorAll('a, button, input, textarea, [role="button"]');
  interactiveElements.forEach(el => {
    el.addEventListener("mouseenter", () => {
      cursorRing.style.width = "50px";
      cursorRing.style.height = "50px";
      cursorDot.style.transform = "translate(-50%, -50%) scale(1.5)";
    });
    
    el.addEventListener("mouseleave", () => {
      cursorRing.style.width = "32px";
      cursorRing.style.height = "32px";
      cursorDot.style.transform = "translate(-50%, -50%) scale(1)";
    });
  });

  if (reduceMotion) {
    const handleReduceMotion = (event) => {
      if (event.matches) {
        orb.classList.remove("active");
        cursorDot.classList.remove("active");
        cursorRing.classList.remove("active");
        particles.forEach(p => {
          p.element.classList.remove("active");
          p.element.remove();
        });
        stop();
      } else {
        currentX = targetX;
        currentY = targetY;
        ringX = targetX;
        ringY = targetY;
      }
    };

    if (reduceMotion.addEventListener) {
      reduceMotion.addEventListener("change", handleReduceMotion);
    } else if (reduceMotion.addListener) {
      reduceMotion.addListener(handleReduceMotion);
    }
  }
})();

// Scroll Progress Indicator on Scrollbar
(function() {
  const updateScrollProgress = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollPercent = (scrollTop / scrollHeight) * 100;
    
    // Update the progress indicator height
    document.body.style.setProperty('--scroll-progress', `${scrollPercent}%`);
  };

  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  updateScrollProgress(); // Initial call
})();
