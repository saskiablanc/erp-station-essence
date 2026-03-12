/* panels/ticket_barcode.js - popup pavé numérique code-barres */
window.TicketBarcode = (() => {
  const MAX_LENGTH = 13;

  function formatDisplay(code) {
    const digits = String(code ?? "").replace(/\D/g, "").slice(0, MAX_LENGTH);
    const padded = (digits + "-------------").slice(0, MAX_LENGTH);
    return `${padded.slice(0, 4)} ${padded.slice(4, 8)} ${padded.slice(8, 13)}`;
  }

  async function prompt() {
    let code = "";
    let confirmed = false;

    await Swal.fire({
      html: `
        <div class="ticket-barcode-modal">
          <button type="button" class="ticket-barcode-close" data-barcode-close aria-label="Fermer">X</button>
          <div class="ticket-barcode-display-wrap">
            <div class="ticket-barcode-display" data-barcode-display>---- ---- -----</div>
          </div>
          <div class="ticket-barcode-error" data-barcode-error></div>
          <div class="ticket-barcode-keypad">
            <button type="button" data-barcode-key="1">1</button>
            <button type="button" data-barcode-key="2">2</button>
            <button type="button" data-barcode-key="3">3</button>
            <button type="button" data-barcode-key="4">4</button>
            <button type="button" data-barcode-key="5">5</button>
            <button type="button" data-barcode-key="6">6</button>
            <button type="button" data-barcode-key="7">7</button>
            <button type="button" data-barcode-key="8">8</button>
            <button type="button" data-barcode-key="9">9</button>
            <button type="button" data-barcode-action="back">\u2039</button>
            <button type="button" data-barcode-key="0">0</button>
            <button type="button" data-barcode-action="validate">\u2713</button>
          </div>
        </div>
      `,
      showConfirmButton: false,
      showCancelButton: false,
      allowOutsideClick: false,
      allowEscapeKey: true,
      customClass: {
        popup: "ticket-swal-popup ticket-swal-popup-barcode",
        htmlContainer: "ticket-swal-barcode-html",
      },
      didOpen: (popup) => {
        const display = popup.querySelector("[data-barcode-display]");
        const error = popup.querySelector("[data-barcode-error]");

        const refresh = () => {
          display.textContent = formatDisplay(code);
        };

        const close = () => {
          Swal.close();
        };

        const validate = () => {
          if (!code) {
            error.textContent = "Code-barres requis";
            return;
          }
          if (code.length !== MAX_LENGTH) {
            error.textContent = "Le code-barres doit contenir 13 chiffres";
            return;
          }
          confirmed = true;
          close();
        };

        popup.querySelector("[data-barcode-close]")?.addEventListener("click", close);

        popup.querySelectorAll("[data-barcode-key]").forEach((button) => {
          button.addEventListener("click", () => {
            if (code.length >= MAX_LENGTH) {
              error.textContent = "Maximum 13 chiffres";
              return;
            }
            code += String(button.dataset.barcodeKey || "");
            error.textContent = "";
            refresh();
          });
        });

        popup.querySelector('[data-barcode-action="back"]')?.addEventListener("click", () => {
          code = code.slice(0, -1);
          error.textContent = "";
          refresh();
        });

        popup.querySelector('[data-barcode-action="validate"]')?.addEventListener("click", validate);

        const onKeyDown = (event) => {
          if (event.key >= "0" && event.key <= "9") {
            event.preventDefault();
            if (code.length >= MAX_LENGTH) {
              error.textContent = "Maximum 13 chiffres";
              return;
            }
            code += event.key;
            error.textContent = "";
            refresh();
            return;
          }
          if (event.key === "Backspace") {
            event.preventDefault();
            code = code.slice(0, -1);
            error.textContent = "";
            refresh();
            return;
          }
          if (event.key === "Enter") {
            event.preventDefault();
            validate();
          }
        };

        popup.addEventListener("keydown", onKeyDown);
        popup.dataset.barcodeKeydownBound = "1";
        popup._barcodeKeyDownHandler = onKeyDown;
      },
      willClose: (popup) => {
        if (popup?._barcodeKeyDownHandler) {
          popup.removeEventListener("keydown", popup._barcodeKeyDownHandler);
          delete popup._barcodeKeyDownHandler;
        }
      },
    });

    return confirmed ? code : null;
  }

  return { prompt };
})();
