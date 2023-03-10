## **一、让自己习惯C++**

### **条款01：视C++为一个语言联邦**

C++可视为：

- C：以C为基础。
- 面向对象的C++：添加面向对象特性。
- 模板C++：泛型编程概念，使用模板。
- STL：使用STL的容器、迭代器、算法、及函数对象。

四者的集合。

### **条款02：尽量以const，enum，inline替换＃define**

- 对于单纯常量，尽量以const对象或enums枚举来代替#define。
- 若用 define 的可能会导致程序出出现多份目标码，而常量不会出现这种情况
- 取一enum的地址就不合法，这种行为和 define 类似因此可以用此来代替 define ，如果你不想让别人获得一个pointer或reference指向你的某个整数常量，enum可以帮助你实现这个约束。
- 对于函数宏，用 inline 函数代替 #define（define是死板的替换，容易产生传递计算式类似累加多次的问题）

### **条款03：尽可能使用const**

- **顶层**const：指的是const修饰的变量**本身**是一个常量，无法修改，指的是指针，就是 * 号的右边
- **底层**const：指的是const修饰的变量**所指向的对象**是一个常量，指的是所指变量，就是 * 号的左边

例子：

```cpp
int a = 10;int* const b1 = &a;        //顶层const，b1本身是一个常量
const int* b2 = &a;       //底层const，b2本身可变，所指的对象是常量
const int b3 = 20;         //顶层const，b3是常量不可变
const int* const b4 = &a;  //前一个const为底层，后一个为顶层，b4不可变
const int& b5 = a;         //用于声明引用变量，都是底层const
```

- 将const实施于成员函数的目的，是为了确认该成员函数可作用于const对象身上。这一类成员函数之所以重要，基于两个理由。第一，它们使 class 接口比较容易被理解。这是因为，得知哪个函数可以改动对象内容而哪个函数不行，很是重要。第二，它们使“操作const对象”成为可能。
- 两个成员函数**如果只是常量性（constness）不同，可以被重载**。这实在是一个重要的C++特性。const T& getXXX() const;和T& getWriteableXXX();
- 利用C++的一个与const相关的摆动场：`mutable`（可变的）。mutable释放掉non-static成员变量的`bitwise constness`约束。（即可以在const成员函数内修改 `mutable`修饰的成员变量
- 将某些东西声明为 const可帮助编译器侦测出错误用法。const可被施加于任何作用域内的对象、函数参数、函数返回类型、成员函数本体。
- 编译器强制实施bitwise constness，但你编写程序时应该使用“概念上的常量性”（conceptual constness）。
- 当 const和non-const成员函数有着实质等价的实现时，令non-const版本调用const版本可避免代码重复。（因为这代表着可以通过一两次转型用const 版本实现出non-const版本）

### **条款04：确定对象被使用前已先被初始化**

- 确定对象在使用前已经初始化，避免一些难以预测的问题。
- 为内置类型手动做初始化，C++不保证初始化它们。
- `const`变量在成员变量那里声明，然后再在构造函数初始化，那样会报错，只能在构造函数体运行前完成初始化赋值工作，就是在构造函数初始化列表。
- **如果成员变量是**`**const**`**或**`**references**`，**为避免需要记住成员变量何时必须在成员初值列中初始化，何时不需要，**最简单的做法就是：**构造函数使用成员初始化列表来赋值，而不是在构造函数里去赋值（会导致赋值两次，浪费了）**
- **C++有着十分固定的“成员初始化次序”**，`base classes`更早于其`derived classes`被初始化（见条款12），而`class`的成员变量总是以其声明次序被初始化。
- 对于一些可能在被别的类直接调用其成员函数、值的类，最好改为暴露一个返回其类对象的引用的函数的形式，而不是暴露其类对象本身，这可以保证在函数内完成初始化，避免被调用时还没有初始化。**（类似于单例模式的的获取方式）**

## **二、构造/析构/赋值运算**

### **条款05：了解C++默默编写并调用哪些函数**

- 当没有声明时，编译器会自动为类创建默认构造函数、析构函数、复制构造函数和赋值构造函数
- 如果成员变量中包含引用、const这些不能被改变的值，则不会去生成赋值构造函数，因为无法修改引用对象和const的值，除非我们自己去定义赋值构造函数的行为。
- 惟有当这些函数被需要（被调用），它们才会被编译器创建出来。

### **条款06：若不想使用编译器自动生成的函数，就该明确拒绝**

- 若不想使用编译器自动生成的函数，可将相应的成员函数申明为private并且不予实现。或者继承一个类似uncopyable的基类，该基类的相应函数为private且不予实现，这样子类调用时会去调用基类的该函数，从而被编译器拒绝。

### **条款07：为多态基类声明虚析构函数**

- polymorphic（带多态性质的）base classes 应该声明一个 virtual 析构函数。如果class带有任何virtual函数，它就应该拥有一个virtual析构函数。
- Classes 的设计目的如果不是作为 base classes 使用，或不是为了具备多态性（polymorphically），就不该声明virtual析构函数。

