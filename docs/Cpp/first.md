#### 常规题目（简单）

```c++
//1. 两数之和
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        vector<int> news; //初始化列表  两层循环

        for (int i = 0; i < nums.size(); ++i) {
            for (int j = i+1; j < nums.size(); ++j) {
                if (nums[i] + nums[j] == target)
                {
                    news.push_back(i);
                    news.push_back(j);
                }
            }
        }
        return news;
    }
};



//9. 回文数

class Solution {
public:
    bool isPalindrome(int x) {
        string s = to_string(x);
        for (int i = 0; i < s.size() /2; ++i) {
            if (s[i]!=s[s.size() -1 - i])
            {
                return false;
            }
        }
        return true;
    }
};



//13. 罗马数字转整数
class Solution {
    //阅读理解 个人感觉无意义
public:
    int romanToInt(string s) {
        int ret = 0;
        for(int i = 0; i < s.size(); i ++){
            if(s[i] == 'I' && s[i+1] == 'V') {ret += 4;i++; continue;}
            if(s[i] == 'I' && s[i+1] == 'X') {ret += 9;i++; continue;}
            if(s[i] == 'X' && s[i+1] == 'L') {ret += 40;i++; continue;}
            if(s[i] == 'X' && s[i+1] == 'C') {ret += 90;i++; continue;}
            if(s[i] == 'C' && s[i+1] == 'D') {ret += 400;i++; continue;}
            if(s[i] == 'C' && s[i+1] == 'M') {ret += 900;i++; continue;}

            if(s[i] == 'I') ret += 1;
            if(s[i] == 'V') ret += 5;
            if(s[i] == 'X') ret += 10;
            if(s[i] == 'L') ret += 50;
            if(s[i] == 'C') ret += 100;
            if(s[i] == 'D') ret += 500;
            if(s[i] == 'M') ret += 1000;
        }

        return ret;
    }
};


//14. 最长公共前缀
class Solution {
public:
    string longestCommonPrefix(vector<string>& strs) {

        //寻找最短数组
        int len = 0;
        int min = 10000000;
        for (int i = 0; i < strs.size(); ++i) {
            if (min > strs[i].size())
                min = strs[i].size();
        }

        //选择最长公共字串
        for (int i = 0; i < min; ++i) {

            for (int j = 0; j < strs.size(); ++j) {
                if (strs[0][i] != strs[j][i])
                {

                    return strs[0].substr(0,len);
                }

            }
            len++;

        }
        return strs[0].substr(0,len);
    }
};


//20. 有效的括号
class Solution {
    //栈
public:
    bool isValid(string s) {

        if(s.size() % 2!=0)//不是成对的直接返回0
        {
            return false;
        }
        //每个元素入栈
        stack<char> result;
        int i = 0;

        for (int i = 0; i < s.size(); ++i)
        {
            //cout << s.at(i) << endl;
            if (s.at(i) == '(' || s.at(i) == '[' || s.at(i) == '{' )
            {
                result.push(s.at(i));
            } else{
                if (result.empty()) return false;
                char ch = result.top();
                result.pop();
                if (s.at(i) ==')')
                {
                    if (ch!='(') return false;
                } else if(s.at(i) ==']')
                {
                    if (ch!='[') return false;
                }
                else if(s.at(i) =='}')
                {
                    if (ch!='{') return false;
                }
            }
        }
        if (result.empty())
        {
            return true;
        } else return false;




    }
};


//21. 合并两个有序链表
class Solution {
public:
    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {
        ListNode* preHead = new ListNode(-1);
        ListNode* temp = preHead;
        while (list1!=NULL && list2!=NULL )
        {
            if (list1->val < list2->val)
            {
                preHead->next = list1;

                list1 = list1->next;
                preHead = preHead->next;
            } else
            {
                preHead->next = list2;

                list2 = list2->next;
                preHead = preHead->next;
            }
        }
        preHead->next = (list1 == NULL) ? list2 :list1;
        return temp->next;
    }
};



//26. 删除有序数组中的重复项
class Solution {
    
public:
    int removeDuplicates(vector<int>& nums) {
        for (int i = 0; i < nums.size() - 1; ++i) {
            if (nums[i] == nums[i+1])
            {
                nums.erase((nums.begin()+i+1)); //删除下一个
                i--; //防止越界
            }
        }
        return nums.size();
    }
};

//27. 移除元素
class Solution {
public:
    int removeElement(vector<int>& nums, int val) {
        for (int i = 0; i < nums.size(); ++i) {
            if (nums[i]==val)
            {
                nums.erase(nums.begin()+i);
                i--;
            }
        }
        return nums.size();
    }
};

//35. 搜索插入位置
class Solution {
public:
    //考虑边界条件
    int searchInsert(vector<int>& nums, int target) {
        if (nums[0]>=target) return 0; //边界
        if (nums[nums.size()-1]==target) //边界
        return nums.size()-1;

        for (int i = 0; i < nums.size()-1; ++i) {
            if (target == nums[i])
            {
                return i;
            }
            if (nums[i]< target && nums[i+1]>target)
            {
                return i+1;
            }
        }
        return nums.size();
    }
};


//58. 最后一个单词的长度
class Solution {
public:
    int lengthOfLastWord(string s) {
        while (s[s.size()-1]==' ') //去掉末尾空格
        {
            s.erase(s.size()-1);
        }
        return s.length() -s.rfind(' ') -1;

    }
};



//66. 加一

class Solution {
public:
    //十进制相加超出了
    vector<int> plusOne(vector<int>& digits) {
        vector<int> result;
        int temp,p=0;
        for (int i = digits.size()-1; i>=0; --i) {

            if (i ==  digits.size()-1)
            {
                temp = digits[i] +1;
                if (temp == 10) p = 1;
                else p = 0;
            } else
            {
                temp = digits[i] + p;
                if (temp == 10) p = 1;
                else p = 0;
            }
            if (temp == 10) result.push_back(0);
            else result.push_back(temp);
        }
        //最后如果有进位则添加
        if (p)
        {
            result.push_back(p);
        }
        reverse(result.begin(), result.end());
        return result;


    }
};


//67. 二进制求和
class Solution {
public:
    string addBinary(string a, string b) {

        string s = "";
        int ma = max(a.size(),b.size());//找出最大的数长度
        int mi = min(a.size(),b.size());//找出最大的数长度
        int a_size = a.size(),b_size = b.size();//记录两者size
        int p = 0, temp=0;//进位和
        //遍历长度
        for (int i = 0; i < mi; ++i) {

            temp = a[a_size- i-1] -'0' + b[b_size- i-1] -'0' +p;
            p = temp / 2;
            temp = temp % 2;
            s.append(to_string(temp));
        }


        //处理剩余字符串
        if (a.size() >= b.size())
        {
            for (int i = mi; i < ma; ++i) {
                temp = a[a_size- i-1] -'0' +p;
                p = temp / 2;
                temp = temp % 2;
                s.append(to_string(temp));
            }
        } else{
            for (int i = mi; i < ma; ++i) {
                temp =  b[b_size- i-1] -'0' +p;
                p = temp / 2;
                temp = temp % 2;
                s.append(to_string(temp));
            }
        }
        if (p == 1) s.append("1");
        reverse(s.begin(), s.end());
        return s;

    }
};

//69. x 的平方根 
class Solution {
public:
    int mySqrt(int x) {

        long long temp = 0;
        while (true)
        {
            if (temp * temp == x) return temp;
            if (temp * temp < x) temp++;

            if (temp * temp < x && ((temp+1) * (temp+1)) > x) return temp;


        }

    }
};


//70. 爬楼梯 递归超时
class Solution {
public:
    map<int,int> ma;



    int climbStairs(int n) {
        if (n==0) return 0;
        if ( n == 1) return 1;
        if(n==2) return 2;
        else
        {
            map<int, int>::iterator pos1 = ma.find(n-1);
            map<int, int>::iterator pos2 = ma.find(n-2);
            if (pos1!=ma.end() && pos2!=ma.end())
            {
                return (*pos1).second + (*pos2).second;
            } else if (pos1==ma.end() && pos1==ma.end())
            {
                int p = climbStairs (n-1);
                int p2 = climbStairs (n-2);
                ma.insert(pair<int,int>(n-1,p));
                ma.insert(pair<int,int>(n-2,p2));
                return p + p2;

            } else if(pos1!=ma.end() && pos2==ma.end())
            {
                int p2 = climbStairs (n-2);
                ma.insert(pair<int,int>(n-2,p2));
                return (*pos1).second + p2;
            }
            else
            {
                int p = climbStairs (n-1);
                ma.insert(pair<int,int>(n-1,p));
                return p + (*pos2).second;
            }


        }
    }
};

//solution2 斐波那契数列找规律
class Solution {
public:
    int climbStairs(int n) {

        if (n == 0) return 0;
        if (n == 1) return 1;
        if (n == 2) return 2;
        int a[46] = {0};
        a[0]=0,a[1]=1,a[2]=2;
        for (int i = 3; i <= n; ++i) {
            a[i] = a[i-1] + a[i -2];
        }
        return a[n];
    }
};

//83. 删除排序链表中的重复元素
class Solution {
public:
    //注意边界条件
    ListNode* deleteDuplicates(ListNode* head) {
        ListNode* header = head;
        while (head!=NULL && head->next!=NULL)
        {
            if (head->val == head->next->val)
            {
                head->next = head->next->next;
            } else{
                head = head->next;
            }
        }
        return header;
    }
};


//88. 合并两个有序数组
class Solution {
public:
    void merge(vector<int>& nums1, int m, vector<int>& nums2, int n) {


        nums1.erase(nums1.begin()+m,nums1.end());

        for (int i = 0; i < n; ++i) {
            nums1.push_back(nums2[i]);
        }
        sort(nums1.begin(), nums1.end());
    }
};
```

#### 二叉数遍历





前序遍历

```c++

```

中序遍历

```c++

```

后续遍历

```c++

```

```c++
//寻找list列表里面所有的子列表
/*
方法：
一共有2的n次方种情况，因为对应下标元素取或者不取
对应0-2的n次方减一的二进制数，二进制数下标为1的话就取出该元素
*/
class Solution {
public:
    vector<vector<int>> subsets(vector<int>& nums) {

        int n = 0;
        vector<vector<int>> result;
        while (n < pow(2,nums.size()))
        {
            int temp = n;
            vector<int> vvector;
            for (int i = 0; i < nums.size(); ++i) {
                if (temp % 2)
                {
                    vvector.push_back(nums[i]);
                }
                temp = temp / 2;
            }
            result.push_back(vvector);
            n++;
        }
        return result;

    }
};
```

