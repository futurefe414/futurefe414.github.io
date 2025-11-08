---
title: Day 02 LINQ
date: 2025-09-04
tags: LINQ
categories: Csharp
top_img: /images/background/东方/1.jpg
cover: /images/background/东方/04.jpg
---
# LINQ 

## 1. 什么是 LINQ？

LINQ（Language Integrated Query，语言集成查询）是 C# 3.0 引入的一种查询语法，它让你能用类似 SQL 的语法来操作集合（对象、数组、XML、数据库数据等）。正是因为LINQ可以像SQL一样操作数据库，所以也被人戏称为db(database)。
 **核心思想**：用一种统一的方式查询不同的数据源。

比如你要筛选一个数组中的偶数：

```csharp
using System;
using System.Linq;

class Program
{
    static void Main()
    {
        int[] numbers = { 1, 2, 3, 4, 5, 6 };

        // 使用 LINQ 查询语法
        var evens = from n in numbers
                    where n % 2 == 0
                    select n;

        Console.WriteLine("偶数有：");
        foreach (var n in evens)
        {
            Console.WriteLine(n);
        }
    }
}
```

输出：

```
偶数有：
2
4
6
```

这段代码看起来是不是有点像 SQL？

```sql
SELECT n FROM numbers WHERE n % 2 == 0;
```


 **查询表达式语法（Query Syntax）**
    LINQ 的语法参考了 SQL，例如 `from ... where ... select`，让 C# 程序员不用学习另一套 DSL，就能在代码里写“查询语句”。

------

## 2. 方法语法（Method Syntax）

除了查询语法，LINQ 还有一种 **链式方法写法**，更贴近函数式编程。在C#中，LINQ 的方法语法使用了一系列扩展方法，这些方法定义在 `System.Linq` 命名空间中。(在C#里习惯称函数为方法。)

```csharp
using System;
using System.Linq;

class Program
{
    static void Main()
    {
        string[] names = { "Alice", "Bob", "Charlie", "David" };

        // 方法语法
        var shortNames = names
            .Where(n => n.Length <= 4)
            .OrderBy(n => n.Length);

        Console.WriteLine("名字长度 <= 4:");
        foreach (var name in shortNames)
        {
            Console.WriteLine(name);
        }
    }
}
```
筛选名字长度 <= 4 的人,并按名字长度升序排序。  
输出：

```
名字长度 <= 4:
Bob
Dave
```

------

## 3. 常用操作

| 操作符    | 功能                  | 示例                            |
| --------- | --------------------- | ------------------------------- |
| `Where`   | 过滤数据              | `list.Where(x => x > 10)`       |
| `Select`  | 投影（选择字段）      | `list.Select(x => x.Name)`      |
| `OrderBy` | 排序 (默认升序)       | `list.OrderBy(x => x.Age)`      |
| `GroupBy` | 分组                  | `list.GroupBy(x => x.Category)` |
| `Join`    | 连接（类似 SQL JOIN） | `list1.Join(list2, ...)`        |

------

## 4.数据库 查询

如果你用 Entity Framework，LINQ 可以直接写 SQL 风格的查询：

```csharp
using (var context = new MyDbContext())
{
    var students = from s in context.Students
                   where s.Age > 18
                   orderby s.Name
                   select s;

    foreach (var student in students)
    {
        Console.WriteLine($"{student.Name} - {student.Age}");
    }
}
```

这里的 `context.Students` 其实不是数组，而是 **IQueryable**，LINQ 会把表达式树翻译成 SQL：

```sql
SELECT [s].[Name], [s].[Age]
FROM [Students] AS [s]
WHERE [s].[Age] > 18
ORDER BY [s].[Name];
```

所以看起来就是 **“像写 SQL 一样写 C# 代码”**。

------

## 5. 总结

- LINQ = 统一的查询语法，让你用一种写法查询不同数据源。
- 它借鉴了 SQL 语法（`from / where / select`），看起来很像数据库操作。
- 既能操作内存数据，也能查询数据库、XML、集合等。