# Condition条件变量

### 一、condition条件变量回顾

![](https://camo.githubusercontent.com/e98fef3ca8cbb5440b09868900a58dc775d21159/68747470733a2f2f692e696d6775722e636f6d2f4937724569764a2e706e67)

条件变量比较关键的地方就是while循环中的等待，如果条件不满足，那么条件变量将解锁，然后在while循环中一直等待条件变量满足，于此同时，其他线程通过某种方式改变了条件，然后发出信号通知等待线程条件满足，然后等待线程加锁推出while循环。

### 二、实现

![](https://camo.githubusercontent.com/e99ee2c7fa9db0bf9413cbd0bc9c6b36f1da79db/68747470733a2f2f692e696d6775722e636f6d2f6236454350494f2e706e67)

该类只是很简单地对pthread_cond_t进行封装。

Condition.h:

```cpp
// Use of this source code is governed by a BSD-style license
// that can be found in the License file.
//
// Author: Shuo Chen (chenshuo at chenshuo dot com)

#ifndef MUDUO_BASE_CONDITION_H
#define MUDUO_BASE_CONDITION_H

#include <muduo/base/Mutex.h>

#include <boost/noncopyable.hpp>
#include <pthread.h>

namespace muduo
{

class Condition : boost::noncopyable
{
 public:
  explicit Condition(MutexLock& mutex)
    : mutex_(mutex)
  {
    pthread_cond_init(&pcond_, NULL);
  }

  ~Condition()
  {
    pthread_cond_destroy(&pcond_);
  }

  void wait()
  {
    pthread_cond_wait(&pcond_, mutex_.getPthreadMutex());
  }

  // returns true if time out, false otherwise.
  bool waitForSeconds(int seconds);

  void notify()
  {
    pthread_cond_signal(&pcond_);
  }

  void notifyAll()
  {
    pthread_cond_broadcast(&pcond_);
  }

 private:
  MutexLock& mutex_;
  pthread_cond_t pcond_;
};

}
#endif  // MUDUO_BASE_CONDITION_H
```

Condition.cc：

```cpp
// Use of this source code is governed by a BSD-style license
// that can be found in the License file.
//
// Author: Shuo Chen (chenshuo at chenshuo dot com)

#include <muduo/base/Condition.h>

#include <errno.h>

// returns true if time out, false otherwise.
bool muduo::Condition::waitForSeconds(int seconds)
{
  struct timespec abstime;
  clock_gettime(CLOCK_REALTIME, &abstime);
  abstime.tv_sec += seconds;
  return ETIMEDOUT == pthread_cond_timedwait(&pcond_, mutex_.getPthreadMutex(), &abstime);
}
```

可见，muduo中的条件变量也就是对UNIX中的条件变量封装一层而已。

### 三、CountDownLatch

![](https://camo.githubusercontent.com/68536a33b06cba7424d2c8c2d5c0c181ac452069/68747470733a2f2f692e696d6775722e636f6d2f466e776f6b41742e706e67)

该类是muduo的互斥锁与条件变量使用的案例典范：

```c
void CountDownLatch::wait()
{
  MutexLockGuard lock(mutex_);
  while (count_ > 0) {
    condition_.wait();
  }
}

void CountDownLatch::countDown()
{
  MutexLockGuard lock(mutex_);
  --count_;
  if (count_ == 0) {
    condition_.notifyAll();
  }
}
```

由此可以实现生产者消费者模型，达到线程同步的目的。

CountDownLatch.h:

```cpp
// Use of this source code is governed by a BSD-style license
// that can be found in the License file.
//
// Author: Shuo Chen (chenshuo at chenshuo dot com)

#ifndef MUDUO_BASE_COUNTDOWNLATCH_H
#define MUDUO_BASE_COUNTDOWNLATCH_H

#include <muduo/base/Condition.h>
#include <muduo/base/Mutex.h>

#include <boost/noncopyable.hpp>

namespace muduo
{

class CountDownLatch : boost::noncopyable
{
 public:

  explicit CountDownLatch(int count);

  void wait();

  void countDown();

  int getCount() const;

 private:
  mutable MutexLock mutex_;
  Condition condition_;
  int count_;
};

}
#endif  // MUDUO_BASE_COUNTDOWNLATCH_H
```

CountDownLatch.cc:

```cpp
// Use of this source code is governed by a BSD-style license
// that can be found in the License file.
//
// Author: Shuo Chen (chenshuo at chenshuo dot com)

#include <muduo/base/CountDownLatch.h>

using namespace muduo;

CountDownLatch::CountDownLatch(int count)
  : mutex_(),
    condition_(mutex_),
    count_(count)
{
}

void CountDownLatch::wait()
{
  MutexLockGuard lock(mutex_);
  while (count_ > 0) {
    condition_.wait();
  }
}

void CountDownLatch::countDown()
{
  MutexLockGuard lock(mutex_);
  --count_;
  if (count_ == 0) {
    condition_.notifyAll();
  }
}

int CountDownLatch::getCount() const
{
  MutexLockGuard lock(mutex_);
  return count_;
}
```

从源码可以看出，该类结合和互斥锁和条件变量。

### 四、BlockinngQueue

![](https://camo.githubusercontent.com/a69edb21659c74d84ab067bad500000d8bf4f718/68747470733a2f2f692e696d6775722e636f6d2f716c546c3131672e706e67)

muduo_BlockinngQueue利用了条件变量来进行阻塞队列的操作，是一个典型的“生产者消费者”模型：

```c
void put(const T& x)
{
  MutexLockGuard lock(mutex_);
  queue_.push_back(x);
  notEmpty_.notify(); // TODO: move outside of lock
}

T take()
{
  MutexLockGuard lock(mutex_);
  // always use a while-loop, due to spurious wakeup
  while (queue_.empty())
  {
    notEmpty_.wait();
  }
  assert(!queue_.empty());
  T front(queue_.front());
  queue_.pop_front();
  return front;
}
```

  ### 五、BoundedBlockingQueue

![](https://camo.githubusercontent.com/d3fd3d5ee1fb0ce87b0ce112070536d4c2c9bc2f/68747470733a2f2f692e696d6775722e636f6d2f454e484d3446782e706e67)  

BoundedBlockingQueue与BlockinngQueue相比最大的区别在于该队列是有长度限制的，如果生产者生产的东西过多导致队列已满，那么生产者将被阻塞生产任务：

```c
void put(const T& x)
{
  MutexLockGuard lock(mutex_);
  while (queue_.full())
  {
    notFull_.wait();
  }
  assert(!queue_.full());
  queue_.push_back(x);
  notEmpty_.notify(); // TODO: move outside of lock
}

T take()
{
  MutexLockGuard lock(mutex_);
  while (queue_.empty())
  {
    notEmpty_.wait();
  }
  assert(!queue_.empty());
  T front(queue_.front());
  queue_.pop_front();
  notFull_.notify(); // TODO: move outside of lock
  return front;
}
```

##  ##

#### 一、muduo_BlockinngQueue



muduo_BlockinngQueue.h：

```cpp
// Use of this source code is governed by a BSD-style license
// that can be found in the License file.
//
// Author: Shuo Chen (chenshuo at chenshuo dot com)

#ifndef MUDUO_BASE_BLOCKINGQUEUE_H
#define MUDUO_BASE_BLOCKINGQUEUE_H

#include <muduo/base/Condition.h>
#include <muduo/base/Mutex.h>

#include <boost/noncopyable.hpp>
#include <deque>
#include <assert.h>

namespace muduo
{

template<typename T>
class BlockingQueue : boost::noncopyable
{
 public:
  BlockingQueue()
    : mutex_(),
      notEmpty_(mutex_),
      queue_()
  {
  }

  void put(const T& x)
  {
    MutexLockGuard lock(mutex_);
    queue_.push_back(x);
    notEmpty_.notify(); // TODO: move outside of lock
  }

  T take()
  {
    MutexLockGuard lock(mutex_);
    // always use a while-loop, due to spurious wakeup
    while (queue_.empty())
    {
      notEmpty_.wait();
    }
    assert(!queue_.empty());
    T front(queue_.front());
    queue_.pop_front();
    return front;
  }

  size_t size() const
  {
    MutexLockGuard lock(mutex_);
    return queue_.size();
  }

 private:
  mutable MutexLock mutex_;
  Condition         notEmpty_;
  std::deque<T>     queue_;
};

}

#endif  // MUDUO_BASE_BLOCKINGQUEUE_H
```

#### 二、BoundedBlockingQueue ####

BoundedBlockingQueue与muduo_BlockinngQueue相比最大的区别在于该队列是有长度限制的。

BoundedBlockingQueue.h：


```cpp
// Use of this source code is governed by a BSD-style license
// that can be found in the License file.
//
// Author: Shuo Chen (chenshuo at chenshuo dot com)

#ifndef MUDUO_BASE_BOUNDEDBLOCKINGQUEUE_H
#define MUDUO_BASE_BOUNDEDBLOCKINGQUEUE_H

#include <muduo/base/Condition.h>
#include <muduo/base/Mutex.h>

#include <boost/circular_buffer.hpp>
#include <boost/noncopyable.hpp>
#include <assert.h>

namespace muduo
{

template<typename T>
class BoundedBlockingQueue : boost::noncopyable
{
 public:
  explicit BoundedBlockingQueue(int maxSize)
    : mutex_(),
      notEmpty_(mutex_),
      notFull_(mutex_),
      queue_(maxSize)
  {
  }

  void put(const T& x)
  {
    MutexLockGuard lock(mutex_);
    while (queue_.full())
    {
      notFull_.wait();
    }
    assert(!queue_.full());
    queue_.push_back(x);
    notEmpty_.notify(); // TODO: move outside of lock
  }

  T take()
  {
    MutexLockGuard lock(mutex_);
    while (queue_.empty())
    {
      notEmpty_.wait();
    }
    assert(!queue_.empty());
    T front(queue_.front());
    queue_.pop_front();
    notFull_.notify(); // TODO: move outside of lock
    return front;
  }

  bool empty() const
  {
    MutexLockGuard lock(mutex_);
    return queue_.empty();
  }

  bool full() const
  {
    MutexLockGuard lock(mutex_);
    return queue_.full();
  }

  size_t size() const
  {
    MutexLockGuard lock(mutex_);
    return queue_.size();
  }

  size_t capacity() const
  {
    MutexLockGuard lock(mutex_);
    return queue_.capacity();
  }

 private:
  mutable MutexLock          mutex_;
  Condition                  notEmpty_;
  Condition                  notFull_;
  boost::circular_buffer<T>  queue_;
};

}

#endif  // MUDUO_BASE_BOUNDEDBLOCKINGQUEUE_H
```

