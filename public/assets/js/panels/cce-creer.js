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
            <span class="cce-create-label">Numéro de téléphone</span>
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

  function validateCodeSecret(raw) {
    const value = String(raw || "").trim();
    if (!/^[1-9][0-9]{3}$/.test(value)) {
      throw new Error("Le code secret doit contenir 4 chiffres (de 1000 à 9999).");
    }

    if (/^(\d)\1{3}$/.test(value)) {
      throw new Error("Code secret trop faible : évitez les chiffres identiques.");
    }

    const commonPins = new Set(["1234", "4321", "1212", "1000", "2000", "2020"]);
    if (commonPins.has(value)) {
      throw new Error("Code secret trop faible : choisissez un code moins prévisible.");
    }

    let inc = true;
    let dec = true;
    for (let i = 1; i < value.length; i += 1) {
      const prev = Number(value[i - 1]);
      const current = Number(value[i]);
      if (current !== prev + 1) inc = false;
      if (current !== prev - 1) dec = false;
    }
    if (inc || dec) {
      throw new Error("Code secret trop faible : évitez les suites numériques.");
    }

    return value;
  }

  async function requestCodeFromSimulator(customer) {
    if (typeof BroadcastChannel === "undefined") {
      throw new Error("Le navigateur ne supporte pas la communication avec le simulateur.");
    }

    const requestId = `cce-code-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    const channel = new BroadcastChannel("unica-cce-scan");
    let cleanup = null;

    try {
      const responsePromise = new Promise((resolve) => {
        function onMessage(event) {
          const data = event?.data || null;
          if (!data || data.type !== "cce-code-response") return;
          if (String(data.request_id || "") !== requestId) return;
          channel.removeEventListener("message", onMessage);
          resolve(data);
        }

        cleanup = () => channel.removeEventListener("message", onMessage);
        channel.addEventListener("message", onMessage);
      });

      channel.postMessage({
        type: "cce-code-request",
        request_id: requestId,
        customer: {
          nom: String(customer?.nom || ""),
          prenom: String(customer?.prenom || ""),
        },
      });

      const swalPromise = Swal.fire({
        ...swalBase,
        icon: "info",
        title: "Le client choisit son code",
        html: `
          <div style="text-align:center;padding:8px 0;">
            <div style="margin-bottom:12px;">Saisie en attente sur le TPE du simulateur...</div>
            <div style="display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--accent,#6366f1);animation:cce-create-wait 1.2s ease-in-out infinite;"></div>
            <style>@keyframes cce-create-wait{0%,100%{opacity:.3}50%{opacity:1}}</style>
          </div>
        `,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: "Annuler",
        allowOutsideClick: false,
        allowEscapeKey: false,
      });

      const winner = await Promise.race([
        responsePromise.then((data) => ({ source: "simulator", data })),
        swalPromise.then(() => ({ source: "swal" })),
      ]);

      if (winner.source === "swal") {
        channel.postMessage({ type: "cce-code-cancel", request_id: requestId });
        return null;
      }

      Swal.close();

      const status = String(winner.data?.status || "").toLowerCase();
      if (status === "cancel") {
        return null;
      }
      if (status !== "ok") {
        const message =
          String(winner.data?.message || "").trim() ||
          "Saisie du code impossible depuis le simulateur.";
        throw new Error(message);
      }

      return validateCodeSecret(String(winner.data?.code_secret || ""));
    } finally {
      if (typeof cleanup === "function") cleanup();
      channel.close();
    }
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
      const codeSecret = await requestCodeFromSimulator({ nom, prenom });
      if (!codeSecret) {
        await showCancelled();
        return;
      }

      const confirmed = await askConfirmation();
      if (!confirmed) {
        await showCancelled();
        return;
      }

      const result = await createCce({
        nom,
        prenom,
        email,
        telephone,
        code_secret: codeSecret,
      });

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
  label: "Création CCE",
  icon: "CCE",
  sprint: 5,
  buildHTML() {
    return CceCreatePanel.buildHTML();
  },
  onMount(id) {
    CceCreatePanel.onMount(id);
  },
});
