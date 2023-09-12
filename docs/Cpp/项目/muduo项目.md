# muduo网络库解析

​	muduo采用了基于OOP 思想，Reactor 方式，one loop peer thead 的模式，驱动的事件回调的 epoll + 线程池面向对象，通过多线程和事件循环机制实现 高并发处理。

服务器流程TcpServer类:

包含主EventLoop，Acceptor，以及包含EventLoop的线程池。通过调用tcpServer的Start方法后，会初始化线程池，并开启线程中的EventLoop的监听。然后启动Acceptor监听socket端的新的连接服务的读事件。

若是多线程模式，主EventLoop负责监听Acceptor的读写时间，也就是服务器socket端的新的连接服务的读事件。若有新连接来，则通过Acceptor执行绑定的tcpServer的newConnection回调函数。newConnection回调函数会将新来的连接封装为Tcpconnection,并通过轮询算法为其分配对应的线程（EventLoop）。Tcpconnection中设置对应的回调函数，如果有相应的回调产生就会调用该回调函数（由用户设置），并提供Send（）发送消息的接口供用户使用。每当新连接到来时，Tcpconnection封装完成会调用TcpConnection::connectEstablished函数，该函数通过启用Channel的读事件，并且通过tie函数设置Channel对应的weak_ptr智能指针，通过Epoller监听该Channel的读事件发生。



若新连接的事件发生，EventLoop会通过Poller监听到对应的Channel发生了事件，则会通过EventLoop中执行channel的handleEvent事件，对应的读写事件（该事件是用户在TcpServer中设置）。



主要类：

**Channel:**

保存fd，已经相应的回调函数。当Poller中有事件相应，则通过EventLoop执行该相应事件的回调。

**EPollPoller：**

使用epoll接口实现，用于fd事件的增删改，并用poll得到响应的Channel。

**EventLoop：**

一个线程一个EventLoop，一个EventLoop包含一个EPollPoller，以及注册的Channel。一旦EPollPoller返回响应的Channel。则执行Channel对应的回调函数。除此之外，EventLoop还保存有回调函数数组，通过EventFd唤醒EventLoop，并在一次循环中执行这些回调函数。

**EventLoopThread：**

一个绑定了EventLoop的线程，初始化时生成EventLoop，调用StartLoop时候则开启对应的EventLoop的监听。

**EventLoopThreadPool：**

一个线程池，保存有对应的线程以及对应的EventLoop，通过初始化线程数量开辟对应的线程，并启动所有的EventLoop的循环监听。

**Acceptor：**

服务器端的socket，包含EventLoop，用于监听新的连接。每当有新连接来时候，执行TcpServer中的newConnection回调。

**TcpConnection：**

封装一个连接，Tcpconnection中设置对应的回调函数，如果有相应的回调产生就会调用该回调函数（由用户设置），并提供Send（）发送消息的接口供用户使用。每当新连接到来时，Tcpconnection封装完成会调用TcpConnection::connectEstablished函数。

**TcpServer：**

主类，提供设置回调函数接口，线程接口，需要主动传入主EventLoop已经服务器地址。通过start开启线程中的EventLoop的监听。然后启动Acceptor监听socket端的新的连接服务的读事件。如果有新连接则调用connectEstablished函数，分配EventLoop建立新的Tcpconnection。

## 网络通信模块

网络通信模块采用的是 muduo 网络库，本项目通过使用 C++11 简化 muduo 网络库，同时去除了 Boost 库的依赖以及一些冗余的组件，提取出 muduo 库中的核心思想，即 One Loop Per Thread。

### 1. Reactor

该网络库采用的是 Reactor 事件处理模式。在《Linux高性能服务器编程》中，对于 Reactor 模型的描述如下：**主线程（即 I/O 处理单元）只负责监听文件描述符上是否有事件发生，有的话就立即将该事件通知工作线程（即逻辑单元）。此外，主线程不做任何其他实质性的工作。读写数据、接受新的连接，以及处理客户请求均在工作线程中完成**。Reactor 模式的时序图如下：

