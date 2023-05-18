# Shell基本语法

Shell是Linux/Unix下的脚本编程语言，解释执行，无需提前编译；同时是一个程序，连接着操作系统内核和用户以及其他程序。 Shell 编程跟 JavaScript、php 编程一样，只要有一个能编写代码的文本编辑器和一个能解释执行的脚本解释器就可以了。

## 一、第一个shell脚本

```bash
#! /bin/bash
echo "Hello Word!"
```

解释：

- `#!`是一个约定的标记，它告诉系统这个脚本需要什么解释器来执行，即使用哪一种 Shell
- `echo`命令用于向窗口输出文本。

## 二、运行shell脚本的方式

### 2.1 作为可执行程序

将shell脚本代码保存到`*.sh`文件，终端`cd`到相应目录

```bash
chmod +x ./*.sh #使得shell脚本具有可执行权限
./*.sh #执行脚本
```

### 2.2 作为解释器参数

这种运行方式是，直接运行解释器，将脚本文件作为解释器参数

```bash
/bin/bash *.sh
```

------

## 三、shell变量

### 3.1 变量名的命名规则

- 命名只能使用英文字母，数字和下划线
- 首个字符不能以数字开头
- 不能使用bash里的关键字（可用help命令查看保留关键字）

### 3.2变量的赋值

给变量赋值的同时既是对变量的定义

```bash
#【1】显式赋值
name="Qiu"
#【2】语句赋值
for file in 'ls /etc'
```

**注意** 变量名和等号之间不能有空格

### 3.3 使用变量

使用`${变量名}`可取变量存储的值

```bash
name="Qiu"
echo ${name}
```

### 3.4 定义只读变量

> 只读变量只能进行读取，而不能进行修改，类似于C++里面的`const`变量，使用`readonly`命令可将变量改变为只读变量

```bash
#! /bin/bash
My_name="Qiu"
readonly My_name
```

### 3.5 删除变量

使用`unset`命令删除变量

```bash
unset My_name
```

**注意：** 变量删除后不能再次使用其值。利用`readonly`定义的只读变量不能通过`unset`删除

### 3.6 变量类型

> 运行shell时，会同时存在三种变量：

- **1) 局部变量** 局部变量在脚本或命令中定义，仅在当前shell实例中有效，其他shell启动的程序不能访问局部变量。
- **2) 环境变量** 所有的程序，包括shell启动的程序，都能访问环境变量，有些程序需要环境变量来保证其正常运行。必要的时候shell脚本也可以定义环境变量。
- **3) shell变量** shell变量是由shell程序设置的特殊变量。shell变量中有一部分是环境变量，有一部分是局部变量，这些变量保证了shell的正常运行

------

## 四、shell字符串

> shell字符串可以用单引号，也可以用双引号，也可以不用引号 。

### 4.1 单引号

```bash
str='this is a string'
```

单引号字符串的限制：

- 单引号里的任何字符都会原样输出，单引号字符串中的变量是无效的；
- 单引号字串中不能出现单独一个的单引号（对单引号使用转义符后也不行），但可成对出现，作为字符串拼接使用

### 4.2 双引号

```bash
#!/bin/bash
My_name="Qiu"
str="My name is ${My_name}"
echo ${str}
```

双引号的优点：

- 双引号里可以应用变量
- 双引号里可以使用转义字符

### 4.3 拼接字符串

```bash
#【1】使用双引号
#! /bin/bash
My_first="Qiu"
My_second="Kai"
My_name="My name is ${My_first}${My_second}!"
echo ${My_name}
My_name1="My name is "${My_first}${My_second}
echo ${My_name1}
#【2】使用单引号
My_name3='My name is '${My_first}${My_second}
echo ${My_name}
```

### 4.4 输出字符串的长度

```bash
#! /bin/bash
string="QiuKai"
echo ${#string}
```

### 4.5 提取子字符串

```bash
#! /bin/bash
string="I Love You!"
echo "string:${string}"
echo "string的长度为：${#string}"
string1=${string:1:4}
echo "string1:${string1}"
echo "string1的长度为${#string1}"
```

### 4.6 查找字符位置（首次出现的位置）

