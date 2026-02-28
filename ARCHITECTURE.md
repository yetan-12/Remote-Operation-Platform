# RoboData 架构文档

## 项目概述
机械臂遥操采集平台 - 一个用于管理数据采集、审核和平台管理的系统。

## 技术栈
- React 18
- TypeScript
- Tailwind CSS v4.0
- Recharts (数据可视化)

## 核心架构设计

### 1. 高度解耦的模块化设计
系统采用了严格的模块化和解耦设计，每个模块职责单一，便于维护和扩展。

### 2. 目录结构

```
/src/app/
├── App.tsx                          # 应用根组件
├── types/
│   └── index.ts                     # 所有TypeScript类型定义
├── constants/
│   └── index.ts                     # 所有常量配置
├── contexts/
│   └── AuthContext.tsx              # 认证上下文（状态管理）
├── utils/
│   └── session.ts                   # 会话管理工具函数
├── components/
│   ├── Router.tsx                   # 路由组件（懒加载）
│   ├── LoginPage.tsx                # 登录页面
│   ├── Header/                      # 头部组件模块
│   │   ├── index.tsx                # 主组件
│   │   ├── Navigation.tsx           # 导航子组件
│   │   ├── UserMenu.tsx             # 用户菜单子组件
│   │   └── LogoutConfirmDialog.tsx  # 登出确认对话框
│   ├── CollectorDashboard.tsx       # 采集员仪表板
│   ├── ReviewerDashboard.tsx        # 审核员仪表板
│   ├── PlatformDashboard.tsx        # 平台管理仪表板
│   ├── DeviceManagement.tsx         # 设备管理
│   ├── UserManagement.tsx           # 用户管理
│   ├── OperationLog.tsx             # 操作日志
│   └── ui/                          # 通用UI组件
```

## 核心模块说明

### 1. Types（类型系统）
**位置**: `/src/app/types/index.ts`
**职责**: 
- 定义所有TypeScript接口和类型
- 保证类型安全和代码提示
- 集中管理，便于维护

**主要类型**:
- `User`: 用户信息
- `UserRole`: 用户角色
- `PageType`: 页面类型
- `SessionData`: 会话数据
- `AccountConfig`: 账户配置

### 2. Constants（常量配置）
**位置**: `/src/app/constants/index.ts`
**职责**:
- 集中管理所有常量
- 避免硬编码
- 便于配置修改

**主要常量**:
- `DEFAULT_ACCOUNTS`: 默认账户列表
- `SESSION_TIMEOUT`: 会话超时时间（30分钟）
- `SESSION_STORAGE_KEY`: LocalStorage键名
- `ROLE_NAMES`: 角色名称映射
- `PAGE_TITLES`: 页面标题映射

### 3. Utils（工具函数）
**位置**: `/src/app/utils/session.ts`
**职责**:
- 提供纯函数工具
- 会话管理相关逻辑
- 可独立测试

**主要函数**:
- `generateSessionId()`: 生成会话ID
- `getCurrentTimestamp()`: 获取当前时间戳
- `saveSession()`: 保存会话到localStorage
- `restoreSession()`: 从localStorage恢复会话
- `clearSession()`: 清除会话
- `isSessionExpired()`: 检查会话是否过期
- `getSessionMinutes()`: 计算会话时长（分钟）
- `formatSessionDuration()`: 格式化会话时长显示

### 4. AuthContext（认证上下文）
**位置**: `/src/app/contexts/AuthContext.tsx`
**职责**:
- 全局状态管理
- 认证逻辑封装
- 提供统一的认证接口

**提供的API**:
- `currentUser`: 当前用户
- `currentPage`: 当前页面
- `isCheckingSession`: 是否正在检查会话
- `login()`: 登录
- `logout()`: 登出
- `switchRole()`: 切换角色
- `addRole()`: 添加角色
- `removeRole()`: 移除角色
- `navigateTo()`: 页面导航

**使用方式**:
```tsx
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { currentUser, login, logout } = useAuth();
  // ...
}
```

### 5. Router（路由组件）
**位置**: `/src/app/components/Router.tsx`
**职责**:
- 根据当前页面动态渲染对应的Dashboard
- 使用React.lazy实现代码分割
- 提供加载状态

**特性**:
- 懒加载：按需加载Dashboard组件
- 性能优化：减少初始加载体积
- 加载提示：提供友好的加载状态

### 6. Header（头部组件）
**位置**: `/src/app/components/Header/`
**职责**:
- 显示导航菜单
- 用户信息展示
- 登出功能

