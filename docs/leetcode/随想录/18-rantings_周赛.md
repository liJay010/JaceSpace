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