上面的第一条法则，是为了防止内存泄漏 第二条法则则是为了防止额外花销，当一个函数不通过基类指针进行虚构时，首先是析构派生类自己，接着会按照继承顺序的反方向来，依次调用相应的析构函数。故不需要额外的虚函数指针来确保内存安全。 当使用多态这个特性的时候，用基类指针指向派生类时，析构函数的调用是静态的，故需要将析构声明为虚的，进行重写，为析构时调用的函数特制化，才能避免内存泄漏。

### **条款08：别让异常逃离析构函数**

- 析构函数绝对不要吐出异常。如果一个被析构函数调用的函数可能抛出异常，析构函数应该捕捉任何异常，然后吞下它们（不传播）或结束程序。
- 如果客户需要对某个操作函数运行期间抛出的异常做出反应，那么 class 应该提供一个普通函数（而非在析构函数中）执行该操作。

### **条款09：绝不在构造和析构过程中调用虚函数**

- 在构造函数和析构函数中不要去调用虚函数，因为子类在构造/析构时，会调用父类的构造/析构函数，此时其中的虚函数是调用父类的实现，但这是父类的虚函数可能是纯虚函数，即使不是，也可能不符合你想要的目的（是父类的结果不是子类的结果）。base class构造期间 virtual函数绝不会下降到derived classes阶层。
- 因为最根本的理由是在derived class对象的base class构造期间，对象的类型是base class不是derived class，若使用运行期类型信息如果typeid，也会把对象视为base class类型。析构也是
- 如果想调用父类的构造函数来做一些事情，替换做法是：在子类调用父类构造函数时，向上传递一个值给父类的构造函数。

### **条款10：令 operator= 返回一个\*this 引用**

为了实现“连锁赋值”，赋值操作符必须返回一个reference指向操作符的左侧实参。令赋值（assignment）操作符返回一个reference to*this。

### **条款11：在operator=中处理“自我赋值”**

由于变量有别名的存在（多个指针或引用只想一个对象），所以可能出现自我赋值的情况。比如 a[i] = a[j]，可能是同一个对象赋值。这时就需要慎重处理赋值操作符以免删除了自己后再用自己来赋值。 解决方法有：

- 先进行对象是否相同的检查。
- 先创建一个temp对象指向本对象，然后令本对象复制目标对象，然后删除temp对象（原本对象）。
- 先创建一个temp对象复制目标对象，然后交换temp对象与本对象。

### **条款12：复制对象时勿忘其每一个成分**

- 复制构造函数和赋值构造函数要确保复制了对象内的**所有成员变量**和**所有基类成分**，这意味着你如果自定义以上构造函数，那么每增加成员变量，都要同步修改以上构造函数，且要调用基类的相应构造函数。



- 复制构造函数和赋值构造函数看似代码类似，但不要用一个调用另一个，好的做法是建立一个private的成员函数来做这件事，然后两个构造函数都调用该成员函数。

## **三、资源管理**

### **条款13：以对象管理资源**

把资源放进对象内，我们便可倚赖 C++的“析构函数自动调用机制”确保资源被释放。

- 获得资源后立刻放进管理对象（managing object）内。实际上“以对象管理资源”的观念常被称为“资源取得时机便是初始化时机”（ResourceAcquisition Is Initialization；**RAII**），因为我们几乎总是在获得一笔资源后于同一语句内以它初始化某个管理对象。
- 管理对象（managing object）运用析构函数确保资源被释放。不论控制流如何离开区块，一旦对象被销毁（例如当对象离开作用域）其析构函数自然会被自动调用，于是资源被释放。
- 两个常被使用的RAII classes分别是：shared_ptr和auto_ptr。前者通常是较佳选择，因为其copy行为比较直观。若选择auto_ptr，复制动作会使它（被复制物）指向null。
- 对于数组对象，两个指针不会使用对应的delete[]，所以容易发生错误，最好使用string或vector来取代数组。

### **条款14：在资源管理类中小心copying行为**

- 复制 RAII 对象必须一并复制它所管理的资源，所以资源的 copying 行为决定RAII对象的copying行为。

- 如果对想要自行管理delete（或其他类似行为如上锁/解锁）的类处理复制问题，有以下方案，先创建自己的资源管理类，然后可选择：

- - 禁止复制，使用**条款6**的方法
  - 对复制的资源做引用计数（声明为shared_ptr），shared_ptr支持初始化时自定义删除函数（auto_ptr不支持，总是执行delete）
  - 做真正的深复制
  - 转移资源的拥有权，类似auto_ptr，只保持新对象拥有。



### **条款15：在资源管理类中提供对原始资源的访问**

- 封装了资源管理类后，API有时候往往会要求直接使用其原始资源（作为参数的类型只能接受原始资源，不接受管理类指针），这时候就需要提供一个获取其原始资源的方法。
- 有显式转换方法（如指针的->和(*)操作，也比如自制一个getXXX()函数），还有隐式转换方法（比如覆写XXX()取值函数）。
- 显式操作比较安全，隐式操作比较方便（但容易被误用）。如智能指针隐式转换为其原始资源

