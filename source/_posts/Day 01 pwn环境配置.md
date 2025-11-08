---
title: Day 01 pwn环境配置
date: 2025-08-27
tags: 

  - ubuntu
  - pwntools
  - pwndbg
  - python
categories: pwn
top_img: /images/background/00.jpg
cover: /images/background/bkimg.jpg
---
# Ubuntu 下 Pwn 环境配置

Pwn 是 CTF（Capture The Flag）竞赛中的重要方向，主要涉及二进制漏洞利用，而一套完善的 Pwn 环境是开展 Pwn 学习和竞赛的基础。本教程将带领大家在 Ubuntu 系统中，通过一系列命令逐步完成 Pwn 环境的配置，涵盖基础依赖库、工具安装以及关键辅助工具部署，即使是新手也能轻松跟随操作。

## 一、环境配置前的准备

在开始配置 Pwn 环境前，请确保你的 Ubuntu 系统处于正常联网状态，因为后续所有操作都需要通过网络下载相关软件包和工具。同时，建议以具有 sudo 权限的用户登录系统，避免因权限不足导致命令执行失败。打开 Ubuntu 的终端（可以通过快捷键`Ctrl + Alt + T`快速调出），接下来我们将分四个步骤执行命令完成配置。

## 二、分步执行命令配置环境

### 步骤 1：安装基础依赖库与常用工具

这一步是环境配置的基础，我们需要更新系统软件源并升级已安装的软件，同时安装编译工具、编程语言环境、文本编辑器、调试工具以及必要的库文件，这些工具和库文件将为后续 Pwn 工具的安装和使用提供支持。

在终端中粘贴以下命令并回车执行（命令较长，粘贴时确保完整，执行过程中可能需要输入当前用户的密码，输入密码时终端不会显示字符，正常输入即可）：



```shell
sudo apt update && sudo apt upgrade -y

sudo apt install -y build-essential gcc g++ make cmake git curl wget unzip \

      python3 python3-pip python3-venv \

      vim gdb gdb-multiarch tmux patchelf \

      libc6-dev-i386 libc6-dbg libc6-dbg:i386 \

      lib32z1 lib32ncurses6 lib32stdc++6
```



*   `sudo apt update`：用于更新 Ubuntu 系统的软件源列表，让系统知道最新的软件版本信息。

*   `sudo apt upgrade -y`：根据更新后的软件源列表，升级系统中已安装的软件，`-y`参数表示自动确认所有升级操作，无需手动输入`y`确认。

*   `sudo apt install -y`：用于安装指定的软件包，`-y`参数同样是自动确认安装操作。后面紧跟的一系列软件包中，`build-essential`是编译工具集，`gcc`、`g++`是 C 和 C++ 编译器，`python3`及相关组件是 Python 环境，`vim`是文本编辑器，`gdb`系列是调试工具，`libc6`相关库文件则是为了支持 32 位程序的运行和调试。

### 步骤 2：安装 Pwn 核心工具 ——pwntools

pwntools 是 Pwn 方向最常用的 Python 库，它集成了大量用于二进制文件分析、漏洞利用的功能，能够极大提高 Pwn 操作的效率。我们提供了三种安装方式，大家可以根据自己的情况选择，推荐优先尝试前两种，若遇到网络问题可尝试第三种国内源安装方式。

#### 方式一：通过 pip3 直接安装（推荐优先尝试）

在终端粘贴以下命令并执行：



```shell
pip3 install --upgrade pip

pip3 install pwntools
```



*   `pip3 install --upgrade pip`：先将 pip3（Python 的包管理工具）升级到最新版本，确保后续安装 pwntools 时不会因 pip 版本过低出现问题。

*   `pip3 install pwntools`：使用 pip3 安装 pwntools 库。

#### 方式二：通过 apt 包管理器安装

若方式一安装失败，可尝试此方式，在终端粘贴命令：



```shell
sudo apt install python3-pwntools
```

这种方式通过 Ubuntu 官方软件源安装，稳定性较高，但可能不是最新版本。

#### 方式三：通过国内清华源安装（解决网络问题）

