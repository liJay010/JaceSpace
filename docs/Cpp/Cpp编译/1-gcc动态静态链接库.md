# GCC和链接库

## 1.GCC编译器

gcc编译器从拿到一个c源文件到生成一个可执行程序，中间一共经历了四个步骤：

![clip_image002](img\clip_image002.png)

四个步骤并不是gcc独立完成的，而是在内部调用了其他工具，从而完成了整个工作流程：

![clip_image002-1527509458588](img\clip_image002-1527509458588.png)

gcc工作的流程

> deng@itcast:~/share/3rd/1gcc$ ls 1hello.c
>
> 第一步: 进行预处理
>
> deng@itcast:~/share/3rd/1gcc$ gcc -E 1hello.c -o 1hello.i
>
> 第二步: 生成汇编文件
>
> deng@itcast:~/share/3rd/1gcc$ gcc -S 1hello.i -o 1hello.s
>
> 第三步: 生成目标代码
>
> deng@itcast:~/share/3rd/1gcc$ gcc -c 1hello.s -o 1hello.o
>
> 第四步: 生成可以执行文件
>
> deng@itcast:~/share/3rd/1gcc$ gcc 1hello.o -o 1hello 第五步: 执行 deng@itcast:~/share/3rd/1gcc$ ./1hello hello itcast

 

直接将源文件生成一个可以执行文件

> deng@itcast:~/share/3rd/1gcc$ gcc 1hello.c -o 1hello deng@itcast:~/share/3rd/1gcc$ ./1hello hello itcast

如果不指定输出文件名字, gcc编译器会生成一个默认的可以执行a.out

> deng@itcast:~/share/3rd/1gcc$ gcc 1hello.c
> deng@itcast:~/share/3rd/1gcc$ ls 1hello 1hello.c 1hello.i 1hello.o 1hello.s a.out deng@itcast:~/share/3rd/1gcc$ ./a.out
> hello itcast

gcc常用选项

| **选项**       | **作用**                   |
| :------------- | :------------------------- |
| -o file        | 指定生成的输出文件名为file |
| -E             | 只进行预处理               |
| -S(大写)       | 只进行预处理和编译         |
| -c(小写)       | 只进行预处理、编译和汇编   |
| -v / --version | 查看gcc版本号              |
| -g             | 包含调试信息               |
| -On n=0~3      | 编译优化，n越大优化得越多  |
| -Wall          | 提示更多警告信息           |
| -D             | 编译时定义宏               |

显示所有的警告信息

> gcc -Wall test.c

将警告信息当做错误处理

> gcc -Wall -Werror test.c



## 2.静态连接和动态连接

链接分为两种：**静态链接**、**动态链接**。

**1）静态链接**

静态链接：由链接器在链接时将库的内容加入到可执行程序中。

优点：

- 对运行环境的依赖性较小，具有较好的兼容性

缺点：

- 生成的程序比较大，需要更多的系统资源，在装入内存时会消耗更多的时间
- 库函数有了更新，必须重新编译应用程序

**2）动态链接**

动态链接：连接器在链接时仅仅建立与所需库函数的之间的链接关系，在程序运行时才将所需资源调入可执行程序。

优点：

- 在需要的时候才会调入对应的资源函数
- 简化程序的升级；有着较小的程序体积
- 实现进程之间的资源共享（避免重复拷贝）

缺点：

- 依赖动态库，不能独立运行
- 动态库依赖版本问题严重

**3）静态、动态编译对比**

前面我们编写的应用程序大量用到了标准库函数，系统默认采用动态链接的方式进行编译程序，若想采用静态编译，加入-static参数。

以下是分别采用动态编译、静态编译时文件对比：

测试程序(test.c)如下：

```cpp
#include <stdio.h>

int main(void)
{
    printf("hello world\n");

    return 0;
}
```

编译：

> deng@itcast:~/test$ gcc test.c -o test_share
>
> deng@itcast:~/test$ gcc -static test.c -o test_static

结果对比：

![1527510332615](img\1527510332615.png)

## 3.静态库和动态库简介

所谓“程序库”，简单说，就是包含了数据和执行码的文件。其不能单独执行，可以作为其它执行程序的一部分来完成某些功能。

库的存在可以使得程序模块化，可以加快程序的再编译，可以实现代码重用,可以使得程序便于升级。

程序库可分**静态库(static library)**和**共享库(shared library)**。

### 3.1静态库制作和使用

静态库可以认为是一些目标代码的集合，是在可执行程序运行前就已经加入到执行码中，成为执行程序的一部分。

按照习惯,一般以“.a”做为文件后缀名。静态库的命名一般分为三个部分：

- 前缀：lib
- 库名称：自己定义即可
- 后缀：.a

所以最终的静态库的名字应该为：**libxxx.a**

**1） 静态库制作**

![clip_image002-1527510689190](img\clip_image002-1527510689190.jpg)

步骤1：将c源文件生成对应的.o文件

> deng@itcast:~/test/3static_lib$ gcc -c add.c -o add.o
> deng@itcast:~/test/3static_lib$ gcc -c sub.c -o sub.o deng@itcast:~/test/3static_lib$ gcc -c mul.c -o mul.o deng@itcast:~/test/3static_lib$ gcc -c div.c -o div.o