```bash
#! /bin/bash
string="I Love You!"
index=`expr index "${string}" oY`
echo ${index}
```

------

## 五、shell数组

> bash支持一维数组（不支持多维数组），并且不限定数组大小。shell数组可以存储不同类型的值
>
> 通过下标索引获取数组元素，数组下标由0开始，并且下标为大于等于0的整数或整数表达式

### 5.1 定义数组

> 在shell中，用括号表示数组，数组元素之间用空格区分

一般形式：

```bash
数组名=(元素1 元素2 元素3 ...)
或者
数组名=(
元素1
元素2
元素3
...)
```

### 5.2 访问数组元素

> 在shell中访问数组元素的一般格式：

```bash
元素1=${数组名[index]}
#使用@访问所有元素
echo ${数组名[@]}
```

### 5.3 获取数组长度

```bash
# 【1】获取数组长度
length=${#数组名[@]}
或者
length=${#数组名[*]}
#【2】获取单个元素的长度
length=${#数组名[index]}
```

### 5.4 数组示例

```bash
#!/bin/bash
array=(1 2 3 4 5 6)
echo "数组的元素为：${array[@]}"
echo "第3个元素为：${array[2]}"
echo "方法1，数组的长度为：${#array[@]}"
echo "方法2，数组的长度为：${#array[*]}"
```

------

## 六、shell注释

### 6.1 单行注释

```bash
#第一个注释
#第二个注释
```

### 6.2 多行注释

```bash
:<<标志
注释1
注释2
...
标志
```

其中标志通常为`EOF`

------

## 七、shell传递参数

> 在shell脚本执行时，可以通过`$n`方式，向脚本传递参数
>
> 传参过程：
>
> 通过：./filename.sh 参数1 参数2 参数3 … 将参数值传入脚本执行过程
>
> 在脚本文件中，$0:默认为脚本文件名
>
> $1:参数1
>
> $2:参数2
>
> …

```bash
test.sh
#! /bin/bash
#定义数组
array=($1 $2 $3)
echo "脚本文件名为：$0"
echo "数组为：${array[@]}"
```

使用特殊字符处理参数：

- $# : 传递到脚本的参数个数
- $* : 以字符串形式显示所有传向脚本的参数
- $$ : 脚本运行的当前进程ID号
- $! : 后台运行的最后一个进程的ID号
- @ : 用 法 同 @ : 用法同@:用法同*，但是返回的字符串加引号
- $? : 显示最后命令的退出状态，0表示没有错误，其他任何值表明有错误

```bash
#! /bin/bash
array=($1 $2 $3 $4)
b=$5
echo "传入的参数的个数为：$#"
echo "传入的参数为：$*"
echo "传入的参数为：$@"
echo "脚本当前运行的进程号为:$$"
echo "数组为：${array[@]}"
echo "数组的第一个参数为：${array[0]}"
echo "b的值为：$5"
```

**注意** `$*`和`$@`的区别：

- 相同点：都是引用所有的参数
- 不同点：`$*`表示所有参数为一个整体字符串，而`$@`则将每一个参数都分别表示为一个字符串

演示：

```bash
#! /bin/bash
echo "对于\$@和\$*的演示"
for i in "$@";do
        echo ${i}
done

for i in "$*";do
        echo ${i}
done
```

结果：

```bash
(base) kaidaqiu@kaidaqiu-GL63-8RE:~/Code/test03$ ./test2.sh 2 3 4 5 4 3
对于$@和$*的演示
2
3
4
5
4
3
2 3 4 5 4 3
```

------

## 八、shell基本运算符

> shell支持的运算符有：
>
> - 算术运算符
> - 关系运算符
> - 布尔运算符
> - 字符串运算符
> - 文件测试运算符
>
> 原生的bash不支持简单的数学运算，但是可以通过其他命令来实现，如：awk,expr。其中expr最常用

使用`expr`命令进行数学运算

- 完整表达式要被反引号````````包含，而不是单引号
- 表达式和运算符之间要有空格：2 + 2(不是2+2)

### 8.1 算术运算符

- `+`：加法
- `-`减法
- `*`：乘法
- `/`：除法
- `%`：取余
- `=`：赋值
- `==`：相等
- `！=`不等

