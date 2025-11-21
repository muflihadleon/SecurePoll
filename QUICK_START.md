# 快速启动指南

## ✅ 当前状态

1. **Hardhat 节点**：已在后台运行（端口 8545）
2. **合约已部署**：PollFactory 地址：`0x5FbDB2315678afecb367f032d93F642f64180aa3`
3. **前端**：正在启动中（http://localhost:3000）

## 🔧 配置步骤

### 1. 配置 Factory 地址

打开浏览器访问 http://localhost:3000，然后在浏览器控制台执行：

```javascript
localStorage.setItem('pollFactoryAddress', '0x5FbDB2315678afecb367f032d93F642f64180aa3');
```

### 2. 连接 MetaMask

1. 打开 MetaMask
2. 添加本地网络：
   - 网络名称：Hardhat Local
   - RPC URL：http://localhost:8545
   - Chain ID：31337
   - 货币符号：ETH
3. 导入测试账户（在 Hardhat 节点启动日志中可以看到私钥）

### 3. 使用应用

1. **创建投票**：点击 "Create Poll"
2. **参与投票**：在投票列表中选择投票并投票
3. **查看结果**：作为投票创建者，可以查看聚合统计结果

## 📝 注意事项

- 本地开发使用 **Mock 模式**（chainId 31337），加密/解密都是模拟的
- 前端会自动检测 chainId，本地节点使用 Mock，测试网使用 Relayer SDK
- 如果前端没有启动，检查端口 3000 是否被占用

## 🛠️ 故障排除

### Hardhat 节点未运行
```bash
cd action/contracts
npx hardhat node
```

### 前端未启动
```bash
cd action/frontend
npm run dev
```

### 端口被占用
```bash
# 杀死 8545 端口
lsof -ti:8545 | xargs kill -9

# 杀死 3000 端口
lsof -ti:3000 | xargs kill -9
```




