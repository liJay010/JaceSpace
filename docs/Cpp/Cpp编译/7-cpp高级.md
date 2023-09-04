# CPP高级

## 1.函数对象优化

**用临时对象初始化同类型新对象 时候，直接构造，不产生临时对象。**

1.函数参数传递过程中，对象优先**按照引用传递**，不要用值传递

2.函数返回对象时候，直接返回**临时对象**，不要返回定义过的对象

3.接受返回值是对象的函数调用的时候，应该按照初始化的时候接收，不要按照赋值方式接收。

## 2.右值引用

左值：有内存、有名字 ，右值：没名字（临时量）、没内存、常量

给成员方法提供右值引用可以提升运行效率

```cpp
int a = 10;
int &b = a; //左值：有内存、有名字 ，右值：没名字（临时量）、没内存
int &&c = a; //错误，无法将左值绑定到右值引用

int &&d = 20;//右值引用右值
Cmystring &&e = Cmystring("aaa");//临时量是右值
//一个右值引用本身是一个左值
```

移动语义move

```cpp

move(val) //左值转换为右值引用
foward(val) //类型完美转发，能够识别左值或者右值类型
```

## 3.cpp11标准

### 3.1 关键字语法

**auto**：右值自动推导

**nullptr**：指针专用，能够和整数进行区别

**foreach**:可以遍历容器，for(int x:num)

**右值引用**：move(),forward()

**模板新特性**：typename ... A （可变参数）



### 3.2 绑定器和函数对象

**function:函数对象**

**bind:绑定器**

**lambda表达式**



### 3.3 智能指针

shared_ptr 和 weak_ptr



### 3.4 容器

**unordered_set、unordered_map**

**array**:数组固定大小

**forward_list**:前向链表

## 4.emplace_back

在C++中，`emplace_back()`和`push_back()`是用于向容器的尾部添加元素的成员函数，但它们有一些区别。

`push_back()`函数将一个元素副本追加到容器的末尾。这意味着在将元素插入容器之前，必须创建该元素的副本。这对于类似整数、浮点数和指针等简单类型的元素来说是很方便的。

```cpp
std::vector<int> myVector;
myVector.push_back(10);  // 添加 10 到向量末尾
myVector.push_back(20);  // 添加 20 到向量末尾
```



`emplace_back()`函数与`push_back()`函数类似，但它使用给定的参数在容器的末尾直接构造一个新元素。这意味着可以直接将参数传递给元素的构造函数来创建元素，而不需要创建副本。这对于复杂的对象类型非常有用，可以避免不必要的对象复制和降低性能开销。

```cpp
struct MyObject {
    int data;

    MyObject(int value) : data(value) {
        std::cout << "Constructor called with value: " << value << std::endl;
    }
};

std::vector<MyObject> myVector;
myVector.emplace_back(10);  // 直接构造 MyObject 对象并添加到向量末尾
myVector.emplace_back(20);  // 直接构造 MyObject 对象并添加到向量末尾
```



使用`emplace_back()`函数可以在不创建额外副本的情况下，直接在容器尾部构造对象。这在性能要求高的情况下，能够降低开销并提高效率。
