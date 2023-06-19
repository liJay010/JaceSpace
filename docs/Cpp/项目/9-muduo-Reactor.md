# Reactor

### 一、结构  ###

muduo的Reactor模式主要由三个类--Channel、EventLoop和Poller构成，它们之间的调用关系如下图所示：

![](https://i.imgur.com/fAwdZ7q.png)

由于调用有些复杂，下面将根据具体的一个案例来分析整个运作流程，具体的代码可以参考src目录下文件。

### 二、分析 ###

#### 1、补充timerfd_create ####

timerfd 是在Linux内核2.6.25版本中添加的接口，其是Linux为用户提供的一个定时器接口。这个接口基于文件描述符，所以可以被用于select/poll/epoll的场景。当使用timerfd API创建多个定时器任务并置于poll中进行事件监听，当没有可响应的事件，则程序阻塞在poll中，当有事件发生，通过poll的这个事件入口，对产生的事件进行响应，从而构成了一个事件轮询程序，其相关函数如下所示：

```cpp
#include <time.h>
int clock_gettime(clockid_t clockid, struct timespec *tp);
```

- clock_gettime函数主要用于获取系统时间，精确到纳秒级别。在编译时需要添加-lrt库，clockid_t clockid指定用何种模式获取时间，struct timespec *tp用于存储获取到的时间。其中clockid主要有如下常用的参数： 
- CLOCK_REALTIME:系统实时时间,随系统实时时间改变而改变,即从UTC1970-1-1 0:0:0开始计时,中间时刻如果系统时间被用户改成其他,则对应的时间相应改变 
- CLOCK_MONOTONIC:从系统启动这一刻起开始计时,不受系统时间被用户改变的影响 
- CLOCK_PROCESS_CPUTIME_ID:本进程到当前代码系统CPU花费的时间 
- CLOCK_THREAD_CPUTIME_ID:本线程到当前代码系统CPU花费的时间

第二组：

```cpp
#include <sys/timerfd.h>
int timerfd_create(int clockid, int flags);
int timerfd_settime(int fd, int flags, const struct itimerspec *new_value,struct itimerspec *old_value);
int timerfd_gettime(int fd, struct itimerspec *curr_value);
```

- timerfd_create函数主要用于生成一个定时器对象，返回与之关联的文件描述符，clockid可以设置CLOCK_REALTIME和CLOCK_MONOTONIC，flags可以设置为TFD_NONBLOCK（非阻塞），TFD_CLOEXEC（同O_CLOEXEC）
- timerfd_settime用于启动和停止定时器，fd为timerfd_create获得的定时器文件描述符，flags为0表示是相对定时器，为TFD_TIMER_ABSTIME表示是绝对定时器。const struct itimerspec *new_value表示设置超时的时间。

其数据结构如下：

```cpp
struct timespec {
  time_t tv_sec;                /* Seconds */
  long   tv_nsec;               /* Nanoseconds */
};
 
struct itimerspec {
 struct timespec it_interval;  /* Interval for periodic timer */
 struct timespec it_value;     /* Initial expiration */
};
```


需要注意的是itimerspec 结构成员表示的意义： 

- it_value是首次超时时间，需要填写从clock_gettime获取的时间，并加上要超时的时间。 
- it_interval是后续周期性超时时间，是多少时间就填写多少。 
- it_interval不为0则表示是周期性定时器。 
- it_value和it_interval都为0表示停止定时器。

timerfd_gettime此函数用于获得定时器距离下次超时还剩下的时间。如果调用时定时器已经到期，并且该定时器处于循环模式（设置超时时间时struct itimerspec::it_interval不为0），那么调用此函数之后定时器重新开始计时。

#### 2、测试案例 ####

```cpp
#include "Channel.h"
#include "EventLoop.h"

#include <stdio.h>
#include <sys/timerfd.h>

muduo::EventLoop* g_loop;

void timeout()
{
  printf("Timeout!\n");
  g_loop->quit();
}

int main()
{
  muduo::EventLoop loop;
  g_loop = &loop;

  int timerfd = ::timerfd_create(CLOCK_MONOTONIC, TFD_NONBLOCK | TFD_CLOEXEC);
  muduo::Channel channel(&loop, timerfd);
  channel.setReadCallback(timeout);
  channel.enableReading();

  struct itimerspec howlong;
  bzero(&howlong, sizeof howlong);
  howlong.it_value.tv_sec = 5;
  ::timerfd_settime(timerfd, 0, &howlong, NULL);

  loop.loop();

  ::close(timerfd);
}
```

#### 3、追踪分析 ####

首先，在主函数中定义了一个变量loop：

```cpp
muduo::EventLoop loop;
```

然后将其赋值全局的EventLoop：

```cpp
g_loop = &loop;
```

全局EventLoop定义如下：

```cpp
muduo::EventLoop* g_loop;
```

一旦定义了一个EventLoop对象，那么将调用该对象的构造函数：

```cpp
EventLoop::EventLoop()
  : looping_(false),
    quit_(false),
    threadId_(CurrentThread::tid()),
    poller_(new Poller(this))
{
  LOG_TRACE << "EventLoop created " << this << " in thread " << threadId_;
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

构造函数初始化了四个成员变量，它们是：

```cpp
typedef std::vector<Channel*> ChannelList;

bool looping_; /* atomic */
bool quit_; /* atomic */
const pid_t threadId_;
boost::scoped_ptr<Poller> poller_;
```

looping_设置为false，表示loop()函数没有被调用，没有进入事件监听状态；quit_设置为false，没有退出；threadId设置为CurrentThread::tid()，当前线程的tid；创建一个新的Poller给poller_。下面看Poller创建发生了什么。

Poller创建将调用其构造函数：

```cpp
Poller(EventLoop* loop);

Poller::Poller(EventLoop* loop)
  : ownerLoop_(loop)
{
}
```

其构造函数接受一个EventLoop*指针（上面传递的是this），赋值对象是ownerLoop，ownerLoop定义如下：

```cpp
EventLoop* ownerLoop_;
```

继续回到EventLoop构造函数中。在初始化四个变量后先打印该EventLoop对象的信息：

```cpp
LOG_TRACE << "EventLoop created " << this << " in thread " << threadId_;
```

然后做了个判断：

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

t_loopInThisThread定义如下：

```cpp
__thread EventLoop* t_loopInThisThread = 0;
```

如果该变量为0，说明该EventLoop对象是刚刚创建的，将该对象的this指针赋值给t_loopInThisThread;如果该变量不为0，说明该变量已经被赋值了，该EventLoop对象已经存在，该构造函数如果被调用多次将出现这种情况。

回到测试函数，在初始化全局EventLoop对象后，测试函数初始化了一个定时器文件描述符：

```cpp
int timerfd = ::timerfd_create(CLOCK_MONOTONIC, TFD_NONBLOCK | TFD_CLOEXEC)
```

然后创建了一个Channel对象：

```cpp
muduo::Channel channel(&loop, timerfd);
```

Channel构造函数如下：

```cpp
Channel(EventLoop* loop, int fd);

Channel::Channel(EventLoop* loop, int fdArg)
  : loop_(loop),
    fd_(fdArg),
    events_(0),
    revents_(0),
    index_(-1)
{
}
```

其构造函数接受两个参数，一个是EventLoop指针，一个是文件描述符。构造函数初始化了五个成员变量：

```cpp
EventLoop* loop_;
const int  fd_;
int        events_;
int        revents_;
int        index_; // used by Poller.
```

loop_用于保存传入的EventLoop指针；fd_用来保存传入的文件描述符；events_用来保存需要监听的事件，暂时初始化为0；revents_用来保存当前活跃的事件，暂时初始化为0；index_供Poller调用，Poller中有一个Channel数组，这个index_用来保存该Channel在Poller的Channel数组中的索引，初始化为-1。

回到测试函数，在初始化一个Channel之后，测试函数调用了：

```cpp
channel.setReadCallback(timeout);
```

该函数在Channel类中的定义如下：

```cpp
void setReadCallback(const EventCallback& cb)
  { readCallback_ = cb; }
```

该函数接受一个const EventCallback&类型的参数，该参数的定义如下：

```cpp
typedef boost::function<void()> EventCallback
```

一个普通的函数对象，该函数将传入的cb函数对象赋值给readCallback_，readCallback_定义如下：

```cpp
EventCallback readCallback_
```

经过channel.setReadCallback(timeout);调用，将timeout传入给了Channel内部的readCallback_，然而在测试函数中timeout函数的定义如下：

```cpp
void timeout()
{
  printf("Timeout!\n");
  g_loop->quit();
}
```

该函数将调用全局EventLoop g_loop的quit()函数，然而EventLoop中的quit函数定义如下：

```cpp
void EventLoop::quit()
{
  quit_ = true;
  // wakeup();
}
```

设置quit_标志位为0。

回到测试函数，测试函数设置了channel的读回调函数之后使能了读操作：

```cpp
channel.enableReading()
```

使能读操作定义如下：

```cpp
void enableReading() { events_ |= kReadEvent; update(); }
```

在该函数中将events_与kReadEvent做了或运算，kReadEvent定义如下：

```cpp
static const int kNoneEvent
```

初始化为：

```cpp
const int Channel::kReadEvent = POLLIN | POLLPRI;
```

设置为POLLIN读事件。

enableReading函数除了设置监听事件以外还调用了update()函数，该函数定义如下：

```cpp
void Channel::update()
{
  loop_->updateChannel(this);
}
```

在Channel的update函数中调用了EventLoop的updateChannel函数，传入了Channel的this指针，跳转到EventLoop类，其updateChannel函数的定义如下：

```cpp
void EventLoop::updateChannel(Channel* channel)
{
  assert(channel->ownerLoop() == this);
  assertInLoopThread();
  poller_->updateChannel(channel);
}
```

该函数接收一个Channel指针，然后判断该Channel是否是该EventLoop对象中（按照上面的Channel初始化方法，断言判断是正确的，通过），然后调用EventLoop的assertInLoopThread函数，该函数定义如下：

void assertInLoopThread()
{
	if (!isInLoopThread())
	{
	  abortNotInLoopThread();
	}
}

该函数又调用了isInLoopThread函数，该函数定义如下：

```cpp
bool isInLoopThread() const { return threadId_ == CurrentThread::tid(); }
```

该函数判断当前EventLoop是否在当前线程中（一个线程只能调用一个EventLoop，一个线程不能调用其他线程的EventLoop对象），否则调用abortNotInLoopThread函数打印错误信息：

```cpp
void EventLoop::abortNotInLoopThread()
{
  LOG_FATAL << "EventLoop::abortNotInLoopThread - EventLoop " << this
            << " was created in threadId_ = " << threadId_
            << ", current thread id = " <<  CurrentThread::tid();
}
```

再回到EventLoop::updateChannel函数，在判断完该EventLoop是否处于当前线程后调用了Poller的updateChannel函数，传入Channel指针，该函数定义如下：

```cpp
void Poller::updateChannel(Channel* channel)
{
  assertInLoopThread();
  LOG_TRACE << "fd = " << channel->fd() << " events = " << channel->events();
  if (channel->index() < 0) {
    // a new one, add to pollfds_
    assert(channels_.find(channel->fd()) == channels_.end());
    struct pollfd pfd;
    pfd.fd = channel->fd();
    pfd.events = static_cast<short>(channel->events());
    pfd.revents = 0;
    pollfds_.push_back(pfd);
    int idx = static_cast<int>(pollfds_.size())-1;
    channel->set_index(idx);
    channels_[pfd.fd] = channel;
  } else {
    // update existing one
    assert(channels_.find(channel->fd()) != channels_.end());
    assert(channels_[channel->fd()] == channel);
    int idx = channel->index();
    assert(0 <= idx && idx < static_cast<int>(pollfds_.size()));
    struct pollfd& pfd = pollfds_[idx];
    assert(pfd.fd == channel->fd() || pfd.fd == -1);
    pfd.events = static_cast<short>(channel->events());
    pfd.revents = 0;
    if (channel->isNoneEvent()) {
      // ignore this pollfd
      pfd.fd = -1;
    }
  }
}
```

该函数首先判断该Channel是否在当前EventLoop线程中，判断该Channel调用其index()函数，该函数如下：

```cpp
int index() { return index_; }
```

index_的作用之前也提到过，在下面的代码中将更加具体地说明。

很明显，第一次创建Channel时候，回到前面的Channel初始化构造函数代码：

```cpp
Channel::Channel(EventLoop* loop, int fdArg)
  : loop_(loop),
    fd_(fdArg),
    events_(0),
    revents_(0),
    index_(-1)
{
}
```

index_的初值是设置为-1的，所以channel->index() < 0成立，执行第一个分支代码：

```cpp
// a new one, add to pollfds_
assert(channels_.find(channel->fd()) == channels_.end());
struct pollfd pfd;
pfd.fd = channel->fd();
pfd.events = static_cast<short>(channel->events());
pfd.revents = 0;
pollfds_.push_back(pfd);
int idx = static_cast<int>(pollfds_.size())-1;
channel->set_index(idx);
channels_[pfd.fd] = channel;
```

在该分支中首先判断该Channel的文件描述符fd_是否在channels_中，Poller的channels_定义如下：

```cpp
typedef std::map<int, Channel*> ChannelMap;
ChannelMap channels_;
```

该map将一个Channel的文件描述符fd_作为key，将该Channel的一个指针作为value传入。很明显，当前状态下map里面什么东西都没有，所以该断言成立，执行下面的代码：

```cpp
struct pollfd pfd;
pfd.fd = channel->fd();
pfd.events = static_cast<short>(channel->events());
pfd.revents = 0;
```

该部分定义了一个pollfd结构体，并将该Channel的一些文件描述符、监听事件和活跃事件信息传递给该pollfd结构体。然后执行：

```cpp
pollfds_.push_back(pfd);
```

将该结构体保持到pollfds_中，其中pollfds_为：

```cpp
typedef std::vector<struct pollfd> PollFdList;
PollFdList pollfds_;
```

该vector等价于一个pollfd数组，在调用poll函数时需要传入。接下来：

```cpp
int idx = static_cast<int>(pollfds_.size())-1;
channel->set_index(idx);
```

获取到pollfds_数组的长度并减一，赋值到idx中，将该Channel的index_设置为idx，也就是在该数组中的索引。由于一开始只有一个pollfd，并且执行了pollfds_.push_back(pfd)操作，所以pollfds_.size()为1，所以如果要成为数组的第一个元素需要进行减一操作。

当然，如果channel->index()不为负数，也就是说该Channel已经在pollfds数组中登记过，那么执行下面代码：

```cpp
// update existing one
assert(channels_.find(channel->fd()) != channels_.end());
assert(channels_[channel->fd()] == channel);
int idx = channel->index();
assert(0 <= idx && idx < static_cast<int>(pollfds_.size()));
struct pollfd& pfd = pollfds_[idx];
assert(pfd.fd == channel->fd() || pfd.fd == -1);
pfd.events = static_cast<short>(channel->events());
pfd.revents = 0;
if (channel->isNoneEvent()) {
  // ignore this pollfd
  pfd.fd = -1;
}
```

其实也就是给数组中的pollfd结构重新赋值、更新。

回到测试函数，接下来设置定时器：

```cpp
struct itimerspec howlong;
bzero(&howlong, sizeof howlong);
howlong.it_value.tv_sec = 5;
::timerfd_settime(timerfd, 0, &howlong, NULL);
```

然后调用：

```cpp
loop.loop();
```

该函数定义如下：

```cpp
void EventLoop::loop()
{
  assert(!looping_);
  assertInLoopThread();
  looping_ = true;
  quit_ = false;

  while (!quit_)
  {
    activeChannels_.clear();
    poller_->poll(kPollTimeMs, &activeChannels_);
    for (ChannelList::iterator it = activeChannels_.begin();
        it != activeChannels_.end(); ++it)
    {
      (*it)->handleEvent();
    }
  }

  LOG_TRACE << "EventLoop " << this << " stop looping";
  looping_ = false;
}
```

该函数调用了：

```cpp
poller_->poll(kPollTimeMs, &activeChannels_);
```

而Poller得poll函数定义如下：

```cpp
Timestamp Poller::poll(int timeoutMs, ChannelList* activeChannels)
{
  // XXX pollfds_ shouldn't change
  int numEvents = ::poll(&*pollfds_.begin(), pollfds_.size(), timeoutMs);
  Timestamp now(Timestamp::now());
  if (numEvents > 0) {
    LOG_TRACE << numEvents << " events happended";
    fillActiveChannels(numEvents, activeChannels);
  } else if (numEvents == 0) {
    LOG_TRACE << " nothing happended";
  } else {
    LOG_SYSERR << "Poller::poll()";
  }
  return now;
}
```

该函数调用系统的poll函数，poll函数返回一个numEvents事件个数，如果有事件发生，则调用fillActiveChannels函数，该函数定义如下：

```cpp
void Poller::fillActiveChannels(int numEvents,
                                ChannelList* activeChannels) const
{
  for (PollFdList::const_iterator pfd = pollfds_.begin();
      pfd != pollfds_.end() && numEvents > 0; ++pfd)
  {
    if (pfd->revents > 0)
    {
      --numEvents;
      ChannelMap::const_iterator ch = channels_.find(pfd->fd);
      assert(ch != channels_.end());
      Channel* channel = ch->second;
      assert(channel->fd() == pfd->fd);
      channel->set_revents(pfd->revents);
      // pfd->revents = 0;
      activeChannels->push_back(channel);
    }
  }
}
```

该函数将遍历PollFdList数组pollfds_，找到时间集合中中需要处理事件的pollfd结构体，然后通过该结构体中保存的文件描述符在ChannelMap中找到该结构体对应的Channel，，并设置该Channel的响应事件revents，然后将该Channel加入到ChannelList中，ChannelList定义如下：

```cpp
typedef std::vector<Channel*> ChannelList;
ChannelList activeChannels_;
```

用于保存一个EventLoop中需要处理响应的Channel。

回到EventLoop::loop函数，解析来执行：

```cpp
for (ChannelList::iterator it = activeChannels_.begin();
it != activeChannels_.end(); ++it)
{
  (*it)->handleEvent();
}
```

从上面的ChannelList取出所有的Channel并调用其handleEvent函数处理需要响应的事件，该函数定义如下：

```cpp
void Channel::handleEvent()
{
  if (revents_ & POLLNVAL) {
    LOG_WARN << "Channel::handle_event() POLLNVAL";
  }

  if (revents_ & (POLLERR | POLLNVAL)) {
    if (errorCallback_) errorCallback_();
  }
  if (revents_ & (POLLIN | POLLPRI | POLLRDHUP)) {
    if (readCallback_) readCallback_();
  }
  if (revents_ & POLLOUT) {
    if (writeCallback_) writeCallback_();
  }
}
```

至此，整个Reactor流程分析也结束了。

### 三、总结 ###

![](https://i.imgur.com/9IQnqd2.png)

![](https://i.imgur.com/NWo2a5a.png)

## Channel 分析

Channel，你可以理解为是一个“通道”，该“通道”中绑定了一个文件描述符及其所关注事件、注册的读写事件等信息。

### 1、Channel与文件描述符

一个Channel管理一个文件描述符，在创建Channel时需要指定：

```c
const int  fd_;

Channel::Channel(EventLoop* loop, int fd__)
  : loop_(loop),
    fd_(fd__),
    ...
{
}
```

该文件描述符的关注事件可以用如下代码表示：

```c
private:
    const int Channel::kNoneEvent = 0;
    const int Channel::kReadEvent = POLLIN | POLLPRI;
    const int Channel::kWriteEvent = POLLOUT;
```

在Channel内部也定义了events_和revents_来标记文件描述符所关注的事件以及实际发生的事件，该方法和struct pollfd 结构体（见网络编程IO复用poll部分）类似：

```c
  int        events_;
  int        revents_;
```

muduo提供了下面这些函数来设置文件描述符关注事件：

```c
void enableReading() { events_ |= kReadEvent; update(); }
void enableWriting() { events_ |= kWriteEvent; update(); }
void disableWriting() { events_ &= ~kWriteEvent; update(); }
void disableAll() { events_ = kNoneEvent; update(); }
```

其中update函数定义如下：

```c
void Channel::update()
{
  loop_->updateChannel(this);
}
```

该函数的具体实现会在后续章节解释，现在只需要明白update的作用就是将该Channel及其绑定的文件描述符和EventLoop中的poll/epoll关联即可。

muduo也提供了下面函数来获取和设置文件描述符及其事件的状态：

```c
int fd() const { return fd_; }
int events() const { return events_; }
void set_revents(int revt) { revents_ = revt; } // used by pollers
// int revents() const { return revents_; }
bool isNoneEvent() const { return events_ == kNoneEvent; }
bool isWriting() const { return events_ & kWriteEvent; }
```

其中需要注意的是set_revents函数，该函数是被poll/epoll类中调用的，它的使用会在poll/epoll相关章节给出。

### 2、设置监听回调函数

Channel中可以设置读、写、错误和关闭事件的回调函数：

```c
void setReadCallback(const ReadEventCallback& cb)
{ readCallback_ = cb; }
void setWriteCallback(const EventCallback& cb)
{ writeCallback_ = cb; }
void setCloseCallback(const EventCallback& cb)
{ closeCallback_ = cb; }
void setErrorCallback(const EventCallback& cb)
{ errorCallback_ = cb; }
```

其中：

```c
ReadEventCallback readCallback_;
EventCallback writeCallback_;
EventCallback closeCallback_;
EventCallback errorCallback_;

typedef boost::function<void()> EventCallback;
typedef boost::function<void(Timestamp)> ReadEventCallback;
```

这里也使用了函数模板。

### 3、Channel与EventLoop关系

一个Channel一定会关联一个EventLoop，和文件描述符一样，在构造函数中需要传入。一旦关联该EventLoop，EventLoop就可对该Channel操作，相关内容定义如下：

```c
EventLoop* loop_;

EventLoop* ownerLoop() { return loop_; }

void Channel::update()
{
  loop_->updateChannel(this);
}

void Channel::remove()
{
  assert(isNoneEvent());
  loop_->removeChannel(this);
}
```

这些函数在后续章节使用时会在深入介绍。

### 4、响应事件

muduo中定义了该函数来响应Channel所绑定的文件描述符发生事件及其回调函数：

```c
void Channel::handleEvent(Timestamp receiveTime)
{
  boost::shared_ptr<void> guard;
  if (tied_)
  {
    guard = tie_.lock();
    if (guard)
    {
      handleEventWithGuard(receiveTime);
    }
  }
  else
  {
    handleEventWithGuard(receiveTime);
  }
}
```

该函数中主要调用了handleEventWithGuard，handleEventWithGuard定义如下：

```c
void Channel::handleEventWithGuard(Timestamp receiveTime)
{
  eventHandling_ = true;
  if ((revents_ & POLLHUP) && !(revents_ & POLLIN))
  {
    if (logHup_)
    {
      LOG_WARN << "Channel::handle_event() POLLHUP";
    }
    if (closeCallback_) closeCallback_();
  }

  if (revents_ & POLLNVAL)
  {
    LOG_WARN << "Channel::handle_event() POLLNVAL";
  }

  if (revents_ & (POLLERR | POLLNVAL))
  {
    if (errorCallback_) errorCallback_();
  }
  if (revents_ & (POLLIN | POLLPRI | POLLRDHUP))
  {
    if (readCallback_) readCallback_(receiveTime);
  }
  if (revents_ & POLLOUT)
  {
    if (writeCallback_) writeCallback_();
  }
  eventHandling_ = false;
}
```

该函数会根据revents_判断该文件描述符上实际发生的事件类型，然后调用相关的注册的回调函数。例如如果是有POLLIN（读事件）产生，那么将调用readCallback_回调函数

那么什么时候handleEvent函数会执行呢，这里可以先提前窥探一下：

在EventLoop源码中定义了该函数：

```c
void EventLoop::loop()
{
...
  while (!quit_)
  {
    activeChannels_.clear();
    pollReturnTime_ = poller_->poll(kPollTimeMs, &activeChannels_);
    ++iteration_;
    if (Logger::logLevel() <= Logger::TRACE)
    {
      printActiveChannels();
    }
    // TODO sort channel by priority
    eventHandling_ = true;
    for (ChannelList::iterator it = activeChannels_.begin();
        it != activeChannels_.end(); ++it)
    {
      currentActiveChannel_ = *it;
      currentActiveChannel_->handleEvent(pollReturnTime_);
    }
...
  }
...
}
```

所以在poll/epoll返回时，EventLoop会拿到有事件发生的Channel集合，并逐一执行它们的handleEvent函数。

到此，Channel的主要代码就分析完了，一些次要的，或者没有介绍的将在后面分析EventLoop、poll/epoll时介绍。

## Poller

Poller指的是muduo封装的PollPoller、EPollPoller及其父类Poller的总称。在muduo中定义了一个Poller类，该类中定义了一些PollPoller和EPollPoller必须要实现的函数：

```c
virtual Timestamp poll(int timeoutMs, ChannelList* activeChannels) = 0;
virtual void updateChannel(Channel* channel) = 0;
virtual void removeChannel(Channel* channel) = 0;
```

前面说到，一个Channel管理一个文件描述符fd的所有信息与操作，但如果要将文件描述符和poll/epoll关联和注册事件监听，Poller也需要关联Channel并提供相关操作的函数。但是由于poll/epoll的poll函数和操作的方法及其数据结构不同，所以这些具体的实现还是要放在PollPoller和EPollPoller中。

muduo提供了两种事件循环的类PollPoller和EPollPoller，同时也提供了该函数来选择使用哪一个：

```c
static Poller* newDefaultPoller(EventLoop* loop);
// DefaultPoller.cc
Poller* Poller::newDefaultPoller(EventLoop* loop)
{
  if (::getenv("MUDUO_USE_POLL"))
  {
    return new PollPoller(loop);
  }
  else
  {
    return new EPollPoller(loop);
  }
}
```

关于Poller的具体内容详见PollPoller和EPollPoller的讨论。

## PollPoller分析

### 1、PollPoller和EventLoop关系

一个EventLoop关联一个PollPoller，前面章节中说到Channel的update会调用EventLoop的update函数，而EventLoop又调用Poller相关的函数。EventLoop之所以能够“事件循环”也是其内部调用Poller的poll函数，所以有：

```c
PollPoller(EventLoop* loop);

PollPoller::PollPoller(EventLoop* loop)
  : Poller(loop)
{
}

 private:
  EventLoop* ownerLoop_;

void assertInLoopThread()
{
  ownerLoop_->assertInLoopThread();
}
```

这一系列函数和变量的存在。

### 2、PollPoller和Channel的关系

Channel管理了一个文件描述符，在muduo中，一个Channel可以看作是一个文件描述符的“代表”，如果要操作一个文件描述符，则必须是通过该文件描述符对应的Channel。PollPoller需要监听和返回这些文件描述符上注册和实际发生的事件，所以必须提供操作Channel的函数和数据结构。下面这两个数据结构用于保存文件描述符及其Channel。

```c
typedef std::vector<struct pollfd> PollFdList;
typedef std::map<int, Channel*> ChannelMap;
PollFdList pollfds_;
ChannelMap channels_;
```

PollFdList pollfds_的作用非常明显，因为poll函数需要一个struct pollfd的数组地址，所以该结构是用于poll函数参数。ChannelMap channels_则是用于管理注册的Channel的，key是Channel对应的文件描述符fd，value就是该Channel的地址，使用map数据结构可以很方便地对Channel进行查找和删除。

### 3、update 和 remove Channel

#### （1）updateChannel 函数

updateChannel函数定义如下，由于需要更新一个Channel，所以该函数的参数只有Channel的一份指针：

```c
virtual void updateChannel(Channel* channel);

void PollPoller::updateChannel(Channel* channel)
{
  Poller::assertInLoopThread();
  LOG_TRACE << "fd = " << channel->fd() << " events = " << channel->events();
  if (channel->index() < 0)
  {
    // a new one, add to pollfds_
    assert(channels_.find(channel->fd()) == channels_.end());
    struct pollfd pfd;
    pfd.fd = channel->fd();
    pfd.events = static_cast<short>(channel->events());
    pfd.revents = 0;
    pollfds_.push_back(pfd);
    int idx = static_cast<int>(pollfds_.size())-1;
    channel->set_index(idx);
    channels_[pfd.fd] = channel;
  }
  else
  {
    // update existing one
    assert(channels_.find(channel->fd()) != channels_.end());
    assert(channels_[channel->fd()] == channel);
    int idx = channel->index();
    assert(0 <= idx && idx < static_cast<int>(pollfds_.size()));
    struct pollfd& pfd = pollfds_[idx];
    assert(pfd.fd == channel->fd() || pfd.fd == -channel->fd()-1);
    pfd.events = static_cast<short>(channel->events());
    pfd.revents = 0;
    if (channel->isNoneEvent())
    {
      // ignore this pollfd
      pfd.fd = -channel->fd()-1;
    }
  }
}
```

首先看if (channel->index() < 0)情况下做的工作。当一个Channel创建后默认设置自身的index_为-1：

```c
Channel::Channel(EventLoop* loop, int fd__)
  : loop_(loop),
    ...
    index_(-1),
    ...
{
}
```

所以对于新创建的Channel如果被更新，那么一定是走该分支的。既然该Channel是刚创建并且是第一次和PollPoller关联，那么PollPoller中一定不会存在该Channel的信息，所以使用了该断言：

```c
assert(channels_.find(channel->fd()) == channels_.end());
```

再接下来就是构造一个pollfd结构体并将该结构体该Channel保存了，供下次poll函数调用：

```C
struct pollfd pfd;
pfd.fd = channel->fd();
pfd.events = static_cast<short>(channel->events());
pfd.revents = 0;
pollfds_.push_back(pfd);
int idx = static_cast<int>(pollfds_.size())-1;
channel->set_index(idx);
channels_[pfd.fd] = channel;
```

需要注意的是，上面Channel的index_被设置为当前pollfds_的实际长度减一，这也是为了方便快速获取到pollfds_向量中的对应的文件描述符，有了该文件描述又可以很快从channels_中获取到该Channel，这个过程的代价很小，几乎不需要遍历。

接下来分析channel->index() > 0 的情况，发生这种情况也意味着该Channel之前已经注册到该PollPoller中了，但是由于一些原因需要修改该文件描述符的关注事件，对于这种情况的Channel将调用else分支代码：

```c
else
{
  // update existing one
  assert(channels_.find(channel->fd()) != channels_.end());
  assert(channels_[channel->fd()] == channel);
  int idx = channel->index();
  assert(0 <= idx && idx < static_cast<int>(pollfds_.size()));
  struct pollfd& pfd = pollfds_[idx];
  assert(pfd.fd == channel->fd() || pfd.fd == -channel->fd()-1);
  pfd.events = static_cast<short>(channel->events());
  pfd.revents = 0;
  if (channel->isNoneEvent())
  {
    // ignore this pollfd
    pfd.fd = -channel->fd()-1;
  }
}
```

代码中两个assert断言该Channel是否已经和PollPoller关联，如果关联则取出该pollfd数组中的该Channel对应的文件描述符及其结构体，更新该结构体中文件描述符监听事件。如果不再关注该Channel中文件描述符事件，则直接将该文件描述符赋值为其相反数减一。

#### （2）removeChannel 函数

使用该函数之前一般需要调用 updateChannel 函数设置不再关注该Channel对应的文件描述符上的事件。

该函数定义如下：

```c
void PollPoller::removeChannel(Channel* channel)
{
  Poller::assertInLoopThread();
  LOG_TRACE << "fd = " << channel->fd();
  assert(channels_.find(channel->fd()) != channels_.end());
  assert(channels_[channel->fd()] == channel);
  assert(channel->isNoneEvent());
  int idx = channel->index();
  assert(0 <= idx && idx < static_cast<int>(pollfds_.size()));
  const struct pollfd& pfd = pollfds_[idx]; (void)pfd;
  assert(pfd.fd == -channel->fd()-1 && pfd.events == channel->events());
  size_t n = channels_.erase(channel->fd());
  assert(n == 1); (void)n;
  if (implicit_cast<size_t>(idx) == pollfds_.size()-1)
  {
    pollfds_.pop_back();
  }
  else
  {
    int channelAtEnd = pollfds_.back().fd;
    iter_swap(pollfds_.begin()+idx, pollfds_.end()-1);
    if (channelAtEnd < 0)
    {
      channelAtEnd = -channelAtEnd-1;
    }
    channels_[channelAtEnd]->set_index(idx);
    pollfds_.pop_back();
  }
}
```

首先三个断言确认该Channel已经和PollPoller关联而且确认该Channel上的文件描述符事件不再关注，然后找到该Channel文件描述符在pollfds_数组中的位置，将该Channel从Channels_中去除，将该文件描述符对应的pollfd从pollfds_数组中去除。从pollfs_数组中去除一个pollfd，Muduo使用了一个技巧，如果要去除的pollfd结构是数组中的最后一个元素，则调用pop_back函数直接弹出，否则将该元素和数组中最后一个元素交换位置，然后弹出最后一个元素，这样保证了pollfds_数组元素是连续的，不存在中间缺失的情况。

### 3、poll

poll函数是在EventLoop中调用的，EventLoop希望通过该函数获取到当前的活动Channel(文件描述符上有事件发生)集合，所以会传入一个ChannelList* activeChannels作为poll的参数，该结构定义如下：

```c
typedef std::vector<Channel*> ChannelList;
```

也是一个vector集合，保存Channel的地址。poll函数定义如下：

```c
Timestamp PollPoller::poll(int timeoutMs, ChannelList* activeChannels)
{
  // XXX pollfds_ shouldn't change
  int numEvents = ::poll(&*pollfds_.begin(), pollfds_.size(), timeoutMs);
  Timestamp now(Timestamp::now());
  if (numEvents > 0)
  {
    LOG_TRACE << numEvents << " events happended";
    fillActiveChannels(numEvents, activeChannels);
  }
  else if (numEvents == 0)
  {
    LOG_TRACE << " nothing happended";
  }
  else
  {
    LOG_SYSERR << "PollPoller::poll()";
  }
  return now;
}
```

该函数的第一个参数是超时时间，第二个参数是EventLoop中需要的活动通道集合。该函数的内部也是调用了poll函数，当poll返回时，该函数会获取当前时间戳，作为函数返回值使用。如果poll返回为0，则说明poll超时但没有发生任何事件；如果poll为负值，则说明poll系统调用失败；如果poll正常返回一个整数，则说明当前有文件描述符活动，需要获取这些文件描述符对应的Channel，并返回给EventLoop，这里使用了fillActiveChannels来获取这些活跃的通道：

```c
void PollPoller::fillActiveChannels(int numEvents, ChannelList* activeChannels) const
{
  for (PollFdList::const_iterator pfd = pollfds_.begin();
      pfd != pollfds_.end() && numEvents > 0; ++pfd)
  {
    if (pfd->revents > 0)
    {
      --numEvents;
      ChannelMap::const_iterator ch = channels_.find(pfd->fd);
      assert(ch != channels_.end());
      Channel* channel = ch->second;
      assert(channel->fd() == pfd->fd);
      channel->set_revents(pfd->revents);
      // pfd->revents = 0;
      activeChannels->push_back(channel);
    }
  }
}
```

到这里PollPoller就分析完了，需要注意的是Channel的index_，在PollPoller中，如果index_为-1，则说明该Channel是新的需要加入的通道；如果index_>0，则说明该Channel已经和PollPoller关联了，index_的值用于在pollfds_数组中查找文件描述符对应的pollfd如果index_为其他负值，则说明该文件描述符将不被关注，该Channel也将被移除。

index_在EPollPoller中的作用也类似，但又是一种新的处理方法，这在EPollPoller中将具体分析。

## EPollPoller 分析

### 1、PollPoller和EventLoop关系

一个EventLoop关联一个EPollPoller，前面章节中说到Channel的update会调用EventLoop的update函数，而EventLoop又调用Poller相关的函数。EventLoop之所以能够“事件循环”也是其内部调用Poller的poll函数，所以有：

```c
EPollPoller(EventLoop* loop);

EPollPoller::EPollPoller(EventLoop* loop)
  : Poller(loop),
    epollfd_(::epoll_create1(EPOLL_CLOEXEC)),
    events_(kInitEventListSize)
{
  if (epollfd_ < 0)
  {
    LOG_SYSFATAL << "EPollPoller::EPollPoller";
  }
}

 private:
  EventLoop* ownerLoop_;

void assertInLoopThread()
{
  ownerLoop_->assertInLoopThread();
}
```

这一系列函数和变量的存在。

### 2、EPollPoller和Channel的关系

Channel管理了一个文件描述符，在muduo中，一个Channel可以看作是一个文件描述符的“代表”，如果要操作一个文件描述符，则必须是通过该文件描述符对应的Channel。EPollPoller需要监听和返回这些文件描述符上注册和实际发生的事件，所以必须提供操作Channel的函数和数据结构。下面这两个数据结构用于保存文件描述符及其Channel。

```c
typedef std::vector<struct epoll_event> EventList;
typedef std::map<int, Channel*> ChannelMap;
EventList events_;
ChannelMap channels_;
```

EventList events_的作用非常明显，因为epoll函数需要一个struct epoll_event的数组地址，所以该结构是用于epoll_wait函数参数。ChannelMap channels_则是用于管理注册的Channel的，key是Channel对应的文件描述符fd，value就是该Channel的地址，使用map数据结构可以很方便的对Channel进行查找和操作。

### 3、update 和 remove Channel

#### （1）updateChannel 函数

updateChannel函数定义如下：

```c
void EPollPoller::updateChannel(Channel* channel)
{
  Poller::assertInLoopThread();
  LOG_TRACE << "fd = " << channel->fd() << " events = " << channel->events();
  const int index = channel->index();
  if (index == kNew || index == kDeleted)
  {
    // a new one, add with EPOLL_CTL_ADD
    int fd = channel->fd();
    if (index == kNew)
    {
      assert(channels_.find(fd) == channels_.end());
      channels_[fd] = channel;
    }
    else // index == kDeleted
    {
      assert(channels_.find(fd) != channels_.end());
      assert(channels_[fd] == channel);
    }
    channel->set_index(kAdded);
    update(EPOLL_CTL_ADD, channel);
  }
  else
  {
    // update existing one with EPOLL_CTL_MOD/DEL
    int fd = channel->fd();
    (void)fd;
    assert(channels_.find(fd) != channels_.end());
    assert(channels_[fd] == channel);
    assert(index == kAdded);
    if (channel->isNoneEvent())
    {
      update(EPOLL_CTL_DEL, channel);
      channel->set_index(kDeleted);
    }
    else
    {
      update(EPOLL_CTL_MOD, channel);
    }
  }
}
```

这个函数的作用和PollPoller函数作用是一样的。当一个Channel的index_为-1时则说明这个Channel并没有和EPollPoller关联，如果index_为2，则说明该通道被取消过关注，如果为1则说明该Channel已经和EPollPoller关联，需要更新相关文件描述符的一些监听事件：

```c
namespace
{
const int kNew = -1;
const int kAdded = 1;
const int kDeleted = 2;
}
```

如果index_是kNew或者kDeleted，则说明需要将该通道和该EPollPoller关联，设置index_为kAdded，然后调用update函数将该通道和EPollPoller关联：

```c
void EPollPoller::update(int operation, Channel* channel)
{
  struct epoll_event event;
  bzero(&event, sizeof event);
  event.events = channel->events();
  event.data.ptr = channel;
  int fd = channel->fd();
  if (::epoll_ctl(epollfd_, operation, fd, &event) < 0)
  {
    if (operation == EPOLL_CTL_DEL)
    {
      LOG_SYSERR << "epoll_ctl op=" << operation << " fd=" << fd;
    }
    else
    {
      LOG_SYSFATAL << "epoll_ctl op=" << operation << " fd=" << fd;
    }
  }
}
```

update函数内部也是调用了epoll_ctl函数（其用法在网络编程部分有介绍）。需要注意的是，epoll_event里并没有设置文件描述符，而是用了event.data.ptr指针保存了Channel，毕竟Channel中包含的文件描述符信息更加丰富。

如果index_已经是added状态，那么判断该Channel中文件描述符是否被设置为“不关注”如果是的话，直接调用updata函数将该文件描述符移除epoll事件监听，否则更新该文件描述符结构的events监听事件。

#### （2）removeChannel 函数

```c
void EPollPoller::removeChannel(Channel* channel)
{
  Poller::assertInLoopThread();
  int fd = channel->fd();
  LOG_TRACE << "fd = " << fd;
  assert(channels_.find(fd) != channels_.end());
  assert(channels_[fd] == channel);
  assert(channel->isNoneEvent());
  int index = channel->index();
  assert(index == kAdded || index == kDeleted);
  size_t n = channels_.erase(fd);
  (void)n;
  assert(n == 1);

  if (index == kAdded)
  {
    update(EPOLL_CTL_DEL, channel);
  }
  channel->set_index(kNew);
}
```

该函数将取消对Channel对应的文件描述的事件监听，然后将该Channel从channels_中删除。

### 4、poll 

poll函数是在EventLoop中调用的，EventLoop希望通过该函数获取到当前的活动Channel(文件描述符上有事件发生)集合，所以会传入一个ChannelList* activeChannels作为poll的参数，该结构定义如下：

```c
typedef std::vector<Channel*> ChannelList;
```

也是一个vector集合，保存Channel的地址。poll函数定义如下：

```c
Timestamp EPollPoller::poll(int timeoutMs, ChannelList* activeChannels)
{
  int numEvents = ::epoll_wait(epollfd_,
                               &*events_.begin(),
                               static_cast<int>(events_.size()),
                               timeoutMs);
  Timestamp now(Timestamp::now());
  if (numEvents > 0)
  {
    LOG_TRACE << numEvents << " events happended";
    fillActiveChannels(numEvents, activeChannels);
    if (implicit_cast<size_t>(numEvents) == events_.size())
    {
      events_.resize(events_.size()*2);
    }
  }
  else if (numEvents == 0)
  {
    LOG_TRACE << " nothing happended";
  }
  else
  {
    LOG_SYSERR << "EPollPoller::poll()";
  }
  return now;
}
```

该函数的第一个参数是超时时间，第二个参数是EventLoop中需要的活动通道集合。该函数的内部也是调用了epoll_wait函数，该函数需要一个额外的文件描述符作为epollfd_：

```c
int epollfd_;
```

该文件描述符在构造函数初始化参数中中已经初始化了：

```c
EPollPoller::EPollPoller(EventLoop* loop)
  : Poller(loop),
    epollfd_(::epoll_create1(EPOLL_CLOEXEC)),
    events_(kInitEventListSize)
{
  if (epollfd_ < 0)
  {
    LOG_SYSFATAL << "EPollPoller::EPollPoller";
  }
}
```

当epoll_wait返回时，该函数会获取当前时间戳，作为函数返回值使用。如果poll返回为0，则说明poll超时但没有发生任何事件；如果poll为负值，则说明poll系统调用失败；如果poll正常返回一个整数，则说明当前有文件描述符活动，需要获取这些文件描述符对应的Channel，并返回给EventLoop，这里使用了fillActiveChannels来获取这些活跃的通道，当活跃的文件描述达到events_数组大小时，该数组将会扩容一倍，以满足更多需求，也减少了vector动态扩张的次数。fillActiveChannels函数定义如下：

```c
void EPollPoller::fillActiveChannels(int numEvents,
                                     ChannelList* activeChannels) const
{
  assert(implicit_cast<size_t>(numEvents) <= events_.size());
  for (int i = 0; i < numEvents; ++i)
  {
    Channel* channel = static_cast<Channel*>(events_[i].data.ptr);
#ifndef NDEBUG
    int fd = channel->fd();
    ChannelMap::const_iterator it = channels_.find(fd);
    assert(it != channels_.end());
    assert(it->second == channel);
#endif
    channel->set_revents(events_[i].events);
    activeChannels->push_back(channel);
  }
}
```

需要注意的是EPollPoller的文件描述符epollfd_，由于EPollPoller是采用RAII技法编写的，在构造函数中创建了文件描述符epollfd_，那么在析构函数中也应该关闭epollfd_并释放资源：

```c
EPollPoller::~EPollPoller()
{
  ::close(epollfd_);
}
```

到此，EPollPoller就分析结束了。