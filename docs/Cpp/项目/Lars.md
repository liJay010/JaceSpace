# Lars
![FBD6AFF56DEE4C2D642C6C47328AC0B0](pictures\FBD6AFF56DEE4C2D642C6C47328AC0B0.png)

## 框架部分(Reactor) (重要)

### C++ TCP/UDP长连接 服务器框架
#### 构建reactor项目
##### 创建Lars/Reactor目录
##### 完成基本的reactor库生成及测试
###### Makefile
* 生成库 需要添加 fPIC
#### LarsV0.1-reactor的基础服务功能
##### 回显功能
###### 创建tcp_server
* tcp_server构造函数
    * socket创建基本过程(创建，绑定，监听)
        * 需要信号的忽略(SIGHUP, SIGPIPE)
* do_accept
    * accept操作
        * 对accept返回值-1，需要对errno具体的数值来处理
    * while循环
        * 写死“lars hello "发送给客户端
##### example测试V0.1的server app
###### 通过 nc 127.0.0.1 7777 模拟客户端来测试
#### LarsV0.2-内存管理
##### 内存块结构io_buf
###### 属性
* 容量capacity
* 有效数据长度 length
* 未处理的数据的首地址(索引) head
* 当前内存块的首地址 data
* io_buf指针 next
###### 方法
* clear() 清空当前内存 不是free物理回收，而是指针清空
* pop(int len) ,已经处理了 len长度的数据 
* adjust() 将head重置，将有效的数据前置到data指针下
* copy(io_buf *other), 将other的有效数据拷贝到自身中(复制)
##### 内存池结构buf_pool
###### 全局唯一(单例模式)
###### 属性
* 内存池的数据句柄 map
    * key---> 内存块刻度
    * value---> 当前刻度下所挂载的io_buf链表
* 内存池的总体大小 total_num
###### 方法
* 构造函数 buf_pool()
    * 初始化全部的内存
        * 建立map结构，将全部的刻度的内存一次new出来
* 得到一个io_buf的方法 开辟一个io_buf
    * io_buf* alloc_buf(int N)
        * alloc不是一个new操作，而是从map中选取一个合适的io_buf返回
    * io_buf* alloc_buf()
        * 默认返回一个固定的长度的io_buf
* 将一个已经使用完的io_buf重置放回buf_pool中
    * void revert(io_buf *buffer);
##### 读写缓冲区
###### reactor_buf 为input_buf和output_buf的父类
* 属性
    * io_buf * _buf
* 方法
    * length()
        * 获取_buf未读处理数据长度
    * pop(int len)
        * 弹出已处理数据
    * clear()
        * 清空_buf并将_buf放回 buf_pool内存池
###### input_buf
* 网络通信 读取数据缓冲区
    * 方法
        * int read_data(int fd);
            * 将fd 读取至io_buf中
        * const char *data() const;
            * 获取缓冲区中的数据
        * void adjust();
            * 重置缓冲区
###### output_buf
* 网络通信 写输出数据缓冲区
    * 方法
        * send_data(char *data, int datalen)
            * 将data数据写到output_buf中的_buf中
        * write2fd(int fd)
            * 将output_buf中的_buf中 写到对端fd中
##### larsV0.2开发
###### 回显功能
* 将数据读到input_buf中
* 将input_buf存到业务的msg内存中 进行业务处理
* 将业务数据msg 写到output_buf中
* 将output_buf中的数据写到 客户端套接字connfd中
#### LarsV0.3 event_loop
##### 多路IO事件机制
###### 封装事件(基于epoll原生事件来封装)
* event_base
    * io_event
        * 读回调及参数
        * 写回调及参数
    * io_callback
        * 事件的回调函数
* event_loop
    * 属性
        * _io_evs  map: key->fd,  value->io_event
        * _epfd
        * listen_fd_set 正在被监听的fd集合
    * 添加一个事件
    * 删除一个事件
    * 启动event_loop循环机制
###### LarsV0.3开发
* tcp_server
    * 添加一个event_loop属性
    * tcp_server 创建完listen fd 之后，将listenfd绑定一个accpet回调业务的读事件
* accept_callback
    * accpet
        * 得到一个新的connfd
    * 将connfd的读事件和读回调 server_rd_callback添加到event_loop中
*  server_rd_callback
    * 读取客户端数据
    * 将connfd 读事件删除，添加写事件和写回调 server_wt_callback 到 event_loop中
