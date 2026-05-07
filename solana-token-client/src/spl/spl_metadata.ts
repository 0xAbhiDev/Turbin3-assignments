import { createSignerFromKeypair, publicKey, signerIdentity } from "@metaplex-foundation/umi";
import wallet from "../devnet-wallet.json";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createMetadataAccountV3, CreateMetadataAccountV3InstructionAccounts, CreateMetadataAccountV3InstructionArgs, DataV2Args } from "@metaplex-foundation/mpl-token-metadata";
import bs58 from "bs58";

const mint = publicKey("GXX4cCgNEbDSaux6pbTUzpVoehJTgDG1UPcXcxFWofF4");

const umiClient = createUmi("https://api.devnet.solana.com");

const keypair = umiClient.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umiClient, keypair);

umiClient.use(signerIdentity(signer));

(async () => {
    try{

        const accounts:CreateMetadataAccountV3InstructionAccounts={
            mint,
            mintAuthority:signer
        }
         
        const data:DataV2Args = {
            name:"Turbine token",
            symbol:"TURB",
            uri:"https://arweave.net/123456",
            sellerFeeBasisPoints:1,
            creators:null,
            collection:null,
            uses:null
        }

        const args :CreateMetadataAccountV3InstructionArgs={
            data,
            isMutable:true,
            collectionDetails:null
        }
        const tx = createMetadataAccountV3(umiClient,{
          ...args,
          ...accounts
        })
     
        const result = await tx.sendAndConfirm(umiClient);
        console.log("Metadata account created with signature:", bs58.encode(result.signature));

    }
    catch(err){
        console.error(err);
    }
})()