### **条款16：成对使用new和delete时要采取相同形式**

- 当你使用 new（也就是通过new动态生成一个对象），有两件事发生。

- - 第一，内存被分配出来（通过名为operator new的函数，见条款49和条款51）。
  - 第二，针对此内存会有一个（或更多）构造函数被调用。



- 当你使用 delete，也有两件事发生：针对此内存会有一个（或更多）析构函数被调用，然后内存才被释放（通过名为operator delete的函数，见条款51）。
- 如果你调用new时使用[]，你必须在对应调用delete时也使用[]。如果你调用new时没有使用[]，那么也不该在对应调用delete时使用[]。
- 对于数组，不建议使用typedef行为，这会让使用者不记得去delete []。对于这种情况，建议使用string或者vector。

### **条款17：以独立语句将newed对象置入智能指针**

因为编译器对于“跨越语句的各项操作”没有重新排列的自由（只有在语句内它才拥有那个自由度）。 以独立语句将 newed对象存储于（置入）智能指针内。如果不这样做，一旦异常被抛出，有可能导致难以察觉的资源泄漏。

## **四、设计与声明**

### **条款18：让接口容易被正确使用，不易被误用**

好的接口要容易被正确使用，不容易被误用，符合客户的直觉。

- 促进正确使用的办法包括保持接口的一致性，既包括自定义接口之间的一致性，也包括与内置类型行为的相似一致性。
- 阻止误用的办法包括建立新类型来限制该类型上的操作、束缚对象的值以及消除客户管理资源的责任，以此来作为接口的参数与返回类型。
- shared_ptr支持定制删除函数，所以可以很方便的实现上述问题，以及防范DLL问题。

### **条款19：设计class犹如设计type**

在设计class时，要考虑一系列的问题，包括

- 对象的创建和销毁（构造、析构）
- 对象的初始化与赋值（构造、赋值操作符）
- 复制操作（复制构造）
- 合法值（约束条件）
- 继承体系（注意虚函数）
- 支持的类型转换（显示转换、类型转换操作符）
- 成员函数和成员变量的可见范围（public/protected/private）
- 是否需要用模板实现？

### **条款20：宁以pass-by-reference-to-const替换pass-by-value**

pass by reference-to-const这种传递方式的效率高得多：没有任何构造函数或析构函数被调用，因为没有任何新对象被创建。以by reference方式传递参数也可以避免slicing（对象切割）问题。**当一个derived class对象以by value方式传递并被视为一个base class对象，base class的copy构造函数会被调用**，**而“造成此对象的行为像个derived class对象”的那些特化性质全被切割掉了，仅仅留下一个base class对象。**

- 尽量以pass-by-reference-to-const替换pass-by-value。前者通常比较高效，并可避免切割问题（slicing problem）。
- 以上规则并不适用于内置类型，以及 STL 的迭代器和函数对象。对它们而言，pass-by-value往往比较适当。

### **条款21：必须返回对象时，别妄想返回其reference**

- 绝不要返回pointer或reference指向一个local stack对象，或返回reference指向一个heap-allocated对象，或返回pointer或reference指向一个local static对象而有可能同时需要多个这样的对象。要不已经被析构掉了，要不就是造成内存泄漏。

### **条款22：将成员变量声明为private**

从封装的角度观之，其实只有两种访问权限：private（提供封装）和其他（不提供封装）。

- 切记将成员变量声明为private。这可赋予客户访问数据的一致性、可细微划分访问控制、允诺约束条件获得保证，并提供class作者以充分的实现弹性。
- protected并不比public更具封装性。

### **条款23：宁以non-member、non-friend替换member函数**

- 一般我们相当然以为类中的成员函数更具封装性，而实际上并不是那么一回事，因为成员函数不仅可以访问private成员变量，也可以取用private函数、enums、typedefs等等。而非成员非友元函数能实现更大的封装性，因为它只能访问public函数。
- 此外，这些函数只要位于同一个命名空间内，就可以被拆分为多个不同的头文件，客户可以按需引入头文件来获得这些函数，而类是无法拆分的（子类继承与此需求不同），因此这种做法有更好的扩充性。

### **条款24：若所有参数皆需类型转换，请为此采用non-member函数**

- 如果你需要为某个函数的所有参数（包括被this指针所指的那个隐喻参数）进行类型转换，那么这个函数必须是个non-member。

通常，令类支持隐式类型转换通常是个糟糕的主意。当然这条规则有其例外，最常见的例外是在建立数值类型时。 例：

```cpp
const Rational operator*(const Rational& rhs) const;
//如果定义一个有理数类，并实现*操作符为成员函数，如上所示；那么考虑一下调用：
Rational oneHalf(1, 2);
result = oneHalf * 2; // 正确，2被隐式转换为Rational（2，1）
          //编译器眼中应该是这样：const Rational temp(2); result = oneHalf * temp;
result = 2 * oneHalf; // 错误，2，可不被认为是Rational对象；因此无法调用operator*
 class Rational
  {
        ... // contains no operator*
  };
 const Rational operator*(const Rational& lhs,  Rational& rhs)
 {
     return Rational(lhs.numerator() * rhs.numerator(),
                                lhs.denominator() * rhs.denominator());
 }
 Rational oneFourth(1, 4);
 Rational result;
 result = oneFourth * 2;
 result = 2 * oneFourth;  //这下两个都工作的很好，通过隐式转换实现
```

