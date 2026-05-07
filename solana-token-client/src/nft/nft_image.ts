import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import wallet from "../../devnet-wallet.json";
import { createGenericFile, createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { readFile } from "fs/promises";

const umi = createUmi("https://api.devnet.solana.com");

const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));

const signer = createSignerFromKeypair(umi, keypair);

umi.use(signerIdentity(signer));

umi.use(irysUploader({
    address: "https://devnet.irys.xyz",
}));



(async () => {
    try {

        const image = await readFile("./meme-dog.jpg");

        const file = createGenericFile(image,"meme-dog.jpg",{
            contentType:"image/jpeg"
        });

        const [myUri] = await umi.uploader.upload([file]);
        
        console.log("Image URI:", myUri);
    }
    catch(err){
        console.error(err);
    }
})()