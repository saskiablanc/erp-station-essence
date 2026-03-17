/** panels/cce-creer.js */
const CceCreatePanel = (() => {
  const swalBase = {
    customClass: {
      popup: "ticket-swal-popup",
      title: "ticket-swal-title",
      htmlContainer: "ticket-swal-text",
      confirmButton: "ticket-swal-btn",
      denyButton: "ticket-swal-btn",
      cancelButton: "ticket-swal-btn ticket-swal-btn-secondary",
    },
    buttonsStyling: false,
    reverseButtons: false,
    backdrop: "rgba(26, 26, 46, 0.45)",
  };

  function buildHTML() {
    return `
      <div class="cce-create-panel">

        <form class="cce-create-form" novalidate>
          <label class="cce-create-field">
            <span class="cce-create-label">Nom</span>
            <input
              class="cce-create-input"
              type="text"
              name="nom"
              placeholder="BACHOVA"
              autocomplete="family-name"
            />
          </label>

          <label class="cce-create-field">
            <span class="cce-create-label">Prénom</span>
            <input
              class="cce-create-input"
              type="text"
              name="prenom"
              placeholder="Camilia"
              autocomplete="given-name"
            />
          </label>

          <label class="cce-create-field">
            <span class="cce-create-label">Adresse mail</span>
            <input
              class="cce-create-input"
              type="email"
              name="email"
              placeholder="c.bachova@mail.com"
              autocomplete="email"
            />
          </label>

          <label class="cce-create-field">
            <span class="cce-create-label">Numéro de tel</span>
            <input
              class="cce-create-input"
              type="tel"
              name="telephone"
              placeholder="+21 7 26 03 20 05"
              autocomplete="tel"
            />
          </label>

          <button class="cce-create-submit" type="submit">Valider</button>
          <div class="cce-create-feedback" aria-live="polite"></div>
        </form>
      </div>
    `;
  }

  function setFeedback(form, message, isError = false) {
    const feedback = form.querySelector(".cce-create-feedback");
    if (!feedback) return;

    feedback.textContent = message;
    feedback.classList.toggle("visible", !!message);
    feedback.classList.toggle("error", !!message && isError);
  }

  async function askConfirmation() {
    const result = await Swal.fire({
      ...swalBase,
      icon: "question",
      title: "Confirmer la création de la carte CCE",
      showCancelButton: true,
      confirmButtonText: "Valider",
      cancelButtonText: "Annuler",
      allowOutsideClick: false,
    });

    return result.isConfirmed;
  }

  async function showCodeChoiceStep() {
    await Swal.fire({
      ...swalBase,
      icon: "info",
      title: "Le client choisit son code",
      timer: 3000,
      timerProgressBar: true,
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
    });
  }

  async function showCancelled() {
    await Swal.fire({
      ...swalBase,
      icon: "error",
      title: "Création CCE annulée",
      confirmButtonText: "Fermer",
    });
  }

  async function showSuccess(cce) {
    await Swal.fire({
      ...swalBase,
      icon: "success",
      title: "Création CCE terminée",
      html: `Carte #${cce.id_carte_CE} créée pour <strong>${cce.prenom} ${cce.nom}</strong>.`,
      confirmButtonText: "Fermer",
    });
  }

  async function showCreationError(message) {
    await Swal.fire({
      ...swalBase,
      icon: "error",
      title: "Création CCE impossible",
      html: message,
      confirmButtonText: "Fermer",
    });
  }

  async function createCce(payload) {
    return Requetes.creerCCE(payload);
  }

  async function onSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);
    const nom = String(data.get("nom") || "").trim();
    const prenom = String(data.get("prenom") || "").trim();
    const email = String(data.get("email") || "").trim();
    const telephone = String(data.get("telephone") || "").trim();

    if (!nom || !prenom || !email || !telephone) {
      setFeedback(form, "");
      Toast.warn("Merci de renseigner tous les champs");
      return;
    }

    const submitBtn = form.querySelector(".cce-create-submit");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "...";
    }

    setFeedback(form, "");

    try {
      await Requetes.checkCCEDuplicate({ nom, prenom, email, telephone });
      await showCodeChoiceStep();

      const confirmed = await askConfirmation();
      if (!confirmed) {
        await showCancelled();
        return;
      }

      const result = await createCce({ nom, prenom, email, telephone });

      const cce = result.cce || result;

      form.reset();
      setFeedback(form, "");
      Toast.ok(`CCE créée - code ${cce.code_secret}`);
      await showSuccess(cce);
      window.dispatchEvent(
        new CustomEvent("cce:created", {
          detail: { id_carte_CE: cce.id_carte_CE },
        }),
      );
    } catch (error) {
      const message = error.message || "Création CCE impossible";
      setFeedback(form, "");
      Toast.err(message);
      await showCreationError(message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Valider";
      }
    }
  }

  function onMount(id) {
    const root = document.getElementById("win-" + id);
    if (!root) return;

    const form = root.querySelector(".cce-create-form");
    if (!form) return;

    form.addEventListener("submit", onSubmit);
  }

  return { buildHTML, onMount };
})();

WM.register("cce_create", {
  label: "Créer CCE",
  icon: "CCE",
  sprint: 5,
  buildHTML() {
    return CceCreatePanel.buildHTML();
  },
  onMount(id) {
    CceCreatePanel.onMount(id);
  },
});
