// assets/js/components/SocialSidebar.js
/* ─────────────────────────────────────────────────────────
   Fixed social sidebar — right edge, desktop only.
   Each icon is colored by brand; hovering reveals the
   platform name on the LEFT side of the icon.
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';
  const NS = (window.ITZone = window.ITZone || {});

  /* ── Platforms with brand colors ──────────────────────── */
  const PLATFORMS = [
    {
      name: 'Facebook',
      href: 'https://facebook.com/',
      icon: 'facebook',
      bg: '#1877F2',
      label: 'Like on Facebook'
    },
    {
      name: 'Instagram',
      href: 'https://instagram.com/',
      icon: 'instagram',
      bg: 'linear-gradient(45deg, #F58529 0%, #DD2A7B 40%, #8134AF 70%, #515BD4 100%)',
      label: 'Follow on Instagram'
    },
    {
      name: 'YouTube',
      href: 'https://youtube.com/',
      icon: 'youtube',
      bg: '#FF0000',
      label: 'Watch on YouTube'
    },
    {
      name: 'TikTok',
      href: 'https://tiktok.com/',
      icon: 'tiktok',
      bg: '#000000',
      label: 'Follow on TikTok'
    }
  ];

  /* ── Inline SVG icons ──────────────────────────────────── */
  function brandIcon(name) {
    switch (name) {
      case 'facebook':
        return (
          '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">' +
            '<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>' +
          '</svg>'
        );
      case 'instagram':
        return (
          '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">' +
            '<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>' +
          '</svg>'
        );
      case 'youtube':
        return (
          '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">' +
            '<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>' +
          '</svg>'
        );
      case 'tiktok':
        return (
          '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">' +
            '<path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z"/>' +
          '</svg>'
        );
      default:
        return '';
    }
  }

  function template() {
    return PLATFORMS.map(function (p) {
      const isGradient = p.bg.indexOf('gradient') !== -1;
      const styleAttr = isGradient
        ? 'style="--social-bg-image: ' + p.bg + ';"'
        : 'style="--social-bg-color: ' + p.bg + ';"';

      /* NO data-cursor attribute — default cursor stays */
      return (
        '<a class="social-side-item' + (isGradient ? ' has-gradient' : '') + '"' +
        '   href="' + p.href + '"' +
        '   target="_blank" rel="noopener noreferrer"' +
        '   aria-label="' + p.label + '"' +
        '   ' + styleAttr + '>' +
          '<span class="social-side-label">' + p.name + '</span>' +
          '<span class="social-side-icon">' + brandIcon(p.icon) + '</span>' +
        '</a>'
      );
    }).join('');
  }

  function mount() {
    const host = document.getElementById('social-sidebar');
    if (!host) return;
    if (host.dataset.mounted === 'true') return;
    host.dataset.mounted = 'true';

    host.innerHTML = template();
    NS.renderIcons?.(host);
  }

  NS.SocialSidebar = { mount };
})();