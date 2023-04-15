# 剑指offer

### [剑指 Offer 03. 数组中重复的数字](https://leetcode.cn/problems/shu-zu-zhong-zhong-fu-de-shu-zi-lcof/)(未)

原地哈希时间复杂度n，空间复杂度1

```cpp
class Solution {
public:
    int findRepeatNumber(vector<int>& nums) {
        //原地哈希
        for (int i = 0; i < nums.size(); ++i) {
            if (i == nums[i]) continue;
            while (nums[i] != i)
            {
                if (nums[i] == nums[nums[i]]) return nums[i];
                swap(nums[i],nums[nums[i]]);
            }
        }
        return 0;
    }
};
```

### [剑指 Offer 04. 二维数组中的查找](https://leetcode.cn/problems/er-wei-shu-zu-zhong-de-cha-zhao-lcof/)

```cpp
class Solution {
    //右上角开始，增加往下，减少往左
public:
    bool findNumberIn2DArray(vector<vector<int>>& matrix, int target) {
        if(matrix.size() == 0) return false;
        int x = 0, y = matrix[0].size() - 1;
        while (x < matrix.size() && y >= 0)
        {
            if (matrix[x][y] == target) return true;
            else if(matrix[x][y] > target) y--;
            else x++;
        }
        return false;
    }
};
```

### [剑指 Offer 06. 从尾到头打印链表](https://leetcode.cn/problems/cong-wei-dao-tou-da-yin-lian-biao-lcof/)

```cpp
class Solution {
public:
    vector<int> reversePrint(ListNode* head) {
        vector<int> res;
        while (head)
        {
            res.push_back(head->val);
            head = head->next;
        }
        std::reverse(res.begin(), res.end());
        return res;
    }
};


```

### [剑指 Offer 07. 重建二叉树](https://leetcode.cn/problems/zhong-jian-er-cha-shu-lcof/)

```cpp
class Solution {
    TreeNode* buildTree(vector<int>& preorder, vector<int>& inorder,int preorderstart ,int preorderend,int inorderstart,int inorderend)
    {

        if (preorderstart == preorderend ) return NULL;
        TreeNode*  root = new TreeNode(preorder[preorderstart]);
        if (preorderend - preorderstart == 1) return root;
        int mid = inorderstart;//下标
        while (inorder[mid] != preorder[preorderstart]) mid++;

        root->left = buildTree(preorder, inorder,  preorderstart + 1 , preorderstart+mid - inorderstart + 1,inorderstart , mid);
        root->right = buildTree(preorder, inorder, preorderstart+mid - inorderstart + 1 ,preorderend,mid + 1,      inorderend);
        return root;

    }
public:
    TreeNode* buildTree(vector<int>& preorder, vector<int>& inorder) {
        if (inorder.size() == 0 || preorder.size() == 0) return NULL;
        return buildTree( preorder,  inorder,0,preorder.size(),0,inorder.size());
    }
};
```

### [剑指 Offer 09. 用两个栈实现队列](https://leetcode.cn/problems/yong-liang-ge-zhan-shi-xian-dui-lie-lcof/)

```cpp
class CQueue {
    stack<int> stack1;
    stack<int> stack2;
public:
    CQueue() {

    }

    void appendTail(int value) {
        stack1.push(value);
    }

    int deleteHead() {
        while (!stack1.empty())
        {
            int top = stack1.top();
            stack1.pop();
            stack2.push(top);
        }
        if(stack2.empty()) return -1;
        int res = stack2.top();
        stack2.pop();
        while (!stack2.empty())
        {
            int top = stack2.top();
            stack2.pop();
            stack1.push(top);
        }
        return res;
    }
};
```



### [剑指 Offer 10- I. 斐波那契数列](https://leetcode.cn/problems/fei-bo-na-qi-shu-lie-lcof/)

```cpp
class Solution {
public:
    int fib(int n) {
        long long dp[101];
        dp[0] = 0;
        dp[1] = 1;
        for (int i = 2; i <= n; ++i) {
            dp[i] = (dp[i-1]+ dp[i - 2]) % 1000000007;
        }
        return dp[n];
    }
};
```

### [剑指 Offer 10- II. 青蛙跳台阶问题](https://leetcode.cn/problems/qing-wa-tiao-tai-jie-wen-ti-lcof/)

```cpp
class Solution {
public:
    int numWays(int n) {
        int dp[101];
        dp[0] = 1;
        dp[1] = 1;
        dp[2] = 2;
        for (int i = 2; i <= n; ++i) {
            dp[i] = (dp[i-1]+ dp[i - 2]) % 1000000007;
        }
        return dp[n];
    }
};
```

### [剑指 Offer 11. 旋转数组的最小数字](https://leetcode.cn/problems/xuan-zhuan-shu-zu-de-zui-xiao-shu-zi-lcof/)

题解：https://leetcode.cn/problems/xuan-zhuan-shu-zu-de-zui-xiao-shu-zi-lcof/solution/mian-shi-ti-11-xuan-zhuan-shu-zu-de-zui-xiao-shu-3/

```cpp

class Solution {
public:
    int minArray(vector<int>& numbers) {
        int i = 0, j = numbers.size() - 1;
        while (i < j) {
            int m = (i + j) / 2;
            if (numbers[m] > numbers[j]) i = m + 1; 
            else if (numbers[m] < numbers[j]) j = m;
            else j--;
        }
        return numbers[i];
    }
};
```

### [剑指 Offer 12. 矩阵中的路径](https://leetcode.cn/problems/ju-zhen-zhong-de-lu-jing-lcof/)

```cpp
class Solution {
    vector<vector<bool>> used;
    bool search(vector<vector<char>>& board,string &word , int start , int row , int col)
    {
        if (start == word.size()) return true;
        if (row < 0 || row >= board.size() || col <  0 || col >=  board[0].size() || used[row][col]) return false;
        if (word[start] == board[row][col])
        {
            used[row][col] = true;
            bool up = search( board,word , start + 1 , row - 1, col);
            bool down = search( board,word , start + 1 , row + 1, col);
            bool left = search( board,word , start + 1 , row , col - 1);
            bool right = search( board,word , start + 1 , row , col+ 1);
            if (up || down || left || right) return true;
            used[row][col] = false;
        }
        return false;
    }
public:
    bool exist(vector<vector<char>>& board, string word) {
        used.assign(board.size(),vector<bool>(board[0].size(), false));
        for (int i = 0; i < board.size(); ++i) {
            for (int j = 0; j < board[0].size(); ++j) {
                if (board[i][j] == word[0])
                {
                    bool find = search(board,word , 0 , i , j);
                    if (find) return true;
                }
            }
        }
        return false;
    }
};
```

