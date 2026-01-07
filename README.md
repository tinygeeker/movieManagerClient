# 电影管理器

一个跨平台的电影管理客户端，支持Windows和macOS系统。

## 功能特性

- 自动扫描并管理指定文件夹下的所有电影
- 显示电影的详细信息，包括格式、时长、文件大小、分辨率等
- 支持文件夹导航，可返回上一级目录
- 电影卡片式显示，每页最多显示20部电影
- 鼠标悬浮时显示电影详情
- 点击电影卡片可直接播放电影
- 美观的彩色封面，支持从视频中提取帧作为封面
- 中文界面，操作简单直观

## 前提条件

### 基本运行条件
- Node.js
- npm 或 yarn
- Electron

### 可选依赖（用于获取更多视频信息）
- **ffprobe**：用于提取视频元数据（时长、分辨率、编码等）
- **ffmpeg**：用于从视频中提取帧作为封面

#### 安装方法
1. **Windows**：
   - 下载并安装 [FFmpeg](https://ffmpeg.org/download.html#build-windows)
   - 将ffmpeg添加到系统PATH环境变量中

2. **macOS**：
   - 使用Homebrew安装：`brew install ffmpeg`

3. **Linux**：
   - 使用包管理器安装：`sudo apt install ffmpeg`（Ubuntu/Debian）

## 安装与运行

1. 克隆或下载项目到本地
2. 进入项目目录
3. 安装依赖：`npm install`
4. 运行应用：`npm start`

## 使用方法

1. 将应用程序放在包含电影的文件夹中
2. 启动应用程序，它会自动扫描当前目录及其子目录中的电影文件
3. 点击电影卡片可直接播放电影
4. 鼠标悬浮在电影卡片上可查看电影详情
5. 点击左侧文件夹列表可导航到不同的文件夹
6. 使用分页控件可浏览更多电影

## 项目贡献

如果你觉得项目有用，就请我喝杯奶茶吧。 :tropical_drink:

![打赏二维码](https://tinygeeker.github.io/assets/user/donate.jpg)

## 许可证

ISC