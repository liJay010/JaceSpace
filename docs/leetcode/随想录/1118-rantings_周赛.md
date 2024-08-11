# 周赛rantings

https://zerotrac.github.io/leetcode_problem_rating/#/

# 1600-1700

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



### [1319. 连通网络的操作次数](https://leetcode.cn/problems/number-of-operations-to-make-network-connected/)

**1633**---并查集

```cpp
class Solution {
public:
    int makeConnected(int n, vector<vector<int>>& connections) {
        vector<int> father(n);
        for(int i = 0;i < n;i++) father[i] = i;
        function<int(int)> find =[&](int a){
            return a == father[a] ? a : father[a] = find(father[a]);
        };
        function<void(int,int)> unions =[&](int a ,int b){
            int fa = father[a];
            int fb = father[b];
            if(fa == fb) return;
            father[fa] = fb;
        };
        int count = 0;
        for(auto x:connections)
        {
            if(find(x[0]) != find(x[1])) unions(x[0],x[1]);
            else count++;
        }
        unordered_set<int> uset;
        for(int i = 0;i < n ;i++) 
        {
            if(uset.find(find(i)) == uset.end()) uset.insert(find(i));
        }

        return count >= uset.size() - 1 ? uset.size() - 1: -1;
    }
};
```



### [2344. 使数组可以被整除的最少删除次数](https://leetcode.cn/problems/minimum-deletions-to-make-array-divisible/)

**1640**---数学，最大公因数

```cpp
class Solution {
    int gcd(int a, int b) 
    {
        return b == 0 ? a : gcd(b, a% b);
    }
public:
    int minOperations(vector<int>& nums, vector<int>& numsDivide) {
        int g = numsDivide[0];
        for (auto &num: numsDivide) g = gcd(g, num);
        sort(nums.begin(), nums.end());
        for (int i = 0; i < nums.size(); i ++) {
            int &num = nums[i];
            // if(num > g) break;
            if (g % num == 0) return i;
        }
        return -1;
    }
};
```



### [1367. 二叉树中的链表](https://leetcode.cn/problems/linked-list-in-binary-tree/)

**1649**---二叉树

```cpp
class Solution {
    //判断是否一直连续相等
    bool find_true(ListNode* head, TreeNode* root)
    {
        if(head && !root) return false;
        if(!head) return true;
        if(head->val != root->val) return false;
        bool l = find_true(head->next, root->left);
        bool r = find_true(head->next, root->right);
        return l || r;
    }
public:
    bool isSubPath(ListNode* head, TreeNode* root) {
        if(head && !root) return false;
        if(!head) return true;
        if(head->val == root->val)
        {
            bool l = find_true(head->next, root->left);
            bool r = find_true(head->next, root->right);
            if(l || r) return true;
        }
        bool l = isSubPath(head, root->left);
        bool r = isSubPath(head, root->right);
        return l || r;
    }
};
```



### [1249. 移除无效的括号](https://leetcode.cn/problems/minimum-remove-to-make-valid-parentheses/)

**1657**---字符串

```cpp
class Solution {
public:
    string minRemoveToMakeValid(string s) {
        unordered_set<int> res;
        vector<int> res_left;
        //正序
        int left = 0, right = 0;
        for(int i = 0;i < s.size() ;i++)
        {
            if(s[i] == '(') 
            {
                left++;
                res_left.push_back(i);
            }
            else if(s[i] == ')') 
            {
                if(right < left) right++;
                else res.insert(i);
            }
        }
        int cur = left - right;
        for(int i = res_left.size() - cur;i < res_left.size();i++) res.insert(res_left[i]);
        string result = "";
        for(int i = 0; i < s.size();i++)
        {
            if(res.find(i) == res.end()) result.push_back(s[i]);
        }

        return result;
    }
};
```



### [1254. 统计封闭岛屿的数目](https://leetcode.cn/problems/number-of-closed-islands/)

**1658**---图 --深度优先搜索

```cpp
class Solution {
public:
    int closedIsland(vector<vector<int>>& grid) {
        //dfs
        int n = grid.size(),m = grid[0].size();
        function<bool(int, int)> dfs = [&](int i,int j)
        {
            if(i == 0 || j == 0 || i == n - 1 || j == m - 1) return grid[i][j] == 0 ? false : true;
            if(grid[i][j] == 0)
            {
                grid[i][j] = 1;
                int r1 = dfs(i + 1, j);
                int r2 = dfs(i - 1, j);
                int r3 = dfs(i , j + 1);
                int r4 = dfs(i , j - 1);
                return r1 && r2 && r3 && r4;
            }
            return true;
        };
        int count = 0;
        for(int i = 0; i < n ; i++)
        {
            for(int j = 0; j < m ;j++)
            {
                if(grid[i][j] == 0) dfs(i, j) ? count++ : count;
            }
        }
        return count;
    }
};
```

