# SGI-STL和nginx内存池

## 1.nginx内存池

### my_ngx_mem_pool.h

```cpp
/*
 * 移植nginx内存池的代码，用OOP来实现
 */
#pragma once

#include <stdlib.h>
#include <memory.h>
#include <cstdint>

// 类型重定义
using u_char = unsigned char;
using ngx_uint_t = unsigned int;

// 类型前置声明
struct ngx_pool_s;

// 清理函数（回调函数）的类型
typedef void(*ngx_pool_cleanup_pt)(void* data);
struct ngx_pool_cleanup_s
{
    ngx_pool_cleanup_pt     handler;    //定义了一个函数指针，保存清理操作的回调函数
    void*                   data;       //传递给回调函数的参数
    ngx_pool_cleanup_s*     next;       //所有的cleanup清理操作都被串在一条链表上
};

/*
 * 大块内存的头部信息
 */
struct ngx_pool_large_s
{
    ngx_pool_large_s*       next;       //所有的大块内存分配也是被串在一条链表上
    void*                   alloc;      //保存分配出去的大块内存起始地址
};

/*
 * 分配小块内存的内存池的头部数据信息
 */
struct ngx_pool_data_t
{
    u_char*                 last;       //小块内存池可用内存的起始地址
    u_char*                 end;        //小块内存池可用内存的末尾地址
    ngx_pool_s*             next;       //所有小块内存池都被串在了一条链表上，保存下一块小块内存池的地址
    ngx_uint_t              failed;     //记录了当前小块内存池分配内存失败的次数
};

/*
 * ngx内存池的头部信息和管理成员信息
 */
struct ngx_pool_s
{
    ngx_pool_data_t         d;          //存储的是当前小块内存池的使用情况
    size_t                  max;        //存储的是小块内存池和大块内存的分界线
    ngx_pool_s*             current;    //指向第一个提供小块内存分配的小块内存池
    ngx_pool_large_s*       large;      //指向大块内存（链表）的入口地址
    ngx_pool_cleanup_s*     cleanup;    //指向所有预置的清理操作回调函数（链表）的入口
};

// buf缓冲区清零
inline void ngx_memzero(void* buf, size_t n)
{
    memset(buf, 0, n);
}

// 把数值d调整到临近的a的倍数
inline size_t ngx_align(size_t d, size_t a)
{
    return (((d) + (a - 1)) & ~(a - 1));
}

// 把指针p调整到a的临近倍数
inline u_char* ngx_align_ptr(void* p, int a)
{
    return (u_char*)(((uintptr_t) (p) + ((uintptr_t) a - 1)) &
            ~((uintptr_t) a - 1));
}

// 默认一个物理页面的大小4K
const int NGX_PAGESIZE = 4096;
// ngx小块内存池可分配的最大空间
const int NGX_MAX_ALLOC_FROM_POOL = NGX_PAGESIZE - 1;
// 一个默认的ngx内存池开辟的大小
const int NGX_DEFAULT_POOL_SIZE = 16 * 1024;
// 内存池大小按照16字节进行对齐
const int NGX_POOL_ALIGNMENT = 16;
// ngx小块内存池最小的size调整成NGX_POOL_ALIGHMENT的临近的倍数
const int NGX_MIN_POOL_SIZE =
        ngx_align((sizeof(ngx_pool_s) + 2 * sizeof(ngx_pool_large_s)),
                NGX_POOL_ALIGNMENT);
// 小块内存分配考虑字节对齐时的单位
const size_t NGX_ALIGNMENT = sizeof(unsigned long);

class ngx_mem_pool
{
public:
    // 创建指定size大小的内存池，但是小块内存池不超过1个页面大小
    void* ngx_create_pool(size_t size);
    // 考虑内存对齐，从内存池申请size大小的内存
    void* ngx_palloc(size_t size);
    // 不考虑字节对齐，从内存池申请size大小的内存
    void* ngx_pnalloc(size_t size);
    // 调用的是ngx_palloc实现内存分配，但是会初始化0
    void* ngx_pcalloc(size_t size);
    // 释放大块内存
    void ngx_pfree(void* p);
    // 内存重置函数
    void ngx_reset_pool();
    // 内存池的销毁函数
    void ngx_destory_pool();
    // 添加回调清理操作函数
    ngx_pool_cleanup_s* ngx_pool_cleanup_add(size_t size);

private:
    ngx_pool_s* pool; //指向ngx内存池的入口指针

    // 小块内存分配
    void* ngx_palloc_small(size_t size, ngx_uint_t align);
    // 大块内存分配
    void* ngx_palloc_large(size_t size);
    //分配新的小块内存池
    void* ngx_palloc_block(size_t size);
};
```



