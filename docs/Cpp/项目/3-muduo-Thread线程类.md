# Thread线程

### 一、线程标识符

linux中，每个进程有一个pid，类型pid_t，由getpid()取得。Linux下的POSIX线程也有一个id，类型pthread_t，由pthread_self()取得，该id由线程库维护，其id空间是各个进程独立的（即不同进程中的线程可能有相同的id）。Linux中的POSIX线程库实现的线程其实也是一个进程（LWP），只是该进程与主进程（启动线程的进程）共享一些资源而已，比如代码段，数据段等。

有时候我们可能需要知道线程的真实pid。比如进程P1要向另外一个进程P2中的某个线程发送信号时，既不能使用P2的pid，更不能使用线程的pthread id，而只能使用该线程的真实pid，称为tid。

glibc的Pthreads实现实际上把pthread_t用作一个结构体指针（它的类型是unsigned long),指向一块动态分配的内存，而且这块内存是反复使用的。这就造成pthread_t的值很容易重复。**Pthreads只保证同一进程之内，同一时刻的各个线程的id不同；不能保证同一进程先后多个线程具有不同的id，更不要说一台机器上多个进程之间的id唯一性了**：

下面这段代码中先后两个线程的标识符是相同的：

```cpp
int main()
{
	pthread_t t1, t2;
	pthread_create(&t1, NULL, threadFun, NULL);
	printf("%lx\n", t1);
	pthread_join(t1, NULL);

	pthread_create(&t2, NULL, threadFun, NULL);
	printf("%lx\n", t2);
	pthread_join(t2, NULL);
}
```

有一个函数gettid()可以得到tid，但glibc并没有实现该函数，只能通过Linux的系统调用syscall来获取。muduo的线程类中是这样使用的：

```c
pid_t gettid()
{
  return static_cast<pid_t>(::syscall(SYS_gettid));
}
```

### 二、__thread 关键字

在Thread.cc中有如下代码：

```c
namespace CurrentThread
{
  __thread int t_cachedTid = 0;
  __thread char t_tidString[32];
  __thread const char* t_threadName = "unknown";
  const bool sameType = boost::is_same<int, pid_t>::value;
  BOOST_STATIC_ASSERT(sameType);
}
```

其中有__thread修饰，这个修饰是gcc内置的线程局部存储设施，__thread只能修饰POD类型。

* __thread是GCC内置的线程局部存储设施，存取效率可以和全局变量相比。
* __thread变量每一个线程有一份独立实体，各个线程的值互不干扰。可以用来修饰那些带有全局性且值可能变，但是又不值得用全局变量保护的变量。

__thread只能修饰POD类型（plain old data，类似整型指针的标量，不带自定义的构造、拷贝、赋值、析构的类型，二进制内容可以任意复制memset,memcpy,且内容可以复原），与C兼容的原始数据，例如，结构和整型等C语言中的类型是 POD 类型，但带有用户定义的构造函数或虚函数的类则不是，例如：

```c
__thread string t_obj1(“cppcourse”);	// 错误，不能调用对象的构造函数
__thread string* t_obj2 = new string;	// 错误，初始化只能是编译期常量
__thread string* t_obj3 = NULL;	// 正确
```

__thread 不能修饰class类型，因为无法自动调用构造函数和析构函数，可以用于修饰全局变量，函数内的静态变量，不能修饰函数的局部变量或者class的普通成员变量，且__thread变量值只能初始化为编译期常量，即编译期间就能确定值。

### 三、pthread_atfork 函数

该函数的原型如下：

```c
#include <pthread.h>
int pthread_atfork(void (*prepare)(void), void (*parent)(void), void (*child)(void));
```

调用fork时，内部创建子进程前在父进程中会调用prepare，内部创建子进程成功后，父进程会调用parent ，子进程会调用child。用这个方法可以及时在fork子进程后关闭一些文件描述符，因为子进程会获取一份父进程的打开的文件描述符。

