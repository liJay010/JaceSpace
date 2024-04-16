import os

def remove_suffix(directory):
    for filename in os.listdir(directory):
        if "【瑞客论坛 www.ruike1.com】" in filename:
            new_filename = filename.replace("【瑞客论坛 www.ruike1.com】", "")
            os.rename(os.path.join(directory, filename), os.path.join(directory, new_filename))

# 调用函数，传入包含要重命名文件的目录路径
remove_suffix("assets")