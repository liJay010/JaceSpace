# 面向对象和基于对象编程

- [线程封装--面向对象编程风格](#%E7%BA%BF%E7%A8%8B%E5%B0%81%E8%A3%85--%E9%9D%A2%E5%90%91%E5%AF%B9%E8%B1%A1%E7%BC%96%E7%A8%8B%E9%A3%8E%E6%A0%BC)
  - [一、类图](#%E4%B8%80%E7%B1%BB%E5%9B%BE)
  - [二、实现](#%E4%BA%8C%E5%AE%9E%E7%8E%B0)
  - [三、测试案例](#%E4%B8%89%E6%B5%8B%E8%AF%95%E6%A1%88%E4%BE%8B)

## 线程封装--面向对象编程风格


#### 一、类图

![](https://camo.githubusercontent.com/5fbc3bd7c8137dcb0d6bab56f8012dc52fe692c6/68747470733a2f2f692e696d6775722e636f6d2f4258417a67436a2e706e67)

#### 二、实现

首先定义一个基础的Thread类：

Thread.h:

```c
#ifndef _THREAD_H_
#define _THREAD_H_

#include <pthread.h>

class Thread
{
public:
	Thread();
	virtual ~Thread();

	void Start();
	void Join();

	void SetAutoDelete(bool autoDelete);

private:
	static void* ThreadRoutine(void* arg);
	virtual void Run() = 0;
	pthread_t threadId_;
	bool autoDelete_;
};

#endif // _THREAD_H_
```

需要注意的是，该类中的Run函数定义为纯虚函数，子类是一定要实现该接口的。

Thread.cpp

```c
#include "Thread.h"
#include <iostream>
using namespace std;


Thread::Thread() : autoDelete_(false)
{
	cout<<"Thread ..."<<endl;
}

Thread::~Thread()
{
	cout<<"~Thread ..."<<endl;
}

void Thread::Start()
{
	pthread_create(&threadId_, NULL, ThreadRoutine, this);
}

void Thread::Join()
{
	pthread_join(threadId_, NULL);
}

void* Thread::ThreadRoutine(void* arg)
{
	Thread* thread = static_cast<Thread*>(arg);
	thread->Run();
	if (thread->autoDelete_)
		delete thread;
	return NULL;
}

void Thread::SetAutoDelete(bool autoDelete)
{
	autoDelete_ = autoDelete;
}
```

该类中提供了构造和析构函数，析构函数使用了virtual关键字标记为虚函数，为了子类能够彻底析构对象。

该基类也提供了SetAutoDelete函数来让实例化对象在该对象线程执行完后及时地自动化析构自身，默认情况下线程的实例化对象是开启自动析构的，也就是说默认情况下线程对象调用完毕后将自动销毁自身。

该基类提供了Start函数来开启一个线程，线程的回调函数为ThradRuntine，ThreadRuntine设置为私有函数，这里将该函数设置为静态的。为什么设置为静态的是有原因的，理论上Run函数才是线程回调该调用的函数，然而Run函数是需要子类来覆写实现自己的业务逻辑，也为此Run函数使用了virtual关键字。Run函数是Thread基类的一个普通的成员函数，所以其实Run函数本质上是void Run(this)的，在形参中隐藏了this指针，然而pthread_create函数需要的是一个普通的函数，函数定义如下： void *(start_runtine)(void)。所以才需要将ThreadRuntine定义为全局或者静态的，定义为全局将将该函数全部暴露，所以定义为静态。

在ThreadRoutine中运行实际业务的Run函数，这里需要注意的是pthead_create函数传递了this指针给ThreadRuntine函数，因为该函数是静态的，它不能操作非静态的函数或者变量，所以在该函数中通过传入的this指针来调用Run函数，然后在调用完毕之后delete掉this，自动销毁自身对象。

#### 三、测试案例

```c
#include "Thread.h"
#include <unistd.h>
#include <iostream>
using namespace std;

class TestThread : public Thread
{
public:
	TestThread(int count) : count_(count)
	{
		cout<<"TestThread ..."<<endl;
	}

	~TestThread()
	{
		cout<<"~TestThread ..."<<endl;
	}

private:
	void Run()
	{
		while (count_--)
		{
			cout<<"this is a test ..."<<endl;
			sleep(1);
		}
	}

	int count_;
};

int main(void)
{
	/*
	TestThread t(5);
	t.Start();

	t.Join();
	*/

	TestThread* t2 = new TestThread(5);
	t2->SetAutoDelete(true);
	t2->Start();
	t2->Join();

	for (; ; )
		pause();

	return 0;
}
```

测试代码中定义了一个TestThread类，继承自Thread类，然后在自身业务实现的Run方法中每隔一秒打印一条条信息，一共count条。

在main函数中动态创建了一个TestThread对象，然后调用该线程的Start函数执行业务，结果如下：

![](https://camo.githubusercontent.com/de46af0b3ffb228f43a0803a3627b19197d09526/68747470733a2f2f692e696d6775722e636f6d2f4d5876557833692e706e67)

从打印信息可以看到，创建一个TestThread对象，首先调用基类的构造函数，然后调用自己的构造函数，然后由于调用了Start函数，Start函数调用了Run函数，Run函数打印了五条信息后析构自身然后调用父类的析构函数，主线程由于死循环卡死在主程序中。



## 线程封装--基于对象编程风格

### 一、boost bind/function 

boost bind/function库的出现，替代了stl中的mem_fun,ptr_fun,bind1st,bin2nd等函数。使用的一个案例如下所示：

```cpp
#include <iostream>
#include <boost/function.hpp>
#include <boost/bind.hpp>
using namespace std;

class Foo
{
public:
    void memberFunc(double d, int i, int j)
    {
        cout << d << endl;//打印0.5
        cout << i << endl;//打印100       
        cout << j << endl;//打印10
    }
};

int main()
{
    Foo foo;
    boost::function<void (int, int)> fp = boost::bind(&Foo::memberFunc, &foo, 0.5, _1, _2);
    fp(100, 200);
    boost::function<void (int, int)> fp2 = boost::bind(&Foo::memberFunc, boost::ref(foo), 0.5, _1, _2);
    fp2(55, 66);

    return 0;
}

```

编译运行结果如下：

![](https://camo.githubusercontent.com/bb929e9c70202a7a332e91d1a1aaf0b2435522d2/68747470733a2f2f692e696d6775722e636f6d2f6f4a50684c554d2e706e67)


### 二、基于对象风格的Thread 



#### 1、Thread类图 

```c
typedef boost::function<void ()> ThreadFunc;
```

![](https://camo.githubusercontent.com/61d4b0d59ec09097e9606dcd5e6ddb29d15ab283/68747470733a2f2f692e696d6775722e636f6d2f637a63334363342e706e67)

#### 2、实现 

Thread.h:

```cpp
#ifndef _THREAD_H_
#define _THREAD_H_

#include <pthread.h>
#include <boost/function.hpp>

class Thread
{
public:
    typedef boost::function<void ()> ThreadFunc;
    explicit Thread(const ThreadFunc& func);
    void Start();
    void Join();
    void SetAutoDelete(bool autoDelete);

private:
    static void* ThreadRoutine(void* arg);
    void Run();
    ThreadFunc func_;
    pthread_t threadId_;
    bool autoDelete_;
};

#endif // _THREAD_H_
```

Thread.cpp:

```cpp
#include "Thread.h"
#include <iostream>
using namespace std;

Thread::Thread(const ThreadFunc& func) : func_(func), autoDelete_(false)
{

}

void Thread::Start()
{
    pthread_create(&threadId_, NULL, ThreadRoutine, this);
}

void Thread::Join()
{
    pthread_join(threadId_, NULL);
}

void* Thread::ThreadRoutine(void* arg)
{
    Thread* thread = static_cast<Thread*>(arg);
    thread->Run();
    if (thread->autoDelete_)
        delete thread;
    return NULL;
}

void Thread::SetAutoDelete(bool autoDelete)
{
    autoDelete_ = autoDelete;
}

void Thread::Run()
{

    func_();
}
```

从上面代码看出，基于对象的Thread类内部绑定了一个ThreadFunc函数来执行用户的业务函数，Run函数本质上也就是调用了ThreadFunc函数。

#### 3、测试

```cpp
#include "Thread.h"
#include <boost/bind.hpp>
#include <unistd.h>
#include <iostream>
using namespace std;

class Foo
{
public:
	Foo(int count) : count_(count)
	{
	}

	void MemberFun()
	{
		while (count_--)
		{
			cout<<"this is a test ..."<<endl;
			sleep(1);
		}
	}

	void MemberFun2(int x)
	{
		while (count_--)
		{
			cout<<"x="<<x<<" this is a test2 ..."<<endl;
			sleep(1);
		}
	}

	int count_;
};

void ThreadFunc()
{
	cout<<"ThreadFunc ..."<<endl;
}

void ThreadFunc2(int count)
{
	while (count--)
	{
		cout<<"ThreadFunc2 ..."<<endl;
		sleep(1);
	}
}


int main(void)
{
	Thread t1(ThreadFunc);
	Thread t2(boost::bind(ThreadFunc2, 3));
	Foo foo(3);
	Thread t3(boost::bind(&Foo::MemberFun, &foo));
	Foo foo2(3);
	Thread t4(boost::bind(&Foo::MemberFun2, &foo2, 1000));

	t1.Start();
	t2.Start();
	t3.Start();
	t4.Start();

	t1.Join();
	t2.Join();
	t3.Join();
	t4.Join();


	return 0;
}
```

测试结果如下：

![](https://camo.githubusercontent.com/0b4b9dc37b94290ac2177007aa8f807106678e4d/68747470733a2f2f692e696d6775722e636f6d2f554548347669482e706e67)


在测试程序中先创建了一个线程类t1，t1调用ThreadFunc函数打印了一次信息；

然后程序创建了t2线程，传入函数绑定了ThreadFunc2，其中传入了参数3，然后执行三次打印信息；

在主程序中创建了Foo对象，然后分别绑定该Foo对象的两个函数，打印相关信息。

### 三、总结

以回射服务器EchoServer为例，该EchoServer需要在内部实现OnConnection、OnMessage和OnClose三个函数，对于三种不同风格的的编程来说：

- C编程风格：注册三个全局函数到网络库，网路库通过函数指针来回调

- 面向对象风格：用一个EchoServer继承TcpServer(抽象类)，实现三个接口的具体业务逻辑

- 基于对象风格：用一个EchoServer包含一个TcpServer(具体类)对象，在构造函数中用boost::bind来注册三个成员函数，例如：

```cpp
class EchoServer
{
public:
	EchoServer()
   {
		server.SetConnectionCallback(boost::bind(onConnection));
		server.SetOnMessageCallback(boost::bind(OnMessage));
		server.SetOnCloseCallback(boost::bind(OnClose));
   }

	void OnConnection(){...}
	void OnMessage();
	voie OnClose();

	TcpServer server;
}
```