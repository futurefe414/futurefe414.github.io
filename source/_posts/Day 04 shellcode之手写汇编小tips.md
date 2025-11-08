---
title: Day 04 shellcode之手写汇编小tips
date: 2025-08-30
tags:
  - 汇编
  - pwntools
  - ubuntu
categories: pwn
top_img: /images/background/狐妖/03.jpg
cover: /images/background/狐妖/2.jpg
---

# Shellcode 汇编小 Tips

如果shellcraft不适用，我们往往需要手写汇编构造更简短的 shellcode。本文整理了一些小技巧，帮助你快速写出合适的 shellcode。

---
## 前置知识
###  1.mmap 与可执行内存

有些题目会先用 `mmap` 给我们一块可读可写可执行的内存，比如：
```c
secret = (__int64)mmap((void *)0x111000, 0x1000uLL, 7, 34, -1, 0LL);
```

* 第一参数：映射地址（0 表示随机，>0x10000 时映射到自己）
* 第二参数：长度
* 第三参数：保护权限（7 = r + w + x=1+2+4）
* 第五参数：文件句柄（-1 表示匿名）

我们就可以把 **shellcode** 写入到这片内存里并**执行**。

---

### 2. 常见 syscall 编号

Linux x64 下，常用的系统调用号：

* `read`  = 0
* `write` = 1
* `open`  = 2
* `execve` = 59 (0x3b)

执行系统调用的一般步骤：

```asm
mov rax, <syscall号>   ; 系统调用号放在 rax
mov rdi, <参数1>
mov rsi, <参数2>
mov rdx, <参数3>
syscall
```

比如执行 `/bin/sh`：

```asm
execve("/bin/sh", 0, 0)
```

对应寄存器：

* `rax = 59`
* `rdi = "/bin/sh"`
* `rsi = 0`
* `rdx = 0`   

**对应汇编**：
```asm
shellcode="mov rsi,0;mov rdx,0;mov rax,59;push 0x68732f6e69622f;pop rdi;syscall"
```
---

### 3. asm()函数

pwntools 提供了 `asm()` 快速把汇编翻译成字节码：

```python
shellcode=asm(shellcode)
```



---

## 小tips

### 1. 绕过字符串检测（strlen 等）---> **push 0;**

有些题目会检测输入的字符串，如果包含 `\x00` 截断（如 `strlen`），可以利用`push 0` 在栈上手动压入空字符，避免直接输入 `\x00`（这个会导致你写入的目标汇编被截成其他无效汇编，执行不可知的操作）：

```asm
push 0              ; 压入 \x00
mov rsi, rsp
```

这样就能通过可打印字符串的检验了。

---

### 2.没有`/bin/sh`  --->写入`/bin/sh`到映射的内存中
`.ljust()`函数：用二参向右填充满一参字节，不会覆盖原有数据。

```python  
shellcode.ljust(0x50,b"\x00")+b"/bin/sh\x00" 
```
此时`/bin/sh`的地址就是`0x111050`（假设映射地址是`0x111000`），`mov rdi, 0x111050`即可。


---
### 3.mov 消耗过大 ---> **push + pop**
如`mov rsi,0;`可以用`push 0; pop rsi;`代替，节省字节数。

---
### 4.翻译汇编的网站
可以使用 [https://defuse.ca/online-x86-assembler.htm](https://defuse.ca/online-x86-assembler.htm) 这个网站把汇编代码翻译成机器码。   
师傅们可以使用这个工具来调试和优化自己的 shellcode。

---
##  总结

* **mmap** 常用于获取一片可执行内存，用来写 shellcode。
* **syscall 编号** 可以记一下，尤其是 read/write/open/execve。
* 写字符串时注意 `\x00` 截断问题，必要时用 `push 0；` 手动补。
* `mov` 指令有时过长，可以用 `push + pop` 代替。


---

