// random-img.js — 给文章顶部和封面设置带时间戳/随机数的 loliapi URL，避免浏览器缓存
(function () {
  var baseTop = window.BUTTERFLY_RANDOM_TOP || "https://www.loliapi.com/acg";
  var baseCover = window.BUTTERFLY_RANDOM_COVER || baseTop;
  var hasPostCover = !!window.BUTTERFLY_HAS_POST_COVER;

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
    // 如果文章自己指定了 top_img/cover，则跳过覆盖文章顶部（post 页）相关元素
    // 但仍可覆盖列表中缩略图等（按需修改）
    var topSelectors = ['.post-cover', '.page-cover', '.banner', '.hero']; // 文章顶部容器或 hero 区域
    var coverSelectors = ['.post .cover', '.article-cover', '.post-thumbnail img']; // 列表或缩略图

    var topUrl = cacheBustedUrl(baseTop);
    var coverUrl = cacheBustedUrl(baseCover);

    // 文章页顶部：只有在文章没有指定 top_img/cover 时才覆盖
    if (!hasPostCover) {
      topSelectors.forEach(function (sel) {
        var els = document.querySelectorAll(sel);
        els.forEach(function (el) { setImgOrBg(el, topUrl); });
      });
    }

    // 列表页/缩略图：通常不由 front-matter 指定，直接覆盖（如果你不想覆盖缩略图，把这段删除）
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