# 表格检测

## 1.论文资料

https://paperswithcode.com/sota/table-recognition-on-pubtabnet
https://github.com/hikopensource/DAVAR-Lab-OCR/tree/main/demo/table_recognition/lgpma
https://github.com/poloclub/unitable



## 2.convstem

### 资料

https://github.com/poloclub/tsr-convstem

https://github.com/poloclub/unitable

1. Train an instance of visual encoder with ResNet-18

```
make experiments/r18_e2_d4_adamw/.done_train_structure
```



1. Test + Compute teds score

```
make experiments/r18_e2_d4_adamw/.done_teds_structure
```



### 1.运行须知

#### 1.main函数修改：

加上数据集路径

cfg.dataset.root_dir = "/rxhui/lxj/download/PubTableNet/pubtabnet"

```
if cfg.trainer.mode == "train":
        log.info(printer(device, "Loading training dataset"))
        cfg.dataset.root_dir = "/rxhui/lxj/download/PubTableNet/pubtabnet"
        print(cfg)
        train_dataset = PubTabNet(
            root_dir=cfg.dataset.root_dir,
            json_html=cfg.dataset.json_html,
            label_type=cfg.dataset.label_type,
            split="train",
            transform=train_transform,
        )
```

#### 2.指定显卡

```python
import os

os.environ["CUDA_VISIBLE_DEVICES"] = "4,5,6,7"
```



### 3.调试

/rxhui/lxj/.vscode/launch.json：

```
{
            
            "python":"/rxhui/anaconda3/envs/adp/bin/python3.9",
            "name": "Table",
            "type": "python",
            "request": "launch",
            "program": "/rxhui/anaconda3/envs/adp/lib/python3.9/site-packages/torch/distributed/run.py",
            "console": "integratedTerminal",
            "cwd":"/rxhui/lxj/workspace/table_rec/tsr-convstem-main/src/",
            "env": {
                "CUDA_VISIBLE_DEVICES": "4,5,6,7"
            },
 
            "justMyCode": false,
            "args": [
                "--rdzv-backend", "c10d",
                "--rdzv_endpoint", "localhost:0",
                "--nnodes", "1",
                "--nproc_per_node", "4",
                "/rxhui/lxj/workspace/table_rec/tsr-convstem-main/src/main.py",
                "++name=r18_e2_d4_adamw",
                "model/model/backbone=imgcnn",
                "++model.model.encoder.nlayer=2",
                "++model.model.decoder.nlayer=4",
                "++model.model.backbone.backbone._target_=torchvision.models.resnet18",
                "++model.model.backbone.output_channels=512",
                "trainer/train/optimizer=adamw",
                "++trainer.train.batch_size=48",
                "++trainer.valid.batch_size=48",
                "++trainer.mode=train"
            ]
        },
```

