## EventLoop

### 1、什么都不做的EventLoop

一个EventLoop就是一个事件循环，下面将通过一个“什么都不做的EventLoop”来大致描述下muduo中EventLoop的功能。

“什么都不做的EventLoop”有如下几个特点：

* one loop per thread意思是说每个线程最多只能有一个EventLoop对象。
* EventLoop对象构造的时候，会检查当前线程是否已经创建了其他EventLoop对象，如果已创建，终止程序（LOG_FATAL）
* EventLoop构造函数会记住本对象所属线程（threadId_）。
* 创建了EventLoop对象的线程称为IO线程，其功能是运行事件循环（EventLoop::loop）

具体代码可在src下看到。

### 2、one loop per thread

这里指的是一个EventLoop只属于一个线程（但一个线程可以拥有多个EventLoop），在muduo中，如果EventLoop一旦被创建，EventLoop会保持所属线程的一份tid拷贝，作为标识。如果该EventLoop被其他线程调用则会报错，muduo中使用assertInLoopThread函数来判断该EventLoop对象是否是在所属线程中执行。相关代码如下：

```cpp
EventLoop::EventLoop()
  : looping_(false),
    threadId_(CurrentThread::tid())
{
  LOG_TRACE << "EventLoop created " << this << " in thread " << threadId_;
  // 如果当前线程已经创建了EventLoop对象，终止(LOG_FATAL)
  if (t_loopInThisThread)
  {
    LOG_FATAL << "Another EventLoop " << t_loopInThisThread
              << " exists in this thread " << threadId_;
  }
  else
  {
    t_loopInThisThread = this;
  }
}

void assertInLoopThread()
{
  if (!isInLoopThread())
  {
    abortNotInLoopThread();
  }
}

bool isInLoopThread() const { return threadId_ == CurrentThread::tid(); }

void EventLoop::abortNotInLoopThread()
{
  LOG_FATAL << "EventLoop::abortNotInLoopThread - EventLoop " << this
            << " was created in threadId_ = " << threadId_
      
            << ", current thread id = " <<  CurrentThread::tid();
} 
```

### 3、事件循环

一个EventLoop里其实是调用了poll/epoll来跟踪所关注的文件描述符的，当有

文件描述符上有事件发生时，EventLoop会拿到那些发生事件的文件描述符信息，这里的只是简单示例，更具体的内容会在后续章节不断展开。

```c
void EventLoop::loop()
{
  assert(!looping_);
  // 断言当前处于创建该对象的线程中
  assertInLoopThread();
  looping_ = true;
  LOG_TRACE << "EventLoop " << this << " start looping";

  ::poll(NULL, 0, 5*1000);

  LOG_TRACE << "EventLoop " << this << " stop looping";
  looping_ = false;
}
```



## 源码分析 ##

EventLoop.h:

```cpp
// Copyright 2010, Shuo Chen.  All rights reserved.
// http://code.google.com/p/muduo/
//
// Use of this source code is governed by a BSD-style license
// that can be found in the License file.

// Author: Shuo Chen (chenshuo at chenshuo dot com)
//
// This is a public header file, it must only include public header files.

#ifndef MUDUO_NET_EVENTLOOP_H
#define MUDUO_NET_EVENTLOOP_H

#include <boost/noncopyable.hpp>

#include <muduo/base/CurrentThread.h>
#include <muduo/base/Thread.h>

namespace muduo
{
namespace net
{

///
/// Reactor, at most one per thread.
///
/// This is an interface class, so don't expose too much details.
class EventLoop : boost::noncopyable
{
 public:
  EventLoop();
  ~EventLoop();  // force out-line dtor, for scoped_ptr members.

  ///
  /// Loops forever.
  ///
  /// Must be called in the same thread as creation of the object.
  ///
  void loop();

  void assertInLoopThread()
  {
    if (!isInLoopThread())
    {
      abortNotInLoopThread();
    }
  }
  bool isInLoopThread() const { return threadId_ == CurrentThread::tid(); }

  static EventLoop* getEventLoopOfCurrentThread();

 private:
  void abortNotInLoopThread();
  
  bool looping_; /* atomic */
  const pid_t threadId_;		// 当前对象所属线程ID
};

}
}
#endif  // MUDUO_NET_EVENTLOOP_H
```

EventLoop.cc:

```cpp
// Copyright 2010, Shuo Chen.  All rights reserved.
// http://code.google.com/p/muduo/
//
// Use of this source code is governed by a BSD-style license
// that can be found in the License file.

// Author: Shuo Chen (chenshuo at chenshuo dot com)

#include <muduo/net/EventLoop.h>

#include <muduo/base/Logging.h>

#include <poll.h>

using namespace muduo;
using namespace muduo::net;

namespace
{
// 当前线程EventLoop对象指针
// 线程局部存储
__thread EventLoop* t_loopInThisThread = 0;
}

EventLoop* EventLoop::getEventLoopOfCurrentThread()
{
  return t_loopInThisThread;
}

EventLoop::EventLoop()
  : looping_(false),
    threadId_(CurrentThread::tid())
{
  LOG_TRACE << "EventLoop created " << this << " in thread " << threadId_;
  // 如果当前线程已经创建了EventLoop对象，终止(LOG_FATAL)
  if (t_loopInThisThread)
  {
    LOG_FATAL << "Another EventLoop " << t_loopInThisThread
              << " exists in this thread " << threadId_;
  }
  else
  {
    t_loopInThisThread = this;
  }
}

EventLoop::~EventLoop()
{
  t_loopInThisThread = NULL;
}

// 事件循环，该函数不能跨线程调用
// 只能在创建该对象的线程中调用
void EventLoop::loop()
{
  assert(!looping_);
  // 断言当前处于创建该对象的线程中
  assertInLoopThread();
  looping_ = true;
  LOG_TRACE << "EventLoop " << this << " start looping";

  ::poll(NULL, 0, 5*1000);

  LOG_TRACE << "EventLoop " << this << " stop looping";
  looping_ = false;
}

void EventLoop::abortNotInLoopThread()
{
  LOG_FATAL << "EventLoop::abortNotInLoopThread - EventLoop " << this
            << " was created in threadId_ = " << threadId_
            << ", current thread id = " <<  CurrentThread::tid();
}
```

