# Testing Procedure for Package Updates

This document outlines the steps to verify that updated package versions do not break the codebase. Follow each step and note any issues encountered.

---

## 1. Update the Dependencies

- [ ] Run `npx npm-check-updates -u` to install the updated dependencies.
- [ ] Follow the instructions in the [README.md](./README.md) to verify they are still correct.
- [ ] Run the dependency installation command `npm install`
- [ ] Confirm there are no errors

## 2. Compile the Compact Contract

- [ ] Compile the contract as described in the README
- [ ] Ensure compilation completes successfully

## 3. Build the Code

- [ ] Build the project using the documented steps
- [ ] Verify the build completes without errors

## 4. Start the Remote Testnet

- [ ] Run the following command in the `counter-cli` directory:
  ```sh
  npm run start-testnet-remote
  ```
- [ ] Confirm there are no errors (the CLI asks if you want to create a new wallet)

## 5. Create a New Wallet

- [ ] Create a new wallet from scratch
- [ ] Save the wallet seed securely

## 6. Fund the Wallet

- [ ] Request tokens from the faucet for the new wallet
- [ ] Confirm the transaction is successful in the CLI

## 7. Wait for Wallet Update

- [ ] Wait for the wallet balance to reflect the received tokens
- [ ] Confirm the wallet shows the correct balance

## 8. Deploy a New Contract

- [ ] Deploy the contract to the testnet
- [ ] Note the contract address and deployment status

## 9. Increment the Contract Value

- [ ] Call the increment function on the deployed contract
- [ ] Verify the value increments as expected

---

## Notes

- Document any errors, warnings, or unexpected behavior encountered during each step.
- If a step fails, include troubleshooting steps and resolutions if found.

---

_Last updated: 30 June 2025_
