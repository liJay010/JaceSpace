# TensorRT

## Cuda Driver

### 1.DriverAPI

1.CUDA Driver是与GPU沟通的驱动级别底层API

2.CUDA Driver**随显卡驱动发布**，与cudatoolkit**分开看**

3.CUDA Driver对应于cuda.h和libcuda.so文件

4.主要知识点是**Context**的管理机制**，以及**CUDA**系列接口的开发习惯**（错误检查方法），还有**内存模型**



### 2.**context**

1.context是一种上下文，关联对GPU的所有操作

2.context与一块显卡关联，一个显卡可以被多个context关联

**每个线程都有一个栈结构储存**context，栈顶是当前使用的context，对应有push、pop函数操作context的栈，所有api都以当前context为操作目标





**关于**context**，有两种：**

1.手动管理的context，cuCtxCreate（手动管理，以堆栈方式push/pop），CreateContext、PushCurrent、PopCurrent这种多context管理就显得麻烦

2.自动管理的context，cuDevicePrimaryCtxRetain（自动管理，runtime api以此为基础），为设备关联主context，分配、释放、设置、栈都不用你管，primaryContext：给我设备id，给你context并设置好，此时**一个显卡对应一个**primary context，context是线程安全的







## RuntimeAPI

### 1.前瞻知识

1.对于runtimeAPI，与driver最大区别是**懒加载**

2.即，第一个runtime API调用时，会进行**cuInit**初始化，避免驱动api的初始化窘境

3.即，第一个需要context的API调用时，会进行context关联并创建context和设置当前context，**调用**cuDevicePrimaryCtxRetain实现

4.绝大部分api需要context，例如查询当前显卡名称、参数、内存分配、释放等



1.CUDA Runtime是封装了CUDA Driver的高级别更友好的API

2.使用**cuDevicePrimaryCtxRetain**为每个设备设置context，不再手工管理context，并且不提供直接管理context的API（可Driver API管理，通常不需要）

3.可以更友好的执行核函数，**.cpp可以与.cu文件无缝对接**

4.对应**cuda_runtime.h和libcudart.so**

5.runtime api随cuda toolkit发布

6.主要知识点是**核函数的使用、线程束布局、内存模型、流的使用**

7.主要实现**归约求和、仿射变换、矩阵乘法、模型后处理**，就可以解决绝大部分问题



### 2.Memory



1.**CPU内存**，称之为Host Memory

 					  **Pageable Memory**：可分页内存，可能被换入换出

  					 **Page-Locked Memory**：页锁定内存，不能被换入换出

​			**GPU**可以直接访问**pinned memory**而不能访问**pageable memory**

2.**GPU内存**，称之为Device Memory

​					   **Global Memory**：全局内存

   					**Shared Memory**：共享内存

​						其他多种内存

数据传输：

![image-20240330155951695](C:\Users\lxj\AppData\Roaming\Typora\typora-user-images\image-20240330155951695.png)

**原则：**

1.GPU可以直接访问**pinned memory**，称之为（DMA Direct Memory Access）

2.对于GPU访问而言，距离计算单元越近，效率越高，所以PinnedMemory<GlobalMemory<SharedMemory

3.代码中，由new、malloc分配的，是**pageable memory**，由**cudaMallocHost分配的是PinnedMemory**，由**cudaMalloc分配的是GlobalMemory**

4.尽量多用**PinnedMemory储存host数据**，或者显式处理Host到Device时，用PinnedMemory做缓存，都是提高性能的关键

```cpp
int device_id = 0;
checkRuntime(cudaSetDevice(device_id));

//global mem
float* memory_device = nullptr;
checkRuntime(cudaMalloc(&memory_device, 100 * sizeof(float))); // pointer to device
//pageable
float* memory_host = new float[100];
memory_host[2] = 520.25;
checkRuntime(cudaMemcpy(memory_device, memory_host, sizeof(float) * 100, cudaMemcpyHostToDevice)); // 返回的地址是开辟的device地址，存放在memory_device

//pinned mem
float* memory_page_locked = nullptr;
checkRuntime(cudaMallocHost(&memory_page_locked, 100 * sizeof(float))); // 返回的地址是被开辟的pin memory的地址，存放在memory_page_locked
checkRuntime(cudaMemcpy(memory_page_locked, memory_device, sizeof(float) * 100, cudaMemcpyDeviceToHost)); // 

printf("%f\n", memory_page_locked[2]);
checkRuntime(cudaFreeHost(memory_page_locked));
delete [] memory_host;
checkRuntime(cudaFree(memory_device)); 
```



