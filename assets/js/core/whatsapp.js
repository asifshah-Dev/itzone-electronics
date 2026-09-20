// assets/js/core/whatsapp.js
/* ─────────────────────────────────────────────────────────
   WhatsApp order helper.
   Builds deep-link URLs with prefilled product messages.
   No product link is included in the message.
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';
  const NS = (window.ITZone = window.ITZone || {});

  const PHONE = '923265974741';   /* international, no + */

  function formatPKR(n) {
    return 'PKR ' + new Intl.NumberFormat('en-PK').format(Number(n) || 0);
  }

  function specLine(item) {
    const parts = [];
    if (item.cpu && item.gen) parts.push(item.cpu + ' ' + item.gen + ' Gen');
    else if (item.cpu)        parts.push(item.cpu);
    if (item.ram)             parts.push(item.ram + 'GB RAM');
    if (item.ssd)             parts.push(item.ssd + 'GB SSD');
    if (item.hdd)             parts.push(item.hdd);
    if (item.resolution)      parts.push(item.resolution);
    if (item.size)            parts.push(item.size);
    return parts.join(' · ');
  }

  /* Short message for card "Order" buttons — no product URL */
  function shortMessage(item) {
    const lines = [
      'Hi IT Zone! I want to order:',
      '',
      '\u2022 ' + item.brand + ' ' + item.model,
      '\u2022 Price: ' + formatPKR(item.price),
    ];
    const specs = specLine(item);
    if (specs) lines.push('\u2022 ' + specs);
    lines.push('');
    lines.push('Please confirm availability and delivery.');
    return lines.join('\n');
  }

  /* Longer message for the product detail page — no product URL */
  function detailMessage(item) {
    const lines = [
      'Hi IT Zone! I want to order this product:',
      '',
      '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501',
      item.brand + ' ' + item.model,
      '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501',
      '',
      'Price: ' + formatPKR(item.price),
    ];

    if (item.cpu)        lines.push('Processor: ' + item.cpu + (item.gen ? ' ' + item.gen + ' Gen' : ''));
    if (item.ram)        lines.push('RAM: ' + item.ram + ' GB');
    if (item.ssd)        lines.push('Storage: ' + item.ssd + ' GB SSD');
    if (item.hdd)        lines.push('Storage: ' + item.hdd);
    if (item.gpu)        lines.push('Graphics: ' + item.gpu);
    if (item.resolution) lines.push('Resolution: ' + item.resolution);
    if (item.size)       lines.push('Size: ' + item.size);
    if (item.extras)     lines.push('Notes: ' + item.extras);

    lines.push('');
    lines.push('Please confirm availability and delivery.');
    return lines.join('\n');
  }

  function genericMessage(context) {
    const lines = ['Hi IT Zone!'];
    if (context) lines.push(context);
    lines.push('');
    lines.push('Please share your latest stock and prices.');
    return lines.join('\n');
  }

  function buildUrl(message) {
    return 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(message || '');
  }

  function productOrderUrl(item) {
    return buildUrl(shortMessage(item));
  }

  function productDetailUrl(item) {
    return buildUrl(detailMessage(item));
  }

  function genericUrl(context) {
    return buildUrl(genericMessage(context));
  }

  NS.WhatsApp = {
    PHONE: PHONE,
    buildUrl: buildUrl,
    shortMessage: shortMessage,
    detailMessage: detailMessage,
    productUrl: productOrderUrl,
    productDetailUrl: productDetailUrl,
    genericUrl: genericUrl,
  };
})();