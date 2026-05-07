import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import wallet from "../../devnet-wallet.json";
import {  createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";

const umi = createUmi("https://api.devnet.solana.com");

const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));

const signer = createSignerFromKeypair(umi, keypair);

umi.use(signerIdentity(signer));

umi.use(irysUploader({
    address: "https://devnet.irys.xyz",
}));



(async () => {
    try {
        const image = " https://gateway.irys.xyz/AQsWtWCwX3nCFUzCjUR8ABfqXARy8N6XiF5EatbX4uCA";

        const metadata = {
            name: "Judge Doge",
            description:" Dog",
            image,
            attributes:[
                {
                    trait_type:"Cuteness",
                    value:"100"
                }
            ],
            properties:{
                files:[
                    {
                        uri:image,
                        type:"image/jpeg"
                    }
                ],
                category:"image"
         }
        }

        const myUri = await umi.uploader.uploadJson(metadata);
        console.log("Metadata URI:", myUri);
    }
    catch(err){
        console.error(err);
    }
})()

// Metadata URI: https://gateway.irys.xyz/CRqWXMTRJctFU5uo86UTXaUbFZeiJkQYma13u7obzSFJ