### [剑指 Offer 14- I. 剪绳子](https://leetcode.cn/problems/jian-sheng-zi-lcof/)

```cpp
class Solution {
public:
    int cuttingRope(int n) {
        vector<int> dp(n+1);
        dp[1] = 1;
        dp[2] = 1;
        for (int i = 3; i <= n ; ++i) {
            for (int j = 1; j < n; ++j) {
                dp[i] = max(j * (i - j), max((i - j) * dp[j],dp[i]));
            }
        }
        return dp[n];
    }
};
```



### [剑指 Offer 14- II. 剪绳子 II](https://leetcode.cn/problems/jian-sheng-zi-ii-lcof/)（经典，不用大数的解法）

//C++贪心 尽可能和更多的3相乘 ，最后结果小于5 则返回

```cpp
class Solution {
    //C++贪心 尽可能和更多的3相乘
public:
    int cuttingRope(int n) {
        if (n <= 3) return n - 1;
        long long res = 1;
        while (n > 4)
        {
            res = (res * 3) % 1000000007;
            n-=3;
        }
        return (res * n) % 1000000007;
    }
};
```

### [剑指 Offer 15. 二进制中1的个数](https://leetcode.cn/problems/er-jin-zhi-zhong-1de-ge-shu-lcof/)

```cpp
class Solution {
public:
    int hammingWeight(uint32_t n) {
        int res = 0;
        while (n)
        {
            res++;
            n &= (n - 1);
        }
        return res;
    }
};
```

### [剑指 Offer 16. 数值的整数次方](https://leetcode.cn/problems/shu-zhi-de-zheng-shu-ci-fang-lcof/)

```cpp
class Solution {
    double Pows(double x, long n)
    {
        if (n == 1) return x;
        double temp = Pows(x, n / 2);
        if (n % 2 == 0) return temp * temp;
        else return temp * temp * x;
    }
public:
    double myPow(double x, int n) {
        if (n == 0) return 1;
        if (n < 0)
        {
            double res = Pows(x, -(long)n);
            return 1 / res;
        }
        return Pows(x, n);
    }
};

//新版
class Solution {
public:
    double myPow(double x, int n) {
        if(n == 0) return 1;
        if(n == 1) return x;
        if(n == -1) return 1 / x;
        double half = myPow(x, n / 2);
        double mod = myPow(x, n % 2);
        return half * half * mod;
    }
};
```

### [剑指 Offer 17. 打印从1到最大的n位数](https://leetcode.cn/problems/da-yin-cong-1dao-zui-da-de-nwei-shu-lcof/)

```cpp
class Solution {
public:
    vector<int> printNumbers(int n) {
        vector<int> res;
        res.reserve(pow(10,n) - 1);
        for (int i = 1; i < pow(10,n); ++i) {
            res.push_back(i);
        }
        return res;
    }
};
```

### [剑指 Offer 18. 删除链表的节点](https://leetcode.cn/problems/shan-chu-lian-biao-de-jie-dian-lcof/)

```cpp
class Solution {
public:
    ListNode* deleteNode(ListNode* head, int val) {
        ListNode* prehead = new ListNode(0,head);
        ListNode* cur = prehead;
        while (cur && cur->next)
        {
            if (cur->next->val == val)
            {
                cur->next = cur->next->next;
            }
            cur = cur->next;
        }
        return prehead->next;
    }
};
```

### [剑指 Offer 19. 正则表达式匹配](https://leetcode.cn/problems/zheng-ze-biao-da-shi-pi-pei-lcof/)(未)

```cpp
class Solution {
public:
    bool isMatch(string s, string p) {
        // dp[i][j] 表示 s以i - 1结束，p以j - 1结束是否能匹配 （0 - n）
        vector<vector<bool>> dp(s.size() + 1,vector<bool>(p.size()+1, false));
        //初始化 dp[0][i] , s字符串为空时，p的*个数
        dp[0][0] = true;
        for (int i = 1; i <= p.size(); ++i) {
            if (p[i - 1] == '*')dp[0][i] =  dp[0][i-2];
        }

        for (int i = 1; i <= s.size(); ++i) {
            for (int j = 1; j <= p.size() ; ++j) {
                //1.遇到 .
                if (p[j - 1] == '.') dp[i][j] = dp[i-1][j-1];
                //2.遇到两者相等
                else if(p[j - 1] != '*') dp[i][j] = dp[i-1][j-1] && p[j - 1] == s[i - 1];
                //3.遇到 p[i - 2] 和s[i-2]不匹配
                else if(p[j - 2] != '.' && p[j - 2] != s[i - 1])dp[i][j] = dp[i][j-2];
                //其他 ，遇到*
                else dp[i][j] = dp[i-1][j]||dp[i][j-1]||dp[i][j-2];
            }
        }
        return dp.back().back();
    }
};
```



### [剑指 Offer 21. 调整数组顺序使奇数位于偶数前面](https://leetcode.cn/problems/diao-zheng-shu-zu-shun-xu-shi-qi-shu-wei-yu-ou-shu-qian-mian-lcof/)

```cpp
class Solution {
public:
    vector<int> exchange(vector<int>& nums) {
        int slow = 0,fast = 0;
        while (fast < nums.size())
        {
            if (nums[fast] % 2 == 1) swap(nums[fast],nums[slow++]);
            fast++;
        }
        return nums;
    }
};
```

### [剑指 Offer 22. 链表中倒数第k个节点](https://leetcode.cn/problems/lian-biao-zhong-dao-shu-di-kge-jie-dian-lcof/)

```cpp
class Solution {
public:
    ListNode* getKthFromEnd(ListNode* head, int k) {
        int n = k;
        ListNode* cur= head;
        while (n--) cur = cur->next;
        while (cur)
        {
            cur = cur->next;
            head = head->next;
        }
        return head;
    }
};
```

### [剑指 Offer 24. 反转链表](https://leetcode.cn/problems/fan-zhuan-lian-biao-lcof/)

```cpp
class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode* pre = NULL;
        ListNode* cur = head;
        while (cur)
        {
            ListNode* temp = cur->next;
            cur->next = pre;
            pre = cur;
            cur = temp;
        }
        return pre;
    }
};
```