### **条款25：考虑写出一个不抛异常的swap函数**

- 当`std::swap`对你的类型效率不高时，提供一个`swap`成员函数，并确定这个函数不抛出异常。
- 如果你提供一个`member swap`，也该提供一个`non-member swap`用来调用前者。对于classes（而非templates），也请特化`std::swap`。
- 调用`swap`时应针对`std::swap`使用`using`声明式，然后调用`swap`并且不带任何“命名空间资格修饰”。
- 为“用户定义类型”进行`std templates`全特化是好的，但千万不要尝试在std内加入某些对std而言全新的东西。

## **五、实现**

### **条款26：尽可能延后变量定义式的出现时间**

- 你不只应该延后变量的定义，**直到非得使用该变量的前一刻为止**，甚至应该尝试延后这份定义直到能够给它初值实参为止。如果这样，不仅能够避免构造（和析构）非必要对象，还可以**避免无意义的default构造行为**。更深一层说，以“具明显意义之初值”将变量初始化，还可以附带说明变量的目的。

- **对于循环操作，在循环前还是中进行构造，取决于赋值操作与构造+析构操作的成本对比**。

- - 循环前：1个构造函数+1个析构函数+n个赋值操作
  - 循环后：n个构造函数+n个析构函数



### **条款27：尽量少做转型动作**

- const_cast通常被用来将对象的**常量性转除**（cast away the constness）。它也是唯一有此能力的C++style转型操作符。
- dynamic_cast主要用来执行“**安全向下转型**”（safe downcasting），也就是用来决定某对象是否归属继承体系中的某个类型。它是唯一无法由旧式语法执行的动作，也是唯一可能耗费重大运行成本的转型动作（稍后细谈）。
- reinterpret_cast意图执行**低级转型，实际动作（及结果）可能取决于编译器**，这也就表示它**不可移植**。例如将一个pointer to int转型为一个int。这一类转型在低级代码以外很少见。本书只使用一次，那是在讨论如何针对原始内存（rawmemory）写出一个调试用的分配器（debugging allocator）时，见条款50。
- **static_cast用来强迫隐式转换**（implicit conversions），例如将non-const对象转为const对象（就像条款3所为），或将int转为double等等。它也可以用来执行上述多种转换的反向转换，例如将 void*指针转为 typed 指针，将pointer-to-base转为pointer-to-derived。但它无法将const转为non-const——这个只有const_cast才办得到。

请记住：

- 如果可以，**尽量避免转型**，特别是在注重效率的代码中避免 dynamic_casts。如果有个设计需要转型动作，试着发展无需转型的替代设计。
- 如果转型是必要的，**试着将它隐藏于某个函数背后**。客户随后可以调用该函数，而不需将转型放进他们自己的代码内。
- **宁可使用C++新式转型，也不用用C的旧式**，因为新式的更容易被注意到，而且各自用途专一。

### **条款28：避免返回handles指向对象内部成分**

避免让外部可见的成员函数返回handles（包括引用、指针、迭代器）指向对象内部（更隐私的成员变量或函数），即使返回const修饰也有风险。这一方面降低了封装性，另一方面可能导致其指向的对象内部元素被修改或销毁。

```cpp
 struct RectData
  {
        Point ulhc;
        Point lrhc;
  };
  class Rectangle
  {
      public:
       ...
      Point& upperLeft() const { return pData->ulhc; }1//const只对函数内进行保护，函数返回后呢？？
      Point& lowerRight() const { return pData->lrhc; }2 //const只对函数内进行保护，函数返回后呢？？
      private:
      std::tr1::shared_ptr<RectData> pData;
       ...
    };
```

1，2两函数都返回引用，指向private内部数据，调用者于是可通过这些引用更改内部数据！这严重破坏了数据的封装性，对私有成员进行直接操作？太不可思意了！

### **条款29：为“异常安全”而努力是值得的**

异常安全函数（Exception-safe functions）提供以下三个保证之一：

- **基本承诺**：如果异常被抛出，程序内的任何事物仍然保持在有效状态下。
- **强烈保证**：如果异常被抛出，程序状态不改变。调用这样的函数需有这样的认知：如果函数成功，就是完全成功，如果函数失败，**程序会回复到“调用函数之前”的状态**。
- **不抛掷（nothrow）保证**，**承诺绝不抛出异常**，因为它们总是能够完成它们原先承诺的功能。

**异常安全码**（Exception-safe code）必须提供上述三种保证之一。如果它不这样做，它就不具备异常安全性。 **copy and swap**。原则很简单：**为你打算修改的对象（原件）做出一份副本**，**然后在那副本身上做一切必要修改**。若有任何修改动作抛出异常，原对象仍保持未改变状态。待所有改变都成功后，再将修改过的那个副本和原对象在一个不抛出异常的操作中置换（swap）。

