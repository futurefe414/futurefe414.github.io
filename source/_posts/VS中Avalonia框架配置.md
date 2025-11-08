---
title: VS中使用Avalonia
date: 2025-10-14
tags: Avalonia
categories: Csharp
top_img: /images/background/狐妖/09.jpg
cover: /images/background/狐妖/21.jpg
---

# 跨平台的“现代WPF”

Avalonia 是一个 **跨平台的 .NET UI 框架**，专为构建高性能、视觉一致的桌面应用而设计，同时支持扩展到移动和网页平台。

它使用C#编写，依赖.Net SDK编译，既继承了 WPF 等传统 .NET UI 框架的优势，又解决了其跨平台能力的局限性。

# 在VS中使用

## 安装VS+SDK

从[官网](https://visualstudio.microsoft.com/zh-hans/downloads/)安装VS ,然后在VS Installer里根据开发需求选择工作负载安装。

进行 C# 开发一般需要选择 “.NET 桌面开发” 工作负载，如果要进行[ASP.NET](https://asp.net/)和 Web 开发，还需选择 “[ASP.NET](https://asp.net/)和 Web 开发” 工作负载。

> 如果在VS Installer里选了C#相关的工作负载安装，那么.Net SDK就已经包含了，若非，可以自行在官网上找你所需要的SDK安装。

## 安装Avalonia项目模板

由于Avalonia是第三方框架，它目前无法直接在VS Installer安装器里勾选安装，而是需要在终端里安装：

```cmd
dotnet new install Avalonia.Templates
```

在CMD / PowerShell / Developer PowerShell for VS 2022等终端执行以上命令，一行就可以安装完成，非常的方便.🥰🥰

装完Avalonia后，Avalonia DevTools（**UI 调试工具**，类似浏览器的开发者工具）也已经自动包含，此时项目的入口代码(通常是Program.cs文件)如下：

```c#
using Avalonia;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.DevTools; 

public static void Main(string[] args) => BuildAvaloniaApp()
    .StartWithClassicDesktopLifetime(args);

public static AppBuilder BuildAvaloniaApp()
    => AppBuilder.Configure<Application>()
        .UsePlatformDetect()
        .WithInterFont()
   	    .LogToTrace();
```

这样的默认配置不管是Debug版本还是Release版本都可以启用DevTools,如果不想在Release版本中使用，则改成如下：

```c#
public static AppBuilder BuildAvaloniaApp()
{
    var builder = AppBuilder.Configure<Application>()
        .UsePlatformDetect()
        .LogToTrace();
#if DEBUG
    builder.UseDevTools();
#endif
	return builder;
}
```

Avalonia DevTools在调试（F5）时按F12就可以打开，和浏览器开发者工具一致。

## 安装扩展

在VS扩展-->管理扩展中找到Avalonia,点击安装。重启VS。

# 总而言之

C#环境配置非常简单，5分钟搞定。~~C#居然还有这个红利👆🏼🤓~~

