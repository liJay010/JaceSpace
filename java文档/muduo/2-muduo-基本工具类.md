## muduo_base库源码分析 -- Timestamp ##

## 一、Timestamp类封装 ##

- <base/types.h>头文件

- less_than_comparable，要求实现<运算符，可自动实现>,<=,>=

- BOOST_STATIC_ASSERT编译时检查错误

- 使用PRId64，实现跨平台

- Timestamp实现及测试

#### 1.Timestamp类图 ####

![](https://i.imgur.com/wIiupg3.png)


#### 2.Timestamp类实现源码 ####

Timestamp.h:

```cpp
#ifndef MUDUO_BASE_TIMESTAMP_H
#define MUDUO_BASE_TIMESTAMP_H

#include <muduo/base/copyable.h>
#include <muduo/base/Types.h>

#include <boost/operators.hpp>

namespace muduo
{

///
/// Time stamp in UTC, in microseconds resolution.
///
/// This class is immutable.
/// It's recommended to pass it by value, since it's passed in register on x64.
///
class Timestamp : public muduo::copyable,
                  public boost::equality_comparable<Timestamp>,
                  public boost::less_than_comparable<Timestamp>
{
 public:
  ///
  /// Constucts an invalid Timestamp.
  ///
  Timestamp()
    : microSecondsSinceEpoch_(0)
  {
  }

  ///
  /// Constucts a Timestamp at specific time
  ///
  /// @param microSecondsSinceEpoch
  explicit Timestamp(int64_t microSecondsSinceEpochArg)
    : microSecondsSinceEpoch_(microSecondsSinceEpochArg)
  {
  }

  void swap(Timestamp& that)
  {
    std::swap(microSecondsSinceEpoch_, that.microSecondsSinceEpoch_);
  }

  // default copy/assignment/dtor are Okay

  string toString() const;
  string toFormattedString(bool showMicroseconds = true) const;

  bool valid() const { return microSecondsSinceEpoch_ > 0; }

  // for internal usage.
  int64_t microSecondsSinceEpoch() const { return microSecondsSinceEpoch_; }
  time_t secondsSinceEpoch() const
  { return static_cast<time_t>(microSecondsSinceEpoch_ / kMicroSecondsPerSecond); }

  ///
  /// Get time of now.
  ///
  static Timestamp now();
  static Timestamp invalid()
  {
    return Timestamp();
  }

  static Timestamp fromUnixTime(time_t t)
  {
    return fromUnixTime(t, 0);
  }

  static Timestamp fromUnixTime(time_t t, int microseconds)
  {
    return Timestamp(static_cast<int64_t>(t) * kMicroSecondsPerSecond + microseconds);
  }

  static const int kMicroSecondsPerSecond = 1000 * 1000;

 private:
  int64_t microSecondsSinceEpoch_;
};

inline bool operator<(Timestamp lhs, Timestamp rhs)
{
  return lhs.microSecondsSinceEpoch() < rhs.microSecondsSinceEpoch();
}

inline bool operator==(Timestamp lhs, Timestamp rhs)
{
  return lhs.microSecondsSinceEpoch() == rhs.microSecondsSinceEpoch();
}

///
/// Gets time difference of two timestamps, result in seconds.
///
/// @param high, low
/// @return (high-low) in seconds
/// @c double has 52-bit precision, enough for one-microsecond
/// resolution for next 100 years.
inline double timeDifference(Timestamp high, Timestamp low)
{
  int64_t diff = high.microSecondsSinceEpoch() - low.microSecondsSinceEpoch();
  return static_cast<double>(diff) / Timestamp::kMicroSecondsPerSecond;
}

///
/// Add @c seconds to given timestamp.
///
/// @return timestamp+seconds as Timestamp
///
inline Timestamp addTime(Timestamp timestamp, double seconds)
{
  int64_t delta = static_cast<int64_t>(seconds * Timestamp::kMicroSecondsPerSecond);
  return Timestamp(timestamp.microSecondsSinceEpoch() + delta);
}

}
#endif  // MUDUO_BASE_TIMESTAMP_H
```

Timestamp.cc:

```cpp
#include <muduo/base/Timestamp.h>

#include <sys/time.h>
#include <stdio.h>

#ifndef __STDC_FORMAT_MACROS
#define __STDC_FORMAT_MACROS
#endif

#include <inttypes.h>

#include <boost/static_assert.hpp>

using namespace muduo;

BOOST_STATIC_ASSERT(sizeof(Timestamp) == sizeof(int64_t));

//以秒的形式输出Timestamp中时间，精确到微秒
string Timestamp::toString() const
{
  char buf[32] = {0};
  int64_t seconds = microSecondsSinceEpoch_ / kMicroSecondsPerSecond;
  int64_t microseconds = microSecondsSinceEpoch_ % kMicroSecondsPerSecond;
  snprintf(buf, sizeof(buf)-1, "%" PRId64 ".%06" PRId64 "", seconds, microseconds);
  return buf;
}

//将当前Timestamp时间对象格式化输出为年月日时分秒格式，如果选择了showMicroseconds，那么将精确到微秒
string Timestamp::toFormattedString(bool showMicroseconds) const
{
  char buf[64] = {0};
  time_t seconds = static_cast<time_t>(microSecondsSinceEpoch_ / kMicroSecondsPerSecond);
  struct tm tm_time;
  gmtime_r(&seconds, &tm_time);

  if (showMicroseconds)
  {
    int microseconds = static_cast<int>(microSecondsSinceEpoch_ % kMicroSecondsPerSecond);
    snprintf(buf, sizeof(buf), "%4d%02d%02d %02d:%02d:%02d.%06d",
             tm_time.tm_year + 1900, tm_time.tm_mon + 1, tm_time.tm_mday,
             tm_time.tm_hour, tm_time.tm_min, tm_time.tm_sec,
             microseconds);
  }
  else
  {
    snprintf(buf, sizeof(buf), "%4d%02d%02d %02d:%02d:%02d",
             tm_time.tm_year + 1900, tm_time.tm_mon + 1, tm_time.tm_mday,
             tm_time.tm_hour, tm_time.tm_min, tm_time.tm_sec);
  }
  return buf;
}

// 获取当前时间，将当前时间转化为微秒并返回一个Timestamp对象
Timestamp Timestamp::now()
{
  struct timeval tv;
  gettimeofday(&tv, NULL);
  int64_t seconds = tv.tv_sec;
  return Timestamp(seconds * kMicroSecondsPerSecond + tv.tv_usec);
}
```

测试：

```cpp
#include <muduo/base/Timestamp.h>
#include <vector>
#include <stdio.h>

using muduo::Timestamp;

void passByConstReference(const Timestamp& x)
{
  printf("%s\n", x.toString().c_str());
}

void passByValue(Timestamp x)
{
  printf("%s\n", x.toString().c_str());
}

void benchmark()
{
  const int kNumber = 1000*1000;

  // 创建一个KNumber大小的stamps
  std::vector<Timestamp> stamps;
  stamps.reserve(kNumber);
  //将kNumber大小个个Timestamp放置到该向量中，时间为当前时间
  for (int i = 0; i < kNumber; ++i)
  {
    stamps.push_back(Timestamp::now());
  }
  //打印第一个和最后一个Timestamp对象
  printf("%s\n", stamps.front().toString().c_str());
  printf("%s\n", stamps.back().toString().c_str());
  //计算第一个和最后一个对象时间差
  printf("%f\n", timeDifference(stamps.back(), stamps.front()));

  //下面这些都是计算连续两个时间差，分时间差小于零，大于零但小于一百，大于一百三种情况，具体内容可见测试的log
  int increments[100] = { 0 };
  int64_t start = stamps.front().microSecondsSinceEpoch();
  for (int i = 1; i < kNumber; ++i)
  {
    int64_t next = stamps[i].microSecondsSinceEpoch();
    int64_t inc = next - start;
    start = next;
    if (inc < 0)
    {
      printf("reverse!\n");
    }
    else if (inc < 100)
    {
      ++increments[inc];
    }
    else
    {
      printf("big gap %d\n", static_cast<int>(inc));
    }
  }

  for (int i = 0; i < 100; ++i)
  {
    printf("%2d: %d\n", i, increments[i]);
  }
}

int main()
{
  Timestamp now(Timestamp::now());//构造函数初始化一个Timestamp，时间为当前时间
  printf("%s\n", now.toString().c_str());//打印当前时间微秒数
  passByValue(now);//打印当前时间微秒数
  passByConstReference(now);//打印当前时间微秒数
  benchmark();
}
```

测试结果保存在timestamp.log中。

### 补充：使用PRId64 ###

int64_t用来表示64位整数，在32位系统中是long long int，在64位系统中是long int,所以打印int64_t的格式化方法是：

```cpp
printf(“%ld”, value);  // 64bit OS
printf("%lld", value); // 32bit OS
```

跨平台的做法：

```cpp
#define __STDC_FORMAT_MACROS
#include <inttypes.h>
#undef __STDC_FORMAT_MACROS 
printf("%" PRId64 "\n", value);  
```



## 二、Atomic

更多内容可见 [muduo源码分析--Automic原子操作](https://github.com/hujiese/Large-concurrent-serve/blob/master/06_muduo_Atomic/muduo_Atomic.md)

在多线程环境中访问临界区需要做到同步，同步可以通过加锁实现，然而锁是高并发服务器的一大杀手，所以这里可以考虑使用更加高效的方法，就是原子操作。

### 一、gcc原子性操作

```c
// 原子自增操作
type __sync_fetch_and_add (type *ptr, type value)

// 原子比较和交换（设置）操作
type __sync_val_compare_and_swap (type *ptr, type oldval, type newval)
bool __sync_bool_compare_and_swap (type *ptr, type oldval, type newval)

// 原子赋值操作
type __sync_lock_test_and_set (type *ptr, type value)
```

使用这些原子性操作函数，编译的时候需要加-march=cpu-type选项。

### 二、volatile 关键字

volatile的作用： 作为指令关键字，确保本条指令不会因编译器的优化而省略，且要求每次直接读值。简单地说就是防止编译器对代码进行优化

当要求使用volatile 声明的变量的值的时候，系统总是重新从它所在的内存读取数据，而不是使用保存在寄存器中的备份。即使它前面的指令刚刚从该处读取过数据。而且读取的数据立刻被保存。

多线程下寄存器内的值可能为多个线程共享，可能会发生改变。

### 三、muduo编译选项

* -Wall // 大部分警告
* -Wextra // 一些额外的警告
* -Werror // 当出现警告时转为错误，停止编译
* -Wconversion // 一些可能改变值的隐式转换，给出警告。
* -Wno-unused-parameter // 函数中出现未使用的参数，不给出警告。
* -Wold-style-cast // C风格的转换，给出警告
* -Woverloaded-virtual // 如果函数的声明隐藏住了基类的虚函数，就给出警告。
* -Wpointer-arith // 对函数指针或者void *类型的指针进行算术操作时给出警告
* -Wshadow // 当一个局部变量遮盖住了另一个局部变量，或者全局变量时，给出警告。
* -Wwrite-strings // 规定字符串常量的类型是const char[length],因此,把这样的地址复制给 non-const char* 指针将产生警告.这些警告能够帮助你在编译期间发现企图写入字符串常量 的代码
* -march=native // 指定cpu体系结构为本地平台

### 四、AtomicIntegerT类

该类是muduo的原子操作类，该类封装了一系列原子操作函数，该文件与base/Atomic.h中定义，其主要内容如下：

![](https://camo.githubusercontent.com/27b42484104a67cf0b32f312ffd4d7ba5320e9b7/68747470733a2f2f692e696d6775722e636f6d2f4b536f704c74742e706e67)

## 三、muduo源码分析--Exception异常 ##

### 一、Exception类实现 ###

- backtrace，栈回溯，保存各个栈帧的地址
- backtrace_symbols，根据地址，转成相应的函数符号
- abi::__cxa_demangle

#### 1、类图 ####

![](https://i.imgur.com/mAxS1nj.png)

#### 2、源码实现 ####

Exception.h:

```cpp
// Use of this source code is governed by a BSD-style license
// that can be found in the License file.
//
// Author: Shuo Chen (chenshuo at chenshuo dot com)

#ifndef MUDUO_BASE_EXCEPTION_H
#define MUDUO_BASE_EXCEPTION_H

#include <muduo/base/Types.h>
#include <exception>

namespace muduo
{

class Exception : public std::exception
{
 public:
  explicit Exception(const char* what);
  explicit Exception(const string& what);
  virtual ~Exception() throw();
  virtual const char* what() const throw();
  const char* stackTrace() const throw();

 private:
  void fillStackTrace();

  string message_;
  string stack_;
};

}

#endif  // MUDUO_BASE_EXCEPTION_H
```

Exception.cc:

```cpp
// Use of this source code is governed by a BSD-style license
// that can be found in the License file.
//
// Author: Shuo Chen (chenshuo at chenshuo dot com)

#include <muduo/base/Exception.h>

//#include <cxxabi.h>
#include <execinfo.h>
#include <stdlib.h>

using namespace muduo;

Exception::Exception(const char* msg)
  : message_(msg)
{
  fillStackTrace();
}

Exception::Exception(const string& msg)
  : message_(msg)
{
  fillStackTrace();
}

Exception::~Exception() throw ()
{
}

const char* Exception::what() const throw()
{
  return message_.c_str();
}

const char* Exception::stackTrace() const throw()
{
  return stack_.c_str();
}

void Exception::fillStackTrace()
{
  const int len = 200;
  void* buffer[len];
  int nptrs = ::backtrace(buffer, len);
  char** strings = ::backtrace_symbols(buffer, nptrs);
  if (strings)
  {
    for (int i = 0; i < nptrs; ++i)
    {
      // TODO demangle funcion name with abi::__cxa_demangle
      stack_.append(strings[i]);
      stack_.push_back('\n');
    }
    free(strings);
  }
}
```

从上面源码可以看到，私有成员变量message_用来保存一条普通异常信息，stack_用来保存整个异常错误的回溯栈。打印异常信息的what和stackTrace函数都调用了函数fillStackTrace函数，该函数如下：

```cpp
void Exception::fillStackTrace()
{
  const int len = 200;
  void* buffer[len];
  int nptrs = ::backtrace(buffer, len);
  char** strings = ::backtrace_symbols(buffer, nptrs);
  if (strings)
  {
    for (int i = 0; i < nptrs; ++i)
    {
      // TODO demangle funcion name with abi::__cxa_demangle
      stack_.append(strings[i]);
      stack_.push_back('\n');
    }
    free(strings);
  }
}
```

比较关键的部位就是两个函数backtrace和backtrace_symbols，下面将介绍这两个函数的用法。

在头文件"execinfo.h"中声明了三个函数用于获取当前线程的函数调用堆栈：

```cpp
#include <execinfo.h>

 int backtrace(void **buffer, int size);

 char **backtrace_symbols(void *const *buffer, int size);

 void backtrace_symbols_fd(void *const *buffer, int size, int fd);
```

下面将具体介绍用法：

```cpp
int backtrace(void **buffer,int size)
```

该函数用与获取当前线程的调用堆栈,获取的信息将会被存放在buffer中,它是一个指针数组。参数 size 用来指定buffer中可以保存多少个void* 元素。函数返回值是实际获取的指针个数,最大不超过size大小在buffer中的指针实际是从堆栈中获取的返回地址,每一个堆栈框架有一个返回地址。

注意某些编译器的优化选项对获取正确的调用堆栈有干扰,另外内联函数没有堆栈框架;删除框架指针也会使无法正确解析堆栈内容。

```cpp
char ** backtrace_symbols (void *const *buffer, int size)
```

backtrace_symbols将从backtrace函数获取的信息转化为一个字符串数组. 参数buffer应该是从backtrace函数获取的数组指针,size是该数组中的元素个数(backtrace的返回值)，函数返回值是一个指向字符串数组的指针,它的大小同buffer相同.每个字符串包含了一个相对于buffer中对应元素的可打印信息.它包括函数名，函数的偏移地址,和实际的返回地址

现在,只有使用ELF二进制格式的程序和苦衷才能获取函数名称和偏移地址.在其他系统,只有16进制的返回地址能被获取.另外,你可能需要传递相应的标志给链接器,以能支持函数名功能(比如,在使用GNU ld的系统中,你需要传递(-rdynamic))

backtrace_symbols生成的字符串都是malloc出来的，但是不要最后一个一个的free，因为backtrace_symbols是根据backtrace给出的call stack层数，一次性的malloc出来一块内存来存放结果字符串的，所以，像上面代码一样，只需要在最后，free backtrace_symbols的返回指针就OK了。这一点backtrace的manual中也是特别提到的。

注意:如果不能为字符串获取足够的空间函数的返回值将会为NULL。

```cpp
void backtrace_symbols_fd (void *const *buffer, int size, int fd)
```

backtrace_symbols_fd与backtrace_symbols 函数具有相同的功能,不同的是它不会给调用者返回字符串数组,而是将结果写入文件描述符为fd的文件中,每个函数对应一行.它不需要调用malloc函数,因此适用于有可能调用该函数会失败的情况。

下面这段代码是一个使用实例：

```cpp
#include <execinfo.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

void
myfunc3(void)
{
   int j, nptrs;
#define SIZE 100
   void *buffer[100];
   char **strings;

   nptrs = backtrace(buffer, SIZE);
   printf("backtrace() returned %d addresses\n", nptrs);

   /* The call backtrace_symbols_fd(buffer, nptrs, STDOUT_FILENO)
      would produce similar output to the following: */

   strings = backtrace_symbols(buffer, nptrs);
   if (strings == NULL) {
       perror("backtrace_symbols");
       exit(EXIT_FAILURE);
   }

   for (j = 0; j < nptrs; j++)
       printf("%s\n", strings[j]);

   free(strings);
}

static void   /* "static" means don't export the symbol... */
myfunc2(void)
{
   myfunc3();
}

void
myfunc(int ncalls)
{
   if (ncalls > 1)
       myfunc(ncalls - 1);
   else
       myfunc2();
}

int
main(int argc, char *argv[])
{
   if (argc != 2) {
       fprintf(stderr, "%s num-calls\n", argv[0]);
       exit(EXIT_FAILURE);
   }

   myfunc(atoi(argv[1]));
   exit(EXIT_SUCCESS);
}
```

所以，fillStackTrace函数将异常栈的所有信息都保存在stack_中。

### 二、测试 ###

测试代码如下：

```cpp
#include <muduo/base/Exception.h>
#include <stdio.h>

class Bar
{
 public:
  void test()
  {
    throw muduo::Exception("oops");
  }
};

void foo()
{
  Bar b;
  b.test();
}

int main()
{
  try
  {
    foo();
  }
  catch (const muduo::Exception& ex)
  {
    printf("reason: %s\n", ex.what());
    printf("stack trace: %s\n", ex.stackTrace());
  }
}
```

测试结果如下：

![](https://i.imgur.com/xUwLjSs.png)

打印异常原因之后打印异常栈，然后一直追踪到 ./echo(_ZN3Bar4testEv+0x29) [0x4013a7]。

### 三、__cxa_demangle打印具体函数信息 ###

上面测试可以总结出：

- 1. backtrace可以在程序运行的任何地方被调用，返回各个调用函数的返回地址，可以限制最大调用栈返回层数。
- 2. 在backtrace拿到函数返回地址之后，backtrace_symbols可以将其转换为编译符号，这些符号是编译期间就确定的

但是从测试的结果看，打印的异常栈内容都是给编译器看的，里面都有编译符号，但是根据backtrace_symbols返回的编译符号，abi::__cxa_demangle可以找到具体地函数方法：

```cpp
char* abi::__cxa_demangle(const char * mangled_name, char* output_buffer, size_t* length, int* status)
```

下面这段代码将可以将带编译符号的信息转换出我们需要的函数信息：

```cpp
string Exception::demangle(const char* symbol)
{
  size_t size;
  int status;
  char temp[128];
  char* demangled;
  //first, try to demangle a c++ name
  if (1 == sscanf(symbol, "%*[^(]%*[^_]%127[^)+]", temp)) {
    if (NULL != (demangled = abi::__cxa_demangle(temp, NULL, &size, &status))) {
      string result(demangled);
      free(demangled);
      return result;
    }
  }
  //if that didn't work, try to get a regular c symbol
  if (1 == sscanf(symbol, "%127s", temp)) {
    return temp;
  }
 
  //if all else fails, just return the symbol
  return symbol;
}
```

这就需要修改源码了，修改后的代码如下:

Exception.h：

```cpp
// Use of this source code is governed by a BSD-style license
// that can be found in the License file.
//
// Author: Shuo Chen (chenshuo at chenshuo dot com)

#ifndef MUDUO_BASE_EXCEPTION_H
#define MUDUO_BASE_EXCEPTION_H

#include <muduo/base/Types.h>
#include <exception>

namespace muduo
{

class Exception : public std::exception
{
 public:
  explicit Exception(const char* what);
  explicit Exception(const string& what);
  virtual ~Exception() throw();
  virtual const char* what() const throw();
  const char* stackTrace() const throw();

 private:
  void fillStackTrace();
  string demangle(const char* symbol);

  string message_;
  string stack_;
};

}

#endif  // MUDUO_BASE_EXCEPTION_H
```

Exception.cc：

```cpp
// Use of this source code is governed by a BSD-style license
// that can be found in the License file.
//
// Author: Shuo Chen (chenshuo at chenshuo dot com)

#include <muduo/base/Exception.h>

#include <cxxabi.h>
#include <execinfo.h>
#include <stdlib.h>
#include <stdio.h>

using namespace muduo;

Exception::Exception(const char* msg)
  : message_(msg)
{
  fillStackTrace();
}

Exception::Exception(const string& msg)
  : message_(msg)
{
  fillStackTrace();
}

Exception::~Exception() throw ()
{
}

const char* Exception::what() const throw()
{
  return message_.c_str();
}

const char* Exception::stackTrace() const throw()
{
  return stack_.c_str();
}

void Exception::fillStackTrace()
{
  const int len = 200;
  void* buffer[len];
  int nptrs = ::backtrace(buffer, len);
  char** strings = ::backtrace_symbols(buffer, nptrs);
  if (strings)
  {
    for (int i = 0; i < nptrs; ++i)
    {
      // TODO demangle funcion name with abi::__cxa_demangle
      //stack_.append(strings[i]);
	  stack_.append(demangle(strings[i]));
      stack_.push_back('\n');
    }
    free(strings);
  }
}

string Exception::demangle(const char* symbol)
{
  size_t size;
  int status;
  char temp[128];
  char* demangled;
  //first, try to demangle a c++ name
  if (1 == sscanf(symbol, "%*[^(]%*[^_]%127[^)+]", temp)) {
    if (NULL != (demangled = abi::__cxa_demangle(temp, NULL, &size, &status))) {
      string result(demangled);
      free(demangled);
      return result;
    }
  }
  //if that didn't work, try to get a regular c symbol
  if (1 == sscanf(symbol, "%127s", temp)) {
    return temp;
  }
 
  //if all else fails, just return the symbol
  return symbol;
}
```

测试程序不变，运行后结果如下：

![](https://i.imgur.com/LNachch.png)

可见，现在的打印结果去掉了符号信息，看起来清楚多了。