* server_wt_callback
    * 将数据写回客户端
    * 将connfd 写事件删除，添加读事件和读回调 server_rd_callback 到 event_loop中
#### LarsV0.4 链接和消息封装
##### 消息的封装
###### msg_head
* int msgid
* int msglen
##### 链接的封装
###### tcp_conn
* 属性
    * _connfd
    * 所关联的epoll触发堆 event_loop* _loop
    * 输出缓冲
    * 输入缓冲
* 方法
    * 构造函数
        * 设置conn为非阻塞
        * 将conn的 读事件和回掉 加入到event_loop中
    * do_read
        * 处理读事件的回掉函数
            * 解析包头和包体
            * 调用回显业务 ---> send_message()方法
    * send_message
        * 将 读到数据发送给对端，实际上是填充obuf缓冲区
        * 激活 conn写事件， 让event_loop触发   将conn的 写事件和回掉 加入到event_loop中
    * do_write
        * 处理写事件的回掉函数
            * 将obuf中的数据 通过io写给客户端
            * 如果obuf数据写完， 删除conn的写事件 从 event_loop中
##### tcp_server 在accept成功之后
###### 将得到的新的connfd 构造一个tcp_conn对象
#### Lars V0.4 客户端接口
##### 封装一个tcp_client类
###### 属性
* _sockfd, 客户端链接套接字
* event_loop 事件监听机制
* 允许开发注册的 客户端回调函数
    * 用来处理服务端返回数据的 回调业务
* 输出缓冲
* 输入缓冲
###### 方法
* 构造
    * 客户端套接字创建
* 主动发送消息的方法 send_message()
* do_read()
    * 处理读事件的回掉函数
* do_write()
    * 处理写事件的回掉函数
* clean_conn()
    * 清空对象资源
* do_connect()
    * 主动和服务器创建链接
        * 设置sockfd为非阻塞
            * connect系统调用之后，return -1,errno == EINPROGRESS 需要判断sockfd是否可写
            * 可写则创建成功
            * 否则创建失败
#### Lars V0.5 tcp_conn连接属性
##### 让server有一个目前都有多少tcp_conn在线 状态
###### tcp_server类集成一些属性
* 添加的属性
    * 用来索引全部在线连接的一个集合 tcp_conn **conns
* 添加的方法 (静态方法) 因为这些方法都是tcp_conn来进行调用的
    * 针对连接集合 做添加操作 
        * tcp_conn在构造函数完成之前 调用该方法来添加链接
    * 针对连接集合， 做减少操作
        * tcp_conn在销毁之前 调用该方法来减少链接
    * 获取链接集合的个数
        * tcp_server 成功accept一个新链接之后， 得到当前链接个数，来判断损是否需要new一个新的tcp_conn对象
    * 保护当前连接集合的一个锁
* 在tcp_server构造函数中 将tcp_conn** conns 额外开辟max_conns+3个容量的空间
    * 3表示有3个默认的文件描述符
###### 每次创建一个tcp_conn链接 
* 向集合中 添加一个连接
###### 每次销毁一个tcp_conn连接
* 从集合中 删除一个链接
#### Lars V0.6 消息路由分发机制
##### 在 message.h中 定义一个msg_router类
###### 属性
* _router 路由 map:      key<消息ID>， value <处理的业务回调函数>
* _args map:  key<消息ID>,     value <处理业务回调函数的形参>
###### 方法
* 注册一个路由回调业务
* 根据msgid来调用一个路由回调业务
##### 定义了一个抽象的链接类net_connection
###### 纯虚方法
* send_message()
###### tcp_conn 继承net_connection
* 重写send_message()
###### tcp_client 继承 net_connection
* 重写send_message()
##### 将msg_router集成到reactor框架中
###### tcp_server
* tcp_server 添加一个msg_router属性
* 初始化msg_router对象
* 给tcp_server提供一个add_msg_router 添加一个路由回调业务的方法
    * 将方法注册到router中
* tcp_conn
    * do_read
        * 在已经读取完全部的client发送过来的数据之后
        * 调用tcp_server::router.call()
            * 根据不同的msgid 来调用不同的业务方法
###### tcp_client
* tcp_client中添加一个msg_router属性
    * tcp_client构造函数中初始化
* 给tcp_client提供一个add_msg_router 添加一个路由回调业务的方法
    * 将方法注册到router中