### my_ngx_mem_pool.cpp

```cpp
#include "my_ngx_mem_pool.h"

// 创建指定size大小的内存池，但是小块内存池不超过一个页面的大小
void* ngx_mem_pool::ngx_create_pool(size_t size)
{
    ngx_pool_s* p;

    p = (ngx_pool_s*)malloc(size);
    if(p == nullptr)
    {
        return nullptr;
    }

    p->d.last = (u_char*)p + sizeof(ngx_pool_s);
    p->d.end = (u_char*)p + size;
    p->d.next = nullptr;
    p->d.failed = 0;

    size = size - sizeof(ngx_pool_s);
    p->max = (size < NGX_MAX_ALLOC_FROM_POOL) ? size : NGX_MAX_ALLOC_FROM_POOL;

    p->current = p;
    p->large = nullptr;
    p->cleanup = nullptr;

    pool = p;

    return p;
}

// 考虑内存字节对齐，从内存池申请size大小的内存
void* ngx_mem_pool::ngx_palloc(size_t size)
{
    if(size <= pool->max)
    {
        return ngx_palloc_small(size, 1);
    }
    return ngx_palloc_large(size);
}

// 不考虑内存字节对齐，从内存池申请size大小的内存
void* ngx_mem_pool::ngx_pnalloc(size_t size)
{
    if(size <= pool->max)
    {
        return ngx_palloc_small(size, 0);
    }
    return ngx_palloc_large(size);
}

// 调用的是ngx_palloc实现内存分配，但是会初始化0
void* ngx_mem_pool::ngx_pcalloc(size_t size)
{
    void* p;
    p = ngx_palloc(size);
    if(p)
    {
        ngx_memzero(p, size);
    }
    return p;
}

// 小块内存分配
void* ngx_mem_pool::ngx_palloc_small(size_t size, ngx_uint_t align)
{
    u_char*     m;
    ngx_pool_s* p;

    p = pool->current;

    do {
        m = p->d.last;

        if (align) {
            m = ngx_align_ptr(m, NGX_ALIGNMENT);
        }

        if ((size_t) (p->d.end - m) >= size) {
            p->d.last = m + size;
            return m;
        }

        p = p->d.next;
    }while (p);

    return ngx_palloc_block(size);
}

// 分配新的小块内存池
void* ngx_mem_pool::ngx_palloc_block(size_t size)
{
    u_char*     m;
    size_t      psize;
    ngx_pool_s* p;
    ngx_pool_s* newpool;

    psize = (size_t)(pool->d.end - (u_char*)pool);

    m = (u_char*)malloc(psize);
    if(m == nullptr)
    {
        return nullptr;
    }

    newpool = (ngx_pool_s*)m;

    newpool->d.end = m + psize;
    newpool->d.next = nullptr;
    newpool->d.failed = 0;

    m += sizeof(ngx_pool_data_t);
    m = ngx_align_ptr(m, NGX_ALIGNMENT);
    newpool->d.last = m + size;

    for(p = pool->current; p->d.next; p = p->d.next)
    {
        if(p->d.failed++ > 4)
        {
            pool->current = p->d.next;
        }
    }

    p->d.next = newpool;

    return m;
}

// 大块内存分配
void* ngx_mem_pool::ngx_palloc_large(size_t size)
{
    void*               p;
    ngx_uint_t          n;
    ngx_pool_large_s*   large;

    p = malloc(size);
    if(p == nullptr)
    {
        return nullptr;
    }

    n = 0;

    for(large = pool->large; large; large = large->next)
    {
        if(large->alloc == nullptr)
        {
            large->alloc = p;
            return p;
        }

        if(n++ > 3)
        {
            break;
        }
    }

    large = (ngx_pool_large_s*)ngx_palloc_small(sizeof(ngx_pool_large_s), 1);
    if(large == nullptr)
    {
        free(p);
        return nullptr;
    }

    large->alloc = p;
    large->next = pool->large;
    pool->large = large;

    return p;
}

// 释放大块内存
void ngx_mem_pool::ngx_pfree(void *p)
{
    ngx_pool_large_s* l;
    for(l = pool->large; l; l = l->next)
    {
        if(p == l->alloc)
        {
            free(l->alloc);
            l->alloc = nullptr;
            return;
        }
    }
}

// 内存重置函数
void ngx_mem_pool::ngx_reset_pool()
{
    ngx_pool_s*         p;
    ngx_pool_large_s*   l;

    for(l = pool->large; l; l = l->next)
    {
        if(l->alloc)
        {
            free(l->alloc);
        }
    }

    // 处理第一个块内存池
    p = pool;
    p->d.last = (u_char*)p + sizeof(ngx_pool_s);
    p->d.failed = 0;

    // 从第二块内存池开始循环到最后一个内存池
    for(p = p->d.next; p; p = p->d.next)
    {
        p->d.last = (u_char*)p + sizeof(ngx_pool_data_t);
        p->d.failed = 0;
    }

    pool->current = pool;
    pool->large = nullptr;
}

// 内存池的销毁函数
void ngx_mem_pool::ngx_destory_pool()
{
    ngx_pool_s*             p;
    ngx_pool_s*             n;
    ngx_pool_large_s*       l;
    ngx_pool_cleanup_s*     c;

    for(c = pool->cleanup; c; c = c->next)
    {
        if(c->handler)
        {
            c->handler(c->data);
        }
    }

    for(l = pool->large; l ; l = l->next)
    {
        if(l->alloc)
        {
            free(l->alloc);
        }
    }

    for(p = pool, n = pool->d.next; ; p = n, n = n->d.next)
    {
        free(p);
        if(n == nullptr)
        {
            break;
        }
    }
}

// 添加回调清理操作函数
ngx_pool_cleanup_s* ngx_mem_pool::ngx_pool_cleanup_add(size_t size)
{
    ngx_pool_cleanup_s*     c;

    c = (ngx_pool_cleanup_s*)ngx_palloc(sizeof(ngx_pool_cleanup_s));
    if(c == nullptr)
    {
        return nullptr;
    }

    if(size)
    {
        c->data = ngx_palloc(size);
        if(c->data == nullptr)
        {
            return nullptr;
        }
    }
    else
    {
        c->data = nullptr;
    }

    c->handler = nullptr;
    c->next = pool->cleanup;
    pool->cleanup = c;

    return c;
}
```

