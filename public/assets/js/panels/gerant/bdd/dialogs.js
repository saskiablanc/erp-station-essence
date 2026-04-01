/** panels/gerant/bdd/dialogs.js */
(() => {
  const ns = (window.BddPanelModules = window.BddPanelModules || {});
  const {
    SCHEMAS,
    swalBase,
    esc,
    confirm,
    cancelled,
    ok,
    err,
    buildActionError,
    loadTable,
    invalidateLockedDates,
  } = ns;

async function openAdd(root) {
  const schema = SCHEMAS[root._bddTable || "produit"];
  if (!schema.add) {
    await Swal.fire({
      ...swalBase,
      icon: "info",
      title: "Ajout non disponible",
      html: "Cette table se gère via son panel dédié.",
      confirmButtonText: "Fermer",
    });
    return;
  }
  const formHtml = `<div class="bdd-form">${(schema.addFields || [])
    .map(
      (f) =>
        `<label class="bdd-form-row"><span class="bdd-form-label">${esc(f.label)}</span>
     <input id="${f.id}" class="bdd-form-input" type="${f.type}" placeholder="${esc(f.ph || "")}"></label>`,
    )
    .join("")}</div>`;

  const res = await Swal.fire({
    ...swalBase,
    title: "Ajouter une ligne",
    html: formHtml,
    showCancelButton: true,
    cancelButtonText: "Annuler",
    confirmButtonText: "Confirmer",
    allowOutsideClick: false,
    focusConfirm: false,
    didOpen: (p) => p.querySelector("input")?.focus(),
    preConfirm: () => {
      const vals = {};
      let hasEmpty = false;
      (schema.addFields || []).forEach((f) => {
        const v = document.getElementById(f.id)?.value.trim() || "";
        if (!v && f.type !== "password") hasEmpty = true;
        vals[f.f] = f.type === "number" ? parseFloat(v) || 0 : v;
      });
      if (hasEmpty) {
        Swal.showValidationMessage("Merci de renseigner tous les champs");
        return false;
      }
      return vals;
    },
  });

  if (!res.isConfirmed) {
    await cancelled();
    return;
  }

  let nextRef = "?";
  try {
    const rows = root._bddRows || [];
    if (rows.length) {
      const ids = rows.map((r) => Number(schema.rowKey(r))).filter(Boolean);
      if (ids.length) nextRef = Math.max(...ids) + 1;
    }
  } catch (_) {}

  const conf = await confirm(
    "Êtes vous sûr de vouloir ajouter cette ligne ?",
    nextRef,
  );
  if (!conf.isConfirmed) {
    await cancelled();
    return;
  }

  try {
    await schema.add(res.value);
    await loadTable(root);
    await ok("Ligne Ajoutée");
  } catch (e) {
    await err(buildActionError("add", schema, e), "Erreur ajout");
  }
}

// ════════════════════════════════════════════════════════
//  Popup modification
// ════════════════════════════════════════════════════════
async function openEdit(root, key) {
  const schema = SCHEMAS[root._bddTable || "produit"];
  const row = root.querySelector(
    `.bdd-row[data-key="${CSS.escape(String(key))}"]`,
  );
  if (!row) return;

  const cells = Array.from(row.querySelectorAll(".bdd-td"));
  const editFields = schema.editFields || [];

  // Pré-remplit avec les valeurs actuelles en trouvant la colonne par son champ
  const currentVals = {};
  editFields.forEach((ef) => {
    const colIdx = schema.cols.findIndex((c) => c.f === ef.f);
    currentVals[ef.f] = (cells[colIdx]?.textContent || "")
      .replace(/[€\u00a0]/g, "")
      .trim();
  });

  const formHtml = `<div class="bdd-form">
    <p class="bdd-confirm-ref" style="margin-bottom:10px">(Référence : Id ${esc(String(key))})</p>
    ${editFields
      .map(
        (ef) =>
          `<label class="bdd-form-row"><span class="bdd-form-label">${esc(ef.label)}</span>
       <input id="bdd-edit-${ef.f}" class="bdd-form-input" type="${ef.type || "text"}"
              ${ef.isPrice ? 'step="0.01"' : ""} value="${esc(currentVals[ef.f] || "")}"></label>`,
      )
      .join("")}
  </div>`;

  const res = await Swal.fire({
    ...swalBase,
    title: "Modifier la ligne",
    html: formHtml,
    showCancelButton: true,
    cancelButtonText: "Annuler",
    confirmButtonText: "Confirmer",
    allowOutsideClick: false,
    focusConfirm: false,
    didOpen: (p) => p.querySelector("input")?.focus(),
    preConfirm: () => {
      const vals = {};
      let hasEmpty = false;
      editFields.forEach((ef) => {
        const v =
          document.getElementById("bdd-edit-" + ef.f)?.value.trim() || "";
        if (!v && ef.type !== "password") hasEmpty = true;
        vals[ef.f] =
          ef.isPrice || ef.type === "number" ? parseFloat(v) || 0 : v;
      });
      if (hasEmpty) {
        Swal.showValidationMessage("Mauvaise Entrée — champs vides");
        return false;
      }
      return vals;
    },
  });

  if (!res.isConfirmed) {
    await cancelled();
    return;
  }

  const conf = await confirm(
    "Êtes vous sûr de vouloir modifier cette ligne ?",
    key,
  );
  if (!conf.isConfirmed) {
    await cancelled();
    return;
  }

  try {
    await schema.update(key, res.value);
    await loadTable(root);
    await ok("Ligne Modifiée");
  } catch (e) {
    // Si la journée est verrouillée, invalider le cache pour forcer le rechargement du visuel
    if (e.message && e.message.includes("validée")) invalidateLockedDates();
    await err(buildActionError("edit", schema, e), "Erreur modification");
    await loadTable(root);
  }
}

// ════════════════════════════════════════════════════════
//  Popup suppression
// ════════════════════════════════════════════════════════
async function openDelete(root, key) {
  const schema = SCHEMAS[root._bddTable || "produit"];
  const deleteMessage = schema.deleteCascadeHint
    ? `Êtes vous sûr de vouloir supprimer cette ligne ?\n${schema.deleteCascadeHint}`
    : "Êtes vous sûr de vouloir supprimer cette ligne ?";
  const conf = await confirm(deleteMessage, key);
  if (!conf.isConfirmed) {
    await cancelled();
    return;
  }
  try {
    await schema.del(key);
    await loadTable(root);
    if (schema.deleteCascadeHint) {
      await ok("Ligne Supprimée (avec dépendances)");
    } else {
      await ok("Ligne Supprimée");
    }
  } catch (e) {
    if (e.message && e.message.includes("validée")) invalidateLockedDates();
    await err(buildActionError("delete", schema, e), "Erreur suppression");
    await loadTable(root);
  }
}

// ════════════════════════════════════════════════════════
//  onMount
// ════════════════════════════════════════════════════════


  Object.assign(ns, { openAdd, openEdit, openDelete });
})();