* do_read
    * 在已经读取完全部的client发送过来的数据之后
    * this->_router.call()
        * 根据不同的msgid 来调用不同的业务方法
##### 分别完成server.cpp服务器开发和client.cpp客户端开发进行单元测试
#### Lars V0.7 创建连接/销毁连接HOOK机制
##### 在net_connection.h 
###### 定义一个链接hook函数的原型
* typedef  void (*conn_callback)(net_connection *conn, void *args);
##### tcp_server
###### 添加属性 两个函数指针
* static conn_callback conn_start_cb;
* static void * conn_start_cb_args;
* static conn_callback conn_close_cb;
* static void * conn_close_cb_args;
###### 添加两个设置 hook函数的方法
* void set_conn_start()
* void set_conn_close()
###### 在tcp_conn中
* 创建tcp_conn的构造函数中 调用 conn_start_cb
* 在clean_conn()方法中 调用conn_close_cb
###### 实现server.cpp 进行测试
##### tcp_client
###### 添加属性 两个函数指针
* static conn_callback conn_start_cb;
* static void * conn_start_cb_args;
* static conn_callback conn_close_cb;
* static void * conn_close_cb_args;
###### 添加两个设置 hook函数的方法
* void set_conn_start()
* void set_conn_close()
###### 在链接创建成功之后
* connection_succ() 函数中 调用 conn_start_cb
* 在clean_conn()方法中 调用conn_close_cb
###### 实现client.cpp 进行测试
#### Lars V0.8 消息队列和线程池
##### 几种并发模型
##### task_msg
###### 消息队列的任务类型
* 任务1
    * 新建立链接的任务  main_thread accept成功之后发送该任务
        * type：NEW_CONN
        * data: connfd
* 任务2
    * 一般任务 (TODO) 在LarsV0.11版本中实现
##### thread_queue
###### 属性
* evfd 当前消息队列的监听文件描述符
    * 让所绑定的thread里的event_loop用来监控
        * 将evfd加入到evet_loop 就会给evfd绑定一个读事件的回调函数   [任务处理回调函数]
* 当前thread_queue是被那个loop监听的
* queue队列 <task_msg 或者  其他>
    * 任务队列
* 保护queue一个互斥锁
###### 方法
* 发送一个任务 send(task_msg)
    * 主线程或者其他业务流程来调用此方法，来发送任务
        * 将任务task_msg加入到queue中
        * 激活 evfd的可读事件
* 取出一个任务的方法 recv()
    * 当evfd被读事件激活， 当前evfd所绑定的 [任务处理回调函数] 来调用 该方法recv()
        * 从 queue中取出该task_msg
##### thread_pool
###### 属性
* thread_queue集合
* 全部的线程ID
* 当前线程的个数
###### 方法
* 初始化一个线程池(thread_cnt)
    * 1 根据传递进来的线程个数 依次开辟线程
        * 线程的主业务 thread_main()
            * 1 创建一个event_loop （用来监听当前线程所关联的 connfd读写状态， 用来监听对应的thread_queue的evfd读事件）
            * 2 将当前线程和 对应的 thread_queue绑定  绑定一个deal_task处理当前任务的读事件函数
                * deal_task
                    * 1 将queue中的task读出来
                    * 2 判断task的任务类型
                        * 任务类型是1 NEW_CONN 新链接
                            * 创建一个新的链接，将这个链接加入到当前的 线程中
                        * 任务类型是2  NEW_TASK	新任务
                            * 处理新任务
            * 3 启动event_loop --> event_process();进行epoll_wait阻塞监听
    * 2 依次创建 thread_queue消息队列 让消息队列和对应的线程进行绑定
        * 消息队列   和线程应该拥有同一个loop
* 提供一个获取一个thread_queu的方法 让外界调用
##### 将消息队列和连接池集成到reactor框架中
###### tcp_server 应该增加一个 链接池的属性
###### 在tcp_server构造函数中 创建线程池
###### 每次 server accept成功之后，得到一个新的connfd
* 将connfd通过thread_queue发送给一个task任务线程
#### Lars V0.9 配置文件
##### 开发者在开发app时候可以在 填写一个配置文件  reactor.ini
##### [reactor]
;服务器监听IP
ip = 127.0.0.1
port = 7777
;当前框架最大的链接个数
maxConn = 1024
;当前服务器框架的线程池的个数
threadNum = 10
##### 创建最大连接 都从配置文件中读
##### 创建线程池个数  都从配置文件中读
#### Lars V0.10 udp协议支持
##### udp server(单线程)
###### udp server类
* 属性
    * 读缓冲
    * 写缓冲
    * event_loop
    * 临时记录客户端的地址
    * 消息路由分发机制