### test_ngx_pool.cpp

```cpp
#include "my_ngx_mem_pool.h"
#include <iostream>
#include <string.h>
using namespace std;

struct stData
{
    char*   ptr;
    FILE*   pfile;
};

void func1(void*p1)
{
    char* p = (char*)p1;
    cout << "Free ptr memory!" << endl;
    free(p);
}

void func2(void* pf1)
{
    FILE* pf = (FILE*)pf1;
    cout << "Close file!" << endl;
    fclose(pf);
}

int main()
{
    // TODO：ngx_create_pool的代码逻辑可以直接实现在mempool的构造函数当中
    ngx_mem_pool mempool;
    if(mempool.ngx_create_pool(512) == nullptr)
    {
        cout << "ngx_create_pool fail!" << endl;
        return -1;
    }

    void* p1 = mempool.ngx_palloc(128); // 从小块内存分配
    if(p1 == nullptr)
    {
        cout << "ngx_palloc 128 bytes fail!" << endl;
        return -1;
    }

    stData* p2 = (stData*)mempool.ngx_palloc(512); // 从大块内存池分配的
    if(p2 == nullptr)
    {
        cout << "ngx_palloc 512 bytes fail!" <<endl;
        return -1;
    }
    p2->ptr = (char*)malloc(12);
    strcpy(p2->ptr, "hello world");
    p2->pfile = fopen("data.txt", "w");

    ngx_pool_cleanup_s* c1 = mempool.ngx_pool_cleanup_add(sizeof(char*));
    c1->handler = func1;
    c1->data = p2->ptr;

    ngx_pool_cleanup_s* c2 = mempool.ngx_pool_cleanup_add(sizeof(FILE*));
    c2->handler = func2;
    c2->data = p2->pfile;

    // TODO: ngx_destory_pool的代码逻辑可以直接实现在mempool析构函数当中
    mempool.ngx_destory_pool(); //1.调用所有的预置的清理函数 2.释放大块内存 3.释放小块内存池所有内存

    return 0;
}
```



