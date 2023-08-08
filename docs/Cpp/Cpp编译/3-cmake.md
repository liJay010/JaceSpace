# Cmake

原文以及代码来自：https://github.com/wzpan/cmake-demo

https://zhuanlan.zhihu.com/p/534439206

## **CMake使用介绍**

cmake命令会执行目录下的CMakeLists.txt配置文件里面的配置项，一个基本的CMakeLists.txt的配置

文件内容如下：

```cmake
cmake_minimum_required (VERSION 3.0) #要求cmake最低的版本号
project (demo) # 定义当前工程名字
set(CMAKE_BUILD_TYPE "Debug")#设置debug模式，如果没有这一行将不能调试设断点
set(CMAKE_CXX_FLAGS ${CMAKE_CXX_FLAGS} -g)
add_executable(main main.c)
#进入子目录下执行 CMakeLists.txt文件 这里的lib和tests里面都有可编译的代码文件
add_subdirectory(lib)
add_subdirectory(tests)
```

### **示例一**

生成一个main.cpp源文件，输出"hello world"，然后在同级目录创建一个CMakeLists.txt文件，内容

如下：

```cmake
cmake_minimum_required (VERSION 2.8) #要求cmake最低的版本号
project (demo) # 定义当前工程名字
set(CMAKE_BUILD_TYPE "Debug")#设置debug模式，如果没有这一行将不能调试设断点
add_executable(main main.cpp)
```

### **示例二**

如果需要编译的有多个源文件，可以都添加到add_executable(main main.cpp test.cpp)列表当中，

但是如果源文件太多，一个个添加到add_executable的源文件列表中，就太麻烦了，此时可以用

**aux_source_directory(dir var)**来定义源文件列表，使用如下：

```cmake
cmake_minimum_required (VERSION 2.8)
project (demo)
aux_source_directory(. SRC_LIST) # 定义变量，存储当前目录下的所有源文件
add_executable(main ${SRC_LIST})
```

aux_source_directory()也存在弊端，它会把指定目录下的所有源文件都加进来，可能会加入一些我们

不需要的文件，此时我们可以使用set命令去新建变量来存放需要的源文件，如下

```cmake
cmake_minimum_required (VERSION 2.8)
project (demo)
set( SRC_LIST
./main.cpp
./test.cpp)
add_executable(main ${SRC_LIST})
```

### **示例三 - 一个正式的工程构建**

一个正式的源码工程应该有这几个目录：

```cpp
-bin 存放最终的可执行文件 
-build 存放编译中间文件
-include 头文件
  --sum.h
  --minor.h
-src 源代码文件
  --sum.cpp
  --minor.cpp
  --main.cpp
-CMakeLists.txt
```

CMakeLists.txt如下：

```cmake
cmake_minimum_required (VERSION 2.8)
project (math)
# 设置cmake的全局变量
set(EXECUTABLE_OUTPUT_PATH ${PROJECT_SOURCE_DIR}/bin)
#添加头文件路径，相当于makefile里面的-I
include_directories(${PROJECT_SOURCE_DIR}/include)
aux_source_directory (src SRC_LIST)
add_executable (main main.cpp ${SRC_LIST})
```

然后在build目录里面执行cmake .. 命令，这样所有的编译中间文件都会在build目录下，最终的可执行

文件会在bin目录里面

### **静态库和动态库的编译控制**

把上面的sum和minor源文件直接生成静态库或者动态库，让外部程序进行链接使用，代码结构如下：

```cpp
-bin 存放最终的可执行文件 
-build 存放编译中间文件
-lib 存放编译生成的库文件
-include 头文件
--sum.h
 --minor.h
-src 源代码文件
 --sum.cpp
 --minor.cpp
 --CMakeLists.txt
-test 测试代码
 --main.cpp
 --CMakeLists.txt
-CMakeLists.txt
```

最外层的CMakeLists.txt是总控制编译，内容如下：

```cmake
cmake_minimum_required (VERSION 2.8)
project (math)
add_subdirectory (test)
add_subdirectory (src)
```

src里面的源代码要生成静态库或动态库，CMakeLists.txt内容如下：

```cmake
set (LIBRARY_OUTPUT_PATH ${PROJECT_SOURCE_DIR}/lib)
# 生成库，动态库是SHARED，静态库是STATIC
add_library (sum SHARED sum.cpp)
add_library (minor SHARED minor.cpp)
# 修改库的名字
#set_target_properties (sum PROPERTIES OUTPUT_NAME "libsum")
#set_target_properties (minor PROPERTIES OUTPUT_NAME "libminor")
```



test里面的CMakeLists.txt内容如下：

```cmake
set (EXECUTABLE_OUTPUT_PATH ${PROJECT_SOURCE_DIR}/bin)
include_directories (../include) # 头文件搜索路径
link_directories (${PROJECT_SOURCE_DIR}/lib) # 库文件搜索路径
add_executable (main main.cpp) # 指定生成的可执行文件
target_link_libraries (main sum minor) # 执行可执行文件需要依赖的库
```

在build目录下执行cmake ..命令，然后执行make

### CMake常用的预定义变量

