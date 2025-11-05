# AI 桌面分析工具

一个基于 AI 的桌面活动分析工具，可以录制屏幕活动并使用 Gemini AI 进行智能分析。

## 项目结构

- `backend/` - Node.js/Express 后端服务
- `frontend/` - React 前端应用

## 功能特点

- 🎥 屏幕录制功能
- 🤖 AI 智能分析（基于 Google Gemini）
- 📊 活动摘要和卡片展示
- 🔄 实时视频块上传和处理

## 技术栈

### 后端
- Node.js + Express
- TypeScript
- Fluent-FFmpeg（视频处理）
- Google Gemini AI API
- Multer（文件上传）

### 前端
- React
- TypeScript
- Ant Design
- Zustand（状态管理）

## 开发环境要求

- Node.js 16+
- FFmpeg（用于视频处理）
- Google Gemini API Key

## 安装和运行

### 1. 安装 FFmpeg

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt-get install ffmpeg
```

**Windows:**
下载并安装 [FFmpeg](https://ffmpeg.org/download.html)

### 2. 配置环境变量

在 `backend/` 目录创建 `.env` 文件：

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
```

### 3. 安装依赖

```bash
# 后端
cd backend
npm install

# 前端
cd ../frontend
npm install
```

### 4. 启动开发服务器

**方式一：使用启动脚本（推荐）**

返回项目根目录：
```bash
chmod +x start-dev.sh
./start-dev.sh
```

**方式二：手动启动**

后端（终端1）：
```bash
cd backend
npm run dev
```

前端（终端2）：
```bash
cd frontend
npm run dev
```

### 5. 访问应用

- 前端：http://localhost:5173
- 后端：http://localhost:3001

## 使用说明

1. 点击"开始录制"按钮
2. 选择要录制的屏幕或窗口
3. 进行你的桌面活动
4. 点击"停止并分析"
5. 等待 AI 分析完成
6. 查看活动摘要和建议

## API 端点

- `POST /api/analysis/upload` - 上传视频块
- `POST /api/analysis/analyze` - 开始分析

## 注意事项

- 确保已安装 FFmpeg
- 需要有效的 Google Gemini API Key
- 录制的视频会自动上传到后端处理
- 分析完成后临时文件会自动清理

## 开发者

Ddahuang324

## License

MIT
