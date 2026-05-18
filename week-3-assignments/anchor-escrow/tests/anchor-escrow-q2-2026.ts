import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorEscrow } from "../target/types/anchor_escrow";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { Commitment, Keypair, PublicKey } from "@solana/web3.js";
import { BN } from "bn.js";
import { randomBytes } from "crypto";
const commitment:Commitment = "confirmed";
import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createMint,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
import { expect } from "chai";

describe("Anchor Escrow", () => {

const confirmTx = async (signature: string) => {
    const latestBlockhash = await anchor.getProvider().connection.getLatestBlockhash();
    await anchor.getProvider().connection.confirmTransaction(
      {
        signature,
        ...latestBlockhash,
      },
      commitment
    )
  }

 const confirmTxs = async (signatures: string[]) => {
    await Promise.all(signatures.map(confirmTx))
  }

    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.anchor_escrow as Program<AnchorEscrow>;

    const connection = provider.connection;

    const payer = provider.wallet as NodeWallet;

    const taker = Keypair.generate();

  let mintA:PublicKey;
  let mintB:PublicKey;

  let makerAtaA:PublicKey;
  let makerAtaB:PublicKey;

  let takerAtaA:PublicKey;
  let takerAtaB:PublicKey;

  let vault : PublicKey;

  const seed = new BN(randomBytes(8));
  const escrow = PublicKey.findProgramAddressSync(
    [
      Buffer.from("escrow"),
      payer.publicKey.toBuffer(),
      seed.toBuffer("le", 8),
    ],
    program.programId
  )[0];


 it("Request airdrop to taker!", async () => {
    await Promise.all([payer, taker].map(async (k) => {

      return await connection.requestAirdrop(k.publicKey, 100 * anchor.web3.LAMPORTS_PER_SOL)
    })).then(confirmTxs);

  });


  it("Mint tokens to maker and taker!", async () => {

    mintA = await createMint(
        connection,
        payer.payer,
        provider.publicKey,
        provider.publicKey,
        6
    );

    console.log("Mint A:", mintA.toBase58());

    vault = getAssociatedTokenAddressSync(mintA, escrow, true);

    console.log("Vault:", vault.toBase58());

    mintB = await createMint(
        connection,
        payer.payer,
        provider.publicKey,
        provider.publicKey,
        6
    );

    console.log("Mint B:", mintB.toBase58());

    makerAtaA = (await getOrCreateAssociatedTokenAccount(
        connection,
        payer.payer,
        mintA,
        provider.publicKey
    )).address;
    

    makerAtaB = (await getOrCreateAssociatedTokenAccount(
        connection,
        payer.payer,
        mintB,
        provider.publicKey
    )).address;
    
    takerAtaA = (await getOrCreateAssociatedTokenAccount(
        connection,
        payer.payer,
        mintA,
        taker.publicKey
    )).address;

    takerAtaB = (await getOrCreateAssociatedTokenAccount(
        connection,
        payer.payer,
        mintB,
        taker.publicKey
    )).address;

    await mintTo(
        connection,
        payer.payer,
        mintA,
        makerAtaA,
        provider.publicKey,
        1000_000_000,
    );
        
    console.log("Minted 1000 tokens to maker's ATA for mint A", makerAtaA.toBase58());

    await mintTo(
        connection,
        payer.payer,
        mintB,
        takerAtaB,
        provider.publicKey,
        1000_000_000,
    );

    console.log("Minted 1000 tokens to taker's ATA for mint B", takerAtaB.toBase58());

});

it("Make!", async () => {

     const InitialMakerAtaABalance = await provider.connection.getTokenAccountBalance(makerAtaA);

    console.log("initial Maker Ata A balance", InitialMakerAtaABalance.value.amount);

    const tx = await program.methods.make(seed, new BN(1_000_000), new BN(1_000_000),).accountsStrict({
        maker:payer.publicKey,
        mintA:mintA,
        mintB:mintB,
        makerAtaA:makerAtaA,
        makerAtaB:makerAtaB,
        escrow:escrow,
        vault:vault,
        tokenProgram:TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SYSTEM_PROGRAM_ID,
    }).rpc();

    await confirmTx(tx);

   const finalVaultBalance = await provider.connection.getTokenAccountBalance(vault);
    console.log("vault balance", finalVaultBalance.value.amount);
    const finalMakerAtaABalance = await provider.connection.getTokenAccountBalance(makerAtaA);
    console.log("Final MakerAtaA balance", finalMakerAtaABalance.value.amount);
    console.log("make tx", tx);

});

it("Take!", async () => {

    const InitialTakerAtaBBalance = await provider.connection.getTokenAccountBalance(takerAtaB);
    
    console.log("initial Taker Ata B balance", InitialTakerAtaBBalance.value.amount);

    const tx = await program.methods.take().accountsStrict({
        taker:taker.publicKey,
        maker:payer.publicKey,
        mintA:mintA,
        mintB:mintB,
        takerAtaA:takerAtaA,
        takerAtaB:takerAtaB,
        makerAtaB:makerAtaB,
        escrow:escrow,
        vault:vault,
        tokenProgram:TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SYSTEM_PROGRAM_ID,
    }).signers([taker]).rpc();

    await confirmTx(tx);

      expect(await provider.connection.getBalance(vault)).to.equal(0);
    const vaultStateInfo = await provider.connection.getAccountInfo(vault);
    expect(vaultStateInfo).to.be.null;
    console.log("Take tx", tx);
});

it("Refund!", async () => {

  // Created a fresh escrow for refund test so the previously-closed escrow isn't reused

  const seed2 = new BN(randomBytes(8));
  const escrow2 = PublicKey.findProgramAddressSync([
    Buffer.from("escrow"),
    payer.publicKey.toBuffer(),
    seed2.toBuffer("le", 8),
  ], program.programId)[0];

  const vault2 = getAssociatedTokenAddressSync(mintA, escrow2);

  // Initialize the second escrow 

  const txMake2 = await program.methods.make(seed2, new BN(1_000_000), new BN(1_000_000)).accountsStrict({
    maker: payer.publicKey,
    mintA: mintA,
    mintB: mintB,
    makerAtaA: makerAtaA,
    makerAtaB: makerAtaB,
    escrow: escrow2,
    vault: vault2,
    tokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    systemProgram: SYSTEM_PROGRAM_ID,
  }).rpc();

  await confirmTx(txMake2);

  const tx = await program.methods.refund().accountsPartial({
      maker: provider.publicKey,
      mintA: mintA,
      makerAtaA: makerAtaA,
      vault: vault2,
      escrow: escrow2,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SYSTEM_PROGRAM_ID,
    }).rpc();

  await confirmTx(tx);

  expect(await provider.connection.getBalance(vault2)).to.equal(0);
  const vaultStateInfo = await provider.connection.getAccountInfo(vault2);
  expect(vaultStateInfo).to.be.null;
  console.log("Refund tx", tx);
});


});