### [剑指 Offer 25. 合并两个排序的链表(未)](https://leetcode.cn/problems/he-bing-liang-ge-pai-xu-de-lian-biao-lcof/)

```cpp
class Solution {
public:
    ListNode* mergeTwoLists(ListNode* l1, ListNode* l2) {
        if (!l1) return l2;
        if (!l2) return l1;
        if (l1->val > l2->val)
        {
            l2->next = mergeTwoLists( l1,  l2->next);
            return l2;
        }
        else
        {
            l1->next = mergeTwoLists( l1->next,  l2);
            return l1;
        }
    }
};
```

### [剑指 Offer 26. 树的子结构](https://leetcode.cn/problems/shu-de-zi-jie-gou-lcof/)

```cpp
class Solution {
    bool search(TreeNode* A, TreeNode* B)
    {
        if (!A && !B) return true;
        if ( !A && B) return false;
        if (A && !B) return true;
        if (A->val!=B->val) return false;
        bool  left = search(A->left,  B->left);
        bool  right = search(A->right, B->right);
        return left && right;

    }
public:
    bool isSubStructure(TreeNode* A, TreeNode* B) {
        if (!A && !B) return true;
        if (A && !B || !A && B) return false;
        bool find = search(A, B);
        if (find) return true;
        return isSubStructure(A->left, B) || isSubStructure(A->right,  B);
    }
};
```

### [剑指 Offer 27. 二叉树的镜像](https://leetcode.cn/problems/er-cha-shu-de-jing-xiang-lcof/)

```cpp
class Solution {
public:
    TreeNode* mirrorTree(TreeNode* root) {
        if (!root) return nullptr;
        TreeNode* left = mirrorTree(root->left);
        TreeNode* right = mirrorTree( root->right);
        root->left = right;
        root->right = left;
        return root;
    }
};
```

### [剑指 Offer 28. 对称的二叉树](https://leetcode.cn/problems/dui-cheng-de-er-cha-shu-lcof/)

```cpp
class Solution {
    bool isequ(TreeNode* left, TreeNode* right)
    {
        if (!left && !right) return true;
        if (left && !right || !left && right || left->val != right->val) return false;
        return isequ(left->left, right->right) && isequ(left->right, right->left);

    }
public:
    bool isSymmetric(TreeNode* root) {
        if (!root) return true;
        return isequ(root->left, root->right);
    }
};
```

### [剑指 Offer 29. 顺时针打印矩阵](https://leetcode.cn/problems/shun-shi-zhen-da-yin-ju-zhen-lcof/)(未)

```cpp
class Solution {
public:
    vector<int> spiralOrder(vector<vector<int>>& matrix) {
        if (matrix.size() == 0) return {};
        vector<vector<bool>> isuesd(matrix.size(),vector<bool>(matrix[0].size(),false));
        vector<int> res(matrix.size() * matrix[0].size());
        int col = 0, row = 0 , n = 1;
        res[0] = matrix[0][0];
        isuesd[0][0] = true;
        while (n < matrix.size() * matrix[0].size())
        {
            
            while (col < matrix[0].size() - 1 && isuesd[row][col + 1] == false) 
            {
                res[n++] = matrix[row][++col];
                isuesd[row][col] = true;
            }
            while(row < matrix.size() - 1 && isuesd[row + 1][col] == false) 
            {
                res[n++] = matrix[++row][col];
                isuesd[row][col] = true;
            }
            while(col > 0 && isuesd[row][col - 1] == false) 
            {
                res[n++] = matrix[row][--col];
                isuesd[row][col] = true;
            }
            while(row > 0 && isuesd[row - 1][col] == false) 
            {
                res[n++] = matrix[--row][col];
                isuesd[row][col] = true;
            }
        }
        return res;
    }
};
```

### [剑指 Offer 30. 包含min函数的栈](https://leetcode.cn/problems/bao-han-minhan-shu-de-zhan-lcof/)

```cpp
class MinStack {
    stack<int> used;
    stack<int> mis;
public:
    /** initialize your data structure here. */
    MinStack() {

    }

    void push(int x) {
        used.push(x);
        if (mis.empty() || mis.top() >= x) mis.push(x);
    }

    void pop() {
        int top = used.top();
        used.pop();
        if (!mis.empty() &&  mis.top() == top) mis.pop();
    }

    int top() {
        return used.top();
    }

    int min() {
        return mis.top();
    }
};
```

### [剑指 Offer 31. 栈的压入、弹出序列](https://leetcode.cn/problems/zhan-de-ya-ru-dan-chu-xu-lie-lcof/)

```cpp
class Solution {
public:
    bool validateStackSequences(vector<int>& pushed, vector<int>& popped) {
        stack<int> st;
        int pushed_start = 0,popped_start = 0;

        while ( popped_start < popped.size())
        {

            if (st.empty() || st.top() != popped[popped_start] )
            {
                if (pushed_start >= pushed.size()) return false;
                st.push(pushed[pushed_start++]);
            }
            else
            {
                st.pop();
                popped_start++;
            }
        }
        return true;
    }
};
```

### [剑指 Offer 32 - I. 从上到下打印二叉树](https://leetcode.cn/problems/cong-shang-dao-xia-da-yin-er-cha-shu-lcof/)

```cpp
class Solution {
public:
    vector<int> levelOrder(TreeNode* root) {
        if (!root) return {};
        queue<TreeNode*> que;
        vector<int> res;
        que.push(root);
        while (!que.empty())
        {
            int n = que.size();
            while (n--)
            {
                TreeNode* top = que.front();
                que.pop();
                res.push_back(top->val);
                if (top->left) que.push(top->left);
                if (top->right) que.push(top->right);
            }
        }
        return res;
    }
};
```

### [剑指 Offer 32 - II. 从上到下打印二叉树 II](https://leetcode.cn/problems/cong-shang-dao-xia-da-yin-er-cha-shu-ii-lcof/)

```cpp
class Solution {
public:
    vector<vector<int>> levelOrder(TreeNode* root) {
        if (!root) return {};
        queue<TreeNode*> que;
        vector<vector<int>> res;
        que.push(root);
        while (!que.empty())
        {

            int n = que.size();
            vector<int> temp;
            while (n--)
            {
                TreeNode* top = que.front();
                que.pop();
                temp.push_back(top->val);
                if (top->left) que.push(top->left);
                if (top->right) que.push(top->right);
            }
            res.push_back(temp);
        }
        return res;
    }
};
```

