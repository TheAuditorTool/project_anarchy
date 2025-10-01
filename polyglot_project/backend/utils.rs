// ERROR 272: Rust utilities in polyglot project
// Language mixing complexity

fn process_data(input: &str) -> String {
    format!("Processed: {}", input)
}

fn main() {
    let result = process_data("test");
    println!("{}", result);
}