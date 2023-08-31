# pytorch学习笔记——timm库

​		本文转自https://www.myinqi.com/it/2792032.html

​		当提到计算机视觉的深度学习框架时，PyTorch无疑是最受欢迎的选择之一。PyTorch拥有强大的自动求导功能、易于使用的API和广泛的社区支持。而针对计算机视觉任务，timm库则是一个值得推荐的PyTorch扩展库。timm（**Timm is a model repository for PyTorch**）库提供了预训练模型、模型构建块和模型训练的实用工具。timm库可以帮助开发者快速构建和训练深度学习模型，同时支持多种图像分类、分割和检测任务，特别是结合torch和torchvision的使用，对你训练模型，事半功倍。

　　本文将介绍timm库的基本用法，并使用timm库训练一个图像分类模型作为示例。本文将假设读者已经对PyTorch和计算机视觉的基本概念有一定的了解，下面详细说一下。

　　首先简单梳理一下timm的用途：

1. 图像分类（Image Classification）：Timm库包含了许多用于图像分类的预训练模型，如ResNet、VGG、EfficientNet等。你可以使用这些模型进行图像分类任务，如图像分类、图像回归等。

2. 使用EfficientNet模型进行图像分类：

3. ```python
   model = timm.create_model('efficientnet_b0', pretrained=True)
   ```

4. 使用ResNet模型进行图像分类：

5. ```python
   model = timm.create_model('resnet50', pretrained=True)
   ```

6. 目标检测（Object Detection）：Timm库提供了一系列在目标检测和物体识别任务上表现优秀的模型，如EfficientDet、YOLO、RetinaNet等。你可以使用这些模型进行目标检测和物体识别任务。

7. 使用EfficientDet模型进行目标检测：

8. ```python
   model = timm.create_model('efficientdet_d0', pretrained=True)
   ```

9. 使用YOLOv5模型进行目标检测：

10. ```python
    model = timm.create_model('yolov5s', pretrained=True)
    ```

11. 图像分割（Image Segmentation）：Timm库支持各种图像分割模型，如DeepLab、U-Net、PSPNet等。你可以使用这些模型进行图像分割任务，例如语义分割、实例分割等。

12. 使用DeepLabV3模型进行语义分割：

13. ```python
    model = timm.create_model('deeplabv3_resnet50', pretrained=True)
    ```

14. 使用PSPNet模型进行图像分割：

15. ```python
    model = timm.create_model('pspnet_resnet50', pretrained=True)
    ```

16. 模型微调和迁移学习：Timm库提供了方便的函数和工具，使你能够轻松地微调和迁移学习预训练模型。你可以使用Timm库中的模型作为基础模型，并在自己的数据集上进行微调。

17. 使用预训练的ResNet模型进行微调：

18. ```python
    model = timm.create_model('resnet50', pretrained=True) # 在新数据集上进行微调 # ...
    ```

19. 模型评估和验证：Timm库提供了各种评估指标和工具，用于模型的性能评估和验证。你可以使用这些工具来评估模型在不同任务上的性能，并进行模型选择和比较。

20. 使用Timm库提供的评估工具进行模型性能评估

　　总之，Timm库是一个功能齐全的模型库，涵盖了图像分类、目标检测、图像分割等多个计算机视觉任务，并提供了方便的接口和实用工具，简化了模型开发和实验过程。你可以根据具体的需求使用Timm库中的不同模型和功能来完成相应的任务。

　　下面来简单学习一下。

### 1，安装timm库

　　timm库可以通过pip命令进行安装：

```sh
pip install timm
```

　　安装完成后，我们在Python脚本或者Jupyter Notebook中导入timm库。

```sh
import timm
```

　　

### 2，加载预训练模型

　　timm库提供了多个预训练模型，这些模型可以在ImageNet等数据集上进行预训练，也可以在其他数据集上进行微调。

　　加载预训练模型的代码非常简单，下面我们加载需要的预训练模型权重：

```python
import timm
 
m = timm.create_model('vgg16', pretrained=True)
 
m.eval()
```

　　上面代码就会创建一个VGG-16的预训练模型，我们可以通过修改模型名称来加载其他预训练模型，例如：

```python
model = timm.create_model('efficientnet_b0', pretrained=True)
```

　　上面代码就会创建一个EfficientNet-B0的预训练模型。

　　加载所有的预训练模型列表（pprint是美化打印的标准库）：