- 异常安全函数（Exception-safe functions）即使发生异常也不会泄漏资源或允许任何数据结构败坏。这样的函数区分为三种可能的保证：基本型、强烈型、不抛异常型。
- “强烈保证”往往能够以 copy-and-swap 实现出来，但“强烈保证”并非对所有函数都可实现或具备现实意义。
- 函数提供的“异常安全保证”通常最高只等于其所调用之各个函数的“异常安全保证”中的最弱者。

### **条款30：透彻了解inlining的里里外外**

- `inline`只是对编译器的一个请求，大部分编译器拒绝将太过复杂（例如带有循环或递归）的函数`inlining`，而所有对`virtual`函数的调用（除非是最平淡无奇的）也都会使`inlining`落空。
- 有时候虽然编译器有意愿`inlining`某个函数，还是可能为该函数生成一个函数本体。举个例子，如果程序要取某个`inline`函数的地址，编译器通常必须为此函数生成一个`outlined`函数本体。毕竞编译器哪有能力提出一个指针指向并不存在的函数呢？
- **将大多数inlining限制在小型、被频繁调用的函数身上。这可使日后的调试过程和二进制升级（binary upgradability）更容易，也可使潜在的代码膨胀问题最小化，使程序的速度提升机会最大化。**
- **不要只因为function templates出现在头文件，就将它们声明为inline。**

### **条款31：将文件间的编译依存关系降至最低**

- 为了增加编译速度，**应该减少类文件之间的相互依存性**（include），但是类内又常常使用到其他类，不得不相互依存，解决方案是：**将类的声明和定义分开**（不同的头文件），**声明相互依存，而定义不相依存，这样当定义需要变更时，编译时不需要再因为依赖而全部编译。**
- **基于此构想的两个手段**是`Handle classes`和`Interface classes`。Handle classes是一个声明类，一个imp实现类，声明类中不涉及具体的定义，只有接口声明，在定义类中include声明类，而不是继承。而`Interface classes`是在接口类中提供纯虚函数，作为一个抽象基类，定义类作为其子类来实现具体的定义。

## **六、继承与面向对象设计**

### **条款32：确定你的public继承塑模出is-a关系**

- public inheritance（公开继承）意味 "is-a"（是一种）的关系。子是父，父不是子，父具有一般性，子具有特殊性
- “public继承”意味is-a。适用于base classes身上的每一件事情一定也适用于derived classes身上，因为每一个derived class对象也都是一个base class对象。

### **条款33：避免遮掩继承而来的名称**

- `derived classes`内的名称会遮掩`base classes`内的名称。在public继承下从来没有人希望如此。尽管函数参数不同，仍然会被遮掩
- 为了让被遮掩的名称再见天日，可使用 using 声明式或转交函数（forwarding functions）。



### **条款34：区分接口继承和实现继承**

- **声明一个纯虚函数的目的是为了让衍生类只继承其函数接口，而自己进行函数定义实现。**
- 声明一个虚函数的目的是为了让衍生类继承该函数的接口和缺省实现（一般实现），**如果有特别的操作需求，可以在衍生类中进行实现来覆盖**。如果担心因此忘记做特异化实现，可以利用纯虚函数，在父类给纯虚函数一个实现，然后在子类的该函数的实现中调用它，这样就会记得在需要特异化的子类中进行其他特异化实现。
- **声明一个非虚函数的目的是为了让衍生类完全继承该函数的接口和实现，也就是声明该函数的实现方式不得更改，所有子类都表现一致。**

### **条款35：考虑virtual函数以外的其他选择**

`virtual`函数（本质是希望子类的实现不同）的替代方案：（**并非不推荐virtual，只是推荐我们多去思考**）

- 用`public`的**非虚函数来调用**`private`的虚函数具体实现，非虚函数必须为子类继承且不得更改，所以它决定了何时调用以及调用前后的处理；虚函数实现可以在子类中覆写，从而实现多态。**（NVI手法，**NVI手法自身是一个特殊形式的Template Method设计模式**）**



- 将虚函数替换为函数指针成员变量，这样可以对同一种子类对象赋予不同的函数实现，或者在运行时更改某对象对应的函数实现（添加一个set函数）。**（Strategy设计模式）**
- 用`tr1::function`成员变量替换虚函数，从而允许包括函数指针在内的任何可调用物搭配一个兼容于需求的签名式。**（Strategy设计模式）**
- 将虚函数也做成另一个继承体系类，然后在调用其的类中添加一个指针来指向其对象。**（古典 Strategy设计模式）**

**本条款的启示为：为避免陷入面向对象设计路上因常规而形成的凹洞中，偶尔我们需要对着车轮猛推一把。这个世界还有其他许多道路，值得我们花时间加以研究。**

### **条款36：绝不重新定义继承而来的non-virtual函数**

- 不要重新定义继承而来的非虚函数，理论上，非虚函数的意义就在于父类和子类在该函数上保持一致的实现。

### **条款37：绝不重新定义继承而来的缺省参数值**

