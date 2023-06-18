# 剑指offer专项

## 数组

### [剑指 Offer II 011. 0 和 1 个数相同的子数组](https://leetcode.cn/problems/A1NYOS/)

```cpp
class Solution {
public:
    int findMaxLength(vector<int>& nums) {
        int sum = 0;
        for(int i = 0; i < nums.size() ;i++) if(nums[i] == 0) nums[i] = -1;
        unordered_map<int,int> umap;
        partial_sum(nums.begin(),nums.end() , nums.begin());
        for(int i = 0; i < nums.size() ;i++)
        {
            if(umap.find(nums[i]) == umap.end()) umap[nums[i]] = i;
            else sum = max(i -  umap[nums[i]] , sum);
            if(nums[i] == 0) sum = max(sum,i + 1);
        }
        return sum;

    }
};
```



### [剑指 Offer II 009. 乘积小于 K 的子数组](https://leetcode.cn/problems/ZVAVXX/)（未）

count+=right-left+1 这个条件很难想到

```cpp
class Solution {
public:
    int numSubarrayProductLessThanK(vector<int>& nums, int k) {
        if(k <=1) return 0;
        int left = 0 , right = 0, count = 0;
        long long cur = 1;
        while(right < nums.size())
        {
            cur *= nums[right];
            while(cur >= k){
                cur /=nums[left++];
            }
            count+=right-left+1;
            right++;
        }
        return count;
    }
};
```

## 字符串

### [剑指 Offer II 014. 字符串中的变位词](https://leetcode.cn/problems/MPnaiL/)（未）

可以直接比较两个数组是否相等

```cpp
class Solution {
public:
    bool checkInclusion(string s1, string s2) {
        int n = s1.length(), m = s2.length();
        if (n > m) {
            return false;
        }
        vector<int> cnt1(26), cnt2(26);
        for (int i = 0; i < n; ++i) {
            ++cnt1[s1[i] - 'a'];
            ++cnt2[s2[i] - 'a'];
        }
        if (cnt1 == cnt2) {
            return true;
        }
        for (int i = n; i < m; ++i) {
            ++cnt2[s2[i] - 'a'];
            --cnt2[s2[i - n] - 'a'];
            if (cnt1 == cnt2) {
                return true;
            }
        }
        return false;
    }
};
```

### [剑指 Offer II 015. 字符串中的所有变位词](https://leetcode.cn/problems/VabMRr/)

同上一题

```cpp
class Solution {
public:
    vector<int> findAnagrams(string s, string p) {
        if(p.size() > s.size()) return {};
        vector<int> svec(26),pvec(26), res;
        for(int i = 0 ; i < p.size(); i++)
        {
            svec[s[i] -'a']++;
            pvec[p[i] -'a']++;
        }
        if(svec == pvec) res.push_back(0);
        for(int i = p.size(); i < s.size(); i++)
        {
            svec[s[i - p.size()] -'a']--;
            svec[s[i] -'a']++;
            if(svec == pvec) res.push_back(i - p.size() + 1);
        }
        return res;
    }
};
```



### [剑指 Offer II 030. 插入、删除和随机访问都是 O(1) 的容器](https://leetcode.cn/problems/FortPu/)

```cpp
class RandomizedSet {
public:
    RandomizedSet() {
        srand((unsigned)time(NULL));
    }
    
    bool insert(int val) {
        if (indices.count(val)) {
            return false;
        }
        int index = nums.size();
        nums.emplace_back(val);
        indices[val] = index;
        return true;
    }
    
    bool remove(int val) {
        if (!indices.count(val)) {
            return false;
        }
        int index = indices[val];
        int last = nums.back();
        nums[index] = last;
        indices[last] = index;
        nums.pop_back();
        indices.erase(val);
        return true;
    }
    
    int getRandom() {
        int randomIndex = rand()%nums.size();
        return nums[randomIndex];
    }
private:
    vector<int> nums;
    unordered_map<int, int> indices;
};

```



### [剑指 Offer II 034. 外星语言是否排序](https://leetcode.cn/problems/lwyVBB/)