```cmake
PROJECT_NAME : 通过 project() 指定项目名称

PROJECT_SOURCE_DIR : 工程的根目录

PROJECT_BINARY_DIR : 执行 cmake 命令的目录

CMAKE_CURRENT_SOURCE_DIR : 当前 CMakeList.txt 文件所在的目录

CMAKE_CURRENT_BINARY_DIR : 编译目录，可使用 add subdirectory 来修改

EXECUTABLE_OUTPUT_PATH : 二进制可执行文件输出位置

LIBRARY_OUTPUT_PATH : 库文件输出位置

BUILD_SHARED_LIBS : 默认的库编译方式 ( shared 或 static ) ，默认为 static

CMAKE_C_FLAGS : 设置 C 编译选项

CMAKE_CXX_FLAGS : 设置 C++ 编译选项

CMAKE_CXX_FLAGS_DEBUG : 设置编译类型 Debug 时的编译选项

CMAKE_CXX_FLAGS_RELEASE : 设置编译类型 Release 时的编译选项

CMAKE_GENERATOR : 编译器名称

CMAKE_COMMAND : CMake 可执行文件本身的全路径

CMAKE_BUILD_TYPE : 工程编译生成的版本， Debug / Release

```

### 

## Cmake使用步骤

1. 写 CMake 配置文件 CMakeLists.txt 。

2. 执行命令 `cmake PATH` 或者 `ccmake PATH` 生成 Makefile（`ccmake` 和 `cmake` 的区别在于前者提供了一个交互式的界面）。其中， `PATH` 是 CMakeLists.txt 所在的目录。

3. 使用 `make` 命令进行编译。

   

## **入门案例：单个源文件**

### **编写 CMakeLists.txt**

只有单个源文件，首先编写 CMakeLists.txt 文件，并保存在与 main.cc 源文件同个目录下：

```cmake
# CMake 最低版本号要求
cmake_minimum_required (VERSION 2.8)

# 项目信息
project (Demo1)

# 指定生成目标
add_executable(Demo main.cc)
```

CMakeLists.txt 的语法比较简单，由命令、注释和空格组成，其中命令是不区分大小写的。符号 `#` 后面的内容被认为是注释。命令由命令名称、小括号和参数组成，参数之间使用空格进行间隔。对于上面的 CMakeLists.txt 文件，依次出现了几个命令：

1. `cmake_minimum_required`：指定运行此配置文件所需的 CMake 的最低版本；
2. `project`：参数值是 `Demo1`，该命令表示项目的名称是 `Demo1` 。
3. `add_executable`：将名为 main.cc 的源文件编译成一个名称为 Demo 的可执行文件。

### **编译项目**

之后，在当前目录执行 `cmake .` ，得到 Makefile 后再使用 `make` 命令编译得到 Demo1 可执行文件。

## **多个源文件**

```cpp
./Demo2
    |
    +--- main.cc
    |
    +--- MathFunctions.cc
    |
    +--- MathFunctions.h
```

这个时候，CMakeLists.txt 可以改成如下的形式：

```cmake
# CMake 最低版本号要求
cmake_minimum_required (VERSION 2.8)

# 项目信息
project (Demo2)

# 指定生成目标
add_executable(Demo main.cc MathFunctions.cc)
```

唯一的改动只是在 `add_executable` 命令中增加了一个 `MathFunctions.cc` 源文件。这样写当然没什么问题，但是如果源文件很多，把所有源文件的名字都加进去将是一件烦人的工作。更省事的方法是使用 `aux_source_directory` 命令，该命令会查找指定目录下的所有源文件，然后将结果存进指定变量名。其语法如下：

```cmake
aux_source_directory(<dir> <variable>)
```

因此，可以修改 CMakeLists.txt 如下：

```cmake
# CMake 最低版本号要求
cmake_minimum_required (VERSION 2.8)

# 项目信息
project (Demo2)

# 查找当前目录下的所有源文件
# 并将名称保存到 DIR_SRCS 变量
aux_source_directory(. DIR_SRCS)

# 指定生成目标
add_executable(Demo ${DIR_SRCS})
```

这样，CMake 会将当前目录所有源文件的文件名赋值给变量 `DIR_SRCS` ，再指示变量 `DIR_SRCS` 中的源文件需要编译成一个名称为 Demo 的可执行文件。



## **多个目录，多个源文件**

```cpp
./Demo3
    |
    +--- main.cc
    |
    +--- math/
          |
          +--- MathFunctions.cc
          |
          +--- MathFunctions.h
```

对于这种情况，需要分别在项目根目录 Demo3 和 math 目录里各编写一个 CMakeLists.txt 文件。为了方便，我们可以先将 math 目录里的文件编译成静态库再由 main 函数调用。根目录中的 CMakeLists.txt ：

```cmake
# CMake 最低版本号要求
cmake_minimum_required (VERSION 2.8)

# 项目信息
project (Demo3)

# 查找当前目录下的所有源文件
# 并将名称保存到 DIR_SRCS 变量
aux_source_directory(. DIR_SRCS)

# 添加 math 子目录
add_subdirectory(math)

# 指定生成目标 
add_executable(Demo main.cc)

# 添加链接库
target_link_libraries(Demo MathFunctions)
```

该文件添加了下面的内容: 第3行，使用命令 `add_subdirectory` 指明本项目包含一个子目录 math，这样 math 目录下的 CMakeLists.txt 文件和源代码也会被处理 。第6行，使用命令 `target_link_libraries` 指明可执行文件 main 需要连接一个名为 MathFunctions 的链接库 。子目录中的 CMakeLists.txt：

```cmake
# 查找当前目录下的所有源文件
# 并将名称保存到 DIR_LIB_SRCS 变量
aux_source_directory(. DIR_LIB_SRCS)

# 生成链接库
add_library (MathFunctions ${DIR_LIB_SRCS})
```

在该文件中使用命令 `add_library` 将 src 目录中的源文件编译为静态链接库。