**注意：**

- 条件表达式要放在方括号之间，并且要有空格，例如: **[\**a = = a==a==\**b]** 是错误的，必须写成 **[ $a == $b ]**。
- 乘号(*)前边必须加反斜杠(\)才能实现乘法运算

示例：

```bash
#! /bin/bash
a=10
b=20
echo "a和b的值分别为：$a $b"
echo "a+b=`expr $a + $b`"
echo "a-b=`expr $a - $b`"
echo "a*b=`expr $a \* $b`"
echo "a/b=`expr $a / $b`"
echo "a%b=`expr $a % $b`"
if [ $a == $b ]
then
        echo "a=b"
else
        echo "a!=b"
fi
```

结果：

```bash
(base) kaidaqiu@kaidaqiu-GL63-8RE:~/Code/test03$ ./test3.sh 
a和b的值分别为：10 20
a+b=30
a-b=-10
a*b=200
a/b=0
a%b=10
a!=b
```

补充：代码块中`[]`可以执行基本的算术运算：

```bash
#!/bin/bash
#!/bin/bash
a=5
b=6
result=$[a+b] # 注意等号两边不能有空格
echo "result为：$result"

result为：11

```

### 8.2 关系运算符

> 关系运算符只支持数字，不支持字符串，除非字符串的值是数字。

- `-eq`:检测左右表达式的值是否相等，==
- `-ne`：检测左右表达式的值是否不相等，!=
- `-gt`:检测左边的值是否大于右边的值，>
- `-lt`:检测左边的值是否小于右边的值，<
- `-ge`:检测左边的值是否大于等于右边的值，>=
- `-le`:检测左边的值是否小于等于右边的值，<=

示例：

```bash
a=10
b=20
if [ $a -eq $b ]
then
   echo "$a -eq $b : a 等于 b"
else
   echo "$a -eq $b: a 不等于 b"
fi
```

### 8.3 布尔运算符

- `!`非运算，单目运算符
- `-o`或运算，两边有一个为True,则为True
- `-a`与运算,两边表达式均为True时，才为True

示例

```bash
#!/bin/bash
a=10
b=20

if [ $a != $b ]
then
   echo "$a != $b : a 不等于 b"
else
   echo "$a == $b: a 等于 b"
fi
```

### 8.4 逻辑运算符

- `&&`：逻辑AND,两边都为True，则为True
- `||`:逻辑OR，有一边为True，则为True

示例：

```bash
#!/bin/bash
a=10
b=20

if [[ $a -lt 100 && $b -gt 100 ]]
then
   echo "返回 true"
else
   echo "返回 false"
fi
```

### 8.5 字符串运算符

- `=`：检测两个字符串是否相等
- `!=`:检测两个字符串是否不想等
- `-z`:检测字符串长度是否为0,若为0,则返回True
- `-n`:检测字符串长度是否为0,若不为0,则返回True
- `$`:检测字符串是否为空

示例：

```bash
#!/bin/bash
a="abc"
b="efg"

if [ $a = $b ]
then
   echo "$a = $b : a 等于 b"
else
   echo "$a = $b: a 不等于 b"
fi
if [ $a != $b ]
then
   echo "$a != $b : a 不等于 b"
else
   echo "$a != $b: a 等于 b"
fi
if [ -z $a ]
then
   echo "-z $a : 字符串长度为 0"
else
   echo "-z $a : 字符串长度不为 0"
fi
if [ -n "$a" ]
then
   echo "-n $a : 字符串长度不为 0"
else
   echo "-n $a : 字符串长度为 0"
fi
if [ $a ]
then
   echo "$a : 字符串不为空"
else
   echo "$a : 字符串为空"
fi
```

### 8.6 文件测试符

