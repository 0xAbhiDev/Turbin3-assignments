use std::io;
use rand::seq::SliceRandom;

fn main() {
	let fruits = ["apple", "banana", "orange", "mango", "grape"];
	let mut rng = rand::thread_rng();
	let secret = fruits
		.choose(&mut rng)
		.expect("Fruit list should not be empty");

	println!("Guess the fruit name!");
	println!("Choices: {}", fruits.join(", "));
	println!("You have 5 chances.\n");

	for attempt in 1..=5 {
		println!("Chance {attempt}/5: Enter your guess:");
		let mut guess = String::new();

		if io::stdin().read_line(&mut guess).is_err() {
			println!("Failed to read input.");
			continue;
		}

		let guess = guess.trim().to_lowercase();

		if guess == *secret {
			println!("Correct! You guessed the fruit.");
			return;
		} else if attempt < 5 {
			println!("Wrong guess. Try again.\n");
		}
	}

	println!("Out of chances! The correct fruit was: {secret}");
}