### [2593. 标记所有元素后数组的分数](https://leetcode.cn/problems/find-score-of-an-array-after-marking-all-elements/)

**1665**---特殊数据结构

```cpp
class Solution {
public:
    long long findScore(vector<int>& nums) {
        set<pair<int,int>> nums_map;
        for(int i = 0; i < nums.size();i++)  nums_map.insert({nums[i],i});
        long long res = 0;
        while(nums_map.size())
        {
            pair<int,int> t;
            for(auto x:nums_map)
            {
                t = x;
                break;
            }
            res += t.first;
            nums_map.erase(t);
            if(t.second > 0) nums_map.erase(pair<int,int>(nums[t.second - 1],t.second - 1));
            if(t.second < nums.size() - 1) nums_map.erase(pair<int,int>(nums[t.second + 1],t.second + 1));
        }
        return res;
    }
};
```



### [1339. 分裂二叉树的最大乘积](https://leetcode.cn/problems/maximum-product-of-splitted-binary-tree/)

**1674**---二叉数

```cpp
class Solution {
    long long MAXS;
    int all_count;
    const int MX = 1e9 + 7;
    int find_max(TreeNode* root)
    {
        if(!root) return 0;
        int left = find_max(root->left);
        int right = find_max(root->right);
        long long res_left = ((long long)(all_count - left) * left);
        long long res_right = ((long long)(all_count - right) * right);
        MAXS = max({MAXS,res_left,res_right});
        return root->val + left + right;
    }
public:
    int maxProduct(TreeNode* root) {
        MAXS = 0;
        function<int (TreeNode* )> add = [&](TreeNode* root)
        {
            if(!root) return 0;
            return (add(root->left)+add(root->right) + root->val) % MX;
        };
        all_count = add(root);
        find_max(root);
        return MAXS % MX;
    }
};
```

### [2280. 表示一个折线图的最少线段数](https://leetcode.cn/problems/minimum-lines-to-represent-a-line-chart/)

**1680**---数学类

```cpp
class Solution {
public:
    int minimumLines(vector<vector<int>>& stockPrices) {
        if(stockPrices.size() < 3) return stockPrices.size() - 1;
        sort(stockPrices.begin(),stockPrices.end(),[&](const vector<int> &a,const vector<int> &b)
        {return a[0] < b[0];});
        int count = 1;
        for(int i = 2;i < stockPrices.size();i++)
        {
            if((long)(stockPrices[i][0] - stockPrices[i - 1][0]) * (stockPrices[i - 1][1] - stockPrices[i - 2][1])   != (long)(stockPrices[i][1] - stockPrices[i - 1][1]) * (stockPrices[i - 1][0] - stockPrices[i - 2][0])) 
            {
                count++;
            }
        }
        return count;
    }
};
```



### [2074. 反转偶数长度组的节点](https://leetcode.cn/problems/reverse-nodes-in-even-length-groups/)

 **1685**---链表

```cpp
class Solution {
public:
    ListNode* reverseEvenLengthGroups(ListNode* head) {
        vector<ListNode*> res;
        ListNode* cur = head;
        int sum = 1;
        while(cur)
        {
            int n = sum;
            int cnt = 0;
            while(cur && n--)
            {
                res.push_back(cur);
                cur = cur->next;
                cnt++;
            }
            if(cnt % 2 == 0)reverse(res.end() - cnt ,res.end());
            sum++;
        }
        for(int i = 0;i < res.size() - 1 ;i++) res[i]->next = res[i + 1];
        res.back()->next = nullptr;
        return res[0];
    }
};
```

### [1419. 数青蛙](https://leetcode.cn/problems/minimum-number-of-frogs-croaking/)

**1689**---字符串，记数

计算青蛙的个数，像俄罗斯方块一样，“croak”满了需要消去，最后计算"c"的最大值就是青蛙数量

```cpp
class Solution {
public:
    int minNumberOfFrogs(string croakOfFrogs) {
        int counts[5] = {0};
        int res = 0;
        //遍历函数，记数 ，若前面字符大于后面字符数量则返回-1，若满足了则清除，计算最大的counts[0]第一声
        for(int k = 0; k < croakOfFrogs.size(); k++)
            {
                if(croakOfFrogs[k] == 'c') counts[0]++;
                if(croakOfFrogs[k] == 'r') counts[1]++;
                if(croakOfFrogs[k] == 'o') counts[2]++;
                if(croakOfFrogs[k] == 'a') counts[3]++;
                if(croakOfFrogs[k] == 'k') counts[4]++;
                for(int i = 1; i < 5; i++)
                    if(counts[i] > counts[i - 1] ) return -1;
                res = max(res,counts[0] - counts[4]);
            }
        //最后叫声数量不同则 -1
        for(int i = 1; i < 5; i++)
            if(counts[i] != counts[i - 1] ) return -1;
        return res;
    }
};

```



