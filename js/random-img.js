// themes/butterfly/source/js/random-img.js
// 改进版 random-img：每个元素生成独立随机参数，混合 pageKey；优先用 fetch({cache:'no-store'}) 获取 blob。
// 在 Network / Console 可查看请求与响应，便于排查是否是上游缓存导致相同图片。
(function () {
  var baseTop = window.BUTTERFLY_RANDOM_TOP || "https://www.loliapi.com/acg";
  var baseCover = window.BUTTERFLY_RANDOM_COVER || baseTop;
  var hasPostCover = !!window.BUTTERFLY_HAS_POST_COVER;
  var pageKey = window.BUTTERFLY_PAGE_KEY || '';

  // 更强的随机生成：优先用 crypto，如果不可用退回 Math.random
  function randHex() {
    try {
      var arr = new Uint32Array(2);
      crypto.getRandomValues(arr);
      return (arr[0].toString(16) + arr[1].toString(16));
    } catch (e) {
      return Math.floor(Math.random() * 1e16).toString(16);
    }
  }

  function qurl(base, extraSeed) {
    var sep = base.indexOf('?') === -1 ? '?' : '&';
    var ts = Date.now();
    var rnd = randHex();
    // extraSeed 可以是元素索引/页面 key 等，增加不同页面/元素间差异
    var seed = encodeURIComponent((pageKey || '') + '|' + extraSeed + '|' + rnd + '|' + ts);
    return base + sep + 't=' + ts + '&s=' + seed;
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

  // 用 fetch 获取图片并设置为 blob URL；若失败，回退到直接设置带 query 的 URL
  async function setImageWithFetch(el, base, extraSeed) {
    var url = qurl(base, extraSeed);
    console.log('[random-img] fetch ->', url, 'element:', el);
    try {
      var resp = await fetch(url, { cache: 'no-store', mode: 'cors' });
      console.log('[random-img] response', resp.status, resp.type, resp.headers && resp.headers.get && resp.headers.get('content-type'));
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      var blob = await resp.blob();
      if (!blob.type || blob.type.indexOf('image') === -1) {
        console.warn('[random-img] fetched content-type not image, fallback to url', blob.type);
        setImgOrBg(el, url);
        return;
      }
      var blobUrl = URL.createObjectURL(blob);
      setImgOrBg(el, blobUrl);
      setTimeout(function () { try { URL.revokeObjectURL(blobUrl); } catch (e) {} }, 60000);
    } catch (err) {
      console.warn('[random-img] fetch failed, fallback to direct url', err);
      // 最后回退：直接把带 query 的 URL 赋给元素
      setImgOrBg(el, url);
    }
  }

  function applyRandomToSelectors() {
    // 如有不同类名请按你的页面调整
    var topSelectors = ['.post-cover', '.page-cover', '.banner', '.hero'];
    var coverSelectors = ['.post .cover', '.article-cover', '.post-thumbnail img'];

    // 文章页顶部：若文章 front-matter 指定了 top_img/cover，则不覆盖
    if (!hasPostCover) {
      topSelectors.forEach(function (sel, selIndex) {
        var els = document.querySelectorAll(sel);
        els.forEach(function (el, idx) {
          // extraSeed 使用选择器索引 + 元素索引，确保每个元素不同
          setImageWithFetch(el, baseTop, selIndex + '-' + idx);
        });
      });
    } else {
      console.log('[random-img] page has own cover/top_img, skip replacing top selectors');
    }

    // 列表缩略图 / 文章列表封面：通常不由 front-matter 指定，直接替换（每个元素独立随机）
    coverSelectors.forEach(function (sel, selIndex) {
      var els = document.querySelectorAll(sel);
      els.forEach(function (el, idx) {
        setImageWithFetch(el, baseCover, 'cover-' + selIndex + '-' + idx);
      });
    });

    // Debug: 列出 service workers（若存在可能缓存）
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function (regs) {
        if (regs && regs.length) {
          console.log('[random-img] service workers registered:', regs);
        }
      }).catch(function (e) { /* ignore */ });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyRandomToSelectors);
  } else {
    applyRandomToSelectors();
  }
})();