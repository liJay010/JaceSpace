# gdb调试

## 1.安装与运行

**ubuntu gdb安装**

```sh
sudo apt install gdb
```

**开启调试选项(命令)**

```sh
g++ -g -o main main.cpp
```

**开启调试选项(cmake)**

```cmake
# 生成debug版本，可以进行gdb调试
set(CMAKE_BUILD_TYPE "Debug")
```

**运行gdb -- 退出gdb** 

```sh
gdb [可执行程序]
quit
```

**设置/查看命令行参数**

```sh
set args 2 5 #设置命令行参数
show args #查看命令行参数
run arg1 arg2
```

**查看当前文件代码**

```sh
list/l #（从默认位置显示）
list/l 行号 #（从指定的行显示）
list/l 函数名 #（从指定的函数显示）
```

**设置显示的行数**

```sh
show list/listsize
set list/listsize 行数
```

**查看非当前文件代码**

```sh
list/l 文件名:行号
list/l 文件名:函数名
```



## 2.调试命令

**设置断点**

设置断点：在GDB中，使用`break`命令设置断点。例如，要在`main`文件的第10行设置断点，可以执行以下命令：

```cpp
break main:10
info b //查看断点
delete //删除断点
delete 断点编号
delete 5-7 10-12
```

**调试命令**

```sh
next（简写为n）# ：单步执行下一行代码,不会进入函数体。
step（简写为s）# ：单步执行下一行代码，如果有函数调用，则进入函数。 finish（跳出函数体）
continue（简写为c）# ：继续执行程序，直到下一个断点或程序结束。
print（简写为p）变量名 # ：打印变量的值。 修改： p 变量名=值

ptype 变量名 # ：打印变量类型。

# 为函数断点设置条件
# void cond_fun_test(int a,const char *str)
b cond_fun_test if a==10


backtrace（简写为bt）# ：打印当前的堆栈信息。
quit（简写为q）# ：退出GDB调试器。
```

**自动变量操作**

```sh
display #变量名（自动打印指定变量的值） display {var1, var2, var3}
i/info display
undisplay 编号
```

**其它操作**

```sh
set var 变量名=变量值 #（循环中用的较多）
until （#跳出循环）
```



## 3.线程管理

```cpp
#include <vector>
#include <thread>
#include <iostream>
#include <cstring>
#include <stdlib.h>

int count = 0;

void
do_work(void* arg)
{
    std::cout << "线程函数开始" << std::endl;
    //模拟做一些事情
    int local_data = count;
    count++;
    std::this_thread::sleep_for(std::chrono::seconds(3));
    std::cout << "线程函数结束" << std::endl;
}

int
start_threads(int thread_num)
{
    std::vector<std::thread> threads;
    //启动10个线程
    for (int i = 0; i < thread_num; ++i)
    {
        threads.push_back(std::thread(do_work, &i));
        std::cout << "启动新线程：" << i << std::endl;
    }
    //等待所有线程结束
    for (auto& thread : threads)
    {
        thread.join();
    }

    std::cout << "love" << std::endl;
}

int
main(int argc, char* argv[])
{
    start_threads(10);
}

```



```shell
# 查看当前进程的所有线程信息
info threads
# 切换线程
thread 线程id
# 为线程设置断点
# break 断点 thread 线程id
b 155 thread 2
# 为线程执行命令
# thread apply 线程号 命令
thread apply 2 3 i locals
thread apply all bt
```

- 设置观察点

```shell
# watch
watch count
watch count==5
# 读取观察点：当该变量或者表达式被读取时，程序会发生中断
rwatch 变量或表达式
# 读写观察点：无论这个变量是被读取还是被写入，程序都会发生中断，即只要遇到这个变量就会发生中断
awatch 变量或表达式
# 查看所有观察点
info watchpoints
```

- 窗口管理

  ```shell
  # layout命令可以设置显示哪个窗口、是否切分窗口等
  
  # 显示下一个窗口
  layout next
  # 显示前一个窗口
  layout prev
  # 只显示源代码窗口
  layout src
  # 只显示汇编窗口
  layout asm
  # 显示源代码和汇编窗口
  layout split
  # 显示寄存器窗口，与汇编，源码窗口一起显示
  layout regs
  # 设置窗口为活动窗口，以便能够相应上下滚动键
  focus next | prev | src | asm | regs | split
  # 刷新屏幕
  refresh
  # 更新源码窗口
  update
  ```

  