### [剑指 Offer 32 - III. 从上到下打印二叉树 III](https://leetcode.cn/problems/cong-shang-dao-xia-da-yin-er-cha-shu-iii-lcof/)

```cpp
class Solution {
public:
    vector<vector<int>> levelOrder(TreeNode* root) {
        if (!root) return {};
        queue<TreeNode*> que;
        vector<vector<int>> res;
        que.push(root);
        int count = 0;
        while (!que.empty())
        {

            int n = que.size();
            vector<int> temp;
            while (n--)
            {
                TreeNode* top = que.front();
                que.pop();
                temp.push_back(top->val);
                if (top->left) que.push(top->left);
                if (top->right) que.push(top->right);
            }
            if (count % 2 == 1) std::reverse(temp.begin(), temp.end());
            res.push_back(temp);
            count++;
        }
        return res;
    }
};
```

### [剑指 Offer 33. 二叉搜索树的后序遍历序列](https://leetcode.cn/problems/er-cha-sou-suo-shu-de-hou-xu-bian-li-xu-lie-lcof/)(未，重点看看)

```cpp
class Solution {
public:
    bool verifyPostorder(vector<int>& postorder){
        stack<int> stack;
        int root = INT_MAX;
        for(int i = postorder.size() - 1; i >= 0; i--) {
            if(postorder[i] > root) return false;
            while(!stack.empty() && stack.top() > postorder[i])
            {
                root = stack.top();
                stack.pop();
            }
            stack.push(postorder[i]);
        }
        return true;
    }
};
```



### [剑指 Offer 34. 二叉树中和为某一值的路径](https://leetcode.cn/problems/er-cha-shu-zhong-he-wei-mou-yi-zhi-de-lu-jing-lcof/)

```cpp
class Solution {
    vector<vector<int>>res;
    void backtracking(TreeNode* root,int target,vector<int> path)
    {
        if (!root) return;
        path.push_back(root->val);
        if (!root->left && !root->right)
        {
            if (target == root->val)
            {
                res.push_back(path);
            }
            return;
        }
        backtracking(root->left,target -  root->val,path);
        backtracking(root->right,target -  root->val,path);
    }
public:
    vector<vector<int>> pathSum(TreeNode* root, int target) {
        vector<int> path;
        backtracking(root,target, path);
        return res;
    }
};
```



### [剑指 Offer 35. 复杂链表的复制](https://leetcode.cn/problems/fu-za-lian-biao-de-fu-zhi-lcof/)

```cpp
class Solution {

public:
    Node* copyRandomList(Node* head) {
        if(!head) return NULL;
        vector<Node* > res; //原始节点
        vector<Node* > rescon; //新的节点
        vector<int> rad; //节点的rad
        Node* cur = head; //遍历
        Node* pre = new Node(0); //新的pre
        while (cur)
        {
            pre->next = new Node(cur->val);
            rescon.push_back(pre->next);
            pre = pre->next;
            res.push_back(cur);
            cur = cur->next;
        }
        
        for (int i = 0; i < res.size(); ++i) {
            //cout << res[i] << "   "<< res[i]->random  <<endl;
            for (int j = 0; j < res.size(); ++j) {
                if(!res[i]->random)
                {
                    rad.push_back(-1);
                    break;
                }
                if (res[j] == res[i]->random)
                {
                    rad.push_back(j);
                    break;
                }
            }
        }
        //开始复制radom
        for (int i = 0; i < rescon.size(); ++i) {
            if(rad[i] == -1) rescon[i]->random = NULL;
            else rescon[i]->random = rescon[rad[i]];
        }
        return rescon[0];
    }
};
```

### [剑指 Offer 36. 二叉搜索树与双向链表](https://leetcode.cn/problems/er-cha-sou-suo-shu-yu-shuang-xiang-lian-biao-lcof/)（未重点）

```cpp
class Solution {
public:
    Node* treeToDoublyList(Node* root) {
        if (!root) return nullptr;
        dfs(root);
        head->left = pre;
        pre->right = head;//进行头节点和尾节点的相互指向，这两句的顺序也是可以颠倒的
        return head;
    }
private:
    Node *pre, *head;
    void dfs(Node* cur) {
        if (!cur) return;
        dfs(cur->left);
        //pre用于记录双向链表中位于cur左侧的节点，即上一次迭代中的cur,当pre==null时，cur左侧没有节点,即此时cur为双向链表中的头节点
        if (pre) pre->right = cur;
        //反之，pre!=null时，cur左侧存在节点pre，需要进行pre.right=cur的操作。
        else head = cur;
        cur->left = pre;//pre是否为null对这句没有影响,且这句放在上面两句if else之前也是可以的。
        pre = cur;//pre指向当前的cur
        dfs(cur->right);//全部迭代完成后，pre指向双向链表中的尾节点
    }
};
```

### [剑指 Offer 37. 序列化二叉树](https://leetcode.cn/problems/xu-lie-hua-er-cha-shu-lcof/)

```cpp
class Codec {
public:

    // Encodes a tree to a single string.
    string serialize(TreeNode* root) {
        if (!root) return "#_";
        string res = to_string(root->val)+"_";
        res+=serialize(root->left);
        res+=serialize(root->right);
        return res;
    }

    // Decodes your encoded data to tree.
    TreeNode* deserialize(string data) {
        stringstream ss(data);
        string res;
        queue<string> que;
        while (getline(ss,res,'_')) que.push(res);
        return creat(que);
    }
    TreeNode* creat(queue<string> &que)
    {
        string front = que.front();
        que.pop();
        if (front == "#") return NULL;
        TreeNode* root = new TreeNode(stoi(front));
        root->left = creat(que);
        root->right = creat(que);
        return root;
    }

};
```

### [剑指 Offer 38. 字符串的排列](https://leetcode.cn/problems/zi-fu-chuan-de-pai-lie-lcof/)

```cpp
class Solution {
    vector<string> res;
    vector<bool> used;
    void backtracking(string &s,string &now)
    {
        if (now.size() == s.size())
        {
            res.push_back(now);
            return;
        }
        for (int i = 0; i < s.size(); ++i) {
            if (used[i] || i > 0 && s[i] == s[i-1] &&used[i-1] == false) continue;
            used[i] = true;
            now.push_back(s[i]);
            backtracking(s,now);
            now.pop_back();
            used[i] = false;
        }
    }
public:
    vector<string> permutation(string s) {
        std::sort(s.begin(), s.end());
        used.assign(s.size(), false);
        string now = "";
        backtracking(s,now);
        return res;
    }
};
```