### [829. 连续整数求和](https://leetcode.cn/problems/consecutive-numbers-sum/)

**1694**---数学问题

```cpp
class Solution {
public:
    int consecutiveNumbersSum(int n) {
        // 求的是能被 n 整除的所有奇数
        int count = 0;
        for(int i = 1; i <= sqrt(n) ; i += 1)
        {
            if(n % i == 0)
            {
                if(i % 2 == 1) count++; // i 能被整除
                if((n / i % 2) == 1) count++; // n / i 为奇数
                if(i * i == n && i % 2 == 1) count--; //多加了
            }
        }
        return count;
    }
};
```



### [1054. 距离相等的条形码](https://leetcode.cn/problems/distant-barcodes/)

**1701**---优先级队列

```cpp
class Solution {
    class cmp
    {
    public:
        bool operator()(const pair<int,int> &a ,const pair<int,int> &b)
        {
            return a.second < b.second;
        }
    };
public:
    vector<int> rearrangeBarcodes(vector<int>& barcodes) {
        priority_queue<pair<int,int>,vector<pair<int,int>>,cmp> que;
        unordered_map<int,int> umap;
        for(int x: barcodes) umap[x]++;
        for(auto x:umap) que.push(x);
        //优先选择最多的元素
        vector<int> res(barcodes.size());
        int pre = INT_MAX;
        for(int i = 0; i < barcodes.size();i++)
        {
            auto x = que.top();
            que.pop();
            if(x.first == pre)
            {
                auto x2 = que.top();
                que.pop();
                que.push(x);
                x = x2;
            }
            res[i] = x.first;
            if(x.second > 1) que.push({x.first,x.second - 1});
            pre = res[i];
        }
        return res;
    }
};
```

### [923. 三数之和的多种可能](https://leetcode.cn/problems/3sum-with-multiplicity/)

**1710**---双指针，阶乘

```cpp
class Solution {
public:
    int threeSumMulti(vector<int>& arr, int target) {
        sort(arr.begin(),arr.end());
        function<long long(int,int)> C = [&](int n,int r)
        {
            long long zi = 1;
            r = min(r,n-r);
            int lr = r;
            while(lr--) zi *= (n--);
            while(r) zi /= (r--);
            return zi;
        };
        int MAX = 1e9 + 7;
        map<int,int> arr_map;
        for(int x:arr)arr_map[x]++;
        vector<pair<int,int>> vec;
        for(auto x:arr_map) vec.push_back(x);
        int res = 0;
        //出现 A B C 不相同
        for(int i = 0; i < vec.size();i++)
        {
            int left = i,right = vec.size() - 1;
            while(left <= right)
            {
                if(vec[i].first + vec[left].first + vec[right].first == target) 
                    {
                        //三数不同
                        if((i != left) && (i != right) && (left != right))
                        	res = (res + ((long long)vec[i].second * vec[left].second * vec[right].second)) % MAX;
                        //三数相同 排列组合 C(vec[i].second,3)
                        else if((i == left) && (i == right) &&(left == right))
                        {
                            if(vec[i].second >= 3)res = (C(vec[i].second,3) + res) % MAX;
                        }
                        else{
                                //两数相同
                                if(left == i && vec[i].second >= 2)
                                {
                                    res = (C(vec[i].second,2) * vec[right].second + res) % MAX; 
                                }
                                else if(right == i && vec[i].second >= 2)
                                {
                                    res = (C(vec[i].second,2) * vec[left].second + res) % MAX;
                                }
                                else if(right == left && vec[left].second >= 2)
                                {
                                    res = (C(vec[right].second,2) * vec[i].second + res) % MAX;
                                }
                        }
                        right--;
                        left++;
                    }
                else if(vec[i].first + vec[left].first + vec[right].first > target) right--;
                else left++;
            }
        }

        return res;
    }
};
```



### [2563. 统计公平数对的数目](https://leetcode.cn/problems/count-the-number-of-fair-pairs/)

**1720---排序+二分查找**

二分查找函数：

lower_bound()返回值是一个迭代器,返回指向**大于等于**key的第一个值的位置

upper_bound()返回值是一个迭代器,返回指向**大于**key的第一个值的位置

找到返回该数字的地址，不存在则返回end。通过返回的地址减去起始地址begin,得到找到数字在数组中的下标。

