use anchor_lang::{AccountDeserialize, InstructionData, ToAccountMetas, solana_program::{instruction::Instruction, msg}, system_program::ID as SYSTEM_PROGRAM_ID};
use anchor_vault::{self };
use litesvm::LiteSVM;
use solana_address::Address;
use solana_keypair::Keypair;
use solana_signer::Signer;
use solana_message::Message;
use solana_transaction::Transaction;

fn setup() -> (LiteSVM, Keypair, Address) {
    let program_id: Address = anchor_vault::id().to_bytes().into();

    let mut svm = LiteSVM::new();
    let payer = Keypair::new();
    let bytes = include_bytes!("../../../target/deploy/anchor_vault.so");

    svm.add_program(program_id, bytes).unwrap();
    svm.airdrop(&payer.pubkey().to_bytes().into(), 10_000_000_000).unwrap();

    (svm, payer, program_id)
}


fn make_env() -> (LiteSVM, Keypair, Address, Address, Address, u8, u8) {
    let (mut svm, payer, program_id) = setup();
    let user = payer.pubkey();

    let (vault_state_pda, vault_state_bump) =
        Address::find_program_address(&[b"vault-state", user.as_ref()], &program_id);

    let (vault_account_pda, vault_account_bump) =
        Address::find_program_address(&[b"vault-account"], &program_id);

    (svm, payer, program_id, vault_state_pda, vault_account_pda, vault_state_bump, vault_account_bump)
}

#[test]
fn test_initialize() {
    let (mut svm, payer, _program_id, vault_state_pda, vault_account_pda, vault_state_bump, vault_account_bump) = make_env();
    let user = payer.pubkey();

    let init_ix = Instruction {
        program_id: anchor_vault::id(),
        accounts: anchor_vault::accounts::Initialize {
            user: user,
            vault_state: vault_state_pda.to_bytes().into(),
            vault_account: vault_account_pda.to_bytes().into(),
            system_program: SYSTEM_PROGRAM_ID,
        }
        .to_account_metas(None),
        data: anchor_vault::instruction::Initialize {}.data(),
    };

    let message = Message::new(&[init_ix], Some(&payer.pubkey()));
    let recent_blockhash = svm.latest_blockhash();
    let transaction1 = Transaction::new(&[payer.insecure_clone()], message, recent_blockhash);
    let _tx1 = svm.send_transaction(transaction1).unwrap();

    let vault_state_account = svm.get_account(&vault_state_pda).unwrap();
    let vault_account = anchor_vault::VaultState::try_deserialize(&mut vault_state_account.data.as_ref()).unwrap();

    assert_eq!(vault_account.vault_account_bump, vault_account_bump);
    assert_eq!(vault_account.vault_state_bump, vault_state_bump);
}

#[test]
fn test_deposit() {
    let (mut svm, payer, _program_id, vault_state_pda, vault_account_pda, _vault_state_bump, _vault_account_bump) = make_env();
    let user = payer.pubkey();

    // initialize first
    let init_ix = Instruction {
        program_id: anchor_vault::id(),
        accounts: anchor_vault::accounts::Initialize {
            user: user,
            vault_state: vault_state_pda.to_bytes().into(),
            vault_account: vault_account_pda.to_bytes().into(),
            system_program: SYSTEM_PROGRAM_ID,
        }
        .to_account_metas(None),
        data: anchor_vault::instruction::Initialize {}.data(),
    };
    let message = Message::new(&[init_ix], Some(&payer.pubkey()));
    let recent_blockhash = svm.latest_blockhash();
    let transaction1 = Transaction::new(&[payer.insecure_clone()], message, recent_blockhash);
    svm.send_transaction(transaction1).unwrap();

    // deposit
    let deposit_amount: u64 = 1_000_000_000;
    let deposit_ix = Instruction {
        program_id: anchor_vault::id(),
        accounts: anchor_vault::accounts::Deposit {
            user: user,
            vault_state: vault_state_pda.to_bytes().into(),
            vault_account: vault_account_pda.to_bytes().into(),
            system_program: SYSTEM_PROGRAM_ID,
        }
        .to_account_metas(None),
        data: anchor_vault::instruction::Deposit { amount: deposit_amount }.data(),
    };
    let message = Message::new(&[deposit_ix], Some(&user));
    let recent_blockhash = svm.latest_blockhash();
    let transaction2 = Transaction::new(&[payer.insecure_clone()], message, recent_blockhash);
    svm.send_transaction(transaction2).unwrap();

    let vault_balance_after_deposit = svm.get_balance(&vault_account_pda).unwrap();
    assert_eq!(vault_balance_after_deposit, deposit_amount);
}

