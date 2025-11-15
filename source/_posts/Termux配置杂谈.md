---
title: 一点Termux的折腾
date: 2025-11-15
categories: 杂谈
description: 想开发一下平板的用途（）
---

# 前言

本文记录了一下我的一点折腾，用Termux+AnLinux 搭建 Linux 环境，目前我没搭桌面图形化界面（VNC暂未折腾）,当然除了AnLinux还可以用  proot-distro 搭建。

鸿蒙4.0系统兼容安卓环境，因此 Termux 与 AnLinux 均可使用。但鸿蒙对底层硬件权限限制比安卓更严格，所以在 Ubuntu 内播放音频、视频无法直接工作，只能Termux 实现。

# 一些芝士

- Pad 触屏长按实现复制粘贴。
- kill -9 PID  强制终止这个PID进程。
-  CTRL+C    终止当前进程
- 遇到permission denied：大概率是没有执行权限，用`chmod +x xxx.sh`添加执行权限即可解决。
- `free -h`   查看内存
- 可以使用`mv`(移动 move)重命名文件：`mv old.txt new.txt`

# 部署Ubuntu

## 初始化Termux

Termux里的指令和Linux差不多，主要区别就是`apt`换成了`pkg`:

```bash
pkg update && pkg upgrade -y
pkg install wget curl git proot tar -y
termux-setup-storage
```

第二行装了一些常用的工具，第三行是创建`~/storage/`目录，用于访问 `/sdcard`手机内部存储。

具体对应关系和用途如下：

| Termux 目录 | 手机文件管理器对应路径 | 核心用途                                                     |
| ----------- | ---------------------- | ------------------------------------------------------------ |
| dcim        | 内部存储 / DCIM        | 存放手机相机拍摄的照片、录制的视频，是相册核心存储目录       |
| downloads   | 内部存储 / Download    | 存储各类应用下载的文件，比如浏览器、社交软件等下载的文档、安装包等 |
| movies      | 内部存储 / Movies      | 用于存放各类视频文件，像下载的电影、电视剧或剪辑后的视频素材 |
| music       | 内部存储 / Music       | 专门存储音频文件，包括下载的歌曲、录音文件、音频剪辑片段等   |
| pictures    | 内部存储 / Pictures    | 存放非相机拍摄的图片，比如截图、应用保存的图片、绘图软件导出的图像等 |
| shared      | 内部存储根目录         | 相当于手机内部存储的入口，能访问内部存储下的所有公开目录和文件，适配各类文件的跨目录查找需求 |

这些目录的文件双向互通。

## 安装Ubuntu

从AnLinux 里复制命令粘贴到 Termux就可以，等待安装完成，后续启动就是输入`./start-ubuntu.sh`。

1.**安装必备工具**：鸿蒙平板无法直接在应用市场下 Termux 和 AnLinux， 从GitHub Releases 页面下载上述两款APP。

2.**部署 Ubuntu 系统**：打开 AnLinux，在仪表盘选择 Ubuntu，复制对应的安装脚本；切换到 Termux，长按命令行区域粘贴脚本并执行，脚本会自动下载依赖和 Ubuntu 镜像并完成部署。

3.**启动 Linux 系统**：部署完成后，在 Termux 中输入`./start-ubuntu.sh`，出现`root@localhost:~#`则说明启动成功，此时已获得 Ubuntu 的 root 权限，所以后续指令都不用加`sudo`。    

4.**和Termux一样的初始化**：

```bash
apt update && apt upgrade -y
apt install build-essential git vim curl wget -y
```

## 一些环境

### **C/C++**:

```bash
apt install gcc g++ make
```

### **文本编辑器**：

```bash
apt install vim
```

### **.Net**:

- 安装依赖：

```bash
apt install libssl-dev libicu-dev -y
```

- 添加源：

```bash
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
dpkg -i packages-microsoft-prod.deb
rm packages-microsoft-prod.deb
```

- 安装：

```bash
apt update && apt install -y dotnet-sdk-8.0
dotnet --version   # 输出版本号说明安装成功
```

#### **常见问题**：

因为Termux是轻量化的，所以给Ubuntu分配的内存可能不足，所以会出现`GC heap initialization failed with error 0x8007000E`之类的报错，`0x8007000E`就是指内存不足导致内存分配失败。

#### **解决**：

**Termux 内核彻底不支持手动创建的 swap，swap 文件权限和 Termux 系统调用受到限制， 且.NET Core 启动时需要连续的内存块，而非零散内存**，`dd`也不能实现内存分配。

但我们可以如下设置：

```bash
export DOTNET_GCHeapHardLimit=0x100000000
export DOTNET_UseHostedGC=0
dotnet --version    # 此时若能正确输出版本号就成功了。
```

然后我们写入环境变量，

```bash
echo 'export DOTNET_GCHeapHardLimit=0x100000000' > ~/.dotnet_env
echo 'export DOTNET_UseHostedGC=0' >> ~/.dotnet_env
echo 'source ~/.dotnet_env' >> ~/.bashrc
source ~/.bashrc
```

就好了。OK，问题解决。后面就可以`dotnet new console`这样来创建控制台应用啦。

### **code-server**:

```bash
curl -fsSL https://code-server.dev/install.sh | sh
```

启动命令：`code-server`，启动一个本地服务器，默认url是`http://127.0.0.1:8080`，初始密码：`cat ~/.config/code-server/config.yaml`，修改可以用`vim ~/.config/code-server/config.yaml`  修改。

# 媒体文件

| 功能     | Ubuntu 里直接做？       | 推荐方式                 |
| -------- | ----------------------- | ------------------------ |
| 音频播放 | ❌ 不行（无 PulseAudio） | Termux ：mpv             |
| 图片查看 | ✔️ 可以（ASCII 或 X11）  | jp2a或 Termux-X11        |
| 视频播放 | ❌ Ubuntu 内不行         | Termux mpv 或 Termux-X11 |

试试看在Termux里查看吧：

## 音频

**play-audio**:

```bash
pkg install play-audio -y
play-audio xxx.mp3
```

**mpv**:

```bash
pkg install mpv
mpv /sdcard/Music/test.mp3
```

## 图片

ASCII 字符渲染：jp2a

```bash
pkg install jp2a
jp2a image.jpg  # 文件路径
```

图形：x11

```bash
pkg install x11-repo
pkg install termux-x11-nightly
termux-x11 :0
```

## 视频

```bash
pkg install mpv
mpv /sdcard/Movies/test.mp4
```

