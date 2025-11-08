---
title: Day 01 Csharp基础语法
date: 2025-09-02
tags: 语法糖
categories: Csharp
top_img: /images/background/东方/0.jpg
cover: /images/background/东方/02.jpg

---

# 🚀 Day 01  C#基础语法

C#（C-Sharp）是微软开发的现代编程语言，运行在 **.NET 平台** 上。它语法与 Java、C++ 相似，但功能更强大，语法更现代化。

 C# 的基础语法内容包括：

1. 程序入口
2. 数据类型
3. 条件与循环
4. 方法
5. 面向对象（OOP）
6. 语言亮点
7. 数组与集合

------

## 1️⃣ 程序入口

所有 C# 程序都从 `Main` 方法开始执行：

```csharp
using System;

class Program
{
    static void Main(string[] args)
    {
        Console.WriteLine("Hello, C#!");
    }
}
```

- `using System;`：引入命名空间（类似 Java 的 `import`）。
- `class Program`：定义类。
- `static void Main(string[] args)`：程序入口。
- `Console.WriteLine()`：打印输出。

------

## 2️⃣ 数据类型

C# 是强类型语言，常见数据类型如下：

```csharp
int age = 20;           // 整数
double price = 9.99;    // 浮点数
char grade = 'A';       // 字符
string name = "Alice";  // 字符串
bool isActive = true;   // 布尔
```

👉 类型推断：

```csharp
var city = "Tokyo";   // 自动推断 string
var number = 123;     // 自动推断 int
```

👉 常见数值类型范围：

- `int`：32 位整数
- `long`：64 位整数
- `float`：32 位浮点数（要加 `f` 后缀，如 `3.14f`）
- `double`：64 位浮点数
- `decimal`：高精度小数（常用于金融计算，后缀 `m`）

------

## 3️⃣ 条件与循环

### 条件语句

```csharp
int age = 18;

if (age >= 18)
{
    Console.WriteLine("Adult");
}
else
{
    Console.WriteLine("Minor");
}
```

`switch` 语句（支持字符串）：

```csharp
string color = "red";

switch (color)
{
    case "red":
        Console.WriteLine("Stop!");
        break;
    case "green":
        Console.WriteLine("Go!");
        break;
    default:
        Console.WriteLine("Unknown");
        break;
}
```

------

### 循环语句

```csharp
// for 循环
for (int i = 0; i < 5; i++)
{
    Console.WriteLine(i);
}

// while 循环
int n = 0;
while (n < 3)
{
    Console.WriteLine(n);
    n++;
}

// foreach 循环
string[] fruits = { "Apple", "Banana", "Orange" };
foreach (var f in fruits)
{
    Console.WriteLine(f);
}
```

------

## 4️⃣ 方法（函数）

C# 方法定义与调用：

```csharp
static int Add(int a, int b)
{
    return a + b;
}

static void SayHello(string name = "World")  // 默认参数
{
    Console.WriteLine("Hello, " + name);
}

static void Main()
{
    int result = Add(3, 4);
    Console.WriteLine(result);   // 7

    SayHello();                  // Hello, World
    SayHello("Alice");           // Hello, Alice
}
```

------

## 5️⃣ 面向对象（OOP）

C# 是 **面向对象语言**，支持类、对象、继承、多态。

```csharp
class Person
{
    // 属性（自动生成 getter/setter）
    public string Name { get; set; }
    public int Age { get; set; }

    // 方法
    public void Introduce()
    {
        Console.WriteLine($"Hi, I'm {Name}, {Age} years old.");
    }
}

class Program
{
    static void Main()
    {
        Person p = new Person { Name = "Alice", Age = 20 };
        p.Introduce();
    }
}
```

👉 属性写法 `public string Name { get; set; }` 比 Java 的 `getter/setter` 简洁很多。

------

## 6️⃣ 语言亮点

C# 有许多现代化特性，比 Java 更简洁：

### 🔹 字符串插值

```csharp
string name = "Alice";
int age = 20;
Console.WriteLine($"Hello, I'm {name}, {age} years old.");
```

### 🔹 异步编程（async/await）

```csharp
static async Task Download()
{
    Console.WriteLine("Downloading...");
    await Task.Delay(1000);
    Console.WriteLine("Done!");
}
```

### 🔹 LINQ（查询语法）

```csharp
int[] nums = { 1, 2, 3, 4, 5 };

var even = from n in nums
           where n % 2 == 0
           select n;

foreach (var n in even)
{
    Console.WriteLine(n);
}
```

------

## 7️⃣ 数组与集合

### 数组

```csharp
int[] numbers = { 1, 2, 3, 4, 5 };
Console.WriteLine(numbers[0]);  // 1
```

### List（动态数组）

```csharp
using System.Collections.Generic;

List<string> list = new List<string>();
list.Add("Apple");
list.Add("Banana");

foreach (var item in list)
{
    Console.WriteLine(item);
}
```

### Dictionary（键值对）

```csharp
Dictionary<string, int> scores = new Dictionary<string, int>();
scores["Alice"] = 90;
scores["Bob"] = 85;

Console.WriteLine(scores["Alice"]);  // 90
```

------

