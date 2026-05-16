use anchor_lang::prelude::*;

declare_id!("8QgDLgLiexBodp5DztUopL4WXvd39D6B1N5DsKLs6YXx");

#[program]
pub mod anchor_vault {
    use anchor_lang::system_program::Transfer;

use super::*;

 pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    let s = &mut ctx.accounts.vault_state;

    s.vault_state_bump = ctx.bumps.vault_state;
    s.vault_account_bump = ctx.bumps.vault_account;


    Ok(())
}

pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {

let cpi_accounts = Transfer{
    from: ctx.accounts.user.to_account_info(),
    to: ctx.accounts.vault_account.to_account_info(),
};

let cpi_ctx = CpiContext::new(*ctx.accounts.system_program.to_account_info().key, cpi_accounts);
 
 anchor_lang::system_program::transfer(cpi_ctx, amount)?;

    Ok(())
}

pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {

let cpi_accounts = Transfer{
    from: ctx.accounts.vault_account.to_account_info(),
    to: ctx.accounts.user.to_account_info(),
};

let bump = [ctx.accounts.vault_state.vault_account_bump];
        let seeds = &[b"vault-account".as_ref(), &bump];
        let signer_seeds = &[&seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(
            *ctx.accounts.system_program.to_account_info().key,
            cpi_accounts,
            signer_seeds,
        );
 
 anchor_lang::system_program::transfer(cpi_ctx, amount)?;

    Ok(())
}

pub fn close(ctx: Context<Close>)-> Result<()> {

 let cpi_accounts = Transfer{
    from: ctx.accounts.vault_account.to_account_info(),
    to: ctx.accounts.user.to_account_info(),
};

let bump = [ctx.accounts.vault_state.vault_account_bump];
        let seeds = &[b"vault-account".as_ref(), &bump];
        let signer_seeds = &[&seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(
            *ctx.accounts.system_program.to_account_info().key,
            cpi_accounts,
            signer_seeds,
        );
 
 anchor_lang::system_program::transfer(cpi_ctx, ctx.accounts.vault_account.lamports())?;

    Ok(())

}

}

#[account]
#[derive(InitSpace)]
pub struct VaultState {
    pub vault_state_bump: u8,
    pub vault_account_bump: u8,
}

#[derive(Accounts)]
pub struct Initialize <'info> {
    #[account(mut)]
   pub user: Signer<'info>,
   #[account(init, payer = user, space = 8 + VaultState::INIT_SPACE, seeds = [b"vault-state".as_ref(),user.key().as_ref()], bump )]
   pub vault_state: Account<'info, VaultState>,
    #[account(mut, seeds =[b"vault-account".as_ref()], bump )]
   pub vault_account: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(seeds = [b"vault-state".as_ref(),user.key().as_ref()], bump )]
    pub vault_state: Account<'info, VaultState>,
    #[account(mut, seeds =[b"vault-account".as_ref()], bump )]
    pub vault_account: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}


#[derive(Accounts)]

pub struct Withdraw<'info> {
     #[account(mut)]
    pub user: Signer<'info>,
    #[account(seeds = [b"vault-state".as_ref(),user.key().as_ref()], bump )]
    pub vault_state: Account<'info, VaultState>,
    #[account(mut, seeds =[b"vault-account".as_ref()], bump )]
    pub vault_account: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Close<'info> {
     #[account(mut)]
    pub user: Signer<'info>,
    #[account( mut , seeds = [b"vault-state".as_ref(),user.key().as_ref()], bump , close = user )]
    pub vault_state: Account<'info, VaultState>,
    #[account(mut, seeds =[b"vault-account".as_ref()], bump )]
    pub vault_account: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}