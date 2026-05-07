import {  appendTransactionMessageInstructions, assertIsTransactionWithBlockhashLifetime, createKeyPairSignerFromBytes, createSolanaRpc, createSolanaRpcSubscriptions, createTransactionMessage, generateKeyPairSigner, getSignatureFromTransaction, sendAndConfirmTransactionFactory, setTransactionMessageFeePayerSigner, setTransactionMessageLifetimeUsingBlockhash, signTransactionMessageWithSigners } from "@solana/kit";
import wallet from "../devnet-wallet.json";
import { getInitializeMintInstruction, getMintSize, TOKEN_PROGRAM_ADDRESS } from "@solana-program/token";
import { getCreateAccountInstruction } from "@solana-program/system";


const rpc = createSolanaRpc("https://api.devnet.solana.com");

const rpcSubscriptions = createSolanaRpcSubscriptions("wss://api.devnet.solana.com");

(async ()=> {

    try {
    const signer = await createKeyPairSignerFromBytes(new Uint8Array(wallet));

    const mint = await generateKeyPairSigner();

    const space = BigInt(getMintSize());

    const lamports = await rpc.getMinimumBalanceForRentExemption(space).send();

    const {value: blockhash} = await rpc.getLatestBlockhash().send();

    const sendAndConfirm = sendAndConfirmTransactionFactory({rpc, rpcSubscriptions});

    const msg = createTransactionMessage({version:0});

    const msgwithPayer = setTransactionMessageFeePayerSigner(signer,msg);

    const msgwithLifetime = setTransactionMessageLifetimeUsingBlockhash(blockhash, msgwithPayer);

    const createmintIx = appendTransactionMessageInstructions(
        [
        getCreateAccountInstruction({
            payer: signer,
            newAccount: mint,
            space,
            lamports,
            programAddress: TOKEN_PROGRAM_ADDRESS
        }),
        getInitializeMintInstruction({
            mint: mint.address,
            decimals: 9,
            mintAuthority: signer.address,
            freezeAuthority: signer.address
        })
    ] ,
     msgwithLifetime
)

  const signedTx = await signTransactionMessageWithSigners(createmintIx);

  assertIsTransactionWithBlockhashLifetime(signedTx);

 await sendAndConfirm(signedTx,{"commitment":"confirmed"});
 
 const signature = getSignatureFromTransaction(signedTx);

  console.log("Transaction ID:", signature);
  console.log("Mint Address:", mint.address);

    } catch (err) {
        console.error(err);
    }

}) ()