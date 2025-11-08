---
title: Day 01 Csharp基础语法
date: 2025-09-02
tags: 语法糖
categories: Csharp
top_img: /images/background/东方/0.jpg
cover: /images/background/东方/02.jpg
description: 真吓哭了，第一次授课的时候临时才发现电脑坏了 :(
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

## 先上源码，因为懒得写授课的文档。XD

```csharp
// global using System; //隐式导入
#pragma warning disable CS0219  //disable 禁用警告
Console.WriteLine("aaa");

Console.WriteLine("Hello, World!");
int x = 42;
int y = 2;
Console.WriteLine(int.MaxValue);
long xx = -12345;
Console.WriteLine(long.MaxValue);
double d = 2.33;
float z = 3.14F;
decimal w = 19.99M;
char letter = 'a';
string greeting = "111";
Console.WriteLine(greeting.Length);
bool isActive = true;
Console.WriteLine(isActive);
Console.WriteLine("{0}", x);
System.Console.WriteLine($"{x}");
string? c = Console.ReadLine();
Console.WriteLine(c);
int? value = null;
string? reference = null;
Console.WriteLine(value);
Console.WriteLine("{1} is not {0}", x, value);

x = int.Parse(greeting);

int Sum(int a, int b = 3) => a + b; // 可选参数，类比形参/实参。
Console.WriteLine($"Sum: {Sum(1)}");
void Swap(ref int x, ref int y)
{
    int temp = x;
    x = y; // 直接修改外部变量的引用
    y = temp;
}
Console.WriteLine($"x={x},y={y}");
Swap(ref x, ref y);

//Console.WriteLine(x,y);
//Console.WriteLine($"{Swap(ref x, ref y)}");
Console.WriteLine($"x={x},y={y}");

// 计算和与差，用 out 返回差
static int Add(int a, int b, out int diff)
{
    diff = a - b; // 必须给 out 参数赋值
    return a + b; // 返回和
}

// 调用
int sum = Add(5, 3, out int diff);
Console.WriteLine($"和：{sum}，差：{diff}"); // 输出：和：8，差：2

// ref 关键字,声明为引用类型，会改变外部数据。  值类型传递的是副本。
// out 用于返回多个值，声明out int a,调用out a,调用和声明时都加 out。
bool result = int.TryParse("123", out int parsedValue);
if (result)
{
    Console.WriteLine($"Parsed Value: {parsedValue}");
}
else
{
    Console.WriteLine("Parsing failed.");
}

int i = 0;
while (i < 3)
    System.Console.WriteLine(i++);

// foreach (var item in collection) { }
int num = 1;
switch (num)
{
    case 1:
        Console.WriteLine(x);
        break;
    case 2:
        goto case 99;
    case 99:
        Console.WriteLine(233);
        break;
}

object b = "abc"; //可以接受所有类型，是所有类型的父类(基类)，其他都是object的子类。
b = 233;
Console.WriteLine(b);

int[] numbers = [1, 2, 3, 4, 5];
var arr2 = new int[5]; //声明长度为5的数组，默认值为0。
Console.WriteLine($"Numbers: {string.Join(", ", numbers)}"); // 将集合（如数组）中的元素拼接成一个字符串。
object[] mixedArray = [1, "two", 3.0, true];
int[] arr = [3, 1, 2];
Array.Sort(arr); // 结果：[1,2,3]
Array.Reverse(arr); //结果：[3,2,1]
int index = Array.IndexOf(arr, 2); //index= 1  etc..
var sliced = arr[1..3]; // 切片，结果：[2,3]
int[] e = [1];
e = [2, 3];
Console.WriteLine(e.Length);

Dictionary<int, string> dictionay = new() { { 1, "one" }, { 2, "two" } };
Console.WriteLine(dictionay[1]); // 输出：one

// 元组（Tuple）
// 匿名值元组（元素默认名为 Item1, Item2, ...）
var tuple1 = (10, "apple", 3.14);
Console.WriteLine(tuple1.Item1); // 输出：10
Console.WriteLine(tuple1.Item2); // 输出：apple

// 命名值元组（自定义元素名称，更易读）
var tuple2 = (Id: 100, Name: "Alice", Score: 95.5);
Console.WriteLine(tuple2.Id); // 输出：100
Console.WriteLine(tuple2.Name); // 输出：Alice

// 方法返回命名元组
(string Name, int Age) GetPerson()
{
    return ("Charlie", 30);
}
var (n, age) = GetPerson();
Console.WriteLine($"{n}, {age}"); // 输出：Charlie, 30

//discard 弃元，_,下划线作为占位符，表示忽略某个值。
var person = ("Alice", 30, "Female"); // 元组
var (name, _, gender) = person; // 忽略年龄（第二个元素）
Console.WriteLine($"Name: {name}, Gender: {gender}"); // 输出：Name: Alice, Gender: Female

Color favoriteColor = Color.Red & Color.Blue;
var color = Color.Red | Color.Green;
var allcolors = Color.Red | Color.Green | Color.Blue;
Console.WriteLine(favoriteColor);
Console.WriteLine(color);
Console.WriteLine(allcolors);
bool hasRed = color.HasFlag(Color.Red);
var allinone = Color.All;
if (allinone.HasFlag(Color.Green))
{
    Console.Write("Green");
}
if (allinone.HasFlag(Color.Blue))
{
    Console.Write(" Blue");
}
if (allinone.HasFlag(Color.Red))
{
    Console.Write(" Red");
}

[Flags] //该特性支持位运算。
enum Color
{
    white = 0,
    Red = 1 << 0, //0
    Green = 1 << 1, //1
    Blue = 1 << 2, //2
    All = ~0, //所有位都为1
}

/* partial class Program   //partial 关键字允许将类、结构体或接口的定义分散在多个文件中。多个文件中都定义和使用了同一个类名，使用partial声明他们是同一个类，并将他们聚合在一起。
{
    public static void Main()  //访问修饰符public，static声明为静态方法，依赖类名调用，不依赖类的实例化对象。
    {    //static修饰的方法不能访问非静态成员。因为该方法在类加载时就存在，已经在内存中而非静态成员需要通过实例化对象才能访问。
        Console.WriteLine("Main method executed.");
    }
} */

/* List<int> numbersList = [1, 2, 3];
var list = new List<int> { 1, 2, 3, 4, 5 };
Console.WriteLine($"List Count: {list.Count}");
list = [10, 20, 30];
Console.WriteLine(list.Count); */

/* dynamic d = "Dynamic String";
Console.WriteLine(d.Length);
d = 12345;
Console.WriteLine(d + 10);
*/

/* class Person
{
   public required string Name { get; set; }
   public int Age { get; set; }
}
 */

#pragma warning restore CS0219  //restore 恢复
#pragma warning restore CS0162

```



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