### 3.stream 流（异步）

1.流是一种基于context之上的任务管道抽象，一个context可以**创建n个流**

2.流是**异步控制**的主要方式

3.nullptr表示默认流，每个线程都有自己的**默认流**

```cpp
cudaStream_t stream = nullptr;
checkRuntime(cudaStreamCreate(&stream));

// 在GPU上开辟空间
float* memory_device = nullptr;
checkRuntime(cudaMalloc(&memory_device, 100 * sizeof(float)));

// 在CPU上开辟空间并且放数据进去，将数据复制到GPU
float* memory_host = new float[100];
memory_host[2] = 520.25;
checkRuntime(cudaMemcpyAsync(memory_device, memory_host, sizeof(float) * 100, cudaMemcpyHostToDevice, stream)); // 异步复制操作，主线程不需要等待复制结束才继续

// 在CPU上开辟pin memory,并将GPU上的数据复制回来 
float* memory_page_locked = nullptr;
checkRuntime(cudaMallocHost(&memory_page_locked, 100 * sizeof(float)));
checkRuntime(cudaMemcpyAsync(memory_page_locked, memory_device, sizeof(float) * 100, cudaMemcpyDeviceToHost, stream)); // 异步复制操作，主线程不需要等待复制结束才继续
checkRuntime(cudaStreamSynchronize(stream)); //等待所有的异步操作
```



### 4.核函数

1.核函数是cuda编程的关键

2.通过xxx.cu创建一个cudac程序文件，并把cu交给nvcc编译，才能识别cuda语法

3.__global__表示为核函数，由host调用。__device__表示为设备函数，由device调用

4.__host__表示为主机函数，由host调用。__shared__表示变量为共享变量

5.host调用核函数：

```cpp
function<<<gridDim, blockDim, sharedMemorySize, stream>>>(args…);
```

6.只有__global__修饰的函数才可以用

```cpp
<<<>>>
```

的方式调用

7.调用核函数是传值的，不能传引用，可以传递类、结构体等，核函数可以是模板

8.核函数的执行，是**异步**的，也就是立即返回的

9.线程layout主要用到**blockDim**、**gridDim**

10.核函数内访问线程索引主要用到**threadIdx**、**blockIdx**、**blockDim**、**gridDim**这些内置变量



1.核函数里面，把blockDim、gridDim看作shape，把threadIdx、blockIdx看做index

2.则可以按照维度高低排序看待这个信息：

方便的记忆办法，是左乘右加：

![image-20240330160812192](C:\Users\lxj\AppData\Roaming\Typora\typora-user-images\image-20240330160812192.png)

![image-20240330171714908](C:\Users\lxj\AppData\Roaming\Typora\typora-user-images\image-20240330171714908.png)



![image-20240330160820629](C:\Users\lxj\AppData\Roaming\Typora\typora-user-images\image-20240330160820629.png)

