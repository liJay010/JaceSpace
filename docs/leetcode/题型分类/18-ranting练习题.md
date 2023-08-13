# ranting-练习题目

### [1079. 活字印刷](https://leetcode.cn/problems/letter-tile-possibilities/)

深搜 -- 方法掌握

```cpp
class Solution {
public:
    int numTilePossibilities(string tiles) {
        int nums[26] = {0};
        for(char x:tiles) nums[x - 'A']++;
        int res = 0;
        function<void()> dfs = [&]()
        {
            for(int j=0;j < 26;j++)
            {
                if(nums[j])
                {
                    nums[j]--;
                    res++;
                    dfs();
                    nums[j]++;
                }
            }
        };
        dfs();
        return res;
    }
    
};
```



### [1027. 最长等差数列](https://leetcode.cn/problems/longest-arithmetic-subsequence/)

dp

```cpp
class Solution {
public:
    int longestArithSeqLength(vector<int>& nums) {
        //dp[i][j] 为以 nums[i] 结尾 公差为 j - 500 的长度
        int dp[nums.size()][1001];
        memset(dp,0,sizeof(dp));
        int res = 0;
        for(int i = 1; i < nums.size(); i++)
        {
            for(int j = 0; j < i ; j++)
            {
                int count = nums[i] - nums[j] + 500;
                dp[i][count] = dp[j][count] + 1;
                res = max(res,dp[i][count]);
            }
        }
        return res + 1;
    }
};
```









## 值得一刷

打*号说明当时没做出来

### [1079. 活字印刷](https://leetcode.cn/problems/letter-tile-possibilities/)

### [1027. 最长等差数列*](https://leetcode.cn/problems/longest-arithmetic-subsequence/)