[![img](https://github.com/Kohirus/Apollo/raw/main/screenshot/reactor-sequence.png)](https://github.com/Kohirus/Apollo/blob/main/screenshot/reactor-sequence.png)

而 muduo 网络库的时序图则如下图所示：

[![img](https://github.com/Kohirus/Apollo/raw/main/screenshot/muduo-sequence.png)](https://github.com/Kohirus/Apollo/blob/main/screenshot/muduo-sequence.png)

其次，在《Linux高性能服务器编程》一书中还提到了**半同步/半异步**的并发模式，注意，此处的“异步”与 I/O 模型中的异步并不相同，I/O 模型中的“同步”和“异步”的区分是内核应用程序通知的是何种事件（就绪事件还是完成事件），以及由谁来完成 I/O 读写（是应用程序还是内核）。而在并发模式中，“同步”指的是完全按照代码序列的顺序执行，“异步”则指的是程序的执行需要由系统事件来驱动，比如常见的系统终端、信号等。

而 muduo 库所采用的便是高效的半同步/半异步模式，其结构如下图所示：

[![img](https://github.com/Kohirus/Apollo/raw/main/screenshot/half-sync-asyn.png)](https://github.com/Kohirus/Apollo/blob/main/screenshot/half-sync-asyn.png)

上图中，主线程只管理监听 socket，连接 socket 由工作线程来管理。当有新的连接到来时，主线程就接受并将新返回的连接 socket 派发给某个工作线程，此后在该 socket 上的任何 I/O 操作都由被选中的工作线程来处理，直到客户关闭连接。主线程向工作线程派发 socket 的最简单的方式，是往它和工作线程之间的管道写数据。工作线程检测到管道上有数据可读时，就分析是否是一个新的客户连接请求到来。如果是，则把新 socket 上的读写事件注册到自己的 epoll 内核事件表中。上图中的每个线程都维持自己的事件循环，它们各自独立的监听不同的事件。因此，在这种高效的半同步/半异步模式中，每个线程都工作在异步模式，所以它并非严格意义上的半同步/半异步模式。

通常情况下，Reactor 模式的实现有如三几种方式：

- Single Reactor - Single Thread
- Single Reactor - Multi Threads
- Multi Reactors - Multi Threads

对于 “Single Reactor - Single Thread” 模型而言，其通常只有一个 epoll 对象，所有的接收客户端连接、客户端读取、客户端写入操作都包含在一个线程内，如下图所示：

[![img](https://github.com/Kohirus/Apollo/raw/main/screenshot/reactor-thread.png)](https://github.com/Kohirus/Apollo/blob/main/screenshot/reactor-thread.png)

但在目前的单线程 Reactor 模式中，不仅 I/O 操作在该 Reactor 线程上，连非 I/O 的业务操作也在该线程上进行处理了，这可能会大大延迟 I/O 请求的响应。为了提高服务器的性能，我们需要将非 I/O 的业务逻辑操作从 Reactor 线程中移动到工作线程中进行处理。

为此，可以通过使用线程池模型的方法来改进，即 “Single Reactor - Multi Threads” 模型，其结构如下图所示。将读写的业务逻辑交给具体的线程池来实现，这样可以显示 reactor 线程对 IO 的响应，以此提升系统性能。

[![img](https://github.com/Kohirus/Apollo/raw/main/screenshot/reactor-threads.png)](https://github.com/Kohirus/Apollo/blob/main/screenshot/reactor-threads.png)

尽管现在已经将所有的非 I/O 操作交给了线程池来处理，但是所有的 I/O 操作依然由 Reactor 单线程执行，在高负载、高并发或大数据量的应用场景，依然较容易成为瓶颈。

为了继续提升服务器的性能，进而改造出了如下图所示的 “Multi Reactors - Multi Threads” 模型：

[![img](https://github.com/Kohirus/Apollo/raw/main/screenshot/reactors-threads.png)](https://github.com/Kohirus/Apollo/blob/main/screenshot/reactors-threads.png)

在这种模型中，主要分为两个部分：mainReactor、subReactors。 mainReactor 主要负责接收客户端的连接，然后将建立的客户端连接通过负载均衡的方式分发给 subReactors，subReactors 则负责具体的每个连接的读写，而对于非 IO 的操作，依然交给工作线程池去做，对逻辑进行解耦。

而在 muduo 网络库中，便采用的是此种模型，每一个 Reactor 都是一个 EventLoop 对象，而每一个 EventLoop 则和一个线程唯一绑定，这也就是 One Loop Per Thread 的含义所在。其中，MainLoop 只负责新连接的建立，连接建立成功后则将其打包为 TcpConnection 对象分发给 SubLoop，在 muduo 网络库中，采用的是 “轮询算法” 来选择处理客户端连接的 SubLoop。之后，这个已建立连接的任何操作都交付给该 SubLoop 来处理。

通常在服务器模型中，我们可以使用 “任务队列” 的方式向 SubLoop 派发任务，即 MainLoop 将需要执行的任务放到任务队列中，而 SubLoop 则从任务队列中取出任务并执行，当任务队列中没有任务时，SubLoop 则进行休眠直到任务队列中有任务出现。但是在 muduo 网络库却中并未采用这一方式，而是采用了另一个更加高效的方式，以便让 MainLoop 唤醒 SubLoop 处理任务。

在上述的 “半同步/半异步” 模式中，我们提到了，主线程向工作线程派发 socket 最简单的方式，就是往它和工作线程之间的管道写数据。为此，我们可以在 MainLoop 和 SubLoop 之间建立管道来进行通信，当有任务需要执行时，MainLoop 通过管道将数据发送给 SubLoop，SubLoop 则通过 epoll 模型监听到了管道上所发生的可读（EPOLLIN）事件，然后调用相应的读事件回调函数来处理任务。

但是在 muduo 库中，则采用了更为高效的 `eventfd()` 接口，它通过创建一个文件描述符用于事件通知，自 Linux 2.6.22 以后开始支持。

> eventfd 在信号通知的场景下，相对比 pipe 有非常大的资源和性能优势，它们的对比如下：
>
> 1. 首先在于它们所打开的文件数量的差异，由于 pipe 是半双工的传统 IPC 实现方式，所以两个线程通信需要两个 pipe 文件描述符，而用 eventfd 则只需要打开一个文件描述符。总所周知，文件描述符是系统中非常宝贵的资源，Linux 的默认值只有 1024 个，其次，pipe 只能在两个进程/线程间使用，面向连接，使用之前就需要创建好两个 pipe ,而 eventfd 是广播式的通知，可以多对多。
> 2. 另一方面则是内存使用的差别，eventfd 是一个计数器，内核维护的成本非常低，大概是自旋锁+唤醒队列的大小，8 个字节的传输成本也微乎其微，而 pipe 则完全不同，一来一回的数据在用户空间和内核空间有多达 4 次的复制，而且最糟糕的是，内核要为每个 pipe 分配最少 4K 的虚拟内存页，哪怕传送的数据长度为 0。

### 2. I/O multiplexing

在 Linux 系统下，常见的 I/O 复用机制有三种：select、poll 和 epoll。

其中，select 模型的缺点如下：

1. 单个进程能够监视的文件描述符的数量存在最大限制，通常是 1024，当然可以更改数量，但由于 select 采用轮询的方式扫描文件描述符，文件描述符数量越多，性能越差；
2. 内核和用户空间的内存拷贝问题，select 需要复制大量的句柄数据结构，会产生巨大的开销；
3. select 返回的是含有整个句柄的数组，应用程序需要遍历整个数组才能发现哪些句柄发生了事件；
4. select 的触发方式是水平触发，应用程序如果没有对一个已经就绪的文件描述符进行相应的 I/O 操作，那么之后每次 select 调用还是会将这些文件描述符通知进程；

相比于 select 模型，poll 则使用链表来保存文件描述符，因此没有了监视文件数量的限制，但其他三个缺点依然存在。

而 epoll 的实现机制与 select/poll 机制完全不同，它们的缺点在 epoll 模型上不复存在。其高效的原因有以下两点：

1. 它通过使用**红黑树**这种数据结构来存储 epoll 所监听的套接字。当添加或者删除一个套接字时（epoll_ctl），都是在红黑树上进行处理，由于红黑树本身插入和删除性能比较好，时间复杂度为 O(logN)，因此其效率要高于 select/poll。
2. 当把事件添加进来的时候时候会完成关键的一步，那就是该事件会与相应的设备（网卡）驱动程序建立回调关系，当相应的事件发生后，就会调用这个回调函数。这个回调函数其实就是把该事件添加到 `rdllist` 这个双向链表中。那么当我们调用 epoll_wait 时，epoll_wait 只需要检查 rdlist 双向链表中是否有存在注册的事件，效率非常可观。

epoll 对文件描述符的操作有两种模式：LT（Level Trigger，电平触发）和 ET（Edge Trigger，边沿触发）模式。其中，LT 模式是默认的工作模式，这种模式下 epoll 相当于一个效率较高的 poll。当往 epoll 内核事件表中注册一个文件描述符上的 EPOLLOUT 事件时，epoll 将以 ET 模式来操作该文件描述符。ET 模式是 epoll 的高效工作模式。

对于采用 LT 工作模式的文件描述符，当 epoll_wait 检测到其上有事件发生并将此事件通知应用程序后，应用程序可以不立即处理该事件。这样，当应用程序下一次调用 epoll_wait 时，epoll_wait 还会再次向应用程序通告此事件，直到该事件被处理。而对于采用 ET 工作模式的文件描述符，当 epoll_wait 检测到其上有事件发生并将此事件通知应用程序后，应用程序必须立即处理该事件，因为后续的 epoll_wait 调用将不再向应用程序通知这一事件。可见，ET 模式在很大程度上降低了同一个 epoll 事件被重复触发的此时，因此效率要比 LT 模式高。

在 muduo 网络库中，则采用了 LT 工作模式，其原因如下：

1. 不会丢失数据或者消息，应用没有读取完数据，内核是会不断上报的；
2. 每次读数据只需要一次系统调用；照顾了多个连接的公平性，不会因为某个连接上的数据量过大而影响其他连接处理消息；

在 muduo 网络库中，借助于 Linux 下“一切皆文件”的思想，通过 epoll 进行管理的主要有如下三个类型的事件：

- **网络 I/O 事件**：通过套接字（socket）文件描述符进行管理；
- **线程通知事件**：通过 eventfd 唤醒 SubLoop 处理相应的任务；
- **定时器事件**：通过 timerfd 来处理定时器事件；

### 3. QPS

QPS(Query Per Second) 即每秒查询率，QPS 是对一个特定的查询服务器在规定时间内所处理流量多少的衡量标准。