下面通过一个例子来分析该份源码。

```cpp
#include <muduo/net/EventLoop.h>

#include <stdio.h>

using namespace muduo;
using namespace muduo::net;

void threadFunc()
{
	printf("threadFunc(): pid = %d, tid = %d\n",
		getpid(), CurrentThread::tid());

	EventLoop loop;
	loop.loop();
}

int main(void)
{
	printf("main(): pid = %d, tid = %d\n",
		getpid(), CurrentThread::tid());

	EventLoop loop;

	Thread t(threadFunc);
	t.start();

	loop.loop();
	t.join();
	return 0;
}
```

该例子定义了一个线程函数threadFunc()，在该函数中首先打印了调用线程的pid和tid，然后创建一个EventLoop对象，然后调用loop()方法。同样地，在主线程中也做了和子线程相同的事。

主要的地方还在于：

```cpp
EventLoop loop;
loop.loop();
```

首先创建一个EventLoop对象会调用EventLoop的构造函数，其构造函数定义如下：

```cpp
EventLoop::EventLoop()
  : looping_(false),
    threadId_(CurrentThread::tid())
{
  LOG_TRACE << "EventLoop created " << this << " in thread " << threadId_;
  // 如果当前线程已经创建了EventLoop对象，终止(LOG_FATAL)
  if (t_loopInThisThread)
  {
    LOG_FATAL << "Another EventLoop " << t_loopInThisThread
              << " exists in this thread " << threadId_;
  }
  else
  {
    t_loopInThisThread = this;
  }
}
```

构造函数首先是初始化了两个私有的成员变量：

```cpp
bool looping_; /* atomic */
const pid_t threadId_;		// 当前对象所属线程ID
```

looping_用来标记是否调用loop函数处于循环当中，初始化设置为false;而threadId_用来标记当前线程的线程号，初始化为当前线程的tid。

然后在构造函数中运行：

```cpp
if (t_loopInThisThread)
{
	LOG_FATAL << "Another EventLoop " << t_loopInThisThread
          << " exists in this thread " << threadId_;
}
else
{
	t_loopInThisThread = this;
}
```

t_loopInThisThread的定义如下：

```cpp
namespace
{
// 当前线程EventLoop对象指针
// 线程局部存储
__thread EventLoop* t_loopInThisThread = 0;
}
```

构造函数中首先判断t_loopInThisThread是否为空，如果不为空，说明该线程中已经初始化该变量了，否则就将该EventLoop对象指针赋值给t_loopInThisThread对象。

然后分析loop函数：

```cpp
// 事件循环，该函数不能跨线程调用
// 只能在创建该对象的线程中调用
void EventLoop::loop()
{
  assert(!looping_);
  // 断言当前处于创建该对象的线程中
  assertInLoopThread();
  looping_ = true;
  LOG_TRACE << "EventLoop " << this << " start looping";

  ::poll(NULL, 0, 5*1000);

  LOG_TRACE << "EventLoop " << this << " stop looping";
  looping_ = false;
}
```

在loop函数中调用assertInLoopThread()函数断言当前处于创建该对象的线程中，该函数定义如下：

```cpp
void assertInLoopThread()
{
	if (!isInLoopThread())
	{
	  abortNotInLoopThread();
	}
}
```

该函数又调用了isInLoopThread函数，isInLoopThread函数定义如下：

```cpp
bool isInLoopThread() const { return threadId_ == CurrentThread::tid(); }
```

该函数判断当前线程的tid是否和创建该EventLoop对象线程tid一致，如果相等则返回true，如果是同一个线程，很明显在该EventLoop对象创建时在析构函数中已经将threadId赋值为了CurrentThread::tid()。如果不满足条件，则调用abortNotInLoopThread函数，而abortNotInLoopThread函数定义如下：

```cpp
{
  LOG_FATAL << "EventLoop::abortNotInLoopThread - EventLoop " << this
            << " was created in threadId_ = " << threadId_
            << ", current thread id = " <<  CurrentThread::tid();
}
```

打印一些错误信息。

回到loop函数，在assertInLoopThread调用后，loop函数将looping_设置为true，然后调用poll函数，这里暂时不设置监听事件和个数，只设置超时时间为5s，5s后如果没有时间发生，则将looping_设置为false。

析构函数比较简单：

```cpp
EventLoop::~EventLoop()
{
  t_loopInThisThread = NULL;
}
```

这个测试程序的结果是：

![](https://i.imgur.com/43eta5d.png)

接下来看一个反面例子：

```cpp
#include <muduo/net/EventLoop.h>

#include <stdio.h>

using namespace muduo;
using namespace muduo::net;

EventLoop* g_loop;

void threadFunc()
{
	g_loop->loop();
}

int main(void)
{
	EventLoop loop;
	g_loop = &loop;
	Thread t(threadFunc);
	t.start();
	t.join();
	return 0;
}
```

子线程使用主线程的EventLoop，调用其loop函数，结果报错：

![](https://i.imgur.com/145Hvbx.png)