```python
import timm
 
from pprint import pprint
 
model_names = timm.list_models(pretrained=True)
 
pprint(model_names)
 
>>> ['adv_inception_v3',
 
 'cspdarknet53',
 
 'cspresnext50',
 
 'densenet121',
 
 'densenet161',
 
 'densenet169',
 
 'densenet201',
 
 'densenetblur121d',
 
 'dla34',
 
 'dla46_c',
 
...
 ]
```

　　利用通配符加载所有的预训练模型列表：

```python
import timm
 
from pprint import pprint
 
model_names = timm.list_models('*resne*t*')
 
pprint(model_names)
 
>>> ['cspresnet50',
 
 'cspresnet50d',
 
 'cspresnet50w',
 
 'cspresnext50',
 
...
 
]
```

　　

### 3，构建自定义模型

　　如果需要自定义模型，我们可以使用timm库提供的模型构建块。模型构建块是模型的组成部分，可以灵活的组合和定制。例如我们可以使用timm库提供的ConvBnAct模块来定义一个卷积-BatchNorm-ReLU的模型构建块：

```python
import torch.nn as nn
 
from timm.models.layers import ConvBnAct
 
block = ConvBnAct(in_channels=3, out_channels=64, kernel_size=3, stride=1, act_layer=nn.ReLU)
 
print(block)
```

　　这个代码会创建一个输入通道为3、输出通道为64、卷积核大小为3、步长为1、激活函数为ReLU的卷积-BatchNorm-ReLU模块。

　　我们打印一下，可以清晰的看到结果：

```python
ConvNormAct(
 
  (conv): Conv2d(3, 64, kernel_size=(3, 3), stride=(1, 1), padding=(1, 1), bias=False)
 
  (bn): BatchNormAct2d(
 
    64, eps=1e-05, momentum=0.1, affine=True, track_running_stats=True
 
    (drop): Identity()
 
    (act): ReLU(inplace=True)
 
  )
 
)
```

　　

　　再来一个示例：

```python
import timm
 
class CustomModel(timm.models.VisionTransformer):
 
    def __init__(self, **kwargs):
 
        super().__init__(**kwargs)
 
        self.head = torch.nn.Linear(self.head.in_features, num_classes)
 
model = CustomModel(img_size=224, patch_size=16, embed_dim=768, depth=12, num_heads=12, num_classes=100)
```

　　在上面的代码中，我们创建了一个继承自timm库中VisionTransformer的自定义模型，并修改了模型的输出层以适应我们的任务。

### 4，训练图像分类模型

　　下面我们将介绍如何使用timm库训练和测试图像分类模型。timm库是一个用于计算机视觉任务的PyTorch库，它提供了许多预训练模型和常用的计算机视觉工具。我们将使用CIFAR-10数据集作为示例。

#### 1，准备数据集

　　首先，我们需要准备CIFAR-10数据集。我们可以使用torchvision库来下载和加载数据集：

```python
import torch
 
import torchvision
 
import torchvision.transforms as transforms
 
# 数据预处理
 
transform = transforms.Compose([
 
    transforms.RandomHorizontalFlip(),
 
    transforms.RandomCrop(32, padding=4),
 
    transforms.ToTensor(),
 
    transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
 
])
 
# 加载CIFAR-10数据集
 
trainset = torchvision.datasets.CIFAR10(root='./data', train=True, download=True, transform=transform)
 
trainloader = torch.utils.data.DataLoader(trainset, batch_size=100, shuffle=True, num_workers=2)
 
testset = torchvision.datasets.CIFAR10(root='./data', train=False, download=True, transform=transform)
 
testloader = torch.utils.data.DataLoader(testset, batch_size=100, shuffle=False, num_workers=2)
```

#### 2，创建模型

　　接下来，我们将使用timm库创建一个预训练的ResNet50模型，并修改输出层以适应CIFAR-10数据集：

```python
import timm
 
model = timm.create_model('resnet50', pretrained=True, num_classes=10)
```

　　

#### 3，训练模型

　　现在我们可以开始训练模型。我们将使用交叉熵损失函数和Adam优化器：

