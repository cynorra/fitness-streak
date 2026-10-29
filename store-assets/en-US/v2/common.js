// Injects shared bits: status bar, flame svg, app icon, glow orbs.
document.querySelectorAll('[data-sb]').forEach(function (el) {
  el.className = 'sb';
  el.innerHTML = '<span>9:41</span><span class="r">' +
    '<svg viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="2" width="3" height="10" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>' +
    '<svg viewBox="0 0 26 12"><rect x="0" y="0" width="22" height="12" rx="3.5" fill="none" stroke="#fff" stroke-width="1.2" opacity=".6"/><rect x="2" y="2" width="16" height="8" rx="2"/><rect x="23" y="4" width="2.2" height="4" rx="1"/></svg></span>';
});
document.querySelectorAll('[data-flame]').forEach(function (el) {
  var s = el.getAttribute('data-flame') || 64;
  el.innerHTML = '<svg width="' + s + '" height="' + s * 1.2 + '" viewBox="0 0 64 77"><defs><linearGradient id="fg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#f97316"/><stop offset=".55" stop-color="#fb923c"/><stop offset="1" stop-color="#fde68a"/></linearGradient><filter id="fb"><feGaussianBlur stdDeviation="3"/></filter></defs>' +
    '<path d="M33 4C35 18 52 26 52 46c0 17-9 27-20 27S12 63 12 48c0-9 5-15 9-19 1 6 4 9 7 10-3-13 0-27 5-35z" fill="#f97316" opacity=".55" filter="url(#fb)"/>' +
    '<path d="M33 4C35 18 52 26 52 46c0 17-9 27-20 27S12 63 12 48c0-9 5-15 9-19 1 6 4 9 7 10-3-13 0-27 5-35z" fill="url(#fg)"/>' +
    '<path d="M32 40c1 6 8 9 8 17 0 6-4 10-8 10s-8-4-8-9c0-4 2-6 4-8 0 3 1 4 3 4-1-5-1-9 1-14z" fill="#fff7d6" opacity=".92"/></svg>';
});
document.querySelectorAll('[data-icon]').forEach(function (el) {
  el.innerHTML = '<img src="../../../assets/icon.png">';
});
