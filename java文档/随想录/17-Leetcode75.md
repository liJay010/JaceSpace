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



## 哈希

### [1657. 确定两个字符串是否接近](https://leetcode.cn/problems/determine-if-two-strings-are-close/)

第一个，word1中出现的字符在word2中都出现。

第二个，字符出现的频次数相等。比如，对于word1中字符出现次数从小到大排序为531，那么word2中字符出现的次数从小到大也必须是531。无需出现的次数对应的字符相同。

```cpp
class Solution {
public:
    bool closeStrings(string word1, string word2) {
        int sz1 = word1.size(), sz2 = word2.size();
        if (sz1 != sz2) return false;
        vector<int> rc1(26, 0), rc2(26, 0);
        for (int i = 0; i < sz1; ++i) {
            rc1[word1[i] - 'a']++;
            rc2[word2[i] - 'a']++;
        }
        for (int i = 0; i < 26; i++) {
            if (rc1[i] == 0 && rc2[i] != 0 || rc1[i] != 0 && rc2[i] == 0) return false;
        }
        sort(rc1.begin(), rc1.end());
        sort(rc2.begin(), rc2.end());
        return rc1 == rc2;
}
};
```



### [2352. 相等行列对](https://leetcode.cn/problems/equal-row-and-column-pairs/)

```cpp
class Solution {
public:
    int equalPairs(vector<vector<int>>& grid) {
        vector<vector<int>> grid2 = grid;
        int res = 0;
        for(int i = 0; i < grid2.size();i++)
            for(int j = i + 1; j < grid2[0].size();j++)
                swap(grid2[i][j],grid2[j][i]);
        for(int i = 0; i < grid.size();i++)
            for(int j = 0; j < grid2.size();j++)
                if(grid[i] == grid2[j]) res++;
        return res;
    }
};
```



## 栈&队列

### [2390. 从字符串中移除星号](https://leetcode.cn/problems/removing-stars-from-a-string/)

```cpp
class Solution {
public:
    string removeStars(string s) {
        string st = "";
        int t = 0;
        while(t < s.size())
        {
            if(s[t]== '*' && !st.empty()) st.pop_back();
            else st.push_back(s[t]);
            t++;
        }
        return st;
    }
};
```



### [649. Dota2 参议院](https://leetcode.cn/problems/dota2-senate/)

```cpp
class Solution {
public:
    string predictPartyVictory(string senate) {
        queue<int> r, d;
        for (int i = 0; i < senate.size(); ++i) {
            if (senate[i] == 'R') {
                r.push(i);
            } else {
                d.push(i);
            }
        }
        while (!r.empty() && !d.empty()) {
            if (r.front() < d.front()) {
                d.pop();
                r.push(r.front() + senate.size());
                r.pop();
            } else {
                r.pop();
                d.push(d.front() + senate.size());
                d.pop();
            }
        }
        return r.empty() ? "Dire" : "Radiant";
    }
};

```



## 链表

### [2130. 链表最大孪生和](https://leetcode.cn/problems/maximum-twin-sum-of-a-linked-list/)

```cpp
class Solution {
public:
    ListNode* deleteMiddle(ListNode* head) {
        ListNode* pre_head = new ListNode(0,head);
        ListNode* slow = pre_head;
        ListNode* fast = pre_head;
        while(fast->next && fast->next->next)
        {
            slow = slow->next;
            fast = fast->next->next;
        }
        slow->next = slow->next->next;
        return pre_head->next;
    }
};
```

### [2130. 链表最大孪生和](https://leetcode.cn/problems/maximum-twin-sum-of-a-linked-list/)

```cpp
class Solution {
public:
    int pairSum(ListNode* head) {
        stack<int> st;
        ListNode* slow = head;
        ListNode* fast = head;
        st.push(head->val);
        while(fast->next && fast->next->next)
        {
            slow = slow->next;
            fast = fast->next->next;
            st.push(slow->val);
        }
        slow = slow->next;
        int res = 0;
        while(slow)
        {

            res = max(res,slow->val + st.top());
            st.pop();
            slow = slow->next;
        }
        return res;
    }
};
```

## 二叉树

### 深搜

### [872. 叶子相似的树](https://leetcode.cn/problems/leaf-similar-trees/)

```cpp
class Solution {
public:
    bool leafSimilar(TreeNode* root1, TreeNode* root2) {
        vector<int> t1,t2;
        function<void(TreeNode*,vector<int> &)> search = [&](TreeNode* root,vector<int> &t)
        {
            if(!root) return ;
            if(!root->left && !root->right) t.push_back(root->val);
            search(root->left,t);
            search(root->right,t);
        };
        search(root1,t1);
        search(root2,t2);
        return t1 == t2;
    }
};
```

### [1448. 统计二叉树中好节点的数目](https://leetcode.cn/problems/count-good-nodes-in-binary-tree/)

```cpp
class Solution {
public:
    int goodNodes(TreeNode* root) {
        int count = 0;
        function<void(TreeNode*,int)> search = [&](TreeNode* root,int maxs)
        {
            if(!root) return;
            maxs= max(maxs,root->val);
            if(maxs == root->val) count++;
            search( root->left, maxs);
            search(root->right, maxs);
        };
        search(root,INT_MIN);
        return count;
    }
};
```



### [1372. 二叉树中的最长交错路径](https://leetcode.cn/problems/longest-zigzag-path-in-a-binary-tree/)

```cpp
class Solution {
public:
    int longestZigZag(TreeNode* root) {
        int res = 0;
        function<void(TreeNode* ,int,int)> search = [&](TreeNode* root,int l,int r)
        {
            if(!root) return;
            res = max({res,l,r});
            search(root->left,r + 1,0);
            search(root->right,0,l + 1);
        };
        search(root,0,0);
        return res;
    }
};
```

## 广搜

### [1926. 迷宫中离入口最近的出口](https://leetcode.cn/problems/nearest-exit-from-entrance-in-maze/)

```cpp
class Solution {
public:
    int nearestExit(vector<vector<char>>& maze, vector<int>& entrance) {
        // 思路：从入口开始按轮BFS，遇到邻居为“.”则入队，并记录轮数
        // 结束条件时，邻居为边缘格子，返回轮数
        // 若BFS结束也没有找到出口，返回-1

        const int m = maze.size();
        const int n = maze[0].size();
        const int dr[4] = {0, 0, 1, -1};
        const int dc[4] = {1, -1, 0, 0};
        queue<pair<int, int>> que;

        // 初始化
        int erow = entrance[0], ecol = entrance[1];
        que.emplace(erow, ecol);
        maze[erow][ecol] = '-';  // 表示已经搜索过

        // 按轮BFS
        int epoch = 0;
        while (!que.empty()) {
            int counter = que.size();
            epoch++;
            // 一轮
            for (int k = 0; k < counter; k++) {
                auto [r, c] = que.front();
                que.pop();
                // 邻居找'.'入队
                for (int i = 0; i < 4; i++) {
                    int nr = r + dr[i], nc = c + dc[i];
                    if (nr >= 0 && nr < m && nc >= 0 && nc < n && maze[nr][nc] == '.') {
                        // 是边沿直接返回
                        if (nr == 0 || nr == m - 1 || nc == 0 || nc == n - 1) return epoch;
                        // 不是边沿，入队
                        maze[nr][nc] = '-';  // 表示已经搜过
                        que.emplace(nr, nc); 
                    }
                }
            }

        }
        return -1;

    }
};

```