**子组件**:
- `Navigation`: 页面导航标签
- `UserMenu`: 用户信息菜单
- `LogoutConfirmDialog`: 登出确认对话框

**设计理念**:
- 单一职责：每个子组件只负责一个功能
- 可复用：子组件可在其他地方复用
- 易测试：小组件更容易单元测试

### 7. Dashboard组件
**位置**: `/src/app/components/*Dashboard.tsx`
**职责**:
- 各角色的主要工作界面
- 独立的业务逻辑
- 按需加载

**三大Dashboard**:
- `CollectorDashboard`: 采集员仪表板
- `ReviewerDashboard`: 审核员仪表板
- `PlatformDashboard`: 平台管理仪表板

## 数据流

```
用户操作
    ↓
组件调用 useAuth() hook
    ↓
AuthContext 处理业务逻辑
    ↓
调用 utils 工具函数
    ↓
更新状态 / localStorage
    ↓
组件重新渲染
```

## 会话管理流程

### 登录流程
1. 用户在LoginPage输入账号密码
2. 调用 `login(username, password)`
3. AuthContext验证账户信息（从DEFAULT_ACCOUNTS）
4. 生成sessionId和loginTime
5. 创建User对象并更新currentUser状态
6. 自动保存到localStorage
7. 重定向到对应的Dashboard

### 会话恢复流程
1. App启动时，AuthContext自动执行
2. 调用 `restoreSession()` 从localStorage读取
3. 检查会话是否过期（30分钟）
4. 如未过期，恢复用户状态
5. 如已过期，清除localStorage

### 会话监控
- 每分钟检查一次会话有效性
- 如超时，自动登出并提示用户

### 登出流程
1. 用户点击登出按钮
2. 显示确认对话框
3. 确认后调用 `logout()`
4. 清除currentUser状态
5. 清除localStorage
6. 重定向到登录页

## 性能优化策略

### 1. 代码分割
- 使用React.lazy懒加载Dashboard组件
- 只加载当前需要的代码

### 2. 状态管理
- 使用Context API避免prop drilling
- 状态集中管理，减少重复渲染

### 3. 组件解耦
- 小组件更容易优化
- 可使用React.memo防止不必要的重渲染

## 扩展指南

### 添加新页面
1. 在`/src/app/types/index.ts`添加新的PageType
2. 在`/src/app/constants/index.ts`添加页面标题
3. 创建新的Dashboard组件
4. 在`Router.tsx`添加路由规则
5. 在`Header/Navigation.tsx`添加导航链接

### 添加新角色
1. 在`/src/app/types/index.ts`的UserRole添加新角色
2. 在`/src/app/constants/index.ts`的ROLE_NAMES添加角色名称
3. 在DEFAULT_ACCOUNTS添加测试账户
4. 根据需要创建对应的Dashboard

### 添加新功能模块
1. 在`/src/app/components/`创建新组件
2. 保持单一职责原则
3. 使用AuthContext获取认证信息
4. 必要时创建子组件目录

## 最佳实践

### 1. 组件设计
- 保持组件小而专注
- 每个组件只做一件事
- 优先使用函数组件和Hooks

### 2. 状态管理
- 全局状态用Context
- 局部状态用useState
- 避免过度使用全局状态

### 3. 类型安全
- 所有组件props定义接口
- 使用TypeScript严格模式
- 避免使用any类型

### 4. 代码复用
- 提取公共逻辑到utils
- 提取公共UI到ui组件
- 使用自定义Hooks复用逻辑

### 5. 性能考虑
- 大列表使用虚拟滚动
- 图片使用懒加载
- 避免在render中创建函数

## 注意事项

1. **不要修改旧文件**: 已删除旧的Header.tsx，使用新的Header目录
2. **类型导入**: 从`../types`导入类型，不是从`../App`
3. **认证逻辑**: 所有认证相关操作通过AuthContext
4. **会话管理**: 所有会话操作通过utils/session.ts
5. **常量使用**: 使用constants中的常量，不要硬编码

## 开发流程

### 启动项目
```bash
npm install
npm run dev
```

### 测试账户
- Fan (范审核员) - 密码为空
- Wang (王管理员) - 密码为空
- Lyu (吕采集员) - 密码为空

## 未来改进方向

1. **测试覆盖**: 添加单元测试和集成测试
2. **错误边界**: 添加错误边界组件
3. **国际化**: 支持多语言
4. **主题系统**: 支持暗色模式
5. **API集成**: 连接真实后端API
6. **权限系统**: 更细粒度的权限控制
