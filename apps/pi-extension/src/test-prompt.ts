import { AdpClient, AdpDomains } from "@agentx/adp";

async function main() {
  const client = new AdpClient("ws://localhost:9222");
  await client.connect();
  console.log("Connected to agentx");

  // Send a prompt
  const res = await client.send(AdpDomains.Session.prompt, {
    prompt: "What is 2+2?",
  });
  console.log("Session.prompt response:", res);

  // Also test the new handlers
  const tools = await client.send(AdpDomains.Toolchain.list);
  console.log("Toolchain.list:", tools);

  const memory = await client.send(AdpDomains.Memory.queryNodes);
  console.log("Memory.queryNodes:", memory);

  client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