#[test]
fn test_withdraw() {
    let (mut svm, payer, _program_id, vault_state_pda, vault_account_pda, _vault_state_bump, _vault_account_bump) = make_env();
    let user = payer.pubkey();

    // initialize
    let init_ix = Instruction {
        program_id: anchor_vault::id(),
        accounts: anchor_vault::accounts::Initialize {
            user: user,
            vault_state: vault_state_pda.to_bytes().into(),
            vault_account: vault_account_pda.to_bytes().into(),
            system_program: SYSTEM_PROGRAM_ID,
        }
        .to_account_metas(None),
        data: anchor_vault::instruction::Initialize {}.data(),
    };
    let message = Message::new(&[init_ix], Some(&payer.pubkey()));
    let recent_blockhash = svm.latest_blockhash();
    let transaction1 = Transaction::new(&[payer.insecure_clone()], message, recent_blockhash);
    svm.send_transaction(transaction1).unwrap();

    // deposit
    let deposit_amount: u64 = 1_000_000_000;
    let deposit_ix = Instruction {
        program_id: anchor_vault::id(),
        accounts: anchor_vault::accounts::Deposit {
            user: user,
            vault_state: vault_state_pda.to_bytes().into(),
            vault_account: vault_account_pda.to_bytes().into(),
            system_program: SYSTEM_PROGRAM_ID,
        }
        .to_account_metas(None),
        data: anchor_vault::instruction::Deposit { amount: deposit_amount }.data(),
    };
    let message = Message::new(&[deposit_ix], Some(&user));
    let recent_blockhash = svm.latest_blockhash();
    let transaction2 = Transaction::new(&[payer.insecure_clone()], message, recent_blockhash);
    svm.send_transaction(transaction2).unwrap();

    // withdraw
    let withdraw_amount: u64 = 500_000_000;
    let withdraw_ix = Instruction {
        program_id: anchor_vault::id(),
        accounts: anchor_vault::accounts::Withdraw {
            user: user,
            vault_state: vault_state_pda.to_bytes().into(),
            vault_account: vault_account_pda.to_bytes().into(),
            system_program: SYSTEM_PROGRAM_ID,
        }
        .to_account_metas(None),
        data: anchor_vault::instruction::Withdraw { amount: withdraw_amount }.data(),
    };
    let message = Message::new(&[withdraw_ix], Some(&user));
    let recent_blockhash = svm.latest_blockhash();
    let transaction3 = Transaction::new(&[payer.insecure_clone()], message, recent_blockhash);
    svm.send_transaction(transaction3).unwrap();

    let vault_balance_after_withdraw = svm.get_balance(&vault_account_pda).unwrap();
    assert_eq!(vault_balance_after_withdraw, deposit_amount - withdraw_amount);
}

#[test]
fn test_close() {
    let (mut svm, payer, _program_id, vault_state_pda, vault_account_pda, _vault_state_bump, _vault_account_bump) = make_env();
    let user = payer.pubkey();

    // initialize
    let init_ix = Instruction {
        program_id: anchor_vault::id(),
        accounts: anchor_vault::accounts::Initialize {
            user: user,
            vault_state: vault_state_pda.to_bytes().into(),
            vault_account: vault_account_pda.to_bytes().into(),
            system_program: SYSTEM_PROGRAM_ID,
        }
        .to_account_metas(None),
        data: anchor_vault::instruction::Initialize {}.data(),
    };
    let message = Message::new(&[init_ix], Some(&payer.pubkey()));
    let recent_blockhash = svm.latest_blockhash();
    let transaction1 = Transaction::new(&[payer.insecure_clone()], message, recent_blockhash);
    svm.send_transaction(transaction1).unwrap();

    // deposit
    let deposit_amount: u64 = 1_000_000_000;
    let deposit_ix = Instruction {
        program_id: anchor_vault::id(),
        accounts: anchor_vault::accounts::Deposit {
            user: user,
            vault_state: vault_state_pda.to_bytes().into(),
            vault_account: vault_account_pda.to_bytes().into(),
            system_program: SYSTEM_PROGRAM_ID,
        }
        .to_account_metas(None),
        data: anchor_vault::instruction::Deposit { amount: deposit_amount }.data(),
    };
    let message = Message::new(&[deposit_ix], Some(&user));
    let recent_blockhash = svm.latest_blockhash();
    let transaction2 = Transaction::new(&[payer.insecure_clone()], message, recent_blockhash);
    svm.send_transaction(transaction2).unwrap();

    // close
    let user_balance_before_close = svm.get_balance(&user).unwrap();

    let close_ix = Instruction {
        program_id: anchor_vault::id(),
        accounts: anchor_vault::accounts::Close {
            user: user,
            vault_state: vault_state_pda.to_bytes().into(),
            vault_account: vault_account_pda.to_bytes().into(),
            system_program: SYSTEM_PROGRAM_ID,
        }
        .to_account_metas(None),
        data: anchor_vault::instruction::Close {}.data(),
    };

    let message = Message::new(&[close_ix], Some(&user));
    let recent_blockhash = svm.latest_blockhash();
    let transaction4 = Transaction::new(&[payer.insecure_clone()], message, recent_blockhash);
    let _tx4 = svm.send_transaction(transaction4).unwrap();

    assert!(svm.get_account(&vault_state_pda).is_none());

    let user_balance_after_close = svm.get_balance(&user).unwrap();
    
    assert!(user_balance_after_close > user_balance_before_close);
}