```python
import torch.optim as optim
 
criterion = torch.nn.CrossEntropyLoss()
 
optimizer = optim.Adam(model.parameters(), lr=0.001)
 
# 训练模型
 
num_epochs = 10
 
device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
 
model.to(device)
 
for epoch in range(num_epochs):
 
    running_loss = 0.0
 
    for i, data in enumerate(trainloader, 0):
 
        inputs, labels = data
 
        inputs, labels = inputs.to(device), labels.to(device)
 
        optimizer.zero_grad()
 
        outputs = model(inputs)
 
        loss = criterion(outputs, labels)
 
        loss.backward()
 
        optimizer.step()
 
        running_loss += loss.item()
 
    print(f"Epoch {epoch + 1}, Loss: {running_loss / (i + 1)}")
```

　　

#### 4，测试模型

　　训练完成后，我们可以使用测试数据集评估模型的性能：

```python
correct = 0
 
total = 0
 
model.eval()
 
with torch.no_grad():
 
    for data in testloader:
 
        images, labels = data
 
        images, labels = images.to(device), labels.to(device)
 
        outputs = model(images)
 
        _, predicted = torch.max(outputs.data, 1)
 
        total += labels.size(0)
 
        correct += (predicted == labels).sum().item()
 
print(f"Accuracy on test set: {100 * correct / total}%")
```

#### 5，整体图像分类模型代码

　　下面是一个简单的图像分类示例，使用timm库中的ResNet50模型：

```python
import torch
 
import timm
 
from PIL import Image
 
import torchvision.transforms as transforms
 
# 加载ResNet50模型
 
model = timm.create_model('vgg16', pretrained=True)
 
# 将模型设置为评估模式
 
model.eval()
 
# 加载图像并进行预处理
 
image = Image.open(r"D:\Desktop\workdata\data\segmentation_dataset\images\Abyssinian_24.jpg")
 
# 定义图像预处理转换
 
preprocess = transforms.Compose([
 
    transforms.Resize((256, 256)),  # 调整图像大小为256x256
 
    transforms.ToTensor(),  # 转换为Tensor类型
 
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),  # 归一化
 
])
 
# 应用预处理转换
 
processed_image = preprocess(image)
 
# 查看处理后的图像形状和数值范围
 
print("Processed image shape:", processed_image.shape)
 
print("Processed image range:", processed_image.min(), "-", processed_image.max())
 
# 5. 可选：将处理后的图像转换回PIL图像对象
 
processed_pil_image = transforms.ToPILImage()(processed_image)
 
# 6. 可选：显示处理后的图像
 
processed_pil_image.show()
 
# 将输入张量转换为批处理张量
 
input_batch = processed_image.unsqueeze(0)
 
# 将输入张量传递给模型并获取输出
 
with torch.no_grad():
 
    output = model(input_batch)
 
# 获取预测结果
 
_, predicted = torch.max(output.data, 1)
 
# 打印预测结果
 
print(predicted.item())
```

　　

　　在上面的代码中，我们首先加载了ResNet50模型，并将其设置为评估模式。然后，我们加载了一个图像，并使用timm库中的预处理函数对其进行预处理。接下来，我们将输入张量转换为批处理张量，并将其传递给模型以获取输出。最后，我们使用torch.max函数获取预测结果，并将其打印出来。

### 5，特征提取

　　timm中所有模型都可以从模型中获取各种类型的特征，用于除分类之外的任务。

#### 1，获取Penultimate Layer Features:

　　Penultimate Layer Features的中文含义是 "倒数第2层的特征"，即 classifier 之前的特征。timm 库可以通过多种方式获得倒数第二个模型层的特征，而无需进行模型的手术。

```python
import torch
 
import timm
 
m = timm.create_model('resnet50', pretrained=True, num_classes=1000)
 
o = m(torch.randn(2, 3, 224, 224))
 
print(f'Pooled shape: {o.shape}')
 
# Pooled shape: torch.Size([2, 2048])
```

　　获取分类器之后的特征：

```python
import torch
 
import timm
 
m = timm.create_model('ese_vovnet19b_dw', pretrained=True)
 
o = m(torch.randn(2, 3, 224, 224))
 
print(f'Original shape: {o.shape}')
 
m.reset_classifier(0)
 
o = m(torch.randn(2, 3, 224, 224))
 
print(f'Pooled shape: {o.shape}')
 
# Pooled shape: torch.Size([2, 1024])
```

　　输出多尺度特征：默认情况下，大多数模型将输出5个stride（并非所有模型都有那么多），第一个从 stride=2开始（有些从1，4开始）。

