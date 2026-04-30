const searchInput = document.getElementById("siteSearchInput");
const searchButton = document.getElementById("siteSearchButton");
const searchFeedback = document.getElementById("searchFeedback");
const searchSuggestions = document.getElementById("searchSuggestions");

const searchTargets = [
  { terms: ["home", "main", "homepage"], url: "index.html", label: "Home" },
  { terms: ["filters", "all filters", "effects", "tools"], url: "allfilters.html", label: "All Filters" },
  { terms: ["contrast", "increase contrast"], url: "contrast.html", label: "Contrast" },
  { terms: ["brightness", "bright", "lighten"], url: "Brightness.html", label: "Brightness" },
  { terms: ["blur", "blurring", "smooth"], url: "blurring.html", label: "Blurring" },
  { terms: ["sharpen", "sharpening", "clear"], url: "sharpening.html", label: "Sharpening" },
  { terms: ["noise", "noise cancellation", "denoise", "remove noise"], url: "Noisecancellation.html", label: "Noise Cancellation" },
  { terms: ["services", "features"], url: "#services", label: "Services" },
  { terms: ["contact", "help"], url: "#contact", label: "Contact" }
];

if (searchInput && searchButton) {
  const navigateToMatch = (query) => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      showFeedback("Type a word like contrast, blur, filters, or contact.");
      renderSuggestions([]);
      return;
    }

    const match = findMatches(normalized)[0];

    if (!match) {
      showFeedback(`No result for "${normalized}". Try contrast, brightness, blur, sharpen, or noise.`);
      renderSuggestions([]);
      return;
    }

    hideFeedback();
    renderSuggestions([]);
    window.location.href = match.url;
  };

  searchButton.addEventListener("click", () => navigateToMatch(searchInput.value));

  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      navigateToMatch(searchInput.value);
    }
  });

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
      hideFeedback();
      renderSuggestions([]);
      return;
    }

    renderSuggestions(findMatches(query).slice(0, 4));
  });

  document.addEventListener("click", (event) => {
    if (!searchSuggestions || !searchInput) {
      return;
    }

    if (!searchSuggestions.contains(event.target) && event.target !== searchInput) {
      renderSuggestions([]);
    }
  });
}

function findMatches(query) {
  return searchTargets.filter((target) =>
    target.terms.some((term) => term.includes(query) || query.includes(term))
  );
}

function renderSuggestions(matches) {
  if (!searchSuggestions) {
    return;
  }

  if (!matches.length) {
    searchSuggestions.hidden = true;
    searchSuggestions.innerHTML = "";
    return;
  }

  searchSuggestions.hidden = false;
  searchSuggestions.innerHTML = matches
    .map((match) => `<button class="suggestion-item" type="button" data-url="${match.url}">${match.label}</button>`)
    .join("");

  searchSuggestions.querySelectorAll(".suggestion-item").forEach((button) => {
    button.addEventListener("click", () => {
      window.location.href = button.dataset.url;
    });
  });
}

function showFeedback(message) {
  if (!searchFeedback) {
    return;
  }

  searchFeedback.textContent = message;
  searchFeedback.hidden = false;
}

function hideFeedback() {
  if (!searchFeedback) {
    return;
  }

  searchFeedback.hidden = true;
  searchFeedback.textContent = "";
}
