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