步骤2：使用打包工具ar将准备好的.o文件打包为.a文件 libtest.a

> deng@itcast:~/test/3static_lib$ ar -rcs libtest.a add.o sub.o mul.o div.o

**在使用ar工具是时候需要添加参数：rcs**

- r更新
- c创建
- s建立索引

 

**2）静态库使用**

静态库制作完成之后，需要将.a文件和头文件一起发布给用户。

假设测试文件为main.c，静态库文件为libtest.a头文件为head.h

编译命令：

> deng@itcast:~/test/4static_test$ gcc test.c -L./ -I./ -ltest -o test

参数说明：

- -L：表示要连接的库所在目录

- -I./: I(大写i) 表示指定头文件的目录为当前目录

- -l(小写L)：指定链接时需要的库，去掉前缀和后缀

  ![clip_image002-1527510920275](img\clip_image002-1527510920275.jpg)

### 3.2动态库制作和使用

共享库在程序编译时并不会被连接到目标代码中，而是在程序运行是才被载入。不同的应用程序如果调用相同的库，那么在内存里只需要有一份该共享库的实例，规避了空间浪费问题。

动态库在程序运行是才被载入，也解决了静态库对程序的更新、部署和发布页会带来麻烦。用户只需要更新动态库即可，增量更新。

按照习惯,一般以“.so”做为文件后缀名。共享库的命名一般分为三个部分：

- 前缀：lib
- 库名称：自己定义即可
- 后缀：.so

所以最终的动态库的名字应该为：libxxx.so

![clip_image002-1527511145606](img\clip_image002-1527511145606.jpg)

**1）动态库制作**

步骤一：生成目标文件，此时要加编译选项：-fPIC（fpic）

> deng@itcast:~/test/5share_lib$ gcc -fPIC -c add.c
> deng@itcast:~/test/5share_lib$ gcc -fPIC -c sub.c deng@itcast:~/test/5share_lib$ gcc -fPIC -c mul.c deng@itcast:~/test/5share_lib$ gcc -fPIC -c div.c

参数：-fPIC 创建与地址无关的编译程序（pic，position independent code），是为了能够在多个应用程序间共享。

步骤二：生成共享库，此时要加链接器选项: -shared（指定生成动态链接库）

> deng@itcast:~/test/5share_lib$ gcc -shared add.o sub.o mul.o div.o -o libtest.so

步骤三: 通过nm命令查看对应的函数

> deng@itcast:~/test/5share_lib$ nm libtest.so | grep add 00000000000006b0 T add deng@itcast:~/test/5share_lib$ nm libtest.so | grep sub 00000000000006c4 T sub

 

ldd查看可执行文件的依赖的动态库

> deng@itcast:~/share/3rd/2share_test$ ldd test linux-vdso.so.1 => (0x00007ffcf89d4000) libtest.so => /lib/libtest.so (0x00007f81b5612000) libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f81b5248000) /lib64/ld-linux-x86-64.so.2 (0x00005562d0cff000)

**2）动态库测试**

引用动态库编译成可执行文件（跟静态库方式一样）

> deng@itcast:~/test/6share_test$ gcc test.c -L. -I. -ltest (-I. 大写i -ltest 小写L)

然后运行：./a.out，发现竟然报错了！！！

- 当系统加载可执行代码时候，能够知道其所依赖的库的名字，但是还需要知道绝对路径。此时就需要系统动态载入器(dynamic linker/loader)。
- 对于elf格式的可执行程序，是由ld-linux.so*来完成的，它先后搜索elf文件的 DT_RPATH段 — 环境变量LD_LIBRARY_PATH — /etc/ld.so.cache文件列表 — **/lib/, /usr/lib**目录找到库文件后将其载入内存。

 

**3）如何让系统找到动态库**

- 拷贝自己制作的共享库到/lib或者/usr/lib(不能是/lib64目录)
- 临时设置LD_LIBRARY_PATH：

> export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:库路径

- 永久设置,把export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:库路径，设置到~/.bashrc或者 /etc/profile文件中

  > deng@itcast:~/share/3rd/2share_test$ vim ~/.bashrc
  >
  > 最后一行添加如下内容:
  >
  > export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/home/deng/share/3rd/2share_test

  使环境变量生效

  > deng@itcast:~/share/3rd/2share_test$ source ~/.bashrc deng@itcast:~/share/3rd/2share_test$ ./test
  > a + b = 20 a - b = 10

- 将其添加到 /etc/ld.so.conf文件中

  编辑/etc/ld.so.conf文件，加入库文件所在目录的路径

  运行sudo ldconfig -v，该命令会重建/etc/ld.so.cache文件

  > deng@itcast:~/share/3rd/2share_test$ sudo vim /etc/ld.so.conf
  >
  > 文件最后添加动态库路径(绝对路径)

- > 使生效
  >
  > deng@itcast:~/share/3rd/2share_test$ sudo ldconfig -v

- 使用符号链接， 但是一定要使用绝对路径

  deng@itcast:~/test/6share_test$ sudo ln -s /home/deng/test/6share_test/libtest.so /lib/libtest.so