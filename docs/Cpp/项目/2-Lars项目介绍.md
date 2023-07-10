# 项目介绍

**远程调用负载均衡系统-Lars**

Lars一个易用、高性能的服务间远程调用管理、调度、负载均衡系统。主要包含4个模块。Lars_reactor模块，基于reactor模式的高并发服务器模块，支持tcp，udp连接。使用内存池，线程池，以及消息队列，epoll多路io等机制，是整个系统的核心通信模块。Lars_dns模块，数据查询模块，负责模块名称到节点路由的转换。运行于DNSService同机服务器上，负责收集各节点调用状况，可用于观察、报警。**LoadBalance Agent**运行于每个服务器上，负责为此服务器上的业务提供节点获取、节点状态汇报、路由管理、负载调度等核心功能。使用跳表实现的一致性哈希算法运用到Agent，增强主机服务器的可扩展性。在2核2G系统上QPS达5.5w/s。24核128G系统上QPS达56.74w/s。



对于一个部门的后台，为增强灵活性，一个服务可以被抽象为命令字：`modid+cmdid`的组合，称为**一个模块**，而这个服务往往有多个服务节点，其所有服务节点的地址集合被称为这个模块下的**路由**，节点地址简称为节点

- `modid`：标识业务的大类，如：“直播列表相关”

- `cmdid`：标识具体服务内容，如：“批量获取直播列表”

  ​	业务代码利用modid,cmdid，就可以调用对应的远程服务一个Lars系统包含一个DNSService，一个Report Service，以及部署于每个服务器的LoadBalance Agent，业务代码通过API与ELB系统进行交互

**API** ：根据自身需要的`modid,cmdid`，向ELB系统获取节点、汇报节点调用结果；提供`C++`、`Java`、`Python`接口

**LoadBalance Agent**：运行于每个服务器上，负责为此服务器上的业务提供节点获取、节点状态汇报、路由管理、负载调度等核心功能

**DNSService** ： 运行于一台服务器上（也可以用LVS部署多实例防单点），负责`modid,cmdid`到节点路由的转换

**Report Service** ： 运行于DNSService同机服务器上，负责收集各`modid,cmdid`下各节点调用状况，可用于观察、报警

`modid,cmdid`数据由`Mysql`管理，具体SQL脚本在`common/sql`路径下
至于`modid,cmdid`的注册、删除可以利用Web端操作MySQL。



![1-Lars-总体架构设计](C:/Users/li/Desktop/others/JaceSpace/JaceSpace/docs/Cpp/项目/pictures/1-Lars-.png)

如图，每个服务器（虚线）部署了一台LoadBalance Agent，以及多个业务服务

1. 开发者在Web端注册、删除、修改`modid,cmdid`的路由信息，信息被写入到MySQL数据库；
2. 服务器上每个业务biz都把持着自己需要通信的远程服务标识`modid+cmdid`，每个biz都向本机LoadBalance Agent获取远程节点，进而可以和远程目标服务通信，此外业务模块会汇报本次的节点调用结果给LoadBalance Agent；
3. LoadBalance Agent负责路由管理、负载均衡等核心任务，并周期性向DNSService获取最新的路由信息，周期性把各`modid,cmdid`的各节点一段时间内的调用结果传给Report Service
4. DNSService监控MySQL，周期性将最新路由信息加载出来；
5. Report Service将各`modid,cmdid`的各节点一段时间内的调用结果写回到MySQL，方便Web端查看、报警