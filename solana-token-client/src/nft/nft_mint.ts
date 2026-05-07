import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import wallet from "../../devnet-wallet.json";
import {  createSignerFromKeypair, generateSigner, signerIdentity } from "@metaplex-foundation/umi";
import { create, mplCore } from "@metaplex-foundation/mpl-core";
import { base58 } from "@metaplex-foundation/umi/serializers";

const umi = createUmi("https://api.devnet.solana.com");

const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));

const signer = createSignerFromKeypair(umi, keypair);

umi.use(signerIdentity(signer));

umi.use(mplCore());

(async () => {
    try {
        const metadataUri = "https://gateway.irys.xyz/CRqWXMTRJctFU5uo86UTXaUbFZeiJkQYma13u7obzSFJ";

        const asset = generateSigner(umi);

        const tx = await create(umi, {
            asset,
            uri:metadataUri,
            name:"Judge Doge"
        }
        ).sendAndConfirm(umi);

     const signature = base58.deserialize(tx.signature)[0];
        console.log("Transaction ID:", signature);
       
        }
    catch(err){
        console.error(err);
    }
})()

