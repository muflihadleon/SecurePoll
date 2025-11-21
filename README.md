# SecurePoll - 安全投票 DApp

基于 FHEVM 的匿名投票平台，使用全同态加密保护用户隐私。

## 项目结构

```
action/
├── contracts/          # 智能合约
│   ├── PollFactory.sol
│   ├── Poll.sol
│   ├── hardhat.config.ts
│   └── deploy/
└── frontend/          # 前端应用
    ├── app/
    ├── components/
    ├── hooks/
    └── fhevm/
```

## 功能特性

- ✅ **匿名性保证**：所有投票使用 FHEVM 加密，链上仅存储密文
- ✅ **聚合统计**：投票创建者可解密聚合统计结果，但无法查看单个投票
- ✅ **Mock 模式**：本地开发支持 mock，无需真实 FHEVM 节点
- ✅ **精美 UI**：现代化的用户界面设计，橙红色/绿色配色方案

## 快速开始

### 1. 安装依赖

#### 合约部分
```bash
cd contracts
npm install
```

#### 前端部分
```bash
cd frontend
npm install
```

### 2. 配置 Hardhat 节点

确保你的 Hardhat 节点已安装 `@fhevm/hardhat-plugin`：

```bash
cd contracts
npm install @fhevm/hardhat-plugin@^0.1.0
```

### 3. 启动本地 Hardhat 节点

```bash
cd contracts
npx hardhat node
```

这会启动一个支持 FHEVM 的本地节点（chainId: 31337）。

### 4. 部署合约

在另一个终端：

```bash
cd contracts
npx hardhat deploy --network hardhat
```

部署完成后，记下 Factory 合约地址，然后在前端配置：

```javascript
// 在浏览器控制台执行
localStorage.setItem('pollFactoryAddress', 'YOUR_FACTORY_ADDRESS');
```

### 5. 启动前端

#### Mock 模式（本地开发）
```bash
cd frontend
npm run dev:mock
```

前端会自动检测：
- **chainId 31337** → 使用 Mock FHEVM 实例
- **其他 chainId** → 使用 Relayer SDK

### 6. 访问应用

打开浏览器访问：http://localhost:3000

## 使用流程

### 创建投票

1. 点击 "Create Poll"
2. 填写投票名称、描述、截止时间
3. 添加选项（Likert 量表 1-5）
4. 点击 "Create Poll" 部署合约

### 参与投票

1. 在投票列表中选择投票
2. 为每个选项选择分数（1-5）
3. 点击 "Submit Encrypted Votes"
4. 等待加密和提交完成

### 查看结果（仅创建者）

1. 访问投票结果页面
2. 点击 "Request Aggregation" 请求聚合计算
3. 等待 coprocessors 处理（本地 mock 模式会立即返回）
4. 点击 "Decrypt Results" 解密并查看统计结果

## 技术架构

### 合约层

- **PollFactory.sol**：工厂合约，用于创建投票
- **Poll.sol**：投票合约，包含：
  - `submitEncryptedVote()`：提交加密投票
  - `requestAggregation()`：请求聚合计算
  - `commitAggregationResult()`：提交聚合结果（由 coprocessors 调用）
  - `getAggregatedData()`：获取聚合统计（加密）

### 前端层

- **FHEVM 集成**：复用 zama_template 的 FHEVM 代码
- **加密流程**：使用 `instance.createEncryptedInput()` 加密投票
- **解密流程**：使用 `instance.userDecrypt()` 解密聚合结果
- **Mock 模式**：自动检测本地节点，使用 MockFhevmInstance

## Mock 模式说明

在本地开发时（chainId 31337），前端会自动：
1. 检测到 Hardhat FHEVM 节点
2. 使用 `@fhevm/mock-utils` 创建 Mock 实例
3. Mock 加密/解密操作

这允许你在本地快速开发和测试，无需真实的 FHEVM 网络。

## 注意事项

1. **投票范围**：当前实现使用 Likert 量表（1-5），投票类型为 `euint8`
2. **选项数量**：合约限制最多 50 个选项
3. **聚合计算**：在本地 mock 模式，聚合会立即返回；在测试网需要等待 coprocessors 处理
4. **解密权限**：只有投票创建者可以解密聚合结果

## 开发提示

- 合约 ABI 需要从部署后的 artifacts 中提取并放入 `frontend/abi/` 目录
- Mock 模式的所有加密/解密都是模拟的，不会产生真实的 FHE 计算

## 许可证

MIT License




