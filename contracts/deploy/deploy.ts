import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Deploy PollFactory first
  const deployedFactory = await deploy("PollFactory", {
    from: deployer,
    log: true,
    args: [],
  });

  console.log(`PollFactory contract: `, deployedFactory.address);
  
  // Optionally deploy a test poll (for testing)
  // Uncomment if you want to deploy a test poll automatically
  /*
  const PollFactory = await hre.ethers.getContractFactory("PollFactory");
  const factory = PollFactory.attach(deployedFactory.address);
  
  const tx = await factory.createPoll(
    "Test Poll",
    "This is a test poll",
    Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days from now
    5 // 5 options
  );
  
  const receipt = await tx.wait();
  console.log(`Test poll created: `, receipt?.logs[0].address);
  */
};

export default func;
func.id = "deploy_poll_factory"; // id required to prevent reexecution
func.tags = ["PollFactory"];




