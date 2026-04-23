export const PRINT_CSS = `
@page { size: 1920px 1080px; margin: 0; }
@media print {
  html, body { background: #fff; }
  .deck-counter, .dd-review-toggle, .dd-review-panel { display: none !important; }
  .deck { position: static; display: block; }
  .sl {
    display: block !important;
    position: relative;
    left: 0 !important; top: 0 !important;
    transform: none !important;
    page-break-after: always;
    break-after: page;
    box-shadow: none;
  }
  .sl:last-child { break-after: auto; }
}
`;