```cpp
class Solution {
    public:
    unordered_map<char,int> orders;
    bool cmp(const string &a, const string &b)
    {
        int l = 0, r = 0;
        while(l < a.size() && r < b.size())
        {
            if(orders[a[l]] > orders[b[l]]) return false;
            else if(orders[a[l]] < orders[b[l]]) return true;
            l++;
            r++;
        }
        if(l == a.size()) return true;
        else return false;
    }
public:
    bool isAlienSorted(vector<string>& words, string order) {
        for(int i = 0; i < order.size() ; i++)
        {
            orders[order[i]] = i;
        }
        for(int i = 1; i < words.size() ; i++)
        {
            if(!cmp(words[i - 1],words[i])) return false;
        }
        return true;
    }
};
```

### [剑指 Offer II 035. 最小时间差](https://leetcode.cn/problems/569nqc/)

```cpp
class Solution {
public:
    int findMinDifference(vector<string>& timePoints) {
        vector<int> res;
        unordered_map<string,int> umap;
        for(int i = 0 ; i < timePoints.size() ;i++)
        {
            if(umap.find(timePoints[i]) != umap.end()) return 0;
            umap[timePoints[i]] = 60 * stoi(timePoints[i].substr(0,2)) + stoi(timePoints[i].substr(3,2));
            res.push_back(umap[timePoints[i]]);
        }
        sort(res.begin(),res.end());
        int mins = res[0] + 60 * 24 - res.back();
        for(int i = 1; i < res.size() ;i++)
        {
            mins = min(mins,res[i] - res[i-1]);
        }

        return mins;
    }
};
```



## 队列

### [剑指 Offer II 043. 往完全二叉树添加节点](https://leetcode.cn/problems/NaqhDT/)

```cpp
class CBTInserter {
    vector<TreeNode*> tree_que;

public:
    CBTInserter(TreeNode* root) {
        deque<TreeNode*> que;
        if(root) 
        {
            que.push_back(root);
            tree_que.push_back(root);
        }
        while(!que.empty())
        {
            int n = que.size();
            while(n--)
            {
                TreeNode* top = que.front();
                que.pop_front();
                if(top->left) 
                {
                    tree_que.push_back(top->left);
                    que.push_back(top->left);
                }
                if(top->right) 
                {
                    tree_que.push_back(top->right);
                    que.push_back(top->right);
                }
            }
        }

    }
    
    int insert(int v) {
        TreeNode* node = new TreeNode(v);
        TreeNode* tmp = tree_que[(tree_que.size() + 1) / 2 - 1];
        tree_que.push_back(node);
        if(!tmp->left) tmp->left = node;
        else tmp->right = node;
        return tmp->val;
    }
    
    TreeNode* get_root() {
        return tree_que[0];
    }
};
```



## 二叉数

### [剑指 Offer II 047. 二叉树剪枝](https://leetcode.cn/problems/pOCWxh/)

```cpp
class Solution {
    bool isze(TreeNode* root)
    {
        if(!root) return true;
        if(root->val == 1) return false;
        return isze( root->left) && isze(root->right);
    }
public:
    TreeNode* pruneTree(TreeNode* root) {
        if(!root) return nullptr;
        root->left = pruneTree(root->left);
        root->right = pruneTree(root->right);
        if(root-> val == 0) return isze(root->left) && isze(root->right) ? nullptr :root;
        return root;
    }
};
```



### [剑指 Offer II 053. 二叉搜索树中的中序后继](https://leetcode.cn/problems/P5rCT8/)

```cpp
class Solution {
    bool find = false;
    TreeNode* r;
public:
    TreeNode* inorderSuccessor(TreeNode* root, TreeNode* p) {
        
        if(root->left)  r = inorderSuccessor(root->left, p);
        if(root == p) find = true;
        if(find && root != p) 
        {
            r = root;
            find = false;
            return root;
        }
        if(root->right) r = inorderSuccessor(root->right, p);
        return r;
    }
};
```



### [剑指 Offer II 055. 二叉搜索树迭代器](https://leetcode.cn/problems/kTOapQ/)

