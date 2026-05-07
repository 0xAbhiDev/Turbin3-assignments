import { address, appendTransactionMessageInstructions, assertIsTransactionWithBlockhashLifetime, createKeyPairSignerFromBytes, createSolanaRpc, createSolanaRpcSubscriptions, createTransactionMessage, getSignatureFromTransaction, sendAndConfirmTransactionFactory, setTransactionMessageFeePayerSigner, setTransactionMessageLifetimeUsingBlockhash, signTransactionMessageWithSigners } from "@solana/kit";
import wallet from "../devnet-wallet.json";
import { findAssociatedTokenPda, getCreateAssociatedTokenIdempotentInstructionAsync, getTransferCheckedInstruction, TOKEN_PROGRAM_ADDRESS } from "@solana-program/token";

const rpc = createSolanaRpc("https://api.devnet.solana.com");

const rpcSubscriptions = createSolanaRpcSubscriptions("wss://api.devnet.solana.com");

const toWallet = address("5jcmfsMcHqqFyVrw33fkVmnhwZ5ezf7J85pU2svz9CeH");

(async ()=> {

    try {
    const signer = await createKeyPairSignerFromBytes(new Uint8Array(wallet));

const mint = address("GXX4cCgNEbDSaux6pbTUzpVoehJTgDG1UPcXcxFWofF4");

    const from_ata = await findAssociatedTokenPda({
        mint,
        owner: signer.address,
        tokenProgram: TOKEN_PROGRAM_ADDRESS
    });

    const to_ata = await findAssociatedTokenPda({
        mint,
        owner:toWallet,
        tokenProgram: TOKEN_PROGRAM_ADDRESS
    })

    const createAtaIx = await getCreateAssociatedTokenIdempotentInstructionAsync({
       mint,
       owner: toWallet,
       payer: signer,
    })

    const {value: blockhash} = await rpc.getLatestBlockhash().send();

    const sendAndConfirm = sendAndConfirmTransactionFactory({rpc, rpcSubscriptions});

    const msg = createTransactionMessage({version:0});

    const msgwithPayer = setTransactionMessageFeePayerSigner(signer,msg);

    const msgwithLifetime = setTransactionMessageLifetimeUsingBlockhash(blockhash, msgwithPayer);

    const transferIx = getTransferCheckedInstruction({
        source: from_ata[0],
        destination:to_ata[0],
        mint,
        authority:signer,
        amount:1_000_000n,
        decimals: 9
    })

    const txmessage = appendTransactionMessageInstructions([createAtaIx, transferIx ], msgwithLifetime);
    
    const signedTx = await signTransactionMessageWithSigners(txmessage);
    
    assertIsTransactionWithBlockhashLifetime(signedTx);
   
    await sendAndConfirm(signedTx,{"commitment":"confirmed"});

    const signature = getSignatureFromTransaction(signedTx);

    console.log("Transaction ID:", signature);
    console.log("Mint Address:", mint);

    }
    catch(err){
        console.error(err);
    }
})()