- `-b`:检测文件是否是块设备文件，如果是，则返回 true。
- `-c`:检测文件是否是字符设备文件，如果是，则返回 true。
- `-d`:检测文件是否是目录，如果是，则返回 true。
- `-f`:检测文件是否是普通文件（既不是目录，也不是设备文件），如果是，则返回 true。
- `-g`:检测文件是否设置了 SGID 位，如果是，则返回 true。
- `-k`:检测文件是否设置了粘着位(Sticky Bit)，如果是，则返回 true。
- `-p`:检测文件是否是有名管道，如果是，则返回 true。
- `-u`:检测文件是否设置了 SUID 位，如果是，则返回 true。
- `-r`:检测文件是否可读，如果是，则返回 true。
- `-w`:检测文件是否可写，如果是，则返回 true。
- `-x`:检测文件是否可执行，如果是，则返回 true。
- `-s`:检测文件是否为空（文件大小是否大于0），不为空返回 true。
- `-e`:检测文件（包括目录）是否存在，如果是，则返回 true。
- `-S`:判断某文件是否 socket。
- `-L`:检测文件是否存在并且是一个符号链接。

示例：

```bash
#!/bin/bash
# author:菜鸟教程
# url:www.runoob.com

file="/var/www/runoob/test.sh"
if [ -r $file ]
then
   echo "文件可读"
else
   echo "文件不可读"
fi
if [ -w $file ]
then
   echo "文件可写"
else
   echo "文件不可写"
fi
if [ -x $file ]
then
   echo "文件可执行"
else
   echo "文件不可执行"
fi
if [ -f $file ]
then
   echo "文件为普通文件"
else
   echo "文件为特殊文件"
fi
if [ -d $file ]
then
   echo "文件是个目录"
else
   echo "文件不是个目录"
fi
if [ -s $file ]
then
   echo "文件不为空"
else
   echo "文件为空"
fi
if [ -e $file ]
then
   echo "文件存在"
else
   echo "文件不存在"
fi
```

## 九、shell echo命令

命令格式：

```bash
echo string
```

### 9.1显示普通字符

```bash
echo "I Love You!"  #双引号可以省略
```

### 9.2显示转义字符

```bash
echo "\"I Love You!\""
```

### 9.3 显示变量

```
test.sh
#! /bin/bash
read name
echo "${name} It's a test!"

chmod +x test.sh
./test.sh
OK
OK  It's a test!

```

### 9.4 显示换行

```bash
echo -e "OK! \n" # -e 开启转义
echo "It is a test"

OK!

It is a test

```

### 9.5 显示不换行

```bash
#!/bin/sh
echo -e "OK! \c" # -e 开启转义 \c 不换行
echo "It is a test"

OK! It is a test

```

### 9.6 显示结果定向至文件

```bash
echo "It is a test" > myfile

```

### 9.7 原样输出字符串，不进行转义或取变量(用单引号)

```bash
#! /bin/bash 
name="Qiu"
echo '$name'

$name

```

### 9.8 显示命令日期

> 这里使用的是反引号 `, 而不是单引号 '。

```bash
echo `date`

2019年 11月 02日 星期六 23:08:11 CST

```

## 十、shell printf命令

> printf 命令模仿 C 程序库（library）里的 printf() 程序。默认 printf 不会像 echo 自动添加换行符，我们可以手动添加 \n。

printf命令的语法：

```bash
printf format-string [argumetLists]

```

参数说明：

- format-string :为格式控制字符串，用于设置输出的格式
- argumentLists:为参数列表，为输出的内容

示例：

```bash
#! /bin/bash
printf "%-10s %-8s %-4s\n" 姓名 性别 体重kg  
printf "%-10s %-8s %-4.2f\n" 郭靖 男 66.1234 
printf "%-10s %-8s %-4.2f\n" 杨过 男 48.6543 
printf "%-10s %-8s %-4.2f\n" 郭芙 女 47.9876 

```

结果：

```bash
(base) kaidaqiu@kaidaqiu-GL63-8RE:~/Code/test03$ sh test4.sh
姓名     性别   体重kg
郭靖     男      66.12
杨过     男      48.65
郭芙     女      47.99

```

代码说明：

> `%s``````%c``````%d``````%f`都是格式替换符
>
> `%-10s`指一个宽度为10个字符，`-`左对齐（默认为右对齐）。若字符串不足以0填充，超出则全部显示
>
> `%-4.2f`指格式化为float类型，左对齐，且只保留2位小数

补充：

```bash
# 格式只指定了一个参数，但多出的参数仍然会按照该格式输出，format-string 被重用
printf %s abc def

