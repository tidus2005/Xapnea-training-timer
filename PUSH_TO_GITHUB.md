# 推送到 GitHub

本地已完成：`git init`、首次提交。

## 步骤

1. **在 GitHub 上新建仓库**
   - 打开 https://github.com/new
   - Repository name 填：`apnea-training-timer`（或你喜欢的名字）
   - 选择 Public 或 Private
   - **不要**勾选 "Add a README"（本地已有代码）
   - 点 Create repository

2. **在本地添加远程并推送**（把下面的 `YOUR_USERNAME` 换成你的 GitHub 用户名，`apnea-training-timer` 若你改了仓库名也要换）

   ```bash
   cd /Users/tidux/apnea-training-timer
   git remote add origin https://github.com/YOUR_USERNAME/apnea-training-timer.git
   git push -u origin main
   ```

   若你使用 SSH：
   ```bash
   git remote add origin git@github.com:YOUR_USERNAME/apnea-training-timer.git
   git push -u origin main
   ```

3. 按提示登录或输入凭据后即可完成推送。
