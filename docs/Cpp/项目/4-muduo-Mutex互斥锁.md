# Mutex互斥锁

### 一、RAII

RAII技术被认为是C++中管理资源的最佳方法，进一步引申，使用RAII技术也可以实现安全、简洁的状态管理，编写出优雅的异常安全的代码。

RAII是C++的发明者Bjarne Stroustrup提出的概念，RAII全称是“Resource Acquisition is Initialization”，直译过来是“资源获取即初始化”，也就是说在构造函数中申请分配资源，在析构函数中释放资源。因为C++的语言机制保证了，当一个对象创建的时候，自动调用构造函数，当对象超出作用域的时候会自动调用析构函数。所以，在RAII的指导下，我们应该使用类来管理资源，将资源和对象的生命周期绑定。

智能指针（std::shared_ptr和std::unique_ptr）即RAII最具代表的实现，使用智能指针，可以实现自动的内存管理，再也不需要担心忘记delete造成的内存泄漏。毫不夸张的来讲，有了智能指针，代码中几乎不需要再出现delete了。

### 二、MutexLock 

该类的类图如下所示：

![](https://camo.githubusercontent.com/8ce447ee5a59f5f0a61867e158c0739f5859643e/68747470733a2f2f692e696d6775722e636f6d2f53415a636976492e706e67)

MutexLock 类只是简单地对linux的互斥量pthread_mutex_t 的一系列操作进行封装。但有一点很值得称道。该类（包括以后muduo的很多类）是用RAII技法：

```c
MutexLock()
: holder_(0)
{
    int ret = pthread_mutex_init(&mutex_, NULL);
    assert(ret == 0); (void) ret;
}

~MutexLock()
{
    assert(holder_ == 0);
    int ret = pthread_mutex_destroy(&mutex_);
    assert(ret == 0); (void) ret;
}
```

  仔细看析构函数中有个断言，该断言判断holder_的值，holder_在该类中用于保存该MutexLock 所在属线程的tid：

```c
void lock()
{
    pthread_mutex_lock(&mutex_);
    holder_ = CurrentThread::tid();
}

void unlock()
{
    holder_ = 0;
    pthread_mutex_unlock(&mutex_);
}
```

使用lock函数便保存所属线程的tid，解锁便将holder_设置为0。muduo的MutexLock 设计为“不可重入锁”，从析构函数中可以看到，该断言一定要保证unlock函数被调用后才会销毁锁，所以holder_会在unlock函数中被赋值为0。至于为什么需要在调用pthread_mutex_unlock前设置holder_=0，可先看析构函数，析构函数中首先断言holder是否为0，这意味着当前锁只有在没有其他线程使用时才会被析构，否则出错。再回到unlock函数，由于前面使用了lock函数加锁，所以调用unlock时，holder变量是安全的，在解锁前将其设置为0;假设holder变量在解锁后再设置为0，那么该holder变量可能来不及设置为零就被其他线程占用了，所以这样做的目的是为了保证当前的Mutex只被当前线程使用（独占）。

### 三、MutexLockGuard

类图如下：

![](https://camo.githubusercontent.com/0d116c92ac367914f3b8e2bd9e3bcedec54d37c2/68747470733a2f2f692e696d6775722e636f6d2f4c6956654d68302e706e67)

MutexLockGuard类只是简单地对MutexLock 进行封装而已。muduo通过MutexLockGuard类间接地控制MutexLock 的加锁和解锁。在MutexLockGuard对象创建时将锁锁上，在该对象析构时自动将所持有的锁对象解锁，从而避免了单独使用MutexLock对象忘记解锁的情况。如果单独使用MutexLock ，还需要注意调用unlock函数，稍不注意就会忘记。



Mutex.h：

```cpp
class MutexLock : boost::noncopyable
{
 public:
  MutexLock()
    : holder_(0)
  {
    int ret = pthread_mutex_init(&mutex_, NULL);
    assert(ret == 0); (void) ret;
  }

  ~MutexLock()
  {
    assert(holder_ == 0);
    int ret = pthread_mutex_destroy(&mutex_);
    assert(ret == 0); (void) ret;
  }

  bool isLockedByThisThread()
  {
    return holder_ == CurrentThread::tid();
  }

  void assertLocked()
  {
    assert(isLockedByThisThread());
  }

  // internal usage

  void lock()
  {
    pthread_mutex_lock(&mutex_);
    holder_ = CurrentThread::tid();
  }

  void unlock()
  {
    holder_ = 0;
    pthread_mutex_unlock(&mutex_);
  }

  pthread_mutex_t* getPthreadMutex() /* non-const */
  {
    return &mutex_;
  }

 private:

  pthread_mutex_t mutex_;
  pid_t holder_;
};
```

MutexLock类只是简单地对mutex进行封装而已。

MutexLockGuard类：

```cpp
class MutexLockGuard : boost::noncopyable
{
 public:
  explicit MutexLockGuard(MutexLock& mutex)
    : mutex_(mutex)
  {
    mutex_.lock();
  }

  ~MutexLockGuard()
  {
    mutex_.unlock();
  }

 private:

  MutexLock& mutex_;
};
```

MutexLockGuard类和MutexLock是关联关系，间接地操作索对象，但这里使用了RAII技法。

RAII是C++的发明者Bjarne Stroustrup提出的概念，RAII全称是“Resource Acquisition is Initialization”，直译过来是“资源获取即初始化”，也就是说在构造函数中申请分配资源，在析构函数中释放资源。因为C++的语言机制保证了，当一个对象创建的时候，自动调用构造函数，当对象超出作用域的时候会自动调用析构函数。所以，在RAII的指导下，我们应该使用类来管理资源，将资源和对象的生命周期绑定。

智能指针（std::shared_ptr和std::unique_ptr）即RAII最具代表的实现，使用智能指针，可以实现自动的内存管理，再也不需要担心忘记delete造成的内存泄漏。毫不夸张的来讲，有了智能指针，代码中几乎不需要再出现delete了。

这里在MutexLockGuard对象创建时将锁锁上，在该对象析构时自动将所持有的锁对象解锁，从而避免了单独使用MutexLock对象忘记解锁的情况。

### 二、测试代码 ###

```cpp
#include <muduo/base/CountDownLatch.h>
#include <muduo/base/Mutex.h>
#include <muduo/base/Thread.h>
#include <muduo/base/Timestamp.h>

#include <boost/bind.hpp>
#include <boost/ptr_container/ptr_vector.hpp>
#include <vector>
#include <stdio.h>

using namespace muduo;
using namespace std;

MutexLock g_mutex;
vector<int> g_vec;
const int kCount = 10*1000*1000;

void threadFunc()
{
  for (int i = 0; i < kCount; ++i)
  {
    MutexLockGuard lock(g_mutex);
    g_vec.push_back(i);
  }
}

int main()
{
  const int kMaxThreads = 8;
  g_vec.reserve(kMaxThreads * kCount);

  Timestamp start(Timestamp::now());
  for (int i = 0; i < kCount; ++i)
  {
    g_vec.push_back(i);
  }

  printf("single thread without lock %f\n", timeDifference(Timestamp::now(), start));

  start = Timestamp::now();
  threadFunc();
  printf("single thread with lock %f\n", timeDifference(Timestamp::now(), start));

  for (int nthreads = 1; nthreads < kMaxThreads; ++nthreads)
  {
    boost::ptr_vector<Thread> threads;
    g_vec.clear();
    start = Timestamp::now();
    for (int i = 0; i < nthreads; ++i)
    {
      threads.push_back(new Thread(&threadFunc));
      threads.back().start();
    }
    for (int i = 0; i < nthreads; ++i)
    {
      threads[i].join();
    }
    printf("%d thread(s) with lock %f\n", nthreads, timeDifference(Timestamp::now(), start));
  }
}
```

测试结果如下：

该程序主要就是显示在线程中加锁和不加锁的消耗情况，一开始不加锁耗时只有0.2s，加锁后同样的代码消耗达到了0.6s，然后几乎每一个线程加一个锁锁时间消耗加倍。