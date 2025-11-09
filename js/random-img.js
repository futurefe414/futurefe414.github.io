// random-img.js — 给文章顶部和封面设置带时间戳/随机数的 loliapi URL，避免浏览器缓存
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
    // 如果你的主题类名不同，可按需调整这些选择器
    var topSelectors = ['.post-cover', '.page-cover', '.banner', '.hero'];
    var coverSelectors = ['.post .cover', '.article-cover', '.post-thumbnail img'];

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