```cpp
class Solution {
public:
    long long countFairPairs(vector<int>& nums, int lower, int upper) {
        sort(nums.begin(), nums.end());
        long long res = 0LL;
        for (auto it = nums.begin(); it != nums.end(); ++it) {
            int minNum = lower - *it;
            int maxNum = upper - *it;
            auto x = lower_bound(it + 1, nums.end(), minNum);
            auto y = upper_bound(x, nums.end(), maxNum);
            res += y - x;
        }
        return res;
    }
};
```



### [1014. 最佳观光组合](https://leetcode.cn/problems/best-sightseeing-pair/)

**1730**---动态规划

```cpp
class Solution {
public:
    int maxScoreSightseeingPair(vector<int>& values) {
        int res = 0;
        vector<int> dp(values.size(),0);
        for(int i = 1; i < values.size();i++)
        {
            dp[i] = max(values[i] + values[i - 1] - 1, dp[i - 1] - values[i - 1] + values[i] - 1);
            res = max(res,dp[i]);
        }
        return res;
    }
};
```

### [1079. 活字印刷***](https://leetcode.cn/problems/letter-tile-possibilities/)

**1740---回溯--深搜（值得刷）**

对一个数组进行回溯深搜

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



### [1297. 子串的最大出现次数**](https://leetcode.cn/problems/maximum-number-of-occurrences-of-a-substring/)

**1748**---哈希表,只需要考虑短串即可，因为长串包含短串，所以maxSize参数无用

```cpp
class Solution {
public:
    int maxFreq(string s, int maxLetters, int minSize, int maxSize) {
        unordered_map<string,int> umap;
        int res = 0;
        for( int i = 0 ; i + minSize <= s.size(); i++)
        {
            string sub = s.substr(i,minSize);
            unordered_set<char> uset(sub.begin(),sub.end());
            if(uset.size() <= maxLetters) res = max(res , ++umap[sub]);
        }
        return res;
    }
};
```

### [1027. 最长等差数列***](https://leetcode.cn/problems/longest-arithmetic-subsequence/)

**1758---动态规划**

```cpp
//dp[i][j]为以i结束的差为 j 的数量
class Solution {
public:
    int longestArithSeqLength(vector<int>& nums) {
        int dp[nums.size()][1001];
        memset(dp,0,sizeof(dp));
        int res = 0;
        for(int i = 1; i < nums.size() ;i++)
        {
            for(int j = 0; j < i ;j++)
            {
                int count = nums[j] - nums[i] + 500;
                dp[i][count] = dp[j][count] + 1;
                res = max(res,dp[i][count]);
            }
        }
        return res + 1;
    }
};

```

### [2498. 青蛙过河 II](https://leetcode.cn/problems/frog-jump-ii/)

**1759---数组**

```cpp
class Solution {
public:
    int maxJump(vector<int>& stones) {
        int res = 0;
        vector<int> step;
        for(int i = 0; i < stones.size();i += 2) step.push_back(stones[i]);
        int cur = stones.size() % 2 == 1 ? stones.size() - 2 : stones.size() - 1;
        for(int i = cur; i >= 0;i -= 2) step.push_back(stones[i]);
        step.push_back(stones[0]);
        for(int i = 1; i < step.size();i++) res = max(res,abs(step[i] - step[i-1]));
        return res;
    }
};
```



# 周赛

## 352场

### 6909.最长奇偶子数组

---双指针

```cpp
class Solution {
public:
    int longestAlternatingSubarray(vector<int>& nums, int threshold) {
        int res = 0, left = 0, right = 0;
        while(left < nums.size() && right < nums.size())
        {
            if(nums[left] % 2 == 0 && nums[left] <= threshold)
            {
                right = left + 1;
                while(right < nums.size() && nums[right] <= threshold && ((nums[right] % 2)^(nums[right - 1] % 2))) right++;
                res = max(res,right - left); 
                left = right - 1;
            }
            left++;
        }
        return res;
    }
};
```

### 6916.和等于目标值的质数对

----数学，质数问题

```cpp
class Solution {
public:
    vector<vector<int>> findPrimePairs(int n) {
        //求出所有质数
        vector<bool> zhishu(n + 1,true);
        vector<int> zhi;
        zhishu[0] = false;
        zhishu[1] = false;
        for(int i = 2; i <= n ;i++)
        {
            if(zhishu[i])
            {
                for(int k = 2; i * k <= n;k++) zhishu[i * k] = false;
            }
        }
        for(int i = 2; i < n; i++) if(zhishu[i]) zhi.push_back(i);
        unordered_set<int> uset_zhi(zhi.begin(),zhi.end());
        vector<vector<int>> res;
        int mx = 0;
        for(int i = 0; i < zhi.size() && zhi[i] <= n / 2; i++)
        {
            if(uset_zhi.find(n-zhi[i]) != uset_zhi.end()) res.push_back({zhi[i],n - zhi[i]});
        }
        
        return res;
    }
};
```