```cpp
#include <stdio.h>
#include <cuda_runtime.h>
// __global__ 是核函数，__host__是主机函数，__device__表示为设备函数，由device调用
__global__ void test_print_kernel(const float* pdata, int ndata){

    int idx = threadIdx.x + blockIdx.x * blockDim.x;
    
    /*   
    shape   -     index
    gridDim -》 blockIdx
    blockDim -》 threadIdx 
    
    dims                 indexs
        gridDim.z            blockIdx.z
        gridDim.y             blockIdx.y
        gridDim.x            blockIdx.x
        blockDim.z           threadIdx.z
        blockDim.y           threadIdx.y
        blockDim.x           threadIdx.x

        Pseudo code:
        position = 0
        for i in 6:
            position *= dims[i]
            position += indexs[i]
    */
    printf("Element[%d] = %f, threadIdx.x=%d, blockIdx.x=%d, blockDim.x=%d\n", idx, pdata[idx], threadIdx.x, blockIdx.x, blockDim.x);
}

void test_print(const float* pdata, int ndata){

    // <<<gridDim, blockDim, bytes_of_shared_memory, stream>>>
    // gridDim * ndata 等于线程数 gridDim （gridDim.x,gridDim.y,gridDim.z） * blockDim(blockDim.x,blockDim.y,blockDim.z)
    test_print_kernel<<<1, ndata, 0, nullptr>>>(pdata, ndata);

    // 在核函数执行结束后，通过cudaPeekAtLastError获取得到的代码，来知道是否出现错误
    // cudaPeekAtLastError和cudaGetLastError都可以获取得到错误代码
    // cudaGetLastError是获取错误代码并清除掉，也就是再一次执行cudaGetLastError获取的会是success
    // 而cudaPeekAtLastError是获取当前错误，但是再一次执行 cudaPeekAtLastError 或者 cudaGetLastError 拿到的还是那个错
    // cuda的错误会传递，如果这里出错了，不移除。那么后续的任意api的返回值都会是这个错误，都会失败
    cudaError_t code = cudaPeekAtLastError();
    if(code != cudaSuccess){    
        const char* err_name    = cudaGetErrorName(code);    
        const char* err_message = cudaGetErrorString(code);  
        printf("kernel error %s:%d  test_print_kernel failed. \n  code = %s, message = %s\n", __FILE__, __LINE__, err_name, err_message);   
    }
}
```

### 5.共享内存

1.共享内存因为更靠近计算单元，所以访问速度更快

2.共享内存通常可以作为访问全局内存的缓存使用

3.可以利用共享内存实现线程间的通信

4.通常与__syncthreads同时出现，这个函数是同步block内的所有线程，全部执行到这一行才往下走

5.使用方式，通常是在线程id为0的时候从global memory取值，然后syncthreads，然后再使用



```cpp
#include <cuda_runtime.h>
#include <stdio.h>

//////////////////////demo1 //////////////////////////
/* 
demo1 主要为了展示查看静态和动态共享变量的地址
 */
const size_t static_shared_memory_num_element = 6 * 1024; // 6KB
__shared__ char static_shared_memory[static_shared_memory_num_element]; 
__shared__ char static_shared_memory2[2]; 

__global__ void demo1_kernel(){
    extern __shared__ char dynamic_shared_memory[];      // 静态共享变量和动态共享变量在kernel函数内/外定义都行，没有限制
    extern __shared__ char dynamic_shared_memory2[];
    printf("static_shared_memory = %p\n",   static_shared_memory);   // 静态共享变量，定义几个地址随之叠加
    printf("static_shared_memory2 = %p\n",  static_shared_memory2); 
    printf("dynamic_shared_memory = %p\n",  dynamic_shared_memory);  // 动态共享变量，无论定义多少个，地址都一样
    printf("dynamic_shared_memory2 = %p\n", dynamic_shared_memory2); 

    if(blockIdx.x == 0 && threadIdx.x == 0) // 第一个thread
        printf("Run kernel.\n");
}

/////////////////////demo2//////////////////////////////////
/* 
demo2 主要是为了演示的是如何给 共享变量进行赋值
 */
// 定义共享变量，但是不能给初始值，必须由线程或者其他方式赋值
__shared__ int shared_value1;

__global__ void demo2_kernel(){
    
    __shared__ int shared_value2;
    if(threadIdx.x == 0){

        // 在线程索引为0的时候，为shared value赋初始值
        if(blockIdx.x == 0){
            shared_value1 = 123;
            shared_value2 = 55;
        }else{
            shared_value1 = 331;
            shared_value2 = 8;
        }
    }

    // 等待block内的所有线程执行到这一步
    __syncthreads();
    
    printf("%d.%d. shared_value1 = %d[%p], shared_value2 = %d[%p]\n", 
        blockIdx.x, threadIdx.x,
        shared_value1, &shared_value1, 
        shared_value2, &shared_value2
    );
}

void launch(){
    
    demo1_kernel<<<1, 1, 12, nullptr>>>();
    demo2_kernel<<<2, 5, 0, nullptr>>>();
}
```

### 6.