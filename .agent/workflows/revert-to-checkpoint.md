---
description: 校正回施作前 - 恢復到施作前的版本
---

# 校正回施作前

當用戶說「校正回施作前」時，執行以下步驟：

## 舊專案 (Zeabur)
```powershell
cd "C:\Users\GP\Desktop\SausageMenu-main0222舊專案\SausageMenu-main"
git checkout -- .
git clean -fd
git reset --hard HEAD
```
如果 HEAD 不是「施作前」，用：
```powershell
git log --oneline -10
# 找到 "checkpoint: 施作前" 的 hash
git reset --hard <hash>
```

## 新專案 (Google Play)
```powershell
cd "C:\Users\GP\Desktop\SausageMenu-v201\SausageMenu-main"
git checkout -- .
git clean -fd
git reset --hard HEAD
```
如果 HEAD 不是「施作前」，用：
```powershell
git log --oneline -10
# 找到 "checkpoint: 施作前" 的 hash
git reset --hard <hash>
```

## 注意事項
- 此操作會丟棄所有未提交的變更
- 恢復後需要重新 `npm run dev` 啟動
