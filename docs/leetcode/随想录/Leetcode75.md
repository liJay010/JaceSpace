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

