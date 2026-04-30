const revealItems = document.querySelectorAll("[data-reveal]");
const scrollTopButton = document.getElementById("scrollTopButton");

if (revealItems.length) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  }, { threshold: 0.18 });

  revealItems.forEach((item) => revealObserver.observe(item));
}

if (scrollTopButton) {
  const toggleScrollButton = () => {
    const shouldShow = window.scrollY > 500;
    scrollTopButton.hidden = !shouldShow;
    scrollTopButton.classList.toggle("is-visible", shouldShow);
  };

  window.addEventListener("scroll", toggleScrollButton);
  toggleScrollButton();

  scrollTopButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
