// assets/js/components/Reviews.js
/* ─────────────────────────────────────────────────────────
   Reviews section.
   Renders review cards + Trustindex badge + JSON-LD schema.
   Verbose logging so mount issues are visible in console.
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';
  const NS = (window.ITZone = window.ITZone || {});

  console.info('[IT Zone] Reviews: module booting...');

  const REVIEWS = [
    { name: 'Saleem Sarwar',   rating: 5, date: '12 months ago', text: 'Very nice laptop I am very impressed. I will recommend IT Zone to everyone looking for quality machines at fair prices.' },
    { name: 'Ammar Butt',      rating: 5, date: '12 months ago', text: 'I highly recommend IT Zone to anyone looking for quality laptops at fair prices. Hands down one of the best online shopping experiences I\'ve had in Pakistan. The dealing was clean and quick.' },
    { name: 'Zarar Khan',      rating: 5, date: '12 months ago', text: 'I recently purchased an HP ProBook from IT Zone and I\'m really satisfied. The product was exactly as described, well-packed, and delivered on time. The laptop works perfectly.' },
    { name: 'Harris Bhatti',   rating: 5, date: '1 year ago',    text: 'Highly recommend. Reasonable prices and good quality products every time.' },
    { name: 'Measum Zulfiqar', rating: 5, date: '1 year ago',    text: 'Very professional treatment. Bought an HP Z Firefly from them. Amazing quality & service for testing everything before the purchase.' },
    { name: 'Mohsin Ali',      rating: 5, date: '1 year ago',    text: 'Wide range of laptops. I recently bought 2 laptops — HP and Lenovo — and I am satisfied with the overall experience.' },
    { name: 'Arjmand Ismail',  rating: 5, date: '1 year ago',    text: 'Professionally dealing and the device is really in range of prices. Recommended.' },
    { name: 'Tanveer Fahad',   rating: 5, date: '1 year ago',    text: 'Excellent service and authentic products. The staff provided professional guidance in selecting the right laptop.' },
  ];

  function stars(rating) {
    let html = '';
    for (let i = 0; i < 5; i++) {
      const filled = i < rating;
      html += '<i data-lucide="star" class="' + (filled ? 'is-filled' : '') + '"></i>';
    }
    return html;
  }

  function reviewCard(r) {
    return (
      '<article class="review-card" role="listitem">' +
        '<header class="review-head">' +
          '<div class="review-avatar" aria-hidden="true">' +
            r.name.charAt(0).toUpperCase() +
          '</div>' +
          '<div class="review-meta">' +
            '<h3 class="review-name">' + r.name + '</h3>' +
            '<div class="review-stars" aria-label="' + r.rating + ' out of 5 stars">' +
              stars(r.rating) +
            '</div>' +
          '</div>' +
        '</header>' +
        '<blockquote class="review-text">' +
          '\u201C' + r.text + '\u201D' +
        '</blockquote>' +
        '<footer class="review-footer">' +
          '<span class="review-source">' +
            '<i data-lucide="badge-check"></i>' +
            '<span>Posted on Google</span>' +
          '</span>' +
          '<span class="review-date">' + r.date + '</span>' +
        '</footer>' +
      '</article>'
    );
  }

  function buildSchema() {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'IT Zone Electronics',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: String(REVIEWS.length),
        bestRating: '5',
        worstRating: '1',
      },
      review: REVIEWS.map(r => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: r.name },
        reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
        reviewBody: r.text,
      })),
    };
  }

  function template() {
    return (
      '<div class="reviews-header">' +
        '<div>' +
          '<h2 id="reviews-heading" class="section-title">What our customers say</h2>' +
          '<p class="section-subtitle mb-0">Verified reviews from real buyers.</p>' +
        '</div>' +

        '<div class="reviews-summary" role="status">' +
          '<div class="reviews-summary-score">' +
            '<span class="reviews-summary-value">4.9</span>' +
            '<div class="reviews-summary-stars" aria-label="4.9 out of 5 stars">' +
              stars(5) +
            '</div>' +
          '</div>' +
          '<div class="reviews-summary-meta">' +
            '<span class="reviews-summary-count">' + REVIEWS.length + ' verified reviews</span>' +
            '<span class="reviews-summary-badge">' +
              '<i data-lucide="badge-check"></i>' +
              'Verified by Trustindex' +
            '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="reviews-grid" role="list">' +
        REVIEWS.map(reviewCard).join('') +
      '</div>'
    );
  }

  function mount() {
    console.info('[IT Zone] Reviews.mount() called');
    const host = document.getElementById('reviews-slot');
    if (!host) {
      console.warn('[IT Zone] Reviews: no #reviews-slot found on this page.');
      return;
    }
    if (host.dataset.mounted === 'true') {
      console.info('[IT Zone] Reviews: already mounted.');
      return;
    }
    host.dataset.mounted = 'true';

    try {
      host.innerHTML = template();
      NS.renderIcons?.(host);
    } catch (e) {
      console.error('[IT Zone] Reviews: render failed.', e);
      return;
    }

    if (!document.getElementById('reviews-schema')) {
      const s = document.createElement('script');
      s.id = 'reviews-schema';
      s.type = 'application/ld+json';
      s.textContent = JSON.stringify(buildSchema());
      document.head.appendChild(s);
    }

    console.info('[IT Zone] Reviews: mounted ' + REVIEWS.length + ' reviews.');
  }

  NS.Reviews = { mount: mount, count: REVIEWS.length };
  console.info('[IT Zone] Reviews: module loaded ✓');
})();