* 方法
    * 构造 创建服务
    * 添加一个消息路由 msgID --> callback
    * 主动发包send_message()
        * 针对上一个包的源地址，回发数据
###### udp_client类
* 与 udp_server功能类似
#### protobuf协议支持
#### 性能测试QPS_TEST
##### qps_test集成proto3
###### echoMessage.proto
* syntax = "proto3";

package qps_test;

message EchoMessage 
{
    string content = 1;
    int32 id = 2;
};
###### build.sh
* #!/bin/bash
protoc --cpp_out=. ./*.proto
###### 编译添加-lprotobuf
#### Lars V0.11 异步消息任务机制
##### 异步任务的执行时机在
###### event_loop   event_process() 中在一轮处理完读写事件 函数之后 执行
* event_loop添加属性和方法
    * 属性
        * 当前全部已经就绪的task任务集合
    * 方法
        * 添加一个task到集合中 add_task
        * 执行全部task的方法 execute_ready_tasks()
* event_loop提供一个获取listen_fds集合的方法
###### 发送NEW_TASK任务
* tcp_server能够发起这个任务
    * task最终是通过thread_queue来传递的
    * 能够访问全部thread_queue 就是thread_pool
    * 给thread_pool提供一个发送NEW_TASK接口
        * tcp_server能够获取thread_pool对象
            * tcp_server 添加一个方法
                * thread_pool* thread_pool()
        * thread_pool提供一个发送任务的接口
            * send_task()方法
                * 取出当前thread_pool中全部的queue
                * 制作一个NEW_TASK任务
                * 依此发送给queue中
#### Lars V0.12连接属性外部传递设置功能
##### net_connection
###### 多添加额外的一个参数传递 void *param属性
* 开发者可以通过这个属性将conn绑定一些参数
## DNS Service
### 映射一些服务器主机的ID和主机真实IP的关系 服务
#### 功能一：提供agent获取一个最新的modID/cmdID和真实配置的host的IP和Port的对应关系
#### 功能二：具备订阅和推送最新的modID/cmdID给Agent
#### 功能三：定期的去监控持久性关系表的modID/cmdID和host主机信息的数据，保证版本的更新和最新数据的迭代
### Lars-DNS V0.1 Dns的基础服务 提供获取关系功能(功能一)
#### lars_dns数据库表的创建
##### 在Lars创建/base/sql/lars_dns.sql文件
#### lars_dns的基础服务器创建
##### 集成mysql开发环境
##### 集成reactor服务器框架
#### 定义一个Router类
##### modid/cmdid--->ip:port
###### Router是一个单例
###### 链接数据库的方法
* Route类添加
    * 属性
        * MYSQL *_db_conn
    * 方法
        * connect_db()
            * 加载配置文件[mysql内容]
                * ./conf/lars_dns.ini
                    * [reactor]
;服务器监听IP
ip = 127.0.0.1
port = 7778
;当前框架最大的链接个数
maxConn = 1024
;当前服务器框架的线程池的个数
threadNum = 5

[mysql]
db_host = 127.0.0.1
db_port = 3306
db_user = root
db_passwd = aceld
db_name = lars_dns
            * 设置mysql的超时重连机制
            * 链接数据库
    * 在Route的构造函数中调用connect_db()方法来链接数据库
* 在main 获取单例 进行测试
###### 定义一个存放RouteData数据的map和set的混合数据容器
* Route类的添加属性
    * map的数据类型是
        * using __gnu_cxx::hash_map;
using __gnu_cxx::hash_set;

//定义用来保存 host Ip/port的集合类型
typedef hash_set<uint64_t> host_set;
typedef hash_set<uint64_t>::iterator host_set_it;

//定义用来保存modID/cmdID 与host的Ip/port的对应的数据类型
typedef  hash_map<uint64_t, host_set>  route_map;
typedef  hash_map<uint64_t, host_set>::iterator route_map_it;
    * 属性
        * route_map* _data_pointer;
        * route_map* _temp_pointer;
    * 在router构造函数中初始化两个指针所指向的map
        * 加载数据库的内存放在_data_pointer所指向的map之中
#### 对外提供一个获取Modid和CmdID对应的host主机信息的服务
##### proto协议
###### /base/proto下
* syntax = "proto3";

package lars;

/* Lars 系统消息ID  */
enum MessageId {
    ID_UNKONW       = 0;    //prot3 enum第一个属性必须为0， 用来占位
    ID_GetRouteRequest = 1; //Agent向Dns service请求一个Route的对应关系的消息ID
    ID_GetRouteResponse = 2; // Dns Service 回复给Agent的结果的 消息ID
}