- 非常直接而明确了：virtual函数系动态绑定（dynamically bound），而缺省参数值却是静态绑定（statically bound）。
- 绝对不要重新定义一个继承而来的缺省参数值，因为缺省参数值都是静态绑定，而virtual函数——你唯一应该覆写的东西——却是动态绑定。

### **条款38：通过复合表示 has-a 或者“根据某物实现出”的关系**

- 复合（composition）是类型之间的一种关系，当某种类型的对象内含它种类型的对象，便是这种关系。
- 注意 has-a 和 is-a 的区分。如果是 is-a 的关系，可以用继承，但如果是 has-a 的关系，应该将一个类作为另一个类的成员变量来使用，以利用该类的能力，而不是去以继承它的方式使用。
- 复合（composition）的意义和public继承完全不同。
- 在应用域（application domain），复合意味 has-a （有一个）。在实现域（implementation domain），复合意味is-implemented-in-terms-of（根据某物实现出）

### **条款39：明智而审慎地使用private继承**

- 如果`classes`之间是`private`继承关系，那么编译器不会自动将一个`derived class`对象转换为一个`base class`对象。
- 由`private base class`继承而来的所有成员，在`derived class`中都会变成`private`属性，纵使它们在`base class`中原本是`protected`或`public`属性。
- 如果一个类为 空类的话，按道理讲，它是不会占用内存空间的。但是如果设计成组合关系，那么编译器会为空类分配一个字节char的内存空间（此时，sizeof(派生类 x) >sizeof(派生类成员变量)），而又由于对齐需求，可能这个字节最终甚至会变成一个int大小。
- 如果设计成private继承的话，可以避免上述情况。即：sizeof(派生类 x) == sizeof(派生类成员变量)，这便是所谓的EBO(空白基类最优化)。

### **条款40：明智而审慎地使用多重继承**

- 多重继承比单一继承复杂。它可能导致新的歧义性，以及对virtual继承的需要。

```cpp
class A {
public:
    void check() {
        cout << "A" << endl;
    }
 
};
 
class B {
private:
    void check() const {
        cout << "B" << endl;
    }
};
 
class C : public A, public B {
};
 
int main(){
    C c;
    c.check();  //报错
    
}
```

注意以上无法调用，因为尽管B的check()是private的，但是c++先找出最佳匹配才检查可用性，但是此时没有最佳匹配。为解决歧义必须显示指出调用哪个函数例如`c.A::check()`;

- virtual继承会增加大小、速度、初始化（及赋值）复杂度等等成本。如果`virtualbase classes`不带任何数据，将是最具实用价值的情况。
- 多重继承的确有正当用途。其中一个情节涉及“public继承某个Interfaceclass”和“private继承某个协助实现的class”的两相组合。

## **七、模板与泛型编程**

### **条款41：了解隐式接口和编译期多态**

- **类和模板都支持接口和多态。**
- **类的接口是显式定义的——函数签名。多态是通过虚函数在运行期体现的。**
- **模板的接口是隐式的（由模板函数的实现代码所决定其模板对象需要支持哪些接口），多态通过模板具现化和函数重载解析在编译期体现，也就是编译期就可以赋予不同的对象于模板函数。**

### **条款42：了解typename的双重意义**

- 声明template参数时，前缀关键字class和typename可互换。
- 请使用关键字typename标识嵌套从属类型名称；但不得在base class lists（基类列）或member initialization list（成员初值列）内以它作为base class修饰符。

**例子：**

```cpp
template<typename T>
void print(const T& container)
{
    T::const_iterator* m;
    ...
}
```

这里我们声明m为一个局部变量，它是一个指向T::const_iterator的指针。 但是有一种情况，如果T::const_iterator它不是一个类型，而是T中的一个静态成员变量(确实有这个可能)，而这时m碰巧也是一个全局变量(哪有这么巧的事呀！)，那上面的代码就不是定义一个指针变量了，而是两个静态变量相乘。 上面的情况虽然特殊，但确实有可能发生的。所以C++解析器的设计者必须考虑如何避免这个问题。 C++有个规则可以解析这一歧义状态：如果解析器在模板中遇到这个嵌套从属名称，**它便假设这个名称不是一个类型**。**除非你明确告诉他。在缺省情况下，嵌套从属名称不是类型。** **应给编译器点提示：**

```cpp
template<typename T>
void print(const T& container)
{
    if(container.size()>=1)
    typename T::const_iterator iter(container.begin());
    //明确指定是一个类型
        ...
}
```

### **条款43：学习处理模板化基类内的名称**

如果基类是模板类，那么衍生类直接调用基类的成员函数无法通过编译器，因为可能会有特化版的模板类针对某个类不声明该接口函数。 解决方法有：

- 在调用动作前加上“this -  >”

- 使用using声明式来在子类中声明基类的该接口

- 明确指出被调用的函数位于基类：

  ```cpp
  Base<template>::xxx();
  ```

   以上做法都是承诺被调用的函数一定会在各种特化基类中均声明。如果没有声明，还是会在运行期报错。

例子：

