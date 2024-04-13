## Singleton单例对象

![](https://camo.githubusercontent.com/0c3eab502adc01e1ba0ba396180dbd81310f722d/68747470733a2f2f692e696d6775722e636f6d2f6b7a43346a4e672e706e67)

### 1、pthread_once函数

该函数的原型如下：

```c
int pthread_once(pthread_once_t *once_control, void (*init_routine) (void))
```

函数使用初值为PTHREAD_ONCE_INIT的once_control变量保证init_routine()函数在本进程执行序列中仅执行一次。

LinuxThreads使用互斥锁和条件变量保证由pthread_once()指定的函数执行且仅执行一次，而once_control则表征是否执行过。如果once_control的初值不是PTHREAD_ONCE_INIT（LinuxThreads定义为0），pthread_once() 的行为就会不正常。在LinuxThreads中，实际"一次性函数"的执行状态有三种：NEVER（0）、IN_PROGRESS（1）、DONE （2），如果once初值设为1，则由于所有pthread_once()都必须等待其中一个激发"已执行一次"信号，因此所有pthread_once ()都会陷入永久的等待中；如果设为2，则表示该函数已执行过一次，从而所有pthread_once()都会立即返回0。

简而言之，如果once_control的值是PTHREAD_ONCE_INIT，那么init_routine只会执行一次，如果在init_routine函数里执行一个对象的创建，那么即使以后在调用init_routine创建该对象，那么该对象也不会再创建，因为init_routine只执行一次，该对象在全局是唯一的，也就是“单例”。

### 2、muduo实现单例对象

muduo是使用pthread_once函数来实现单例对象的：

```c
private:
  static pthread_once_t ponce_;
  static T*             value_;

template<typename T>
pthread_once_t Singleton<T>::ponce_ = PTHREAD_ONCE_INIT;

template<typename T>
T* Singleton<T>::value_ = NULL;

 static T& instance()
 {
   pthread_once(&ponce_, &Singleton::init);
   return *value_;
 }

 static void init()
 {
   value_ = new T();
   ::atexit(destroy);
 }
```

 假设现在有一个类叫Test，初始化单例对象Test：

 ```c
 Test t = muduo::Singleton<Test>::instance();
 ```

 init()函数只会执行一次。muduo的单例对象是“懒汉式”创建的。

 其中用到了atexit函数，atexit函数是一个特殊的函数，它是在正常程序退出时调用的函数，称之为登记函数，其函数原型如下：

 ```cpp
 int atexit (void (*)(void));
 ```



Singleton.h：

```cpp
// Use of this source code is governed by a BSD-style license
// that can be found in the License file.
//
// Author: Shuo Chen (chenshuo at chenshuo dot com)

#ifndef MUDUO_BASE_SINGLETON_H
#define MUDUO_BASE_SINGLETON_H

#include <boost/noncopyable.hpp>
#include <pthread.h>
#include <stdlib.h> // atexit

namespace muduo
{

template<typename T>
class Singleton : boost::noncopyable
{
 public:
  static T& instance()
  {
    pthread_once(&ponce_, &Singleton::init);
    return *value_;
  }

 private:
  Singleton();
  ~Singleton();

  static void init()
  {
    value_ = new T();
    ::atexit(destroy);
  }

  static void destroy()
  {
    typedef char T_must_be_complete_type[sizeof(T) == 0 ? -1 : 1];
    delete value_;
  }

 private:
  static pthread_once_t ponce_;
  static T*             value_;
};

template<typename T>
pthread_once_t Singleton<T>::ponce_ = PTHREAD_ONCE_INIT;

template<typename T>
T* Singleton<T>::value_ = NULL;

}
#endif
```

从上面可见，整个单例类都使用了static关键字，至于如何实现单例，可以通过下面这个例子来分析。

Singleton_test.cc：

```cpp
#include <muduo/base/Singleton.h>
#include <muduo/base/CurrentThread.h>
#include <muduo/base/Thread.h>

#include <boost/noncopyable.hpp>
#include <stdio.h>

class Test : boost::noncopyable
{
 public:
  Test()
  {
    printf("tid=%d, constructing %p\n", muduo::CurrentThread::tid(), this);
  }

  ~Test()
  {
    printf("tid=%d, destructing %p %s\n", muduo::CurrentThread::tid(), this, name_.c_str());
  }

  const muduo::string& name() const { return name_; }
  void setName(const muduo::string& n) { name_ = n; }

 private:
  muduo::string name_;
};

void threadFunc()
{
  printf("tid=%d, %p name=%s\n",
         muduo::CurrentThread::tid(),
         &muduo::Singleton<Test>::instance(),
         muduo::Singleton<Test>::instance().name().c_str());
  muduo::Singleton<Test>::instance().setName("only one, changed");
}

int main()
{
  muduo::Singleton<Test>::instance().setName("only one");
  muduo::Thread t1(threadFunc);
  t1.start();
  t1.join();
  printf("tid=%d, %p name=%s\n",
         muduo::CurrentThread::tid(),
         &muduo::Singleton<Test>::instance(),
         muduo::Singleton<Test>::instance().name().c_str());
}
```



首先测试程序定义了一个Test类，该类如下：

```cpp
class Test : boost::noncopyable
{
 public:
  Test()
  {
    printf("tid=%d, constructing %p\n", muduo::CurrentThread::tid(), this);
  }

  ~Test()
  {
    printf("tid=%d, destructing %p %s\n", muduo::CurrentThread::tid(), this, name_.c_str());
  }

  const muduo::string& name() const { return name_; }
  void setName(const muduo::string& n) { name_ = n; }

 private:
  muduo::string name_;
};
```

其中构造函数打印运行线程的tid和该类地址，析构函数也打印运行线程的tid和通过setName函数设置的name_。name函数获取name_的值。

函数：

```cpp
void threadFunc()
{
  printf("tid=%d, %p name=%s\n",
         muduo::CurrentThread::tid(),
         &muduo::Singleton<Test>::instance(),
         muduo::Singleton<Test>::instance().name().c_str());
  muduo::Singleton<Test>::instance().setName("only one, changed");
}
```

也是做一些打印操作。

然后在主函数中创建了一个Test单例：

```cpp
muduo::Singleton<Test>::instance().setName("only one");
```

追踪到instance函数：

```cpp
static T& instance()
{
	pthread_once(&ponce_, &Singleton::init);
	return *value_;
}
```

pthread_once中两个对象是：

```cpp
private:
	static pthread_once_t ponce_;
	static T*             value_;
```

它们都是静态的，然后在类的外部初始化：

```cpp
template<typename T>
pthread_once_t Singleton<T>::ponce_ = PTHREAD_ONCE_INIT;

template<typename T>
T* Singleton<T>::value_ = NULL;
```

其中ponce_是pthread_once_t类型的，这个类型将在后面说明。至于value_，则是需要单例创建的实体化对象，设置初值为NULL。

回到函数instance()，在该函数中调用了pthread_once函数，这个函数的原型如下：

```cpp
int pthread_once(pthread_once_t *once_control, void (*init_routine) (void))
```

函数使用初值为PTHREAD_ONCE_INIT的once_control变量保证init_routine()函数在本进程执行序列中仅执行一次。

LinuxThreads使用互斥锁和条件变量保证由pthread_once()指定的函数执行且仅执行一次，而once_control则表征是否执行过。如果once_control的初值不是PTHREAD_ONCE_INIT（LinuxThreads定义为0），pthread_once() 的行为就会不正常。在LinuxThreads中，实际"一次性函数"的执行状态有三种：NEVER（0）、IN_PROGRESS（1）、DONE （2），如果once初值设为1，则由于所有pthread_once()都必须等待其中一个激发"已执行一次"信号，因此所有pthread_once ()都会陷入永久的等待中；如果设为2，则表示该函数已执行过一次，从而所有pthread_once()都会立即返回0。

所以该函数执行完后&Singleton::init()只执行一次，而&Singleton::init()函数定义如下：

```cpp
static void init()
{
	value_ = new T();
	::atexit(destroy);
}
```

该函数内部实例化了一个T类型的对象，由于Singleton构造函数和析构函数都是私有的，只能通过init()函数实例化T对象，而init()函数在一个进程中只会调用一次，所以保证了T对象只会被创建一次。

回到测试程序：

```cpp
muduo::Thread t1(threadFunc);
t1.start();
t1.join();
printf("tid=%d, %p name=%s\n",
     muduo::CurrentThread::tid(),
     &muduo::Singleton<Test>::instance(),
     muduo::Singleton<Test>::instance().name().c_str());
```

这部分代码在线程和主程序中分别创建一个Test对象，然后打印对象的地址和信息，从测试的结果看，主程序和线程都是在修改同一个对象，这从打印的对象地址可以看到，而对象的析构函数也执行了一次，所以至始至终只创建了一个Test对象。

