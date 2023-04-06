# 剑指offer

### [剑指 Offer 03. 数组中重复的数字](https://leetcode.cn/problems/shu-zu-zhong-zhong-fu-de-shu-zi-lcof/)

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