//定义个主机的信息
message HostInfo
{
    int32 ip = 1;
    int32 port = 2;
}


//请求lars dns server GetRoute请求信息的消息内容
message GetRouteRequest {
    int32 modid = 1;
    int32 cmdid = 2;
}


//dns给 agent回复的消息内容
message GetRouteResponse {
    int32 modid = 1; 
    int32 cmdid = 2;
    repeated HostInfo host = 3;
}
###### lars_service添加针对 ID_GetRouteRequest的回调业务处理get_route方法
###### Route 需要提供一个get_hosts方法
* 将modid/cmdid对应的host主机集合信息返回
#### 写一个模拟的agent客户端来测试功能一
### Lars Dns V0.2-订阅功能的实现
#### 订阅类
##### 设计成单例
##### 属性
###### 订阅的清单 _book_list 哪些模块被哪些客户端订阅了
* map类型
    * key
        * modid/cmdid
    * value
        * 客户端的fds 集合
###### 发布清单  _push_list  需要给哪些用户发布新的模块主机信息
* map类型
    * key
        * 需要发布 fd集合
    * value
        * modid/cmdid 集合
##### 方法
###### 订阅方法
* 每次agent客户端 请求一个modid/cmdid 就应该加入 _book_list中
###### 取消订阅方法
###### 发布方法
* 将已经修改的modid/cmdid 发布给订阅过当前模块的全部fd客户端
    * 输入的参数 已经修改的mod（modid/cmdid）集合
    * 将修改的change_mod和_book_list做交集  
        * 将共有的mod部分，加入到_push_list中
    * 通过reactor框架d主动发送任务机制 发送一个任务 注册一个任务回掉业务
        * push_change_task
            * 1 获取目前fd在线集合
            * 2 将fd在线集合 和 _push_list 中 做交集
                * 将共有的fd放在need_pushlish 订单中
            * 3 将need_pushlish 里面的fd和对应的mod集合发送给客户端
                * 遍历Need publish
                * 得到fd
                    * 对应mod集合
                        * 遍历mod集合
                            * 封装一个回执消息GetRouteResponse
                            * 遍历mod 所有的host主机信息
                            * 将主机信息和mod构建GetRouteResponse
                            * 将消息发送给客户端
#### 将订阅类集成到dns服务器中
##### 每次在处理用户请求的时候，调用订阅方法
### Lars DnsV0.3-Bankend Thread 实时监控版本信息 功能
#### 启动一个后端线程
##### 业务1
###### 定期的更新_data_pointer所指向的map数据
* 先加载RouteData到_temp_pointer中(临时map)
* 将_temp_pointer 和 _data_pointer进行交换
##### 业务2
###### 实时去监控RouteChange表中的版本号是否超过了当前版本号
* 如果超过说明有新版本添加(有modid/cmdid被修改)
* 得到最新数据
    * 先加载RouteData到_temp_pointer中(临时map)
    * 将_temp_pointer 和 _data_pointer进行交换
* 如果modid/cmdid已经被订阅，则发布最新的数据给订阅者
#### 给Route类添加方法
##### 加载当前版本号(RouteVersion)
##### 加载RouteChange修改数据及版本号(RouteChange)
##### 可以将_temp_pointer --> _data_pointer
## Reporter Service
### 用户反馈具体主机 访问的正确情况 
#### 功能1
##### Agent将某个host主机(ip,host) 本次的调用结果 发送给report service
###### 解析上报的请求，将结果入库
* 创建一个数据库表 ServerCallStatus;
* 添加proto协议
    * //一个主机的上报结果
message HostCallResult {
    int32 ip = 1;//主机的ip
    int32 port =2; //主机Port
    uint32 succ = 3; //调度成功
    uint32 err = 4; //调度失败
    bool overload = 5; //是否过载
}


