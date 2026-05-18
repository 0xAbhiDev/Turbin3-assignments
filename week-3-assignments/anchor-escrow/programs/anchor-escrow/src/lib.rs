pub mod instructions;
pub mod state;

pub use state::*;
pub use instructions::*;

declare_id!("23LxAm3vHEDbRyCYahmFBiTJgRVaX1yD2RuzDxMmLw6C");

#[program]
pub mod anchor_escrow {
    use super::*;

     #[instruction(discriminator = 0)]
    pub fn make(ctx: Context<Make>, seed: u64, deposit: u64, receive: u64) -> Result<()> {
        ctx.accounts.init_escrow(seed, receive, &ctx.bumps)?;
        ctx.accounts.deposit(deposit)
    }
    pub fn take(ctx: Context<Take>) -> Result<()> {
        ctx.accounts.deposit()?;
        ctx.accounts.withdraw_and_close_vault()
    }
    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        ctx.accounts.refund_and_close_vault()
    }
}

