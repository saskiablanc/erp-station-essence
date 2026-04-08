/** panels/gerant/bdd/schemas.js */
(() => {
  const ns = (window.BddPanelModules = window.BddPanelModules || {});
  const parts = ns.schemaParts || {};

  const SCHEMAS = {
    ...(parts.catalog || {}),
    ...(parts.cce || {}),
    ...(parts.transactions || {}),
    ...(parts.reappro || {}),
    ...(parts.operations || {}),
  };

  const GROUPS = Object.entries(SCHEMAS).map(([id, s]) => ({
    id,
    label: s.label,
    short: s.short || s.label,
  }));

  Object.assign(ns, { SCHEMAS, GROUPS });
})();