# 如果没有 arguments，那么 %s 用NULL代替，%d 用 0 代替
printf "%s and %d \n" 

```

## 十一、shell test命令

> Shell中的 test 命令用于检查某个条件是否成立，它可以进行数值、字符和文件三个方面的测试。

### 11.1 数值测试

- `-eq`:检测左右表达式的值是否相等，==
- `-ne`：检测左右表达式的值是否不相等，!=
- `-gt`:检测左边的值是否大于右边的值，>
- `-lt`:检测左边的值是否小于右边的值，<
- `-ge`:检测左边的值是否大于等于右边的值，>=
- `-le`:检测左边的值是否小于等于右边的值，<=

示例：

```bash
#!/bin/bash
num1=100
num2=100
if test ${num1} -eq ${num2}
then
    echo '两个数相等！'
else
    echo '两个数不相等！'
fi

两个数相等！

```

### 11.2 字符串测试

- `=`：检测两个字符串是否相等
- `!=`:检测两个字符串是否不想等
- `-z`:检测字符串长度是否为0,若为0,则返回True
- `-n`:检测字符串长度是否为0,若不为0,则返回True

示例：

```bash
#! /bin/bash
num1="Qiu"
num2="qiu"
if test ${num1} = ${num2}
then
    echo '两个字符串相等!'
else
    echo '两个字符串不相等!'
fi

两个字符串不相等!

```

### 11.3 文件测试

- `-b`:检测文件是否是块设备文件，如果是，则返回 true。
- `-c`:检测文件是否是字符设备文件，如果是，则返回 true。
- `-d`:检测文件是否是目录，如果是，则返回 true。
- `-f`:检测文件是否是普通文件（既不是目录，也不是设备文件），如果是，则返回 true。
- `-g`:检测文件是否设置了 SGID 位，如果是，则返回 true。
- `-k`:检测文件是否设置了粘着位(Sticky Bit)，如果是，则返回 true。
- `-p`:检测文件是否是有名管道，如果是，则返回 true。
- `-u`:检测文件是否设置了 SUID 位，如果是，则返回 true。
- `-r`:检测文件是否可读，如果是，则返回 true。
- `-w`:检测文件是否可写，如果是，则返回 true。
- `-x`:检测文件是否可执行，如果是，则返回 true。
- `-s`:检测文件是否为空（文件大小是否大于0），不为空返回 true。
- `-e`:检测文件（包括目录）是否存在，如果是，则返回 true。
- `-S`:判断某文件是否 socket。
- `-L`:检测文件是否存在并且是一个符号链接。

示例：

```bash
cd /bin
if test -e ./bash
then
    echo '文件已存在!'
else
    echo '文件不存在!'
fi

文件已存在!

```

## 十二、shell控制流

### 12.1 if…else语句

#### 12.1.1 if语法

```bash
if condition
then
    command1 
    command2
    ...
    commandN 
fi

```

写成一行（适用于终端命令）：

```bash
if condition; then command1; command2; fi

```

#### 12.1.2 if…else语法

```bash
if condition
then
    command1 
    command2
    ...
    commandN
else
    command
fi

```

#### 12.1.3 if…elif…else语法

```bash
if condition1
then
    command1
elif condition2 
then 
    command2
else
    commandN
fi

```

### 12.2 for语句

for循环一般语法：

```bash
for var in item1 item2 ... itemN
do
    command1
    command2
    ...
    commandN
done

```

写成一行（适用于终端）：

```bash
for var in item1 item2 ... itemN; do command1; command2… done;

```

示例：

```bash
for loop in 1 2 3 4 5
do
    echo "The value is: $loop"
done
1234
The value is: 1
The value is: 2
The value is: 3
The value is: 4
The value is: 5

```

补充(shell的for语句可以和C中类似)：

```bash
#!/bin/bash
for((i=1;i<=5;i++));do
    echo "这是第 $i 次调用";
done;

这是第 1 次调用
这是第 2 次调用
这是第 3 次调用
这是第 4 次调用
这是第 5 次调用

```

### 12.3 while语句

while循环语法：

```bash
while condition
do
    command
done

