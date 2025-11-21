# Sepolia 测试网配置指南

## 📋 前置要求

1. MetaMask 钱包
2. Sepolia 测试网 ETH（可从水龙头获取）
3. 已部署的合约地址

## 🔧 配置步骤

### 1. 配置 MetaMask

在 MetaMask 中添加 Sepolia 测试网（如果还没有）：
- 网络名称：Sepolia
- RPC URL：https://ethereum-sepolia-rpc.publicnode.com
- Chain ID：11155111
- 货币符号：ETH
- 区块浏览器：https://sepolia.etherscan.io

### 2. 获取测试 ETH

访问以下任一水龙头获取 Sepolia 测试 ETH：
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia

### 3. 配置 Factory 地址

打开浏览器访问 http://localhost:3000，在控制台执行：

```javascript
// Replace with your own deployed PollFactory address
localStorage.setItem('pollFactoryAddress', '<YOUR_FACTORY_ADDRESS>');
```

### 4. 启动前端

```bash
cd frontend
npm run dev
```

访问 http://localhost:3000

### 5. 连接 MetaMask

1. 在页面上点击 "Connect Wallet"
2. 选择 MetaMask
3. 确保切换到 Sepolia 网络（Chain ID: 11155111）
4. 授权连接

## 🔍 调试步骤

如果遇到 "KMS contract address is not valid or empty" 错误，请：

### 1. 打开浏览器开发者工具（F12）

### 2. 查看控制台日志

应该能看到以下日志：
```
[createFhevmInstance] selectedConfig
[createFhevmInstance] Full runtimeConfig
[createFhevmInstance] Using config
[createFhevmInstance] Final config before createInstance
[createFhevmInstance] Config.kmsContractAddress
```

### 3. 检查配置信息

**预期的 Sepolia 配置应该包含：**
- `aclContractAddress`: "0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D"
- `kmsContractAddress`: "0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A"
- `inputVerifierContractAddress`: "0xBBC1fFCdc7C316aAAd72E807D9b0272BE8F84DA0"
- `chainId`: 11155111
- `gatewayChainId`: 10901

### 4. 验证日志输出

在浏览器控制台运行：

```javascript
// 检查 RelayerSDK 是否已加载
console.log('RelayerSDK loaded:', typeof window.relayerSDK !== 'undefined');

// 检查 SepoliaConfig
console.log('SepoliaConfig:', window.relayerSDK?.SepoliaConfig);

// 检查 kmsContractAddress
console.log('KMS Address:', window.relayerSDK?.SepoliaConfig?.kmsContractAddress);
```

## 🐛 常见问题

### 问题 1：SDK 未加载

**症状**：`window.relayerSDK` 是 undefined

**解决方案**：
1. 检查网络连接
2. 确认 CDN 可访问：https://cdn.zama.org/relayer-sdk-js/0.3.0-5/relayer-sdk-js.umd.cjs
3. 刷新页面重新加载

### 问题 2：KMS 地址为空

**症状**：`Config.kmsContractAddress` 输出为 undefined

**解决方案**：
1. 确认 SDK 版本正确
2. 检查 `window.relayerSDK.SepoliaConfig` 是否存在
3. 如果问题持续，使用本地 SDK（见下方）

### 问题 3：需要使用本地 SDK

如果 CDN 加载有问题，可以修改代码使用本地 SDK：

编辑 `frontend/fhevm/internal/RelayerSDKLoader.ts`，修改第54行：

```typescript
// 原来：
script.src = SDK_CDN_URL;

// 改为：
script.src = SDK_LOCAL_URL;
```

然后重启前端。

## 📊 合约地址

### Sepolia 测试网
 
- **PollFactory**: `<YOUR_FACTORY_ADDRESS>`
- **FHEVM ACL**: `0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D`
- **KMS Verifier**: `0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A`
- **Input Verifier**: `0xBBC1fFCdc7C316aAAd72E807D9b0272BE8F84DA0`

在 Sepolia Etherscan 查看（将 <YOUR_FACTORY_ADDRESS> 替换为你的地址）：
- Factory: `https://sepolia.etherscan.io/address/<YOUR_FACTORY_ADDRESS>`

## 🔄 重新部署到 Sepolia（如需要）

```bash
cd contracts

# 确保已配置 PRIVATE_KEY 或 MNEMONIC
npx hardhat vars set PRIVATE_KEY

# 可选：配置 Infura API Key
npx hardhat vars set INFURA_API_KEY

# 部署
npx hardhat deploy --network sepolia

# 验证合约（可选）
npx hardhat vars set ETHERSCAN_API_KEY
npx hardhat verify --network sepolia <合约地址>
```

## 💡 使用提示

1. **Gas 费用**：在 Sepolia 上的操作需要真实的测试 ETH
2. **交易确认**：Sepolia 的区块时间约 12 秒
3. **Coprocessor 处理**：聚合计算需要等待 FHEVM Gateway 处理，通常需要几分钟
4. **解密权限**：只有投票创建者可以解密聚合结果

## 📝 请将以下信息发给我

如果问题仍未解决，请提供浏览器控制台的以下日志：

```javascript
console.log('1. RelayerSDK:', typeof window.relayerSDK);
console.log('2. SepoliaConfig:', window.relayerSDK?.SepoliaConfig);
console.log('3. Chain ID:', window.ethereum?.request({ method: 'eth_chainId' }));
console.log('4. Connected:', window.ethereum?.selectedAddress);
```

将控制台输出和完整错误信息截图发给我。

