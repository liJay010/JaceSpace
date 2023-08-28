# torch常用操作

## 1.分布式训练

```python
import torch, time, os, shutil
os.environ["CUDA_VISIBLE_DEVICES"] = '0,1,2,3'
import torch.backends.cudnn as cudnn
    
model = timm.create_model('efficientnet_b4', pretrained=True, num_classes=3)
model = torch.nn.DataParallel(model)  
cudnn.benchmark = True
model = model.cuda()
    
    
    
    
    
#验证如果要到CPU上
import collections
def DataParallel2CPU(model, pth_file):
    state_dict = torch.load(pth_file, map_location='cpu')['state_dict']	# 加载参数
    new_state_dict = collections.OrderedDict()	# 新建字典
    for k, v in state_dict.items():	# 遍历参数，并获取名和值
        if k[:7] == "module.":	# 如果名符合匹配，则截取后面的字符串作为新名字
            k = k[7:]  # remove `module.`
        new_state_dict[k] = v
    model.load_state_dict(new_state_dict)	# 此时，"module."该前缀被清理掉了
    return model
model = timm.create_model('efficientnet_b4', pretrained=False, num_classes=3)
model = DataParallel2CPU(model,'best_w.pth')
```

## 2.更改某一层网络

```python
#把最后一层改为
model.module.classifier = nn.Linear(in_features=1792, out_features=3, bias=True)
```



## 3.冻结模型参数

```python
for name, value in model.named_parameters():
        if not "classifier" in name: #满足这个条件
            value.requires_grad = False

params = filter(lambda p: p.requires_grad, model.parameters())
optimizer = optim.Adam(params, lr=config.lr)
```