```

补充：

> while循环可用于读取键盘信息。

```bash
echo '按下 <CTRL-D> 退出'
echo -n '输入你最喜欢的网站名: '
while read FILM
do
    echo "是的！$FILM 是一个好网站"
done

```

> 无限循环

```bash
while true
do
    command
done

#或者
while :
do
    command
done

#或者
for (( ; ; ))

```

### 12.4 until语句

> until 循环执行一系列命令直至条件为 true 时停止。until 循环与 while 循环在处理方式上刚好相反(while是在条件为true时执行，而until语句则是在条件为false时执行)。一般 while 循环优于 until 循环，但在某些时候—也只是极少数情况下，until 循环更加有用。

until语法：

```bash
until condition
do
    command
done

```

### 12.5 case语句

> Shell case语句为多选择语句。可以用case语句匹配一个值与一个模式，如果匹配成功，执行相匹配的命令。
>
> 取值后面必须为单词in，每一模式必须以右括号结束。取值可以为变量或常数。匹配发现取值符合某一模式后，其间所有命令开始执行直至 ;;。
>
> 取值将检测匹配的每一个模式。一旦模式匹配，则执行完匹配模式相应命令后不再继续其他模式。如果无一匹配模式，使用星号 * 捕获该值，再执行后面的命令。

case语法：

```bash
case 值 in
模式1)
    command1
    command2
    ...
    commandN
    ;;
模式2）
    command1
    command2
    ...
    commandN
    ;;
esac

```

示例：

```bash
echo '输入 1 到 4 之间的数字:'
echo '你输入的数字为:'
read aNum
case $aNum in
    1)  echo '你选择了 1'
    ;;
    2)  echo '你选择了 2'
    ;;
    3)  echo '你选择了 3'
    ;;
    4)  echo '你选择了 4'
    ;;
    *)  echo '你没有输入 1 到 4 之间的数字'
    ;;
esac

输入 1 到 4 之间的数字:
你输入的数字为:
3
你选择了 3

```

### 12.6 break和continue语句

> 在循环过程中，有时候需要在未达到循环结束条件时强制跳出循环，不执行循环体内后续命令。
>
> break命令退出所有循环（中止后续循环）
>
> continue命令退出本轮循环，忽略本轮后续命令，执行下次循环

break示例：

```bash
#!/bin/bash
while :
do
    echo -n "输入 1 到 5 之间的数字:"
    read aNum
    case $aNum in
        1|2|3|4|5) echo "你输入的数字为 $aNum!"
        ;;
        *) echo "你输入的数字不是 1 到 5 之间的! 游戏结束"
            break
        ;;
    esac
done

输入 1 到 5 之间的数字:3
你输入的数字为 3!
输入 1 到 5 之间的数字:7
你输入的数字不是 1 到 5 之间的! 游戏结束

```

continue示例：

```bash
#!/bin/bash
echo "#######输入-1退出游戏！#########"
while :
do
    echo -n "输入 1 到 5 之间的数字: "
    read aNum
    case $aNum in
        1|2|3|4|5) echo "你输入的数字为 $aNum!"
        ;;
       -1) echo "退出游戏！"
                break
                ;;
        *) echo "你输入的数字不是 1 到 5 之间的!"
            echo "请重新输入！"
            continue
        ;;
    esac
done

(base) kaidaqiu@kaidaqiu-GL63-8RE:~/Code/test03$ sh test7.sh 
#######输入-1退出游戏！#########
输入 1 到 5 之间的数字: 9
你输入的数字不是 1 到 5 之间的!
请重新输入！
输入 1 到 5 之间的数字: 4
你输入的数字为 4!
输入 1 到 5 之间的数字: -1
退出游戏！

```

## 十三、shell函数

> linux shell 可以用户定义函数，然后在shell脚本中可以随便调用。

shell函数定义的格式：

```bash
[ function ] functionName [()]
{
	action;
	[ return int ]
}

```

格式说明：

- 可以带`function`关键字进行函数定义，也可以不带
- 函数返回值：可用`return`显式返回，并且返回的值为0-255之间；也可以不加`return`默认返回最后一条命令的运行结果。

### 13.1 带参函数

示例：

```bash
#!/bin/bash
function fun()
{
	echo "I Love You! $1 $2"
	echo "一共有$#个参数传入"
}
Name="浙江"
Name1="杭州"
fun ${Name} ${Name1}