### [剑指 Offer 39. 数组中出现次数超过一半的数字](https://leetcode.cn/problems/shu-zu-zhong-chu-xian-ci-shu-chao-guo-yi-ban-de-shu-zi-lcof/)

```cpp
class Solution {
    //摩尔投票法，遇到不同的抵消
public:
    int majorityElement(vector<int>& nums) {
        int cur = nums[0];
        int sum = 1;
        for (int i = 1; i < nums.size(); ++i) {
            if (nums[i] == cur) sum++;
            else sum--;
            if (sum == 0)
            {
                cur = nums[i];
                sum = 1;
            }
        }
        return cur;
    }
};
```

### [剑指 Offer 40. 最小的k个数](https://leetcode.cn/problems/zui-xiao-de-kge-shu-lcof/)

```cpp
class Solution {
public:
    vector<int> getLeastNumbers(vector<int>& arr, int k) {
        priority_queue<int,vector<int>> que;
        for (int i = 0; i < arr.size(); ++i) {
            que.push(arr[i]);
            if (que.size() > k) que.pop();
        }
        vector<int> res;
        while (!que.empty())
        {
            res.push_back(que.top());
            que.pop();
        }
        return res;
    }
};
//或者
class Solution {
public:
    vector<int> getLeastNumbers(vector<int>& arr, int k) {
        std::sort(arr.begin(), arr.end());
        return vector<int>(arr.begin(),arr.begin()+k);
    }
};
```

### [剑指 Offer 41. 数据流中的中位数](https://leetcode.cn/problems/shu-ju-liu-zhong-de-zhong-wei-shu-lcof/)

```cpp
class MedianFinder {
    map<int,int> res;
    int n = 0;
public:
    /** initialize your data structure here. */
    MedianFinder() {

    }

    void addNum(int num) {
        res[num]++;
        n++;
    }

    double findMedian() {
        //有一个
        if (n % 2 == 1)
        {
            int count = 0;
            for (auto x:res) {
                count+= x.second;
                if (count > n / 2) return x.first;
            }
            return 0;
        }
        else
        {
            //有两个
            int count = 0 ;
            double frist = 0, second = 0;
            bool findfirst = false , findse = false;
            for (auto x:res) {
                count+= x.second;
                if (findfirst && findse) break;
                if (!findfirst && count > n / 2)
                {
                    
                    frist = x.first;
                    findfirst = true;
                }
                if (!findse && count > n / 2 - 1 )
                {
                    second = x.first;
                    findse  = true;
                }

            }
            return (frist + second) / 2;
        }
    }
};
```



### [剑指 Offer 42. 连续子数组的最大和](https://leetcode.cn/problems/lian-xu-zi-shu-zu-de-zui-da-he-lcof/)

```cpp
class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        int maxs = 0 , res = nums[0];
        for (int i = 0; i < nums.size(); ++i) {
            maxs+=nums[i];
            res = max(maxs,res);
            if (maxs < 0) maxs = 0;
        }
        return res;
    }
};
```

### [剑指 Offer 43. 1～n 整数中 1 出现的次数](https://leetcode.cn/problems/1nzheng-shu-zhong-1chu-xian-de-ci-shu-lcof/)（未）

见题解：https://leetcode.cn/problems/1nzheng-shu-zhong-1chu-xian-de-ci-shu-lcof/solution/1n-zheng-shu-zhong-1-chu-xian-de-ci-shu-umaj8/

```cpp
class Solution {
public:
    int countDigitOne(int n) {
        // mulk 表示 10^k
        // 在下面的代码中，可以发现 k 并没有被直接使用到（都是使用 10^k）
        // 但为了让代码看起来更加直观，这里保留了 k
        long long mulk = 1;
        int ans = 0;
        for (int k = 0; n >= mulk; ++k) {
            ans += (n / (mulk * 10)) * mulk + min(max(n % (mulk * 10) - mulk + 1, 0LL), mulk);
            mulk *= 10;
        }
        return ans;
    }
};
```

### [剑指 Offer 44. 数字序列中某一位的数字](https://leetcode.cn/problems/shu-zi-xu-lie-zhong-mou-yi-wei-de-shu-zi-lcof/)

```cpp
class Solution {
public:
    int findNthDigit(int n) {
        if (n < 10) return n;
        long long c = 2 , nine = 90;
        n -= 10;
        while (n - c * nine > 0)
        {
            n -= c * nine;
            c++;
            nine *= 10;
        }

        long long shang = n / c;
        long long yu = n % c;
        //cout << shang + nine / 9 << " "<< yu <<endl;
        string s = to_string(shang + nine / 9);

        return stoi(s.substr(yu,1));
    }
};
```



### [剑指 Offer 46. 把数字翻译成字符串](https://leetcode.cn/problems/ba-shu-zi-fan-yi-cheng-zi-fu-chuan-lcof/)

```cpp
class Solution {
public:
    int translateNum(int num) {
        string numstr = to_string(num);
        vector<int> dp( numstr.size() + 1, 0);
        dp[0] = 1;
        dp[1] = 1;
        for (int i = 2; i <= numstr.size(); ++i) {
            if (numstr[i-2] == '1' || numstr[i-2] == '2' && numstr[i - 1] < '6')
            {
                dp[i] = dp[i - 1] + dp[i - 2];
            }
            else dp[i] = dp[i - 1];
        }
        return dp.back();
    }
};
```



### [剑指 Offer 47. 礼物的最大价值](https://leetcode.cn/problems/li-wu-de-zui-da-jie-zhi-lcof/)

```cpp
class Solution {
public:
    int maxValue(vector<vector<int>>& grid) {
        vector<vector<int>>dp(grid.size()+1,vector<int>(grid[0].size()+1,0));
        for (int i = 1; i <= grid.size(); ++i) {
            for (int j = 1; j <=  grid[0].size(); ++j) {
                dp[i][j] = max(dp[i-1][j] , dp[i][j-1]) + grid[i - 1][j - 1];
            }
        }
        return dp.back().back();
    }
};
```

### [剑指 Offer 48. 最长不含重复字符的子字符串](https://leetcode.cn/problems/zui-chang-bu-han-zhong-fu-zi-fu-de-zi-zi-fu-chuan-lcof/)

