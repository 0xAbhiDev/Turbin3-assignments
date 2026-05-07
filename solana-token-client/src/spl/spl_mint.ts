import { address, createSolanaRpc, createSolanaRpcSubscriptions , sendAndConfirmTransactionFactory,createTransactionMessage, setTransactionMessageFeePayerSigner,setTransactionMessageLifetimeUsingBlockhash, createKeyPairSignerFromBytes, appendTransactionMessageInstructions, getSignatureFromTransaction, signTransactionMessageWithSigners, assertIsTransactionWithBlockhashLifetime  } from "@solana/kit";
import wallet from "../devnet-wallet.json";
import { findAssociatedTokenPda, getCreateAssociatedTokenIdempotentInstructionAsync, getMintToInstruction, TOKEN_PROGRAM_ADDRESS } from "@solana-program/token";

const rpc = createSolanaRpc("https://api.devnet.solana.com");

const rpcSubscriptions = createSolanaRpcSubscriptions("wss://api.devnet.solana.com");

const mint = address("GXX4cCgNEbDSaux6pbTUzpVoehJTgDG1UPcXcxFWofF4");

const token_decimals = 1_000_000n;

(async ()=> {

    try {
    const signer = await createKeyPairSignerFromBytes(new Uint8Array(wallet));

    const ata = await findAssociatedTokenPda({
        mint,
        owner: signer.address,
        tokenProgram: TOKEN_PROGRAM_ADDRESS
    });

    const createAtaIx = await getCreateAssociatedTokenIdempotentInstructionAsync({
       mint,
       owner: signer.address,
       payer: signer,
       tokenProgram: TOKEN_PROGRAM_ADDRESS
    })

    const mintToIx  = getMintToInstruction({
        mint,
        token:ata[0],
        mintAuthority: signer.address,
        amount: 1n * token_decimals,
    })

    const {value: blockhash} = await rpc.getLatestBlockhash().send();

    const sendAndConfirm = sendAndConfirmTransactionFactory({rpc, rpcSubscriptions});

    const msg = createTransactionMessage({version:0});

    const msgwithPayer = setTransactionMessageFeePayerSigner(signer,msg);

    const msgwithLifetime = setTransactionMessageLifetimeUsingBlockhash(blockhash, msgwithPayer);

    const txmessage = appendTransactionMessageInstructions([createAtaIx, mintToIx], msgwithLifetime);
    
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