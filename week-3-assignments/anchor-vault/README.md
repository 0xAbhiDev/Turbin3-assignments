# Anchor Vault

A simple Solana Anchor program that implements a vault with `initialize`, `deposit`, `withdraw`, and `close` instructions. The project also includes a LiteSVM-based Rust integration test suite so the program can be exercised locally without deploying to a cluster.

## What it does

- Creates a PDA-backed vault state account.
- Stores PDA bump seeds inside the vault state.
- Accepts deposits into the vault account.
- Allows withdrawals using PDA signer seeds.
- Closes the vault and sends the remaining lamports back to the user.

## Project Structure

- `programs/anchor-vault/src/lib.rs` - on-chain Anchor program
- `programs/anchor-vault/tests/anchor_vault.rs` - Rust integration tests using LiteSVM
- `migrations/deploy.ts` - deployment script
- `Anchor.toml` - Anchor workspace configuration
- `Cargo.toml` - Rust workspace configuration

## Requirements

- Rust and Cargo
- Solana toolchain compatible with Anchor
- Anchor CLI
- Node.js and Yarn if you want to use the TypeScript tooling

## Build and Test

Run the Rust checks and tests from the workspace root:

```bash
cargo check -p anchor-vault
cargo test -p anchor-vault
```

To run the LiteSVM integration test directly with full output:

```bash
cargo test -p anchor-vault --test anchor_vault -- --nocapture
```

If you also use the TypeScript tooling in this workspace, install dependencies once:

```bash
yarn install
```

## How the Test Works

The integration test:

1. Creates a fresh LiteSVM instance.
2. Derives the vault PDAs.
3. Sends `initialize`, `deposit`, `withdraw`, and `close` instructions.
4. Verifies account state and balance changes after each step.

## Notes

- The test suite uses a fresh VM per test, so each `#[test]` is isolated.
- Transaction fees can affect exact balance comparisons, so balance assertions should account for that.
- The program is designed to be simple and readable rather than over-engineered.

