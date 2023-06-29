# 周赛rantings

https://zerotrac.github.io/leetcode_problem_rating/#/

# 1600-1650

### [1864. 构成交替字符串需要的最小交换次数](https://leetcode.cn/problems/minimum-number-of-swaps-to-make-the-binary-string-alternating/)

**1600** --- 字符串  

对比可能的情况，然后记数

```cpp
class Solution {
public:
    int minSwaps(string s) {
        function<string(char)> createc = [&](char start)
        {
            string res(s.size(),start);
            for(int i = 1; i < res.size();i += 2) res[i] = start == '0' ? '1': '0';
            return res;
        };
        function<int(string)> finds = [&](string res)
        {
            int r0 = 0, r1 = 0;
            for(int i = 0; i < res.size();i++)
            {
                if(res[i] != s[i]) s[i] == '1'? r0++:r1++;
            } 
            return r0 == r1 ? r0 : -1;
        };
        string start0 = createc('0');
        string start1 = createc('1');

        int r1 = finds(start0);
        int r2 = finds(start1);
        if(r1== -1 || r2 == -1) return max(r1,r2);
        return min(r1,r2);
    }
};
```

### [1524. 和为奇数的子数组数目](https://leetcode.cn/problems/number-of-sub-arrays-with-odd-sum/)

**1610**---动态规划

需要记录以i结束的奇偶和的子序列数量，最后让奇数和

```cpp
class Solution {
public:
    int numOfSubarrays(vector<int>& arr) {
        //奇 + 偶 = 奇
        int MAXS = 1e9 + 7;
        vector<int> is_now_ji(arr.size(),0); // 以i 结尾和为奇数个数
        vector<int> is_now_ou(arr.size(),0); // 以i 结尾和为偶数个数
        is_now_ji[0] = arr[0] % 2 == 1 ? 1 : 0;
        is_now_ou[0] = arr[0] % 2 == 0 ? 1 : 0;
        for(int i = 1; i < arr.size();i++)
        {
            if(arr[i] % 2 == 0) 
            {
                is_now_ou[i] = (is_now_ou[i - 1] + 1) % MAXS;
                is_now_ji[i] = is_now_ji[i - 1];
            }
            else
            {
                is_now_ou[i] = is_now_ji[i - 1];
                is_now_ji[i] = (is_now_ou[i - 1] + 1) % MAXS;
            }
        }
        int sum = 0;
        for(int x:is_now_ji) sum = (sum + x) % MAXS;
        return sum;

    }
};
```



### [2425. 所有数对的异或和](https://leetcode.cn/problems/bitwise-xor-of-all-pairings/)

**1622---位运算**

异或的性质，考虑异或了几次

```cpp
class Solution {
public:
    int xorAllNums(vector<int>& nums1, vector<int>& nums2) {
        if(nums1.size() % 2 == 0 && nums2.size() % 2 == 0) return 0;
        int res = 0 , res2 = 0;
        for(int x:nums1) res ^= x;
        for(int x:nums2) res2 ^= x;
        if(nums1.size() % 2 != 0 && nums2.size() % 2 != 0) return res ^ res2;
        return nums1.size() % 2 == 0 ? res: res2;
    }
};
```