```cpp
class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        int start = 0 , fast = 0 , mas = 0;
        unordered_set<char> uset;
        while (fast < s.size())
        {
            
            if (uset.find(s[fast]) == uset.end()) 
            {
                uset.insert(s[fast]);
                //cout<< s[fast] <<" ";
                mas = max(fast - start + 1 , mas);
            }
            else
            {
                while (s[start] != s[fast]) 
                {
                    uset.erase(s[start]);
                    start++;
                }
                start++;
            }
            fast++;
        }
        return mas;
    }
};
```



### [剑指 Offer 49. 丑数](https://leetcode.cn/problems/chou-shu-lcof/)（未）

```cpp
class Solution {
public:
    int nthUglyNumber(int n) {
        int a = 0, b = 0 ,c = 0;
        vector<int> dp(n);
        dp[0] = 1;
        for (int i = 1; i < n; ++i) {
            int a1 = dp[a] * 2 , b1 = dp[b] * 3 , c1 = dp[c] * 5;
            dp[i] = min(a1, min(b1,c1));
            if (dp[i] == a1) a++;
            if (dp[i] == b1) b++;
            if (dp[i] == c1) c++;
        }
        return dp[n - 1];
    }
};

```



### [剑指 Offer 50. 第一个只出现一次的字符](https://leetcode.cn/problems/di-yi-ge-zhi-chu-xian-yi-ci-de-zi-fu-lcof/)

```cpp
class Solution {
public:
    char firstUniqChar(string s) {
        int uset[26] = {0};
        for (int i = 0; i < s.size(); ++i) uset[s[i] - 'a']++;
        for (int i = 0; i < s.size(); ++i) {
            if(uset[s[i] - 'a'] == 1) return s[i];
        }
        return ' ';
    }
};
```

### [剑指 Offer 51. 数组中的逆序对](https://leetcode.cn/problems/shu-zu-zhong-de-ni-xu-dui-lcof/)

```cpp
class Solution {
public:
    int reversePairs(vector<int>& nums) {
        vector<int> tmp(nums.size());
        return mergeSort(0, nums.size() - 1, nums, tmp);
    }
private:
    int mergeSort(int l, int r, vector<int>& nums, vector<int>& tmp) {
        // 终止条件
        if (l >= r) return 0;
        // 递归划分
        int m = (l + r) / 2;
        int res = mergeSort(l, m, nums, tmp) + mergeSort(m + 1, r, nums, tmp);
        // 合并阶段
        int i = l, j = m + 1;
        for (int k = l; k <= r; k++)
            tmp[k] = nums[k];
        for (int k = l; k <= r; k++) {
            if (i == m + 1)
                nums[k] = tmp[j++];
            else if (j == r + 1 || tmp[i] <= tmp[j])
                nums[k] = tmp[i++];
            else {
                nums[k] = tmp[j++];
                res += m - i + 1; // 统计逆序对
            }
        }
        return res;
    }
};
```



### [剑指 Offer 53 - I. 在排序数组中查找数字 I](https://leetcode.cn/problems/zai-pai-xu-shu-zu-zhong-cha-zhao-shu-zi-lcof/)（双二分）

```cpp
class Solution {
public:
    int search(vector<int>& nums, int target) {
        //二分查找
        int left1 = 0 , right1 = nums.size() - 1,left2 = 0 , right2 = nums.size() - 1;
        while (left1 <= right1) //right1
        {
            int mid = (left1 + right1) / 2;
            if(nums[mid] >= target) right1 = mid - 1;
            else left1 = mid + 1;
        }
        while (left2 <= right2) //去left2
        {
            int mid = (left2 + right2) / 2;
            if(nums[mid] <= target) left2 = mid + 1;
            else right2 = mid - 1;
        }
        return left2 - right1 - 1;
    }
};
```

### .[剑指 Offer 53 - II. 0～n-1中缺失的数字](https://leetcode.cn/problems/que-shi-de-shu-zi-lcof/)

```cpp
class Solution {
public:
    int missingNumber(vector<int>& nums) {
        return (nums.size() + 1) *( nums.size()) / 2 - std::accumulate(nums.begin(), nums.end(),0);
    }
};

```

### [剑指 Offer 54. 二叉搜索树的第k大节点](https://leetcode.cn/problems/er-cha-sou-suo-shu-de-di-kda-jie-dian-lcof/)

中序遍历（左中右）是递减的， （右中左则是递增的），安装右中左遍历第k个就行

```cpp
class Solution {
    int res = 0,count = 0;
public:
    int kthLargest(TreeNode* root, int k) {
        if (root)
        {
            kthLargest( root->right,  k);
            if (++count == k) return (res = root->val);
            kthLargest( root->left,  k);
        }
        return res;
    }
};

```

### [剑指 Offer 55 - I. 二叉树的深度](https://leetcode.cn/problems/er-cha-shu-de-shen-du-lcof/)

```cpp
class Solution {
public:
    int maxDepth(TreeNode* root) {
        if (!root) return 0;
        return max(maxDepth(root->left),maxDepth(root->right)) + 1;
    }
};
```



### [剑指 Offer 55 - II. 平衡二叉树](https://leetcode.cn/problems/ping-heng-er-cha-shu-lcof/)

```cpp
class Solution {
    int maxDepth(TreeNode* root) {
        if (!root) return 0;
        return max(maxDepth(root->left),maxDepth(root->right)) + 1;
    }
public:
    bool isBalanced(TreeNode* root) {
        if (!root) return true;
        bool left = isBalanced( root->left);
        bool right = isBalanced( root->right);
        if (abs(maxDepth(root->left) - maxDepth(root->right)) <=1 && left && right) return true;
        return false;
    }
};
```



### [剑指 Offer 56 - I. 数组中数字出现的次数](https://leetcode.cn/problems/shu-zu-zhong-shu-zi-chu-xian-de-ci-shu-lcof/)

```cpp
class Solution {
public:
    vector<int> singleNumbers(vector<int>& nums) {
        int r = 0;
        for (int i = 0; i < nums.size(); ++i) {
            r ^= nums[i];
        }

        int t1 = 0 ,t2 = 0 ,ls = (r == INT_MIN ? r : r & (-r));;
        for (int i = 0; i < nums.size(); ++i) {
            if ((nums[i] & ls) != 0) t1 ^= nums[i];
            else t2 ^= nums[i];
        }
        return {t1,t2};
    }
};
```

### [剑指 Offer 57. 和为s的两个数字](https://leetcode.cn/problems/he-wei-sde-liang-ge-shu-zi-lcof/)