//上报  主机的调用结构 给 reporter模块
message ReportStatusRequest {
    int32 modid = 1;
    int32 cmdid = 2;
    int32 caller = 3;
    repeated HostCallResult results = 4;
    uint32 ts = 5;
}
    * /* Lars 系统消息ID  */
enum MessageId {
    ID_ReportStatusRequest  = 3; //上报主机调用结果的 请求消息ID
}
#### 功能2
##### 开设一个存储线程池
###### 专门用来处理入库操作的线程池
## 负债均衡模块 Lb Agent
### agent基础环境
#### 拥有3个udp server线程是对外界业务(API)层提供服务
#### 拥有2个线程 一个dns client， 一个 reporter client
### 定义基础的数据结构
#### host_info
##### 属性
######     uint32_t ip; //ip    
    int port; //端口
    
    uint32_t vsucc; // 虚拟成功次数(API反馈)  -->作用是用于 过载或者空闲的判断
    uint32_t verr; //虚拟失败次数
    uint32_t rsucc; //真实的成功次数 ---> 用来reporter上报，入库的
    uint32_t rerr;// 真实的失败次数
    
    uint32_t contin_succ;//连续成功次数
    uint32_t contin_err; //连续的失败次数


    bool overload; //当前的状态是否是过载
#### load_balance
##### 属性
######     int _modid;
    int _cmdid;
    
    //host_map 当前负载均衡模块所管理的全部主机
    host_map _host_map;
    
    //空闲队列
    host_list _idle_list; 
    
    //过载队列
    host_list _overload_list;
#### route_lb
##### 属性
######     route_map _route_lb_map;  //当前route_lb模块所管理的loadbalance集合
    int _id; //当前route_lb 的编号 和 udp server是一一对应的
### API 和 Agent Udp server 通信的proto协议
####  

   ID_GetHostRequest       = 4; // API --> Agent API请求Agent host信息 
    ID_GetHostResponse      = 5; // Agent-->Api  Agent返回给APi的一个可用的host信息
#### 

// API 请求Agent 获取Host信息(UDP)
message GetHostRequest {
    uint32 seq = 1;
    int32 modid = 2;
    int32 cmdid = 3;
}

// Agent 给 API 回复的 host信息(UDP)
message GetHostResponse {
    uint32 seq = 1;
    int32 modid = 2;
    int32 cmdid = 3;
    int32 recode = 4;
    HostInfo host = 5;
}
#### 


enum LarsRetCode {
    RET_SUCC            = 0;
    RET_OVERLOAD        = 1; //超载
    RET_SYSTEM_ERROR    = 2; //系统错误
    RET_NOEXIST         = 3; //资源不存在
}
### 在全局定义3个route_lb对象 分别给每个udp server绑定
### API发送一个getHost请求信息
#### UDP协议--> UDP server 
##### ID_GetHostRequest对应的回调业务 get_host_cb()
###### route_lb->get_host(modid, cmdid, rsp)
* 如果当前modid/cmdid存在 _route_lb_map中
    * 取出modid/cmdid对应的load_balance对象 获取一个可用主机信息
        * 调用load_balance的choice_one_host()
            * 如果idle_list为空
                * 访问次数是否超过probe_num
                    * 如果超过 从overload_list取出一个host主机
                    * 入果没有超过 返回RET_OVEERLOAD 全部主机都已经超载
            * 如果idle_list不为空
                * 如果overload_list为空
                    * 从idle_list取出一个host主机
                * 如果overload_list不为空
                    * 访问次数是否超过probe_num
                        * 如果超过 从overload_list取出一个host主机
                        * 从idle_list取出一个host主机
* 如果当前的modid/cmdid不存在
    * 添加一对数据到map中 创建一个load_balance对象和当前的modid/cmdid进行绑定
    * 让load_balance向dns server获取当前modid/cmdid下挂载的全部host集合 放在load_balance的host_map中
    * 调用load_balance->pull()
        * 封装一个GetRouteRequest请求 发送给dns_queue
        * dns_client 从dns_queue得到一个请求数据 直接发送dns service
        * dns service 回复一个 GetRouteResponse --> dns_client
        * dns client 注册一个针对ID_GetRouteResponse的处理业务
            * 根据modid/cmdid选中一个route_lb对象
            * 调用route_lb对象 中的 update_host方法来更新主机信息
                * 如果当前的回执的消息中没有任务host内容 删除当前的load_balance对象
                * 如果有host主机信息  调用load_balance的 update方法来更新主机信息
                    * 根据dns 返回的主机信息，如果是新增则创建新主机信息
                    * 得到远程主机集合
                    * 判断哪些是本地存在，远程不存在，将这些主机定义为需要删除的主机
                    * 删除需要删除的主机