I Love You! 浙江 杭州
一共有2个参数传入

```

函数说明：

- 在Shell中，调用函数时可以向其传递参数。在函数体内部，通过 $n 的形式来获取参数的值，例如，$1表示第一个参数，$2表示第二个参数…
- 10 不 能 获 取 第 十 个 参 数 ， 获 取 第 十 个 参 数 需 要 10 不能获取第十个参数，获取第十个参数需要10不能获取第十个参数，获取第十个参数需要{10}。当n>=10时，需要使用${n}来获取参数。
- 特殊字符(用在函数体内)：
  - `$#`传递到脚本的参数个数
  - `$*`以一个单字符串显示所有向脚本传递的参数
  - `$$`脚本运行的当前进程ID号
  - `$!`后台运行的最后一个进程的ID号
  - `$@`与$*相同，但是使用时加引号，并在引号中返回每个参数。
  - `$-`显示Shell使用的当前选项，与set命令功能相同。
  - `$?`显示最后命令的退出状态。0表示没有错误，其他任何值表明有错误。

### 13.2 带返回值函数

示例：

```bash
#!/bin/bash
funWithReturn(){
    echo "这个函数会对输入的两个数字进行相加运算..."
    echo "输入第一个数字: "
    read aNum
    echo "输入第二个数字: "
    read anotherNum
    echo "两个数字分别为 $aNum 和 $anotherNum !"
    return $(($aNum+$anotherNum))
}
funWithReturn
echo "输入的两个数字之和为 $? !"

```

函数说明：

- 函数返回值在调用该函数后通过`$?`来获得。
- 所有函数在使用前必须定义。这意味着必须将函数放在脚本开始部分，直至shell解释器首次发现它时，才可以使用。调用函数仅使用其函数名即可。
- `$?`仅对其上一条指令负责，一旦函数返回后其返回值没有立即保存入参数，那么其返回值将不再能通过`$?`获得。
- shell 语言中 0 代表 true，0 以外的值代表 false。

## 十四、shell输入/输出定向

> 大多数UNIX系统命令从你的终端接受输入并将所产生的输出发送回到您的终端。一个命令通常从一个叫标准输入的地方读取输入，默认情况下，这恰好是你的终端。同样，一个命令通常将其输出写入到标准输出，默认情况下，这也是你的终端。

重定向命令列表：

- command > file ： 将输出重定向到 file。
- command < file ： 将输入重定向到 file。
- command >> file ： 将输出以追加的方式重定向到 file。
- n > file ： 将文件描述符为 n 的文件重定向到 file。
- n >> file ： 将文件描述符为 n 的文件以追加的方式重定向到 file。
- n >& m ： 将输出文件 m 和 n 合并。 、
- n <& m ： 将输入文件 m 和 n 合并。
- << tag ： 将开始标记 tag 和结束标记 tag 之间的内容作为输入。

> 注意： 需要注意的是文件描述符 0 通常是标准输入（STDIN），1 是标准输出（STDOUT），2 是标准错误输出（STDERR）。

### 14.1 输出重定向

> 重定向一般通过在命令间插入特定的符号来实现。

语法：

```bash
command1 > file1

```

- 上面这个命令执行command1然后将输出的内容存入file1。
- 任何file1内的已经存在的内容将被新内容替代。

示例：

```bash
$ who > users

```

执行后，并没有在终端输出信息，这是因为输出已被从默认的标准输出设备（终端）重定向到指定的文件。

```bash
cat users

_mbsetupuser console  Oct 31 17:35 
tianqixin    console  Oct 31 17:35 
tianqixin    ttys000  Dec  1 11:33 

```

> 输出重定向会覆盖文件内容

```bash
$ echo "菜鸟教程：www.runoob.com" > users
$ cat users
菜鸟教程：www.runoob.com

```

> 通过`commond >>file`命令可将输出追加到文件末尾

```bash
$ echo "菜鸟教程：www.runoob.com" >> users
$ cat users
菜鸟教程：www.runoob.com
菜鸟教程：www.runoob.com

```

### 14.2 输入重定向

语法：

```bash
command1 < file1

```

