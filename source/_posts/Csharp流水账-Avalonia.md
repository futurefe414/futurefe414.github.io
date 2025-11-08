---
title: 流水账-Avalonia
date: 2025-09-27
tags: Avalonia
categories: Csharp
top_img: /images/background/狐妖/04.jpg
cover: /images/background/狐妖/0.jpg
description: ohno 妈咪何意味🥹🥹
---

# 流水账-Avalonia

> 近几天尝试用`Avalonia`搞了一个`Draw`(~~也算是借鉴🦊佬的学习路线了~~),但是非常悲伤的是没有设计出MVVM的架构，~~仅是MV架构就要我半条命~~，ViewModel层拼尽全力不知道该填些什么...小记一下我的折腾。

## Model层

没有高端的玩意儿，总而言之就是💩山，只有最最最基础的`class`，没有`record`、`dictionary`那些🥹，用不惯喵。我甚至把所有类都塞到了一个`.cs`文件里,不过能跑就⭐（×），唉唉，不管了。    

我设计了四个类，`Prize`、`Participant`、`DrawResult`、`DrawManager`，分别用来放奖项信息、参与者信息、抽奖结果和抽奖发起者的行为。

前三个类存放相关信息，当然也要支持修改，支持读取，所以均使用`{get;set;}`访问控制器。

至于抽奖发起者，一个最重要的行为就是要组织开奖，也就是获取`DrawWinners()`的行为，而获奖者一般也不止一个，所以我选用了`List`,也就封装出了`public List<DrawResult> DrawWinners()`这个函数。接下来细想一下，这个函数需要哪些实现逻辑呢？

- 首先需要获取参与者信息
- 当然也需要获取奖项设立的情况
- 抽奖的随机性也是必须的
- 最后还要及时删除参与者的数据，避免重复抽奖

如下：

```c#
public List<DrawResult> DrawWinners()
{
    var results = new List<DrawResult>();
    var availableParticipants = _participants.ToList();

    // 如果没有参与者，返回空结果
    if (availableParticipants.Count == 0)
    {
        return results;
    }

    foreach (var prize in _prizes)
    {
        // 计算实际抽奖数量：取奖项数量和剩余参与者数量的较小值
        int actualQuantity = Math.Min(prize.Quantity, availableParticipants.Count);
        
        for (int i = 0; i < actualQuantity && availableParticipants.Count > 0; i++)
        {
            var randomIndex = _random.Next(availableParticipants.Count);
            var winner = availableParticipants[randomIndex];
            
            results.Add(new DrawResult
            {
                WinnerName = winner.Name,
                Prize = prize,
                DrawTime = DateTime.Now
            });

            availableParticipants.RemoveAt(randomIndex);
        }
    }

    _results.AddRange(results);
    return results;
}
```

以上就是抽奖的实现逻辑，此外，值得一提的是`readonly`关键字的使用，

1.

```c#
private readonly List<Participant> _participants = new();
```

这是private封装（内部只读存储），`readonly`使它不能被重新赋值（例如不能再 `_participants = new List<...>()`），但**可以修改集合内部的元素**（如 `_participants.Add(...)`），这就可以很好地支持了操作部分参与者的需求。

2.

```c#
public ReadOnlyCollection<Participant> Participants => _participants.AsReadOnly();
```

这也是封装（readonly只读保护），给外部提供的`readonly`只读访问接口，支持获取参与者信息，也保护了数据不被外部删改。

## View层

View视图的UI设计(`.axaml`)和事件绑定(`.axaml.cs`)相关的数据交互我都放在了这一层处理。

关于UI设计等我过几天再补吧，太累了，先不写了（



## 从`.csproj`到`.exe`

在这一步我也走了很多的弯路，最后也是在拷打`llm`各AI大模型下完成了这最后一步。~~总而言之，能跑就是win!~~



## Keep Ongoing

👆🏼