```cpp
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        int left = 0 ,right = nums.size() - 1;
        while (right >= left)
        {
            if (nums[left] + nums[right] == target) return {nums[left] , nums[right]};
            if (nums[left] + nums[right] > target) right--;
            else left++;
        }
        return {};
    }
};
```



### [剑指 Offer 57 - II. 和为s的连续正数序列](https://leetcode.cn/problems/he-wei-sde-lian-xu-zheng-shu-xu-lie-lcof/)

```cpp
class Solution {
public:
    vector<vector<int>> findContinuousSequence(int target) {
        vector<vector<int>> res;
        int start = 1, end = 2;
        int sum = 3;
        while (start < end)
        {
            if (sum == target)
            {
                //cout << start <<endl;
                vector<int> temp;
                for (int i = start; i <= end; ++i) {
                    temp.emplace_back(i);
                }
                res.emplace_back(temp);

                sum-=start++;
            }
            else if(sum > target)sum-=start++;
            else sum+=++end;

            //cout << sum <<endl;
            
        }
        return res;
    }
};
```



### [剑指 Offer 58 - I. 翻转单词顺序](https://leetcode.cn/problems/fan-zhuan-dan-ci-shun-xu-lcof/)（未）

```cpp
class Solution {
public:
    string reverseWords(string s) {
        //去除首位空格以及多余空格
        int slow =0, fast=0;
        s.push_back(' ');
        while (s[fast]==' ')fast++;
        while (fast < s.size() - 1)
        {
            if (s[fast] == ' ' && s[fast+1] == ' ')fast++;
            else s[slow++] = s[fast++];
        }
        s.resize(slow);
        //翻转单词
        int tar = 0;
        for (int i = 0; i < s.size(); ++i) {
            if (i == s.size() - 1) reverse(s.begin()+tar,s.end());
            if (s[i] == ' ')
            {
                reverse(s.begin()+tar,s.begin()+i);
                tar = i + 1;
            }
        }

        //翻转整个字符串
        std::reverse(s.begin(), s.end());
        return s;
    }
};
```



### [剑指 Offer 59 - I. 滑动窗口的最大值](https://leetcode.cn/problems/hua-dong-chuang-kou-de-zui-da-zhi-lcof/)（未）

```cpp
class Solution {
public:
    class MyQueue { //单调队列（从大到小）
    public:
        deque<int> que; // 使用deque来实现单调队列
        void pop(int value) {
            if (!que.empty() && value == que.front()) {
                que.pop_front();
            }
        }
        void push(int value) {
            while (!que.empty() && value > que.back()) {
                que.pop_back();
            }
            que.push_back(value);
        }
        int front() {
            return que.front();
        }
    };
    vector<int> maxSlidingWindow(vector<int>& nums, int k) {
        MyQueue que;
        vector<int> result;
        for (int i = 0; i < k; i++) { // 先将前k的元素放进队列
            que.push(nums[i]);
        }
        
        result.push_back(que.front()); // result 记录前k的元素的最大值
        for (int i = k; i < nums.size(); i++) {
            que.pop(nums[i - k]); // 滑动窗口移除最前面元素
            que.push(nums[i]); // 滑动窗口前加入最后面的元素
            result.push_back(que.front()); // 记录对应的最大值
        }
        return result;
    }
};
```

### [剑指 Offer 60. n个骰子的点数](https://leetcode.cn/problems/nge-tou-zi-de-dian-shu-lcof/)(未)

```cpp
class Solution {
    //比较关键的两步，一步是“dp[j] = 0;”，一步是“if (j - cur < i-1)”。对于前一步，因为是从后往前逐个累加，
    // 在加到当前点数时，必须把原先存放的n-1个骰子的数据置0，否则累加出错。对于后一步，如果不加此判据，
    // 会取到n-2个骰子的数据，此时可认为是“脏数据”，
    // 会导致累加出错。从实际情况来分析，n-1个骰子的最小值就是n-1，不会比这再小，因此此处的判据是 i-1，而不是0；
public:
    vector<double> dicesProbability(int n) {
        int dp[70] = {0};
        for (int i = 1; i <= 6; i ++) {
            dp[i] = 1;
        }
        for (int i = 2; i <= n; i ++) {
            for (int j = 6*i; j >= i; j --) {
                dp[j] = 0;
                for (int cur = 1; cur <= 6; cur ++) {
                    if (j - cur < i-1) {
                        break;
                    }
                    dp[j] += dp[j-cur];
                }
            }
        }
        int all = pow(6, n);
        vector<double> ret;
        for (int i = n; i <= 6 * n; i ++) {
            ret.push_back(dp[i] * 1.0 / all);
        }
        return ret;
    }
};

```

### [剑指 Offer 62. 圆圈中最后剩下的数字](https://leetcode.cn/problems/yuan-quan-zhong-zui-hou-sheng-xia-de-shu-zi-lcof/)（难-未）

```cpp
class Solution {
public:
    int lastRemaining(int n, int m) {
        int ans = 0;
        // 最后一轮剩下2个人，所以从2开始反推
        for (int i = 2; i <= n; i++) {
            ans = (ans + m) % i;
        }
        return ans;
    }
};
```

### [剑指 Offer 63. 股票的最大利润](https://leetcode.cn/problems/gu-piao-de-zui-da-li-run-lcof/)

```cpp
class Solution {
public:
    int maxProfit(vector<int>& prices) {
        if (prices.empty()) return 0;
        //dp[0]保持持有或者买入 ， dp[1] 不持有()或者卖出
        vector<vector<int>> dp(prices.size(),vector<int>(2,0));
        dp[0][0] = -prices[0];
        for (int i = 1; i < prices.size(); ++i) {
            dp[i][0] = max(dp[i - 1][0],-prices[i]);
            dp[i][1] = max(dp[i - 1][1],dp[i-1][0] + prices[i]);
        }
        return dp.back()[1];
    }
};
```

### [剑指 Offer 64. 求1+2+…+n](https://leetcode.cn/problems/qiu-12n-lcof/)（未）

```cpp
class Solution {
public:
    int sumNums(int n) {
        n != 1 && (n += sumNums(n - 1));
        return n;
    }
};
```

### [剑指 Offer 65. 不用加减乘除做加法](https://leetcode.cn/problems/bu-yong-jia-jian-cheng-chu-zuo-jia-fa-lcof/)（未）

```cpp
class Solution {
public:
    int add(int a, int b) {
        while(b != 0) { // 当进位为 0 时跳出
            unsigned int c = (unsigned int)(a & b) << 1;  // c = 进位
            a ^= b; // a = 非进位和
            b = c; // b = 进位
        }
        return a;
    }
};
```

