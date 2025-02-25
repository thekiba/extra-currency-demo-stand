# Extra Currency Testing Stand

A comprehensive testing platform for TON wallet developers implementing Extra Currency (EC) support. This stand facilitates integration testing against the TON Connect protocol requirements and validates native wallet UI/UX implementations.

## Purpose

This testing stand helps wallet developers ensure their Extra Currency implementation complies with TON ecosystem standards. It provides a series of automated checks and interactive prompts to verify:

- Proper EC feature declaration in TON Connect
- Correct EC balance display in wallet interfaces
- Accurate transaction handling for EC operations
- Fee management in EC transactions
- Proper emulation support for EC operations

## Getting Started

1. Clone this repository
2. Install dependencies with `pnpm install`
3. Start the development server with `pnpm dev`
4. Connect your testnet wallet to begin testing

## Demo

You can try the live demo version of the testing stand here:
[https://extra-currency-demo-stand-demo-dapp.vercel.app/](https://extra-currency-demo-stand-demo-dapp.vercel.app/)

## Requirements

- Testnet wallet with TON Connect v2 support
- Minimum of 3.25 test TON for EC operations
- Extra Currency feature flag in wallet manifest

All tests are performed against the EC swap contract in testnet. Test results are saved between sessions to allow for continued testing.

## Additional Resources

For more information about Extra Currency implementation in the TON ecosystem, check out:
[EC Implementation Guide](https://gist.github.com/Trinketer22/6f8e82d253ebea2e4990d8008a35e48c) 

## License

MIT 