```python
import torch
 
import timm
 
m = timm.create_model('resnest26d', features_only=True, pretrained=True)
 
o = m(torch.randn(2, 3, 224, 224))
 
for x in o:
 
  print(x.shape)
 
# output
 
torch.Size([2, 64, 112, 112])
 
torch.Size([2, 256, 56, 56])
 
torch.Size([2, 512, 28, 28])
 
torch.Size([2, 1024, 14, 14])
 
torch.Size([2, 2048, 7, 7])
```

　　当你在使用timm库进行特征提取时，可以选择使用`create_model`函数的`features_only`参数来直接返回模型的特征提取部分，而不包括分类器部分。这可以帮助简化代码，避免手动移除最后一层分类器。

　　也可以手动去除，代码如下：

```python
import torch
 
import timm
 
# 1. 加载预训练模型
 
model = timm.create_model('resnet50', pretrained=True)
 
# 2. 移除最后一层分类器
 
model = torch.nn.Sequential(*list(model.children())[:-1])
 
# 3. 设置模型为评估模式
 
model.eval()
 
# 4. 加载图像
 
input = torch.randn(1, 3, 224, 224)  # 假设输入为224x224的RGB图像
 
# 5. 特征提取
 
features = model(input)
 
# 6. 打印提取到的特征
 
print("Features shape:", features.shape)
```

　　　　在上述示例中，我们使用timm库加载了一个预训练的ResNet-50模型，并通过移除最后一层分类器来获得特征提取模型。然后，我们将模型设置为评估模式（`model.eval()`）以确保不进行训练。接下来，我们加载输入图像，并将其传递给模型以获取特征表示。最后，我们打印出提取到的特征的形状。

### 6，模型融合

　　模型融合是一种提高模型性能的有效方法。当涉及到更复杂的模型融合时，以下是一些深层次的技巧和注意事项：

1. **模型选择和组合**：选择具有不同架构和特性的模型进行融合，例如卷积神经网络（CNN）、循环神经网络（RNN）和注意力机制（Attention）。确保选择的模型能够相互补充，以提高整体性能。

2. **特征融合**：除了融合模型输出，还可以考虑融合模型的中间层特征。通过提取和融合模型的不同层级特征，可以获得更丰富和多样化的信息。

3. **加权融合**：为每个模型分配适当的权重，以平衡其贡献。权重可以基于预训练模型的性能、验证集表现等进行选择，也可以通过训练得到。

4. **模型蒸馏**：使用一个更大、更复杂的模型（教师模型）来指导训练一个较小、更轻量级的模型（学生模型）。学生模型可以通过蒸馏教师模型的知识，从而提高模型的泛化能力。

5. **集成学习**：除了简单的模型融合，可以尝试集成学习方法，如投票、堆叠（stacking）、混合（blending）等。这些方法通过结合多个模型的预测结果，提高模型的鲁棒性和准确性。

6. **数据增强**：对训练数据进行多样化的增强操作，如随机裁剪、旋转、翻转等，以增加数据的多样性和模型的鲁棒性。确保在融合模型中使用相同的数据增强方式，以保持一致性。

7. **模型选择和调优**：通过交叉验证等方法，选择最佳的模型组合并进行超参数调优。可以使用网格搜索、随机搜索等技术来搜索最佳超参数组合。

　　总之，模型融合是一个灵活且有挑战性的任务，需要结合具体问题和数据集来进行调整和优化。不同的技巧和策略适用于不同的场景，因此需要不断实验和调整以找到最佳的模型融合方法。

　　以下是一个使用timm库进行模型融合的示例：

```python
import torch
 
import timm
 
class ModelEnsemble(torch.nn.Module):
 
    def __init__(self, models):
 
        super().__init__()
 
        self.models = torch.nn.ModuleList(models)
 
    def forward(self, x):
 
        outputs = [model(x) for model in self.models]
 
        return torch.mean(torch.stack(outputs), dim=0)
 
# 加载多个预训练模型
 
model1 = timm.create_model('resnet18', pretrained=True, num_classes=100)
 
model2 = timm.create_model('vgg16', pretrained=True, num_classes=100)
 
# 创建模型融合
 
ensemble = ModelEnsemble([model1, model2])
 
# 使用融合模型进行预测
 
output = ensemble(input_tensor)
```

　　在上面的代码中，我们首先加载了两个预训练模型。然后，我们创建了一个模型融合类，该类将多个模型的输出进行平均。最后，我们使用融合模型进行预测。

　　我们打印一下模型结构，我省略一些代码，只show关键点：