```cpp
template<typename T1>
class Class_A{
public:
    void send1(T1 var);
};

template <typename T1>
class Class_B:public Class_A< T1 >{
public:
    void send2(T1 var) { send1(var); } //编译错误，调用模板基类内函数失败
};
```

原因：**由于base class template可能被特化，而特化版本可能不提供和一般性template模板相同的接口。因此编译器往往拒绝在templated base class（模板基类）内寻找继承而来的名称**，例子：

```cpp
template<>
class Class_A<Type_1>{ //特化模板类，类型为Type_1时的模板类
public:
	void send3(Type_1 var); // 该特化类中不存在send1函数
};
```

**知识点：template为特化模板标志** 现象：由于特化类中不存在send1函数，因此派生类调用该函数失败。所以编译器由于知道基类模板可能被特化，使得接口不一致，所以禁止了这样的调用。 **解决方法的原理：对编译器承诺，base class template的任何版本（包括特化版本）都将支持一般版本所提供的的接口。**

1. 使用this指针

```cpp
template <typename T1>
class Class_B:public Class_A< T1 >{
public:
	void send2(T1 var) { this->send1(var); }  // 告诉编译器，假设send1被继承
};
```

1. 使用using声明

```cpp
template <typename T1>
class Class_B:public Class_A< T1 >{
public:
	using Class_A< T1 >::send1; // 告诉编译器，send1在基类中
	void send2(T1 var) { send1(var); }  
};
```

1. 指明被调函数所在类：基类资格修饰符

```cpp
template <typename T1>
class Class_B:public Class_A< T1 >{
public:
	void send2(T1 var) { Class_A< T1 >::send1(var); }  // 告诉编译器，send1在基类中
	// 此方法不好若send1为虚函数，则Class_A< T1 >::修饰会关闭virtual绑定行为
};
```

### **条款44：将与参数无关的代码抽离**

任何模板代码都不该与某个造成膨胀的参数产生相依关系：

- 因非类型模板参数造成的代码膨胀（比如用尺寸做模板参数导致为不同尺寸的同一对象生成多份相同代码），往往可**消除**，做法是将该参数改为函数参数或者类成员变量，而不要放到模板的参数中。



- 因类型参数造成的代码膨胀（比如int和long有相同的二进制表述，但作为模板参数会产生两份代码），往往可**降低**，做法是让带有完全相同二进制表述的具体类型共享实现码——使用唯一一份底层实现。

### **条款45：运用成员函数模板接受所有兼容类型**

- 请使用member function templates（成员函数模板）生成“可接受所有兼容类型”的函数。
- 如果你声明 member templates 用于“泛化copy构造”或“泛化assignment操作”，你还是需要声明正常的copy构造函数和copy assignment操作符。

```cpp
template<typename T>
class SmartPtr {
public:
    template<typename U>
    SmartPtr(const SmartPtr<U>& other)  // 以other的heldPtr初始化this的heldPtr
    : heldPtr(other.get()) { ... }
    T* get() const { return heldPtr; }
    ...
private:
    T* heldPtr;      // 这个SmartPtr持有内置指针
};
```

下面是tr1::shared_ptr的一份定义摘要，例证上述所言

```cpp
template<class T>
class shared_ptr {
public:
    shared_ptr(shared_ptr const& r);    // copy构造函数
 
    template <class Y>
     shared_ptr(shared_ptr<Y> const& r);               // 泛化copy构造函数
                
     shared_ptr& operator=(shared_ptr<Y> const& r);    // copy assignment
    template <class Y>
     shared_ptr& operator=(shared_ptr<Y> const& );     // 泛化copy assignment
    ...
};
```

### **条款46：需要类型转换时请为模板定义非成员函数**

条款24讨论过为什么唯有non-member函数才有能力“在所有实参身上实施隐式类型转换”，

- 模板类中的模板函数不支持隐式类型转换，如果你在调用时传了一个其他类型的变量，编译器无法帮你做类型转换，从而报错。
- 解决方案是将该模板函数定义为模板类内的友元模板函数，从而支持了参数的隐式转换。如果函数的功能比较简单，可以直接inline，如果比较复杂，可以调用一个类外的定义好的模板函数（此时，友元函数已经给参数做了类型转换，因此可以调用模板函数了）。

```cpp
template<typename T>
    class Rational {
    public:
        ...
        friend
        const Rational operator*(const Rational& lhs, const Rational& rhs); 
};
template<typename T>
const Rational<T> operator*(const Rational<T>& lhs, const Rational<T>& rhs)
{ ... }
```

### **条款47：请使用traits classes表现类型信息**

如何使用一个traits class了：

- 建立一组重载函数（身份像劳工）或函数模板（例如 doAdvance），彼此间的差异只在于各自的traits参数。令每个函数实现码与其接受之traits信息相应和。■
- 建立一个控制函数（身份像工头）或函数模板（例如 advance），它调用上述那些“劳工函数”并传递traits class所提供的信息。

请记住

- Traits classes使得“类型相关信息”在编译期可用。它们以templates和“templates特化”完成实现。
- 整合重载技术（overloading）后，traits classes 有可能在编译期对类型执行if...else测试。

