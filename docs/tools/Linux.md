##  Linux打包压缩命令

### tar 打包压缩命令

```
作用: 对文件进行打包、解包、压缩、解压
语法: tar  [-zcxvf]  fileName  [files]
    包文件后缀为.tar表示只是完成了打包，并没有压缩
    包文件后缀为.tar.gz表示打包的同时还进行了压缩

说明:
    -z: z代表的是gzip，通过gzip命令处理文件，gzip可以对文件压缩或者解压
    -c: c代表的是create，即创建新的包文件
    -x: x代表的是extract，实现从包文件中还原文件
    -v: v代表的是verbose，显示命令的执行过程
    -f: f代表的是file，用于指定包文件的名称

举例：
    打包
        tar -cvf hello.tar ./*		  		将当前目录下所有文件打包，打包后的文件名为hello.tar
        tar -zcvf hello.tar.gz ./*		  	将当前目录下所有文件打包并压缩，打包后的文件名为hello.tar.gz
		
    解包
        tar -xvf hello.tar		  			将hello.tar文件进行解包，并将解包后的文件放在当前目录
        tar -zxvf hello.tar.gz		  		将hello.tar.gz文件进行解压，并将解压后的文件放在当前目录
        tar -zxvf hello.tar.gz -C /usr/local     将hello.tar.gz文件进行解压，并将解压后的文件放在/usr/local目录

```



### Linux挂载硬盘

```sh
#查看 目录 挂载在哪个硬盘
df -h 目录
#查看 所有挂载的硬盘
df -h 

#查看 所有挂载的硬盘 和 没有挂载的硬盘
lsblk -f

#挂载硬盘 /dev/sdd1 到 /mnt/disk6_brain 目录
sudo mount /dev/sdd1 /mnt/disk6_brain 目录
```



### tmux后台（可一直保活，用于nohup需要输入密码的情况）

```sh
#创建一个名为 XXX的后台窗口
tmux new -s XXX

#列出所有会话：
tmux list-sessions

#连接到已存在的会话：
tmux attach-session -t session-name

#杀死会话：
tmux kill-session -t session-name

```

## 梯子

clash开端口

```
export https_proxy=http://127.0.0.1:7890 http_proxy=http://127.0.0.1:7890 all_proxy=socks5://127.0.0.1:7890
```



## VScode调试

```json
{
    // 使用 IntelliSense 了解相关属性。 
    // 悬停以查看现有属性的描述。
    // 欲了解更多信息，请访问: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    //"pythonPath":"/home/lxj/anaconda3/envs/layoutlmv3/bin/python3.7",

    "configurations": [
    
        {
            "python":"/home/lxj/anaconda3/envs/layoutlmv3/bin/python3.7",
            "name": "LayoutLMV3",
            "type": "python",
            "request": "launch",
            "program": "/data1/lxj/workspace/layout/unilm/layoutlmv3/examples/object_detection/train_net.py",
            "console": "integratedTerminal",
            "env": {
                "CUDA_VISIBLE_DEVICES": "1"
            },
            "justMyCode": true,
            "args": [
                "--config-file",
                "/data1/lxj/workspace/layout/unilm/layoutlmv3/examples/object_detection/cascade_layoutlmv3.yaml",
                "--num-gpus",
                "1",
            ]
        },
        {
            "name": "DINO-res50",
            "type": "python",
            "request": "launch",
            "program": "/data1/lxj/workspace/layout/unilm/layoutlmv3/examples/object_detection/train_net.py",
            "console": "integratedTerminal",
            "env": {
                "CUDA_VISIBLE_DEVICES": "1"
            },
            "justMyCode": true,
            "args": [
                "--config-file",
                "/data1/lxj/workspace/layout/unilm/layoutlmv3/examples/object_detection/cascade_layoutlmv3.yaml",
                "--num-gpus",
                "1",
            ]
        },
        {
            "name": "DINO-swin",
            "type": "python",
            "request": "launch",
            "program": "/data1/lxj/workspace/doclayout/DINO/main.py",
            "console": "integratedTerminal",
            "justMyCode": true,
            "args": [
                "--output_dir",
                "/data1/lxj/workspace/doclayout/DINO/logs/DINO/Swin-MS4",
                "-c",
                "/data1/lxj/workspace/doclayout/DINO/config/DINO/DINO_4scale_swin.py",
                "--coco_path",
                "/data1/lxj/workspace/doclayout/DINO/data",
                "--options",
                "dn_scalar=100 embed_init_tgt=TRUE",
                "dn_label_coef=1.0 dn_bbox_coef=1.0 use_ema=False dn_box_noise_scale=1.0"
            ]
        },
        {
            "name": "DINO-swin-5cale",
            "type": "python",
            "request": "launch",
            "program": "/data1/lxj/workspace/doclayout/DINO/main.py",
            "console": "integratedTerminal",
            "justMyCode": true,
            "args": [
                "--output_dir",
                "/data1/lxj/workspace/doclayout/DINO/logs/DINO/DINO_5scale.py",
                "-c",
                "/data1/lxj/workspace/doclayout/DINO/config/DINO/DINO_4scale_swin.py",
                "--coco_path",
                "/data1/lxj/workspace/doclayout/DINO/data",
                "--options",
                "dn_scalar=100 embed_init_tgt=TRUE",
                "dn_label_coef=1.0 dn_bbox_coef=1.0 use_ema=False dn_box_noise_scale=1.0"
            ]
        },
    ]
}
```

## 添加显卡环境变量

```
export CUDA_VISIBLE_DEVICES=3 && python ***
```

## github time out

https://blog.csdn.net/tom_wong666/article/details/128961438
