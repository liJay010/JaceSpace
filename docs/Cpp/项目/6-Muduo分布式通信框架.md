# Muduo分布式通信框架



### 1.protobuf使用

**1.编写配置文件** 

test.proto

```protobuf
syntax = "proto3"; // 声明了protobuf的版本

package fixbug; // 声明了代码所在的包（对于C++来说是namespace）

// 定义下面的选项，表示生成service服务类和rpc方法描述，默认不生成
option cc_generic_services = true;

message ResultCode
{
	int32 errcode = 1;
	bytes errmsg = 2; //bytes就是c++的字符串方法
}

// 数据   列表   映射表
// 定义登录请求消息类型  name   pwd
message LoginRequest
{
    bytes name = 1;
    bytes pwd = 2;
}

// 定义登录响应消息类型
message LoginResponse
{
    ResultCode result = 1;
    bool success = 2;
}

message GetFriendListsRequest
{
    uint32 userid = 1;
}

message User
{
    bytes name = 1;
    uint32 age = 2;
    enum Sex
    {
        MAN = 0;
        WOMAN = 1;
    }
    Sex sex = 3;
}

message GetFriendListsResponse
{
    ResultCode result = 1;
    repeated User friend_list = 2;  // 定义了一个列表类型
}

// 在protobuf里面怎么定义描述rpc方法的类型 - service 
service UserServiceRpc
{
	rpc Login(LoginRequest) returns(LoginResponse);
	rpc GetFriendLists(GetFriendListsRequest) returns(GetFriendListsResponse);
}

```

**2.编译配置文件-生成Cpp文件**

```sh
protoc test.proto --cpp_out=./
```

**3.运行时需要包含生成的文件以及链接动态库** -lprotobuf

main.cpp

```cpp
#include "test.pb.h"
#include <iostream>
#include <string>
using namespace fixbug;


int main1()
{
    // 封装了login请求对象的数据
    LoginRequest req;
    req.set_name("zhang san");
    req.set_pwd("123456");

    // 对象数据序列化 =》 char*
    std::string send_str;
    if (req.SerializeToString(&send_str))
    {
        std::cout << send_str.c_str() << std::endl;
    }

    // 从send_str反序列化一个login请求对象
    LoginRequest reqB;
    if (reqB.ParseFromString(send_str))
    {
        std::cout << reqB.name() << std::endl;
        std::cout << reqB.pwd() << std::endl;
    }

    return 0;
}

int main()
{
    // LoginResponse rsp;
    // ResultCode *rc = rsp.mutable_result();
    // rc->set_errcode(1);
    // rc->set_errmsg("登录处理失败了");
    
    GetFriendListsResponse rsp;
    ResultCode *rc = rsp.mutable_result();
    rc->set_errcode(0);

    User *user1 = rsp.add_friend_list();
    user1->set_name("zhang san");
    user1->set_age(20);
    user1->set_sex(User::MAN);

    User *user2 = rsp.add_friend_list();
    user2->set_name("li si");
    user2->set_age(22);
    user2->set_sex(User::MAN);

    std::cout << rsp.friend_list_size() << std::endl;

    return 0;
}

```