例子： 我们不要这样： 我们想在编译期就确定调用哪个advance，于是实现traits classes，如stl中的容器那样，每个容器都有自己的迭代器，而且迭代器可以在类内typedef，这样不会影响到外面，而且还可以入乡随俗，依据此实现trait

1. 先在容器类中定义`trait`别名，这里是迭代器



1. 再根据`trait`分类（此处为迭代器），实现一组重载函数（身份像劳工）或函数模板，



1. 建立一个控制函数（身份像工头）或函数模板，来调用劳工，这样便可实现编译期trait识别



### **条款48：认识template元编程**

- Template metaprogramming（TMP，模板元编程）可将工作由运行期移往编译期，因而得以实现早期错误侦测和更高的执行效率。
- TMP 可被用来生成“基于政策选择组合”（based on combinations of policy choices）的客户定制代码，也可用来避免生成对某些特殊类型并不适合的代码。

TMP可将工作由运行期移往编译器，因而得以实现早期错误侦测和更高的执行效率。 实现方式以模板为基础，因为模板会在编译时确定，上一条款的traits classes就是一种TMP，依靠模板函数参数不同的重载来在编译器模拟if else（其在运行期才会判断）。 另一个例子是用模板来在编译器实现阶乘：

```cpp
template<unsigned n>
struct Factorial {
    enum { value = n * Factorial<n-1>::value };
};
template<>
struct Factorial<0> {
    enum { value = 1 };
}
```

用模板来实现递归从而在编译器实现阶乘运算，用参数为0的特异化来做递归的终结。

## **八、定制new和delete**

### **条款49：了解 new-handler 的行为**

- set_new_handler允许客户指定一个函数，在内存分配无法获得满足时被调用。
- Nothrow new是一个颇为局限的工具，因为它只适用于内存分配；后继的构造函数调用还是可能抛出异常。



### **条款50：了解new和delete的合理替换时机**

- 有很多理由让你想要写个自定的new和delete，比如改善定制版的效能、对heap运用错误进行调试、收集heap使用信息等。也有许多商业或开源的内存分配器供你使用。

### **条款51：编写new和delete时需固守常规**

- operator new应该内含一个无穷循环，并在其中尝试分配内存，如果它无法满足内存需求，就该调用new-handler。它也应该有能力处理0 bytes申请。Class专属版本则还应该处理“比正确大小更大的（错误）申请”。
- operator delete应该在收到null指针时不做任何事。Class专属版本则还应该处理“比正确大小更大的（错误）申请”。

### **条款52：写了 placement new 也要写 placement delete**

- 如果你的new接收的参数除了必定有的size_t外还有其他，就是个placement new。delete类似。
- **当创建对象时，会先进行new，然后调用构造函数，如果构造出现异常，就需要delete，否则内存泄漏。如果用了placement new，那么编译器会寻找含有同样参数的placement delete，否则不会delete，因此必须成对写接收同样参数的placement new和placement delete。**
- 同时，为了让用户主动使用delete时能进行正确操作，你需要同时定义一个普通形式的delete，来执行和placement delete同样的特殊实现。
- 你在类中声明placement new后，会掩盖C++提供的new函数，因此除非你确实不想用户使用默认的new，否则你需要确保它们还可用（条款33）。

## **九、杂项讨论**

### **条款53：不要轻忽编译器的警告**

- 严肃对待编译器发出的警告信息。努力在你的编译器的最高（最严苛）警告级别下争取“无任何警告”的荣誉。
- 不要过度倚赖编译器的报警能力，因为不同的编译器对待事情的态度并不相同。一旦移植到另一个编译器上，你原本倚赖的警告信息有可能消失。

### **条款54：让自己熟悉包括TR1在内的标准程序库**

- C++98的标准程序库有：
- STL
- Iostreams，包括cin、cout、cerr、clog等
- 国际化支持
- 数值处理
- 异常阶层体系
- C89标准程序库

而TR1是新的一系列组件，在std内的tr1命名空间中，比如：std::tr1::shared_ptr。它包含：

- 智能指针，包括shared_ptr和weak_ptr。
- function：支持以函数签名（出参类型+入参类型）作为模板
- bind：绑定器
- 无序hash表，用以实现无序的set、multiset、map、multimap
- 正则表达式
- tuples：扩充pair，能持有任意个数的对象，类似python中的tuples。
- array：STL化的数组，支持begin和end，不过其大小固定，不适用动态内存。
- mem_fn
- reference_wrapper：让引用的行为更像对象，可以被容器持有。
- 随机数生成工具：大大超越rand
- 数学特殊函数：多种数学函数
- C99兼容扩充。
- type traits，使用见条款47，提供类型的编译期信息。
- result_of：是个模板，用来推到函数调用的返回类型。

### **条款55：让自己熟悉Boost**

Boost是一个程序库，其由C++标准委员会成员创设，可视为一个“可被加入标准C++的各种功能”的测试场，涵盖众多经过多轮复核的优质程序，如果想知道当前C++最高技术水平、想一瞥未来C++的可能长相？看看Boost吧。