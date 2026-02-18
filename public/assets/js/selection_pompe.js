document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".carburant-card");
  if (!cards.length) return;

  cards.forEach((card) => {
    const radio = card.querySelector('input[type="radio"]');
    if (radio && radio.checked) {
      card.classList.add("is-selected");
    }
  });

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const radio = card.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = true;
      }

      cards.forEach((item) => item.classList.remove("is-selected"));
      card.classList.add("is-selected");
    });
  });
});
