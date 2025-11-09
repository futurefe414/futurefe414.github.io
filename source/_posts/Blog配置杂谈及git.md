---
title: Blog配置杂谈及git
date: 2025-11-09
categories: 杂谈
description: 一点折腾🫥🫥
---

# 怎么样获得貌美Blog ? 🤔🤔

## 来配个随机图

### 随机图配置的思考

我的博客用的是`hexo+butterfly`主题，官方文档很详细，所以基础配置教程没必要写。

这里记一下配置文章随机图的小折腾。

随机图片API：

```
https://www.loliapi.com/acg/
```

理想状态下是在主题的配置文件`_config.butterfly.yml`里面修改`default_top_img`和`default_cover`的值为上述API就行了，

但是**实际上**，因为**浏览器缓存**等原因的存在，会导致浏览器第一次访问该URL获得返回图之后，就会默认用该图替换掉所有访问这个URL的图片位置，导致出现多篇博客文章的封面`cover`图和`top_img`图都是一样的，虽然刷新之后每次显示的图是随机的，但所有文章的图却是完全一样，这样的博客还不够貌美且体验非常不好，并不能实现预期，所以我们要做的工作还有很多。

- 配置 `_config.buttrefly.yml  `如上文介绍；
- 编写随机图脚本文件` random-img.js `；
- 给出在 Pug 模板中注入全局变量并引入脚本的代码片段；

通过在`layout`布局中注入`js`脚本，使浏览器每次访问该url都会在它之后加上随机值，从而获得随机美图。

### 更优雅的

不知道为什么butterfly的官方文档里找不到了，翻了翻其他大佬的博客才看到的：

在`default_cover:   `这行配置前面加上`suffix: 1`，

```yaml
suffix: 1
```

然后在`themes/butterfly/scripts`目录下新建一个`random_img.js`脚本，写入以下内容：

```js
'use strict'

hexo.extend.filter.register('before_post_render', function (data) {
  const { config } = this

  if (config.post_asset_folder) {
    const imgTestReg = /\.(png|jpe?g|gif|svg|webp)(\?.*)?$/
    const topImg = data.top_img
    const cover = data.cover
    if (topImg && topImg.indexOf('/') === -1 && imgTestReg.test(topImg)) data.top_img = data.path + topImg
    if (cover && cover.indexOf('/') === -1 && imgTestReg.test(cover)) data.cover = data.path + cover
  }

  if (data.cover === false) {
    data.randomcover = randomCover(data)
    return data
  }

  // 如果文章没有指定 cover，则替换为随机的默认图。
  if (!data.cover) {
    data.cover = randomCover(data)
  }
  // 同理
  if (!data.top_img) {
    data.top_img = randomCover(data)
  }
  return data
}, 0)

function randomCover (data) {
  const theme = hexo.theme.config || {}
  let cover
  // 1) 选择默认图（支持数组或单一 URL）
  if (theme.cover && theme.cover.default_cover) {
    if (!Array.isArray(theme.cover.default_cover)) {
      cover = theme.cover.default_cover
    } else {
      const arr = theme.cover.default_cover
      if (arr.length === 0) {
        cover = theme.default_top_img || ''
      } else {
        const idx = Math.floor(Math.random() * arr.length)
        cover = arr[idx]
      }
    }
  } else {
    cover = theme.default_top_img || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
  }

  // 2) 根据配置决定是否追加 suffix（cache-buster）
  // 兼容旧行为：theme.cover.suffix == 1 用 ?n , ==2 用 &n
  try {
    const coverCfg = (theme.cover && theme.cover.suffix) ? theme.cover.suffix : 0
    if (coverCfg) {
      const sep = cover.indexOf('?') === -1 ? '?' : '&'
      if (Number(coverCfg) === 2) {
        cover = cover + sep + Math.ceil(Math.random() * 10000)
      } else {
        const ts = Date.now()
        const rnd = Math.floor(Math.random() * 900000) + 100000 
        const pageKey = (data && (data.path || data.permalink || data.slug || data.title)) ? String(data.path || data.permalink || data.slug || data.title) : ''
        const phash = pageKey ? simpleHash(pageKey) : Math.floor(Math.random() * 1e8).toString(36)
        cover = cover + sep + 's=' + encodeURIComponent(ts + '_' + phash + '_' + rnd)
      }
    }
  } catch (e) {
    hexo.log && hexo.log.warn && hexo.log.warn('[random_cover] suffix add failed', e)
  }
  return cover
}

function simpleHash (str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0
  }
  return (Math.abs(h) >>> 0).toString(36)
}
```

