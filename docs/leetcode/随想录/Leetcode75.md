# Leetcode75

## 数组 / 字符串

### [1071. 字符串的最大公因子](https://leetcode.cn/problems/greatest-common-divisor-of-strings/)

```cpp
class Solution {
public:
    string gcdOfStrings(string str1, string str2) {
        int shorts = str1.size() < str2.size() ? str1.size() : str2.size();
        while(shorts)
        {
            if(str1.size() % shorts == 0 && str2.size() % shorts == 0)
            {
                bool ist = true;
                int i = 0;
                for( i = 0; i < str1.size();i+=shorts)
                {
                    if(str1.substr(i,shorts) != str2.substr(0,shorts))
                    {
                        ist = false;
                        break;
                    }
                }
                for(i = 0; i < str2.size();i+=shorts)
                {
                    if(str2.substr(i,shorts) != str1.substr(0,shorts)) 
                    {
                        ist = false;
                        break;
                    }
                }
                if(ist) return str2.substr(0,shorts);
            }
            shorts--;
        }
        return "";
    }
};
```

### [334. 递增的三元子序列](https://leetcode.cn/problems/increasing-triplet-subsequence/)

```cpp
class Solution {
public:
    bool increasingTriplet(vector<int>& nums) {
        long long MAX = 1e16;
        vector<long long> res(3,MAX);
        for(auto x:nums)
        {
            int i = 2;
            while(i >= 0 && res[i] >= x) i--;
            res[i + 1] = x;
            if(res[0] != MAX && res[1] != MAX && res[2] != MAX) return true;
        }
        return false;
    }
};
```



### [443. 压缩字符串](https://leetcode.cn/problems/string-compression/)

```cpp
class Solution {
public:
    int compress(vector<char>& chars) {
        int res = 0 , r = 1, ch = chars[0] ,count = 1;
        chars.push_back(' ');
        while(r < chars.size())  
        {
            if(ch == chars[r]) count++;
            if(ch != chars[r] || r == chars.size() - 1)
            {
                if(count == 1) 
                {
                    chars[res] = ch;
                    res++;
                    ch = chars[r];
                }
                else 
                {
                    chars[res++] = ch;
                    for(auto x:to_string(count))
                    {
                        chars[res++] = x;
                    }
                    count = 1;
                    ch = chars[r];
                }
            }
            r++;
        }
        return res;
    }
};
```



## 双指针/滑动窗口

### [1679. K 和数对的最大数目](https://leetcode.cn/problems/max-number-of-k-sum-pairs/)

```cpp
class Solution {
public:
    int maxOperations(vector<int>& nums, int k) {
        sort(nums.begin(),nums.end());
        int left = 0, right = nums.size() - 1;
        int res = 0;
        while(left < right)
        {
            if(nums[left] + nums[right] == k)
            {
                left++;
                right--;
                res++;
            }
            else if(nums[left] + nums[right] < k) left++;
            else right--;
        }
        return res;
    }
};
```



### [643. 子数组最大平均数 I](https://leetcode.cn/problems/maximum-average-subarray-i/)

```cpp
class Solution {
public:
    double findMaxAverage(vector<int>& nums, int k) {
        if(nums.size() < k) return 0;
        double res = 0 , maxs = INT_MIN;
        int left = 0,right = 0;
        while(right < k) res += nums[right++];
        maxs = max(maxs, res);
        while(right < nums.size())
        {
            res += nums[right++];
            res -= nums[left++];
            maxs = max(maxs, res);
        }
        return maxs / k;
    }
};
```

### [1456. 定长子串中元音的最大数目](https://leetcode.cn/problems/maximum-number-of-vowels-in-a-substring-of-given-length/)

```cpp
class Solution {
public:
    int maxVowels(string s, int k) {
        unordered_set<char> uset = {'a','e','i','o','u'};
        int maxs = 0, count = 0 , left = 0,right = 0;
        while(right < k && right < s.size())
        {
            if(uset.find(s[right++]) != uset.end()) count++;
        }
        maxs = max(maxs,count);
        while(right < s.size())
        {
            if(uset.find(s[left++]) != uset.end()) count--;
            if(uset.find(s[right++]) != uset.end()) count++;
            maxs = max(maxs,count);
        }
        return maxs;
    }
};
```



### [1493. 删掉一个元素以后全为 1 的最长子数组](https://leetcode.cn/problems/longest-subarray-of-1s-after-deleting-one-element/)（和下一题相似）

```cpp
class Solution {
public:
    int longestSubarray(vector<int>& nums) {
        int left=0 ,right = 0, res=0 ,k = 1; 
        while(left < nums.size() && right < nums.size()) {
            if(nums[right] || k ) nums[right++]? : k--;
            else nums[left++]? : right++;
            res = max(res , right - left - 1);
            }
        return res;
    }
};
```

### [1004. 最大连续1的个数 III](https://leetcode.cn/problems/max-consecutive-ones-iii/)

```cpp
class Solution {
public:
    int longestOnes(vector<int>& nums, int k) {
        int left=0 ,right = 0, res=0; 
        while(left < nums.size() && right < nums.size()) {
            if(nums[right] || k ) nums[right++]? : k--;
            else nums[left++]? : right++;
            res = max(res , right - left);
            }
        return res;
    }
};
```