如果在安装过程中遇到网络超时、下载速度慢等问题，可使用国内的清华 PyPI 源进行安装，在终端粘贴：



```shell
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple pwntools
```

`-i https://pypi.tuna.tsinghua.edu.cn/simple`参数指定了使用清华的 PyPI 源，能有效提高国内用户的下载速度。

### 步骤 3：安装增强型调试工具 ——pwndbg

gdb 是常用的调试工具，但默认功能较为基础，pwndbg 是 gdb 的一个增强插件，它添加了彩色显示、自动加载调试符号、便捷的调试命令等功能，能让 Pwn 调试过程更加高效。

#### 第一步：克隆 pwndbg 仓库

首先需要从 GitHub 上克隆 pwndbg 的代码仓库到本地，在终端粘贴以下命令（若第一个链接克隆速度慢，可使用第二个国内镜像链接）：



```shell
# 方式一：官方GitHub链接

git clone https://github.com/pwndbg/pwndbg

# 方式二：国内镜像链接（推荐国内用户使用）

git clone https://gitclone.com/github.com/pwndbg/pwndbg.git
```

`git clone`命令用于从远程代码仓库克隆代码到本地，执行后会在当前终端所在目录下生成一个名为`pwndbg`的文件夹，里面包含 pwndbg 的所有代码。

#### 第二步：进入 pwndbg 目录并执行安装脚本

克隆完成后，需要进入 pwndbg 文件夹，然后执行安装脚本进行安装，在终端依次粘贴以下命令：



```shell
cd pwndbg

./setup.sh
```



*   `cd pwndbg`：进入刚刚克隆生成的 pwndbg 目录，只有进入该目录才能执行后续的安装脚本。

*   `./setup.sh`：执行 pwndbg 的安装脚本，该脚本会自动安装 pwndbg 所需的依赖，并完成 gdb 插件的配置。

#### 安装过程中的特殊处理（若出现依赖安装失败问题）

如果在执行`./setup.sh`时遇到依赖安装失败的情况，可尝试先通过国内源安装 uv 工具（用于依赖管理），再进行依赖同步，在终端粘贴以下命令：



```shell
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple uv  --break-system-packages

uv sync --index-url https://mirrors.aliyun.com/pypi/simple/
```

执行完成后，再次运行`./setup.sh`即可继续完成 pwndbg 的安装。

### 步骤 4：安装多版本 glibc 集合 ——glibc-all-in-one

在 Pwn 题目中，不同的题目可能依赖不同版本的 glibc（GNU C 库），而系统默认的 glibc 版本固定，无法满足多种版本需求。glibc-all-in-one 是一个整合了多种常见版本 glibc 的工具集，安装后可以方便地为不同题目切换对应的 glibc 版本，避免因 glibc 版本不匹配导致题目无法运行或调试。

在终端粘贴以下命令进行安装：



```shell
git clone https://github.com/matrix1001/glibc-all-in-one.git \~/glibc-all-in-one
```



*   `git clone https://github.com/matrix1001/glibc-all-in-one.git`：克隆 glibc-all-in-one 的代码仓库。

*   `~/glibc-all-in-one`：指定将仓库克隆到当前用户的家目录（`~`代表家目录）下的`glibc-all-in-one`文件夹中，这样后续查找和使用该工具集会更加方便。

## 三、环境配置验证

完成以上所有步骤后，我们可以通过简单的操作验证环境是否配置成功：



1.  **验证 pwntools**：在终端输入`python3`进入 Python 交互环境，然后输入`from pwn import *`，若没有报错，则说明 pwntools 安装成功。

2.  **验证 pwndbg**：在终端输入`gdb`，若进入 gdb 界面后显示有`pwndbg`相关的提示信息（如彩色的版本号、欢迎语等），则说明 pwndbg 配置成功。

3.  **验证 glibc-all-in-one**：进入家目录，查看是否存在`glibc-all-in-one`文件夹，进入该文件夹后若能看到包含不同 glibc 版本的文件，则说明安装成功。



# IDA安装

IDA是帮助我们分析二进制文件的工具，可以自行上网找找破解教程（

> 