这样浏览器请求时就可以在你给定的api后面加上随机值，从而避免浏览器缓存，实现显示随机图片。

## 建个新分支放文章叭

### hexo做了什么？

先了解一下hexo的部署机制，

- **第一步：生成静态文件**

  执行 `hexo generate`（简写 `hexo g`）时，Hexo 会根据 `source` 目录中的 Markdown 文章、主题模板（`themes` 目录）、配置文件（`_config.yml`）等，编译生成可直接在浏览器运行的静态 HTML、CSS、JS 等文件，默认输出到 `public` 目录。这一步是部署的前提，所有部署的内容均来自 `public` 目录。 

- **第二步：部署静态文件**

  执行 `hexo deploy`（简写 `hexo d`）时，Hexo 会调用配置的部署工具，将 `public` 目录中的静态文件上传到指定的远程平台（如 Git 仓库、云服务器等）。部署方式由 `_config.yml` 中的 `deploy` 配置决定，支持多种部署策略。显然看我的博客url就知道我是部署在github上的git仓库里的，`_config.yaml`里配置的是main分支。

### 文章放哪？

因为hexo是静态生成`.html`文件之后再部署的，这就导致没法在仓库里找到`.md`的博客文章，且GitHub默认不会对`.html`文件渲染，导致在仓库中看到的博客文章体验非常不好（没有网页渲染，只显示Raw源代码），

所以我在`main`分支外创建了一个`posts`分支，该分支中存放能被GitHub渲染的`.md`博客文章。

但是main分支里的文章都已经在hexo部署的时候生成静态页面了，所以简单的分支`split`并不能实现，于是需要`checkout -b`重新创建并切换一条分支。步骤如下：

### 步骤

#### git init 和 .gitignore

在`myblogs`文件夹打开`git bash`，输入`git init`，这会生成一个`.git`文件夹；在相同目录下新建一个`.gitignore`文件（因为我们只想要推送`source/_posts`目录下的文章，所以需要配置一下`.gitignore`的信息）

此时文件结构应该是这样：

![myblogs目录结构](/images/wp/博客配置.png)

然后编辑一下`.gitignore`的内容：

```bash
# 忽略仓库根下的所有（包括文件和目录）
/*

# 保留 .gitignore 自身（否则你会把它也忽略掉）
!.gitignore

# 保留 source 目录
!/source/

# 忽略 source 下的所有内容
/source/*

# 放行 _posts 目录及其所有子文件
!/source/_posts/
!/source/_posts/**

```

#### git remote

```bash
git remote add test xxx（github仓库地址.git）
```

建立远程连接，连接到远程GitHub仓库，并在本地给这个仓库连接取别名为test;  别名一般都是用`origin`

```bash
git remote add origin https://github.com/futurefe414/futurefe414.github.io.git
```

不过如果你已经更改过hexo的`_config.yml`文件且已经` hexo g -d`部署过的话好像已经有默认的了，不用单独连过，它会自动识别到这个仓库连接。

可以通过` git remote -v `查看远程仓库连接.

#### git checkout

在该仓库下新建并切换posts分支：

```bash
git checkout -b posts
```

#### git push

由于hexo部署有推送到GitHub仓库的历史，所以建议在add前先清除一下跟踪：

```bash
 git rm -r --cached .
```

再推送到远程仓库：

```bash
git add .
git commit -m "这里填提交信息"
git push origin posts
```

关于`git push`，`git push origin posts`就是把本地的posts分支推送到origin指代的仓库里的posts分支下（如果没有就新建一个posts分支）

这样你访问[futurefe414/futurefe414.github.io](https://github.com/futurefe414/futurefe414.github.io)这个仓库切换到posts分支下就能看到`.md`渲染的博客文章了。

![posts分支](/images/wp/仓库.png)