### [剑指 Offer 66. 构建乘积数组](https://leetcode.cn/problems/gou-jian-cheng-ji-shu-zu-lcof/)

```cpp
class Solution {
public:
    vector<int> constructArr(vector<int>& a) {
        if (a.size() <= 1) return a;
        vector<int> left(a.begin(),a.end());
        vector<int> right(a.begin(),a.end());

        //左边 + 右边
        left[0] = a[0] , right[a.size() - 1] = a.back();
        for (int i = 1 ,j = a.size() - 2; i < a.size() && j >= 0; ++i ,j--) {
            left[i] = left[i] * left[i - 1];
            right[j] = right[j] * right[j + 1];
        }
        //两边乘积
        a[0] = right[1];
        a[a.size() - 1] = left[a.size() - 2];
        for (int i = 1; i < a.size() - 1; ++i) {
            a[i] = left[i- 1] * right[i+1];
        }
        return a;
    }
};
```

### [剑指 Offer 68 - I. 二叉搜索树的最近公共祖先](https://leetcode.cn/problems/er-cha-sou-suo-shu-de-zui-jin-gong-gong-zu-xian-lcof/)

```cpp

class Solution {
public:
    TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {
        if (!root) return nullptr;
        if (root->val > p->val && root->val > q->val) return lowestCommonAncestor( root->left,  p, q);
        if (root->val < p->val && root->val < q->val) return lowestCommonAncestor( root->right,  p, q);
        return root;
    }
};
```

### [剑指 Offer 68 - II. 二叉树的最近公共祖先](https://leetcode.cn/problems/er-cha-shu-de-zui-jin-gong-gong-zu-xian-lcof/)

```cpp
class Solution {
public:
    TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {
        if (!root) return nullptr;
        if (root == p || root == q) return root;

        TreeNode* left = lowestCommonAncestor(root->left,   p,   q);
        TreeNode* right = lowestCommonAncestor(root->right, p,  q);

        if (left && right) return root;
        if (left && !right) return left;
        if (!left && right) return right;
        return nullptr;
    }
};
```

### [面试题13. 机器人的运动范围](https://leetcode.cn/problems/ji-qi-ren-de-yun-dong-fan-wei-lcof/)

```cpp
class Solution {
    void backtracking(int i, int j, int &k,vector<vector<bool>> &used)
    {
        if (i < 0 || j < 0 || i >= used.size() || j >= used[0].size() || used[i][j]) return;
        if (isvalid(i , j , k))
        {
            sums++;
            used[i][j] = true;
            backtracking(i+1, j, k,used);
            backtracking(i-1, j, k,used);
            backtracking(i, j+1, k,used);
            backtracking(i+1, j-1, k,used);
        }
    }
    bool isvalid(const int i , const int j , const int &k)
    {
        int sum = 0;
        string s = to_string(i);
        for (int l = 0; l < s.size(); ++l) sum += s[l] - '0';
        string s2 = to_string(j);
        for (int l = 0; l < s2.size(); ++l) sum += s2[l] - '0';
        return sum <= k;
    }
    int sums = 0;

public:
    int movingCount(int m, int n, int k) {
        //回溯法
        vector<vector<bool>> used(m,vector<bool>(n, false));
        backtracking(0, 0, k,used);
        return sums;
    }
};
```

### [面试题45. 把数组排成最小的数](https://leetcode.cn/problems/ba-shu-zu-pai-cheng-zui-xiao-de-shu-lcof/)（未）

```cpp
class Solution {
public:
    string minNumber(vector<int>& nums) {
        vector<string> strs;
        string res;
        for(auto num:nums) strs.push_back(to_string(num));
        sort(strs.begin(),strs.end(),compare);
        for(auto str:strs)
            res+=str;
        return res;
    }
private:
    static bool compare(const string &a,const string &b)
    {
        return a+b<b+a; //最重要的
    }
};
```

### [面试题59 - II. 队列的最大值](https://leetcode.cn/problems/dui-lie-de-zui-da-zhi-lcof/)（用另外一个队列存储单调队列）

```cpp
class MaxQueue {
    deque<int> org;
    deque<int> tmp;
public:
    MaxQueue() {

    }

    int max_value() {
        if (tmp.empty()) return -1;
        return tmp.front();
    }

    void push_back(int value) {
        org.push_back(value);
        while (!tmp.empty() && tmp.back() < value)tmp.pop_back();
        tmp.push_back(value);
    }

    int pop_front() {
        if (org.empty()) return -1;
        int top = org.front();
        org.pop_front();
        if (!tmp.empty() && top == tmp.front()) tmp.pop_front();
        return top;
    }
};
```

### [面试题61. 扑克牌中的顺子](https://leetcode.cn/problems/bu-ke-pai-zhong-de-shun-zi-lcof/)

```cpp
class Solution {
public:
    bool isStraight(vector<int>& nums) {
        int arr[14] = {0} , mins = 15 , maxs = 0;
        for (int i = 0; i < nums.size(); ++i) {
            if (nums[i])
            {
                mins = min(mins,nums[i]);
                maxs = max(maxs,nums[i]);
            }
            arr[nums[i]]++;

        }
        //cout << mins << maxs<<endl;
        if (maxs - mins >= 5) return false;
        for (int i = mins; i <= maxs; ++i) {
            if (arr[i] == 1) continue;
            if (arr[i] == 0 && arr[0] ) arr[0]--;
            else return false;
        }
        return true;
    }
};
```

### [面试题67. 把字符串转换成整数](https://leetcode.cn/problems/ba-zi-fu-chuan-zhuan-huan-cheng-zheng-shu-lcof/)（未）

```cpp
class Solution {
public:
    int strToInt(string str) {
        int st = 0;
        while (str[st] == ' ')st++;
        bool isfu = (str[st] == '-');
        if(str[st] == '-' || str[st] == '+') st++;
        int bndry = INT_MAX / 10;
        //int lenth = isfu ? str.size()- 1 - st++  :str.size() - st;
        //cout <<lenth << endl;
        int  res = 0;
        while (st < str.size())
        {
            if(str[st] < '0' || str[st] > '9') break;
            if (res > bndry || res == bndry && str[st] > '7') return isfu? INT_MIN : INT_MAX;
            res = 10 * res  + (str[st++] - '0');
        }
        return isfu ? -res:res;
    }
};
```