```python
ModelEnsemble(
 
  (models): ModuleList(
 
    (0): ResNet(
 
      (conv1): Conv2d(3, 64, kernel_size=(7, 7), stride=(2, 2), padding=(3, 3), bias=False)
 
      (bn1): BatchNorm2d(64, eps=1e-05, momentum=0.1, affine=True, track_running_stats=True)
 
      (act1): ReLU(inplace=True)
 
      (maxpool): MaxPool2d(kernel_size=3, stride=2, padding=1, dilation=1, ceil_mode=False)
 
      (layer1): Sequential(
 
      ........ （这里省略了ResNet的网络结构）
 
      )
 
      (global_pool): SelectAdaptivePool2d (pool_type=avg, flatten=Flatten(start_dim=1, end_dim=-1))
 
      (fc): Linear(in_features=512, out_features=100, bias=True)
 
    )
 
    (1): VGG(
 
      (features): Sequential(
 
        (0): Conv2d(3, 64, kernel_size=(3, 3), stride=(1, 1), padding=(1, 1))
 
        (1): ReLU(inplace=True)
 
        (2): Conv2d(64, 64, kernel_size=(3, 3), stride=(1, 1), padding=(1, 1))
 
        (3): ReLU(inplace=True)
 
        (4): MaxPool2d(kernel_size=2, stride=2, padding=0, dilation=1, ceil_mode=False)
 
        .......(这里省略了VGG16的模型结构)
 
      )
 
      (pre_logits): ConvMlp(
 
        (fc1): Conv2d(512, 4096, kernel_size=(7, 7), stride=(1, 1))
 
        (act1): ReLU(inplace=True)
 
        (drop): Dropout(p=0.0, inplace=False)
 
        (fc2): Conv2d(4096, 4096, kernel_size=(1, 1), stride=(1, 1))
 
        (act2): ReLU(inplace=True)
 
      )
 
      (head): ClassifierHead(
 
        (global_pool): SelectAdaptivePool2d (pool_type=avg, flatten=Flatten(start_dim=1, end_dim=-1))
 
        (fc): Linear(in_features=4096, out_features=100, bias=True)
 
        (flatten): Identity()
 
      )
 
    )
 
  )
 
)
```

　　在上面模型融合过程中，首先将输入图像传递给第一个模型，获取其输出特征。然后，将这些特征作为输入传递给第二个模型，以获得最终的分类结果。通过对两个模型的输出进行融合，可以综合利用它们的优势，提高整体性能或泛化能力。

　　需要注意的是，这只是一个简单的示例，实际的模型融合可能涉及更复杂的策略和技巧。具体的模型融合方法取决于任务的需求和数据集的特点。可以根据实际情况进行调整和改进，以获得更好的结果 。

　　当涉及更复杂的模型融合时，常见的技术包括集成学习方法，如堆叠集成和投票集成。下面是一个更复杂的模型融合示例，使用堆叠集成的方法：

```python
import torch
 
import timm
 
# 1. 加载并初始化要融合的模型
 
model1 = timm.create_model('resnet50', pretrained=True)
 
model2 = timm.create_model('efficientnet_b0', pretrained=True)
 
model3 = timm.create_model('densenet121', pretrained=True)
 
# 2. 定义融合模型
 
class FusionModel(torch.nn.Module):
 
    def __init__(self, model1, model2, model3):
 
        super(FusionModel, self).__init__()
 
        self.model1 = model1
 
        self.model2 = model2
 
        self.model3 = model3
 
        self.fc = torch.nn.Linear(3, 1)  # 假设最终输出为单个值
 
    def forward(self, x):
 
        output1 = self.model1(x)
 
        output2 = self.model2(x)
 
        output3 = self.model3(x)
 
        fused_output = torch.cat([output1, output2, output3], dim=1)
 
        fused_output = self.fc(fused_output)
 
        return fused_output
 
# 3. 创建融合模型实例
 
fusion_model = FusionModel(model1, model2, model3)
 
# 4. 使用融合模型进行推理
 
input = torch.randn(1, 3, 224, 224)  # 假设输入为224x224的RGB图像
 
output = fusion_model(input)
 
# 5. 打印输出结果
 
print("Fused output shape:", output.shape)
```

　　在上述示例中，我们加载了三个预训练模型，并使用堆叠集成的方法将它们的输出连接在一起。连接后的输出经过一个全连接层进行进一步处理，最终得到融合模型的输出。