- 本来需要从键盘获取输入的命令会转移到文件读取内容。
- 输出重定向是大于号(>)，输入重定向是小于号(<)。

```bash
command1 < infile > outfile

```

将同时对输入和输出进行重定向，从infile读取内容，执行command1命令后，将结果输出到outfile中。

### 14.3 深入理解重定向

> 一般情况下，每个 Unix/Linux 命令运行时都会打开三个文件：

- 标准输入文件(stdin)：stdin的文件描述符为0，Unix程序默认从stdin读取数据。
- 标准输出文件(stdout)：stdout 的文件描述符为1，Unix程序默认向stdout输出数据。
- 标准错误文件(stderr)：stderr的文件描述符为2，Unix程序会向stderr流中写入错误信息。

#### 14.3.1 重定向错误输出

> 默认情况下，command > file 将 stdout 重定向到 file，command < file 将stdin 重定向到 file。

如果希望 stderr 重定向到 file，语法：

```bash
command 2 > file

```

或者将stderr追加到file文件末尾，语法：

```bash
command 2 >> file

```

> 其中`2`表示标准错误文件(stderr)

#### 14.3.2 合并stdout和stderr后重定向到file

```bash
command > file 2>&1
#或者
command >> file 2>&1

```

### 14.4 Here Document

> Here Document 是 Shell 中的一种特殊的重定向方式，用来将输入重定向到一个交互式 Shell 脚本或程序。

语法：

```bash
command << delimiter
    document
delimiter

```

- 它的作用是将两个 delimiter 之间的内容(document) 作为输入传递给 command。
- 结尾的delimiter 一定要顶格写，前面不能有任何字符，后面也不能有任何字符，包括空格和 tab 缩进。
- 开始的delimiter前后的空格会被忽略掉。

示例： 通过`wc -l`命令计算 Here Document 的行数：

```bash
$ wc -l << EOF
    欢迎来到
    菜鸟教程
    www.runoob.com
EOF
3          # 输出结果为 3 行
$

```

将 Here Document 用于脚本：

```bash
#!/bin/bash
cat << EOF
欢迎来到
菜鸟教程
www.runoob.com
EOF

欢迎来到
菜鸟教程
www.runoob.com

```

### 14.5 /dev/null文件

> 如果希望执行某个命令，但又不希望在屏幕上显示输出结果，那么可以将输出重定向到 /dev/null：

```bash
command > /dev/null

```

- /dev/null 是一个特殊的文件，写入到它的内容都会被丢弃；
- 如果尝试从该文件读取内容，那么什么也读不到。
- /dev/null 文件非常有用，将命令的输出重定向到它，会起到"禁止输出"的效果。

示例： 屏蔽 stdout 和 stderr

```bash
command > /dev/null 2>&1

```

### 14.6 shell文件包含

> Shell 也可以包含外部脚本。这样可以很方便的封装一些公用的代码作为一个独立的文件。

shell文件包含的语法：

```bash
. filename #点号(.)和文件名中间有一空格
#或者
source filename

```

示例：有两个shell脚本文件，分别为test1.sh和test2.sh

test1.sh

```bash
#! /bin/bash
name="China"

```

test2.sh

```bash
#! /bin/bash
source ./test1.sh  #或者 . ./test1.sh
echo "I Love You!${name}"

```

执行：

```bash
chmod +x test2.sh 
./test2.sh
#或者直接 sh test2.sh

I Love You!China

```

脚本或程序。

语法：

```bash
command << delimiter
    document
delimiter

```

- 它的作用是将两个 delimiter 之间的内容(document) 作为输入传递给 command。
- 结尾的delimiter 一定要顶格写，前面不能有任何字符，后面也不能有任何字符，包括空格和 tab 缩进。
- 开始的delimiter前后的空格会被忽略掉。

示例： 通过`wc -l`命令计算 Here Document 的行数：

```bash
$ wc -l << EOF
    欢迎来到
    菜鸟教程
    www.runoob.com
EOF
3          # 输出结果为 3 行
$

```

将 Here Document 用于脚本：

```bash
#!/bin/bash
cat << EOF
欢迎来到
菜鸟教程
www.runoob.com
EOF
```