### API发送一个主机的结果上报给Lars
#### UDP协议-->UDP server
##### ID_ReportRequest对应的回掉业务 report_cb()
###### route_lb->report_host()
* 找到当前modid/cmdid对应的loadbalance负载均衡模块
* load_balance->report()
    * 如果当前主机是idle 并且本次访问时失败的
        * 是否满足overload条件
            * 判断失败率
            * 判断连续失败次数
    * 如果当前主机是overload状态， 并且本次访问是成功的
        * 是否满足idle条件
            * 判断成功率
            * 连续成功次数
    * 定期的窗口重置
        * 针对idle节点调用成功 有一个idle_timeout刷新统计窗口
        * 针对overload节点调用失败， 有一个overload_timeout 重置overload-->idle
* load_balance->commit()
    * 将_idle_list中的数据组装到lars::ReportCallStatus中
    * 将_overload_list中的数据组装到lars::ReportCallStatus中
    * 将lars::ReportCallStatus发送给  report_queue队列
### load_balance超时重新拉取机制
#### 给route_lb提供一个 reset_lb_status
##### 将所有的load_balance的状态设置为NEW
#### 当dns client连接dns service成功的时候 触发 每个udp server的 reset_lb_status()方法
#### 配置文件中添加一个 定时的时间 update_timeout
#### 给load_balance添加一个属性 last_update_time 来记录最后的更i时间
#### load_balance 构造函数中初始化为NEW状态
#### 在每次load_balance 执行完update()方法之后，更新last_update_time时间
#### 每次当api请求route_lb调用get_host()方法时， 如果lb存在，则判断是否超时
##### 如果超时就主动执行pull()方法 拉取最新的host信息
### API 获取当前modid/cmdid 管理的route信息(全部管理的主机)
#### UDP协议-->UDP server
##### ID_API_GetRouteRequest 对应的回掉业务get_route_cb()
###### route_lb->get_route(modid, cmdid, rsp)
* 如果当前modid/cmdid存在 _route_lb_map中
    * 取出modid/cmdid对应的load_balance对象 获取一个可用主机信息
        * 调用load_balance的get_all_hosts()
            * 将_host_map中全部的host信息返回
* 如果当前的modid/cmdid不存在
    * 添加一对数据到map中 创建一个load_balance对象和当前的modid/cmdid进行绑定
    * 让load_balance向dns server获取当前modid/cmdid下挂载的全部host集合 放在load_balance的host_map中
    * 调用load_balance->pull()
        * 封装一个GetRouteRequest请求 发送给dns_queue
        * dns_client 从dns_queue得到一个请求数据 直接发送dns service
        * dns service 回复一个 GetRouteResponse --> dns_client
        * dns client 注册一个针对ID_GetRouteResponse的处理业务
            * 根据modid/cmdid选中一个route_lb对象
            * 调用route_lb对象 中的 update_host方法来更新主机信息
                * 如果当前的回执的消息中没有任务host内容 删除当前的load_balance对象
                * 如果有host主机信息  调用load_balance的 update方法来更新主机信息
                    * 根据dns 返回的主机信息，如果是新增则创建新主机信息
                    * 得到远程主机集合
                    * 判断哪些是本地存在，远程不存在，将这些主机定义为需要删除的主机
                    * 删除需要删除的主机
### API 注册一个模块modid/cmdid(首次拉取host信息)
#### 每次开发者在使用一个模块之前需要调用该方法注册一个模块
### API开发者的开发流程
#### lars_client api;
#### api.reg_init(1,1)
api.reg_init(1,2)
api.reg_init(1,3)
#### api.get_host(1,1);
#### api.report(1,1,ip, port, succ/overload);
## 脚本测试工具
### 模拟器simulator
### get_route工具
#### 获取某modid/cmdid全部主机信息
### get_host工具
### qps_test工具
#### 虚拟机 2cpu 2Gmem
##### qps 客户端的数量
###### 客户端1： qps = 3800
###### 客户端5: qps =  15000
###### 客户端10: qps =  15000 +
###### 客户端100: qps =  19000 +