当然，多用于解决多线程多进程死锁问题。最好不要同时使用多线程多进程，两者择其一。比如在多线程程序中调用fork容易出现死锁。如果在父进程中先创建了一个线程，该线程中加了互斥锁，在此同时父进程也创建了一个子进程，子进程也尝试加锁。这里就出问题了，子进程会复制父进程中锁的状态，也就是说子进程当前处理临界区之外，而且在子进程中无法解锁，这时候子进程就死锁了。解决方法是使用pthread_atfork函数，在prepare时解锁，在parent时加锁。可参考该文 [pthread_atfork函数解决多线程多进程死锁问题](https://murfyexp.github.io/2018/05/20/linux网络编程/pthread_atfork函数解决多线程多进程死锁问题/)

案例如下：

```c
#include <stdio.h>
#include <time.h>
#include <pthread.h>
#include <unistd.h>

void prepare(void)
{
	printf("pid = %d prepare ...\n", static_cast<int>(getpid()));
}

void parent(void)
{
	printf("pid = %d parent ...\n", static_cast<int>(getpid()));
}

void child(void)
{
	printf("pid = %d child ...\n", static_cast<int>(getpid()));
}


int main(void)
{
	printf("pid = %d Entering main ...\n", static_cast<int>(getpid()));

	pthread_atfork(prepare, parent, child);

	fork();

	printf("pid = %d Exiting main ...\n",static_cast<int>(getpid()));

	return 0;
}
```

编译运行结果如下：

![](https://camo.githubusercontent.com/7fa3cac01e734d5cfcf647853e652048b3d01177/68747470733a2f2f692e696d6775722e636f6d2f757a5772504f4e2e706e67)

### 四、Thread实现

![](https://camo.githubusercontent.com/563c1948852f7c76916a8a115517ccf499c318ad/68747470733a2f2f692e696d6775722e636f6d2f446d62454276792e706e67)

该线程类的封装和前面的“基于对象线程类封装”原理是一样的。

Thread.h:

```cpp
// Use of this source code is governed by a BSD-style license
// that can be found in the License file.
//
// Author: Shuo Chen (chenshuo at chenshuo dot com)

#ifndef MUDUO_BASE_THREAD_H
#define MUDUO_BASE_THREAD_H

#include <muduo/base/Atomic.h>
#include <muduo/base/Types.h>

#include <boost/function.hpp>
#include <boost/noncopyable.hpp>
#include <pthread.h>

namespace muduo
{

class Thread : boost::noncopyable
{
 public:
  typedef boost::function<void ()> ThreadFunc;

  explicit Thread(const ThreadFunc&, const string& name = string());
  ~Thread();

  void start();
  int join(); // return pthread_join()

  bool started() const { return started_; }
  // pthread_t pthreadId() const { return pthreadId_; }
  pid_t tid() const { return tid_; }
  const string& name() const { return name_; }

  static int numCreated() { return numCreated_.get(); }

 private:
  static void* startThread(void* thread);
  void runInThread();

  bool       started_;
  pthread_t  pthreadId_;
  pid_t      tid_;
  ThreadFunc func_;
  string     name_;

  static AtomicInt32 numCreated_;
};

}
#endif
```

Thread.cc:

```cpp
// Use of this source code is governed by a BSD-style license
// that can be found in the License file.
//
// Author: Shuo Chen (chenshuo at chenshuo dot com)

#include <muduo/base/Thread.h>
#include <muduo/base/CurrentThread.h>
#include <muduo/base/Exception.h>
//#include <muduo/base/Logging.h>

#include <boost/static_assert.hpp>
#include <boost/type_traits/is_same.hpp>

#include <errno.h>
#include <stdio.h>
#include <unistd.h>
#include <sys/syscall.h>
#include <sys/types.h>
#include <linux/unistd.h>

namespace muduo
{
namespace CurrentThread
{
  // __thread修饰的变量是线程局部存储的。
  __thread int t_cachedTid = 0;		// 线程真实pid（tid）的缓存，
									// 是为了减少::syscall(SYS_gettid)系统调用的次数
									// 提高获取tid的效率
  __thread char t_tidString[32];	// 这是tid的字符串表示形式
  __thread const char* t_threadName = "unknown";
  const bool sameType = boost::is_same<int, pid_t>::value;
  BOOST_STATIC_ASSERT(sameType);
}

namespace detail
{

pid_t gettid()
{
  return static_cast<pid_t>(::syscall(SYS_gettid));
}

void afterFork()
{
  muduo::CurrentThread::t_cachedTid = 0;
  muduo::CurrentThread::t_threadName = "main";
  CurrentThread::tid();
  // no need to call pthread_atfork(NULL, NULL, &afterFork);
}

class ThreadNameInitializer
{
 public:
  ThreadNameInitializer()
  {
    muduo::CurrentThread::t_threadName = "main";
    CurrentThread::tid();
    pthread_atfork(NULL, NULL, &afterFork);
  }
};

ThreadNameInitializer init;
}
}

using namespace muduo;

void CurrentThread::cacheTid()
{
  if (t_cachedTid == 0)
  {
    t_cachedTid = detail::gettid();
    int n = snprintf(t_tidString, sizeof t_tidString, "%5d ", t_cachedTid);
    assert(n == 6); (void) n;
  }
}

bool CurrentThread::isMainThread()
{
  return tid() == ::getpid();
}

AtomicInt32 Thread::numCreated_;

Thread::Thread(const ThreadFunc& func, const string& n)
  : started_(false),
    pthreadId_(0),
    tid_(0),
    func_(func),
    name_(n)
{
  numCreated_.increment();
}

Thread::~Thread()
{
  // no join
}

void Thread::start()
{
  assert(!started_);
  started_ = true;
  errno = pthread_create(&pthreadId_, NULL, &startThread, this);
  if (errno != 0)
  {
    //LOG_SYSFATAL << "Failed in pthread_create";
  }
}

int Thread::join()
{
  assert(started_);
  return pthread_join(pthreadId_, NULL);
}

void* Thread::startThread(void* obj)
{
  Thread* thread = static_cast<Thread*>(obj);
  thread->runInThread();
  return NULL;
}

void Thread::runInThread()
{
  tid_ = CurrentThread::tid();
  muduo::CurrentThread::t_threadName = name_.c_str();
  try
  {
    func_();
    muduo::CurrentThread::t_threadName = "finished";
  }
  catch (const Exception& ex)
  {
    muduo::CurrentThread::t_threadName = "crashed";
    fprintf(stderr, "exception caught in Thread %s\n", name_.c_str());
    fprintf(stderr, "reason: %s\n", ex.what());
    fprintf(stderr, "stack trace: %s\n", ex.stackTrace());
    abort();
  }
  catch (const std::exception& ex)
  {
    muduo::CurrentThread::t_threadName = "crashed";
    fprintf(stderr, "exception caught in Thread %s\n", name_.c_str());
    fprintf(stderr, "reason: %s\n", ex.what());
    abort();
  }
  catch (...)
  {
    muduo::CurrentThread::t_threadName = "crashed";
    fprintf(stderr, "unknown exception caught in Thread %s\n", name_.c_str());
    throw; // rethrow
  }
}
```

之前封装过一个“基于对象的”Thread类，通过boost::bind绑定函数来实现的，这里也同样是运用了这种方法和技巧：

```cpp
typedef boost::function<void ()> ThreadFunc;
```

可以通过下面这个案例来跟踪了解Thread类的一个大致的工作流程：

```cpp
#include <muduo/base/Thread.h>
#include <muduo/base/CurrentThread.h>

#include <string>
#include <boost/bind.hpp>
#include <stdio.h>

void threadFunc()
{
  printf("tid=%d\n", muduo::CurrentThread::tid());
}

void threadFunc2(int x)
{
  printf("tid=%d, x=%d\n", muduo::CurrentThread::tid(), x);
}

class Foo
{
 public:
  explicit Foo(double x)
    : x_(x)
  {
  }

  void memberFunc()
  {
    printf("tid=%d, Foo::x_=%f\n", muduo::CurrentThread::tid(), x_);
  }

  void memberFunc2(const std::string& text)
  {
    printf("tid=%d, Foo::x_=%f, text=%s\n", muduo::CurrentThread::tid(), x_, text.c_str());
  }

 private:
  double x_;
};

int main()
{
  printf("pid=%d, tid=%d\n", ::getpid(), muduo::CurrentThread::tid());

  muduo::Thread t1(threadFunc);
  t1.start();
  t1.join();

  muduo::Thread t2(boost::bind(threadFunc2, 42),
                   "thread for free function with argument");
  t2.start();
  t2.join();

  Foo foo(87.53);
  muduo::Thread t3(boost::bind(&Foo::memberFunc, &foo),
                   "thread for member function without argument");
  t3.start();
  t3.join();

  muduo::Thread t4(boost::bind(&Foo::memberFunc2, boost::ref(foo), std::string("Shuo Chen")));
  t4.start();
  t4.join();

  printf("number of created threads %d\n", muduo::Thread::numCreated());
}
```



以t1线程为例：

```cpp
muduo::Thread t1(threadFunc);
```

该行代码将调用构造函数，而构造函数定义和实现如下：

```cpp
typedef boost::function<void ()> ThreadFunc;

explicit Thread(const ThreadFunc&, const string& name = string());

Thread::Thread(const ThreadFunc& func, const string& n)
  : started_(false),
    pthreadId_(0),
    tid_(0),
    func_(func),
    name_(n)
{
  numCreated_.increment();
}
```

除了初始化一些pid、tid和func以外，主要就是让创建线程数目原子加一，numCreated_的定义如下：

```cpp
static AtomicInt32 numCreated_;
```

AtomicInt32在前面已经解析过了，原子操作。

```cpp
t1.start();
```

调用到：

```cpp
void start();

void Thread::start()
{
  assert(!started_);
  started_ = true;
  errno = pthread_create(&pthreadId_, NULL, &startThread, this);
  if (errno != 0)
  {
    LOG_SYSFATAL << "Failed in pthread_create";
  }
}
```

其中也是通过pthread_create创建了一个线程，传入线程的id，运行函数和自身指针。这里的startThread定义和实现如下：

```cpp
static void* startThread(void* thread);

void* Thread::startThread(void* obj)
{
  Thread* thread = static_cast<Thread*>(obj);
  thread->runInThread();
  
  return NULL;
}
```

定义为静态的了，至于为什么，前面的基于对象的Thread例子里有说明。然后再startThread函数内部调用了runInThread函数，该函数如下：

```cpp
void runInThread();

void Thread::runInThread()
{
  tid_ = CurrentThread::tid();
  muduo::CurrentThread::t_threadName = name_.c_str();
  try
  {
    func_();
    muduo::CurrentThread::t_threadName = "finished";
  }
  catch (const Exception& ex)
  {
    muduo::CurrentThread::t_threadName = "crashed";
    fprintf(stderr, "exception caught in Thread %s\n", name_.c_str());
    fprintf(stderr, "reason: %s\n", ex.what());
    fprintf(stderr, "stack trace: %s\n", ex.stackTrace());
    abort();
  }
  catch (const std::exception& ex)
  {
    muduo::CurrentThread::t_threadName = "crashed";
    fprintf(stderr, "exception caught in Thread %s\n", name_.c_str());
    fprintf(stderr, "reason: %s\n", ex.what());
    abort();
  }
  catch (...)
  {
    muduo::CurrentThread::t_threadName = "crashed";
    fprintf(stderr, "unknown exception caught in Thread %s\n", name_.c_str());
    throw; // rethrow
  }
}
```

该函数其实主要就是调用了传入的func_函数，在这里就是threadFunc函数：

```cpp
void threadFunc()
{
  printf("tid=%d\n", muduo::CurrentThread::tid());
}
```

再接着：

```cpp
t1.join();
```

调用到：

```cpp
int join(); // return pthread_join()

int Thread::join()
{
  assert(started_);
  return pthread_join(pthreadId_, NULL);
}
```

也就是调用了pthread_join函数。



