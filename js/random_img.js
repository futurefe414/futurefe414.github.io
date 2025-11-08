// random-img.js — 最简单的动态随机图并加入 cache-buster
(function () {
  var baseTop = window.BUTTERFLY_RANDOM_TOP || "https://www.loliapi.com/acg";
  var baseCover = window.BUTTERFLY_RANDOM_COVER || baseTop;

  function cacheBustedUrl(base) {
    var sep = base.indexOf('?') === -1 ? '?' : '&';
    return base + sep + 't=' + Date.now() + '&r=' + Math.floor(Math.random() * 1e9);
  }

  function setImgOrBg(el, url) {
    if (!el) return;
    var tag = (el.tagName || '').toLowerCase();
    if (tag === 'img') {
      el.src = url;
    } else {
      el.style.backgroundImage = 'url("' + url + '")';
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
    }
  }

  function applyRandomToSelectors() {
    // 常见 Butterfly 主题中可能使用的选择器，覆盖文章顶部和封面
    var topSelectors = [
      '.post-cover',       // 文章顶部封面（常见）
      '.page-cover',       // 页面封面
      '.banner',           // 主题 banner
      '.hero'              // hero 区域
    ];
    var coverSelectors = [
      '.post .cover',      // 某些主题结构的文章封面
      '.article-cover',    // 另一些命名
      '.post-thumbnail img'// 列表缩略图中的 img
    ];

    var topUrl = cacheBustedUrl(baseTop);
    topSelectors.forEach(function (sel) {
      var els = document.querySelectorAll(sel);
      els.forEach(function (el) { setImgOrBg(el, topUrl); });
    });

    var coverUrl = cacheBustedUrl(baseCover);
    coverSelectors.forEach(function (sel) {
      var els = document.querySelectorAll(sel);
      els.forEach(function (el) { setImgOrBg(el, coverUrl); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyRandomToSelectors);
  } else {
    applyRandomToSelectors();
  }
})();