## 2.SGI-STL内存池

### my_stl_allocator.h

```cpp
#pragma once

#include <mutex>
#include <cstdlib>
#include <iostream>

/*
 * 移植SGI STL二级空间配置器内存池源码 模板实现
 * 多线程-线程安全的问题：
 * 在nginx内存池中每个线程可以创建一个独立的内存池
 * 而空间配置器是容器使用的，容器产生的对象是很有可能在多个线程中去操作的
 */

// 封装了malloc和free操作，可以设置OOM释放内存的回调函数
template <int _inst>
class __malloc_alloc_template
{
private:
    static void* _S_oom_malloc(size_t);
    static void* _S_oom_realloc(void*, size_t);
    static void(*__malloc_alloc_oom_handler)();

public:
    static void* allocate(size_t __n)
    {
        void* __result = malloc(__n);
        if( 0 == __result) __result = _S_oom_malloc(__n);
        return __result;
    }

    static void deallocate(void* __p, size_t /* __n */)
    {
        free(__p);
    }

    static void* reallocate(void* __p, size_t /* old_sz */, size_t __new_sz)
    {
        void* __result = realloc(__p, __new_sz);
        if (0 == __result) __result = _S_oom_realloc(__p, __new_sz);
        return __result;
    }

    static void(*__set_malloc_handler(void(*__f)()))()
    {
        void(*__old)() = __malloc_alloc_oom_handler;
        __malloc_alloc_oom_handler = __f;
        return(__old);
    }
};

template <int __inst>
void(*__malloc_alloc_template<__inst>::__malloc_alloc_oom_handler)() = nullptr;

template <int __inst>
void*
__malloc_alloc_template<__inst>::_S_oom_malloc(size_t __n)
{
    void(*__my_malloc_handler)();
    void* __result;

    for (;;) {
        __my_malloc_handler = __malloc_alloc_oom_handler;
        if (0 == __my_malloc_handler) { throw std::bad_alloc(); }
        (*__my_malloc_handler)();
        __result = malloc(__n);
        if (__result) return(__result);
    }
}

template <int __inst>
void* __malloc_alloc_template<__inst>::_S_oom_realloc(void* __p, size_t __n)
{
    void(*__my_malloc_handler)();
    void* __result;

    for (;;) {
        __my_malloc_handler = __malloc_alloc_oom_handler;
        if (0 == __my_malloc_handler) { throw std::bad_alloc(); }
        (*__my_malloc_handler)();
        __result = realloc(__p, __n);
        if (__result) return(__result);
    }
}

typedef __malloc_alloc_template<0> malloc_alloc;

template <typename T>
class myallocator
{
public:
    using value_type = T;

    constexpr myallocator() noexcept
    {	// construct default allocator (do nothing)
    }
    constexpr myallocator(const myallocator&) noexcept = default;
    template<class _Other>
    constexpr myallocator(const myallocator<_Other>&) noexcept
    {	// construct from a related allocator (do nothing)
    }

    // 开辟内存
    T* allocate(size_t __n)
    {
        __n = __n * sizeof(T);

        void* __ret = 0;

        if (__n > (size_t)_MAX_BYTES) {
            __ret = malloc_alloc::allocate(__n);
        }
        else {
            _Obj* volatile* __my_free_list
                    = _S_free_list + _S_freelist_index(__n);

            std::lock_guard<std::mutex> guard(mtx);

            _Obj* __result = *__my_free_list;
            if (__result == 0)
                __ret = _S_refill(_S_round_up(__n));
            else {
                *__my_free_list = __result->_M_free_list_link;
                __ret = __result;
            }
        }
        return (T*)__ret;
    }

    // 释放内存
    void deallocate(void* __p, size_t __n)
    {
        if (__n > (size_t)_MAX_BYTES)
        {
            malloc_alloc::deallocate(__p, __n);
        }
        else
        {
            _Obj* volatile*  __my_free_list
                    = _S_free_list + _S_freelist_index(__n);
            _Obj* __q = (_Obj*)__p;

            std::lock_guard<std::mutex> guard(mtx);

            __q->_M_free_list_link = *__my_free_list;
            *__my_free_list = __q;
            // lock is released here
        }
    }

    // 内存扩容&缩容
    void* reallocate(void* __p, size_t __old_sz, size_t __new_sz)
    {
        void* __result;
        size_t __copy_sz;

        if (__old_sz > (size_t)_MAX_BYTES && __new_sz > (size_t)_MAX_BYTES) {
            return(realloc(__p, __new_sz));
        }
        if (_S_round_up(__old_sz) == _S_round_up(__new_sz)) return(__p);
        __result = allocate(__new_sz);
        __copy_sz = __new_sz > __old_sz ? __old_sz : __new_sz;
        memcpy(__result, __p, __copy_sz);
        deallocate(__p, __old_sz);
        return(__result);
    }

    // 对象构造
    void construct(T* __p, const T& val)
    {
        new (__p) T(val);
    }

    // 对象析构
    void destory(T* __p)
    {
        __p->~T();
    }

private:
    enum { _ALIGN = 8 }; // 自由链表是从8字节开始，以8字节为对齐方式，一直扩充到128
    enum { _MAX_BYTES = 128 }; // 内存池最大的chunk块
    enum { _NFREELISTS = 16 }; // 自由链表的个数

    // 每一个chunk块的头信息， _M_free_list_link存储下一个chunk块的地址
    union _Obj
    {
        union _Obj* _M_free_list_link;
        char _M_client_data[1];
    };

    // 已分配的内存chunk块的使用情况
    static char* _S_start_free;
    static char* _S_end_free;
    static size_t _S_heap_size;

    // _S_free_list表示存储自由链表数组的起始地址
    static _Obj* volatile _S_free_list[_NFREELISTS];

    // 内存池基于freelist实现，需要考虑线程安全
    static  std::mutex mtx;

    // 将 __bytes 上调至最邻近的8的倍数
    static size_t _S_round_up(size_t __bytes)
    {
        return (((__bytes) + (size_t)_ALIGN - 1) & ~((size_t)_ALIGN - 1));
    }

    // 返回 _bytes 大小的小额区块位于 free-list 中的编号
    static size_t _S_freelist_index(size_t __bytes)
    {
        return (((__bytes) + (size_t)_ALIGN - 1) / (size_t)_ALIGN - 1);
    }

    // 把分配好的chunk块进行连接
    static void* _S_refill(size_t __n)
    {
        int __nobjs = 20;
        char* __chunk = _S_chunk_alloc(__n, __nobjs);
        _Obj* volatile* __my_free_list;
        _Obj* __result;
        _Obj* __current_obj;
        _Obj* __next_obj;
        int __i;

        if (1 == __nobjs) return(__chunk);
        __my_free_list = _S_free_list + _S_freelist_index(__n);

        /* Build free list in chunk */
        __result = (_Obj*)__chunk;
        *__my_free_list = __next_obj = (_Obj*)(__chunk + __n);
        for (__i = 1; ; __i++) {
            __current_obj = __next_obj;
            __next_obj = (_Obj*)((char*)__next_obj + __n);
            if (__nobjs - 1 == __i) {
                __current_obj->_M_free_list_link = 0;
                break;
            }
            else {
                __current_obj->_M_free_list_link = __next_obj;
            }
        }
        return(__result);
    }

    // 分配自由链表，chunk块
    static char* _S_chunk_alloc(size_t __size, int& __nobjs)
    {
        char* __result;
        size_t __total_bytes = __size * __nobjs;
        size_t __bytes_left = _S_end_free - _S_start_free;

        if (__bytes_left >= __total_bytes) {
            __result = _S_start_free;
            _S_start_free += __total_bytes;
            return(__result);
        }
        else if (__bytes_left >= __size) {
            __nobjs = (int)(__bytes_left / __size);
            __total_bytes = __size * __nobjs;
            __result = _S_start_free;
            _S_start_free += __total_bytes;
            return(__result);
        }
        else {
            size_t __bytes_to_get =
                    2 * __total_bytes + _S_round_up(_S_heap_size >> 4);
            // Try to make use of the left-over piece.
            if (__bytes_left > 0) {
                _Obj* volatile* __my_free_list =
                        _S_free_list + _S_freelist_index(__bytes_left);

                ((_Obj*)_S_start_free)->_M_free_list_link = *__my_free_list;
                *__my_free_list = (_Obj*)_S_start_free;
            }
            _S_start_free = (char*)malloc(__bytes_to_get);
            if (nullptr == _S_start_free) {
                size_t __i;
                _Obj* volatile* __my_free_list;
                _Obj* __p;
                // Try to make do with what we have.  That can't
                // hurt.  We do not try smaller requests, since that tends
                // to result in disaster on multi-process machines.
                for (__i = __size;
                     __i <= (size_t)_MAX_BYTES;
                     __i += (size_t)_ALIGN) {
                    __my_free_list = _S_free_list + _S_freelist_index(__i);
                    __p = *__my_free_list;
                    if (0 != __p) {
                        *__my_free_list = __p->_M_free_list_link;
                        _S_start_free = (char*)__p;
                        _S_end_free = _S_start_free + __i;
                        return(_S_chunk_alloc(__size, __nobjs));
                        // Any leftover piece will eventually make it to the
                        // right free list.
                    }
                }
                _S_end_free = 0;	// In case of exception.
                _S_start_free = (char*)malloc_alloc::allocate(__bytes_to_get);
                // This should either throw an
                // exception or remedy the situation.  Thus we assume it
                // succeeded.
            }
            _S_heap_size += __bytes_to_get;
            _S_end_free = _S_start_free + __bytes_to_get;
            return(_S_chunk_alloc(__size, __nobjs));
        }
    }
};

template <typename T>
char* myallocator<T>::_S_start_free = nullptr;

template <typename T>
char* myallocator<T>::_S_end_free = nullptr;

template <typename T>
size_t myallocator<T>::_S_heap_size = 0;

template <typename T>
typename myallocator<T>::_Obj* volatile myallocator<T>::_S_free_list[_NFREELISTS] =
        { nullptr, nullptr ,nullptr ,nullptr ,nullptr ,nullptr ,nullptr ,nullptr ,nullptr ,nullptr ,nullptr ,nullptr ,nullptr ,nullptr ,nullptr ,nullptr };

template <typename T>
std::mutex myallocator<T>::mtx;
```



### test_stl_allocator.cpp

```cpp
#include "my_stl_allocator.h"
#include <vector>
using namespace std;

int main()
{
    vector<int, myallocator<int>> vec;

    for (int i = 0; i < 100; ++i)
    {
        int data = rand() % 1000;
        vec.push_back(data);
    }

    for (int val : vec)
    {
        cout << val << " ";
    }
    cout<<endl;

    return 0;
}
```