```cpp
class BSTIterator {
    vector<int> res;
    int cur;
    void se(TreeNode* root)
    {
        if(!root) return ;
        se( root->left);
        res.push_back(root->val);
        se( root->right);
    }
public:
    BSTIterator(TreeNode* root) {
        cur = 0;
        se(root);
    }
    
    int next() {
        return res[cur++];
    }
    
    bool hasNext() {
        return cur  < res.size() ;
    }
};

```





## 堆

通过[优先队列](https://so.csdn.net/so/search?q=优先队列&spm=1001.2101.3001.7020)priority_queue模拟大（小）顶堆,优先级高的元素先出队列，并非按照先进先出的要求，其基本操作和队列相同。

```cpp
//greater和less是std实现的两个仿函数
 
//升序队列，小顶堆
priority_queue <int,vector<int>,greater<int> > q;
//降序队列，大顶堆
priority_queue <int,vector<int>,less<int> >q;
 
 
```

### [剑指 Offer II 059. 数据流的第 K 大数值](https://leetcode.cn/problems/jBjn9C/)

```cpp
class KthLargest {
    priority_queue<int,vector<int>,greater<int>> que;
    int k;
public:
    KthLargest(int k, vector<int>& nums) {
        this->k = k;
        for(int i = 0; i < nums.size() ; i++)
        {
            que.push(nums[i]);
            if(que.size() > k) que.pop();
        }
    }
    
    int add(int val) {
        que.push(val);
        if(que.size() > k) que.pop();
        return que.top();
    }
};
```

### [373. 查找和最小的 K 对数字](https://leetcode.cn/problems/find-k-pairs-with-smallest-sums/)（未完成）

构建最小堆，lambda匿名函数

```cpp
class Solution {
public:
  vector<vector<int>> kSmallestPairs(vector<int>& nums1, vector<int>& nums2, int k) {
        // 最小堆
        auto cmp = [&](const pair<int, int>& lhs, const pair<int, int>& rhs) {
            return nums1[lhs.first] + nums2[lhs.second] > nums1[rhs.first] + nums2[rhs.second];
        };
        priority_queue<pair<int, int>, vector<pair<int, int>>, decltype(cmp)> heap(cmp);

        for (int i = 0; i < k && i < nums1.size(); ++i) {
            heap.push({i, 0});
        }
        vector<vector<int>> ret;
        while (k-- > 0 && !heap.empty()) {
            auto ids = heap.top();
            heap.pop();
            ret.push_back({nums1[ids.first], nums2[ids.second]});

            if (ids.second < nums2.size() - 1) {
                heap.push({ids.first, ids.second + 1});
            }
        }

        return ret;
    }
};

```



## 字典树

### [剑指 Offer II 063. 替换单词](https://leetcode.cn/problems/UhWRSj/)

```CPP
class Solution {
class Trie {
    class dicttree
    {
    public:
        char val;
        bool isWord;
        vector<dicttree*> trees;
        dicttree()
        {
            val = 0;
            isWord = false;
            trees.resize(26);
            for (int i = 0; i < 26; ++i) {
                trees[i] = nullptr;
            }
        }
    };
    dicttree *root;
public:
    Trie() {
        root = new dicttree();
    }

    void insert(string word) {
        dicttree * cur = root;
        for (int i = 0; i < word.size(); ++i) {
            if (cur->trees[word[i] - 'a'] == NULL)
            {
                cur->trees[word[i] - 'a'] = new dicttree();
                cur->trees[word[i] - 'a']->val = word[i];

            }
            cur = cur->trees[word[i] - 'a'];
        }
        cur->isWord = true;
    }

    string search(string word) {
        dicttree * cur = root;
        for (int i = 0; i < word.size(); ++i) {
            if (cur->trees[word[i] - 'a'] == NULL) return word;
            cur = cur->trees[word[i] - 'a'];
            if(cur->isWord) return word.substr(0,i + 1);
        }
        return word;
    }
};

public:
    string replaceWords(vector<string>& dictionary, string sentence) {
        Trie* tree = new Trie();
        for(int i = 0 ; i < dictionary.size();i++)
        {
            tree->insert(dictionary[i]);
        }
        string res,temp;
        stringstream ss(sentence);
        while(getline(ss,temp,' '))
        {
            res += tree->search(temp) + " ";
        }
        if(res.back() == ' ') res.pop_back();


        return res;
    }
};
```



### [剑指 Offer II 064. 神奇的字典](https://leetcode.cn/problems/US1pGT/)



```cpp
class MagicDictionary {
    vector<string> dictionary;
public:
    /** Initialize your data structure here. */
    MagicDictionary() {

    }
    
    void buildDict(vector<string> dictionary) {
        this->dictionary = dictionary;
    }
    
    bool search(string searchWord) {
        for(int i = 0;i < dictionary.size() ;i++)
        {
            if(searchWord.size() != dictionary[i].size()) continue;
            int sums = 0;
            for(int j = 0; j < searchWord.size() ;j++)
            {
                if(dictionary[i][j] != searchWord[j]) sums++;
            }
            if(sums == 1) return true;
        }
        return false;
    }
};

```

### [剑指 Offer II 065. 最短的单词编码](https://leetcode.cn/problems/iSwD2y/)

```cpp
class Solution {

    class Trie {
    class dicttree
    {
    public:
        char val;
        bool isWord;
        vector<dicttree*> trees;
        dicttree()
        {
            val = 0;
            isWord = false;
            trees.resize(26);
            for (int i = 0; i < 26; ++i) {
                trees[i] = nullptr;
            }
        }
    };
    dicttree *root;
public:
    Trie() {
        root = new dicttree();
    }

    void insert(string word) {
        dicttree * cur = root;
        for (int i = 0; i < word.size(); ++i) {
            if (cur->trees[word[i] - 'a'] == NULL)
            {
                cur->trees[word[i] - 'a'] = new dicttree();
                cur->trees[word[i] - 'a']->val = word[i];

            }
            cur = cur->trees[word[i] - 'a'];
        }
        cur->isWord = true;
    }

    bool search(string word) {
        dicttree * cur = root;
        for (int i = 0; i < word.size(); ++i) {
            if (cur->trees[word[i] - 'a'] == NULL) return false;
            cur = cur->trees[word[i] - 'a'];
        }
        if(cur->isWord == false) return false;
        return true;
    }

    bool startsWith(string prefix) {
        dicttree * cur = root;
        for (int i = 0; i < prefix.size(); ++i) {
            if (cur->trees[prefix[i] - 'a'] == nullptr ) return false;
            cur = cur->trees[prefix[i] - 'a'];
        }
        return true;
    }
};
public:
    int minimumLengthEncoding(vector<string>& words) {
        Trie *tree = new Trie();
        for(string &s :words) reverse(s.begin(),s.end());
        sort(words.begin(),words.end(),[](const string &a,const string &b){
            return a.size() > b.size();
        });
        int count = 0;
        for(string &s :words) 
        {
            if(tree->startsWith(s)) continue;
            tree->insert(s);
            count += s.size() + 1;
        }
        return count;
    }
};
```



### [剑指 Offer II 066. 单词之和](https://leetcode.cn/problems/z1R5dt/)

```cpp
class MapSum {
    unordered_map<string,int> umap;
public:
    /** Initialize your data structure here. */
    MapSum() {

    }
    
    void insert(string key, int val) {
        umap[key]=val;
    }
    
    int sum(string prefix) {
        int sum = 0;
        for(auto x:umap)
        {
            if(prefix.size() <= x.first.size() && x.first.substr(0,prefix.size()) == prefix)
            {
                sum += x.second;
            }
        }
        return sum;
    }
};

```

### [剑指 Offer II 067. 最大的异或](https://leetcode.cn/problems/ms70jA/)（未完成）



```cpp
class Tire{
public:
    vector<Tire*> next;
    int val;
    Tire():next(vector<Tire*>(2)){}
    void insert(int x){
        Tire* cur = this;
        for(int i=0; i<=30; i++){
            int bit = 1&(x>>(30-i));
            if(!cur->next[bit]){
                cur->next[bit] = new Tire();
            }
            cur = cur->next[bit];
        }
        cur->val = x;
    }
    int searchXor(int x){
        Tire* cur = this;
        for(int i=0; i<=30; i++){
            int bit = 1&(x>>(30-i));
            if(cur->next[1-bit]){
                cur = cur->next[1-bit];
            }else{
                cur = cur->next[bit];
            }
        }
        return cur->val ^ x;
    }
};

class Solution {
public:
    int findMaximumXOR(vector<int>& nums) {
        Tire* node = new Tire();
        int res = 0;
        for(auto& num:nums){
            node->insert(num);
            res = max(res, node->searchXor(num));
        }
        return res;
    }
};
```



## 二分

### [剑指 Offer II 073. 狒狒吃香蕉](https://leetcode.cn/problems/nZZqjQ/)

```cpp
class Solution {
public:
    int minEatingSpeed(vector<int>& piles, int h) {
        int res = 0;
        for(int x: piles) res = max(x ,res);
        int left = 1 , right = res ,pre = 0;
        int mid = 0;
        while(left <= right)
        {
            pre = mid;
            mid = (left + right) / 2;
            int count = 0;
            for(int x: piles) count += x / mid + ((x % mid) > 0);
            if(count > h) left = mid + 1;
            else right = mid - 1;
        }
        return left;
    }
};
```

## DP

### [剑指 Offer II 091. 粉刷房子](https://leetcode.cn/problems/JEj789/)

```cpp
class Solution {
public:
    int minCost(vector<vector<int>>& costs) {
        vector<vector<int>> dp = costs;
        for(int i = 1 ; i < costs.size() ;i++)
        {
            dp[i][0] = min(dp[i - 1][1],dp[i - 1][2]) + costs[i][0];
            dp[i][1] = min(dp[i - 1][0],dp[i - 1][2]) + costs[i][1];
            dp[i][2] = min(dp[i - 1][0],dp[i - 1][1]) + costs[i][2];
        }
        vector<int> p = dp.back();
        return min(p[0],min(p[1],p[2]));
    }
};
```

### [剑指 Offer II 092. 翻转字符](https://leetcode.cn/problems/cyJERH/)

```cpp
class Solution {
public:
    int minFlipsMonoIncr(string s) {
        //dp[0] 为以0结尾的反转最少次数 ，dp[1] 为1结尾的反转最少次数
        vector<vector<int>> dp(s.size(),vector<int>(2));
        dp[0][0] = s[0] == '0' ? 0 : 1;
        dp[0][1] = s[1] == '1' ? 0 : 1;
        for(int i = 1; i < s.size() ; i++)
        {
            if(s[i] == '0')
            {
                dp[i][0] = dp[i - 1][0];
                dp[i][1] = min(dp[i - 1][1],dp[i - 1][0]) + 1;
            }
            else
            {
                dp[i][0] = dp[i - 1][0] + 1;
                dp[i][1] = min(dp[i - 1][1],dp[i - 1][0]);
            }
        }
        return min(dp.back()[0],dp.back()[1]);
    }
};
```

### [剑指 Offer II 093. 最长斐波那契数列](https://leetcode.cn/problems/Q91FMA/)

```cpp

```



### [剑指 Offer II 096. 字符串交织](https://leetcode.cn/problems/IY6buf/)

```cpp

```





### [剑指 Offer II 100. 三角形中最小路径之和](https://leetcode.cn/problems/IlPe0q/)

```cpp
class Solution {
public:
    int minimumTotal(vector<vector<int>>& triangle) {
        vector<vector<int>> dp = triangle;
        for(int i = 1 ; i < triangle.size();i++)
        {
            for(int j = 0; j < i + 1; j++)
            {
                if(j == 0) dp[i][j] = dp[i - 1][j]+ triangle[i][j];
                else if(j == i) dp[i][j] = dp[i - 1][j - 1]+ triangle[i][j];
                else dp[i][j] = min(dp[i - 1][j] , dp[i - 1][j - 1]) + triangle[i][j];
            }
        }

        int mins = INT_MAX;
        for(int i = 0; i < triangle.back().size()  ;i++)
        {
            mins = min(mins,dp.back()[i]);
        }
        return mins;
    }
};
```

