#[macro_use]
extern crate rocket;

use std::error::Error;
use std::fs::File;
use std::io::BufReader;
use std::path::Path;
use std::collections::HashMap;
use std::time::{Instant};

use rocket::serde::json::{Value, json};
use rocket::{State};
use serde_json::from_reader;

fn read_db<P: AsRef<Path>>(path: P) -> Result<Value, Box<dyn Error>> {

    let file = File::open(path)?;
    let reader = BufReader::new(file);
    let u = from_reader(reader)?;
    Ok(u)
}

#[get("/ens/resolve/<ens_name>")]
fn ens_fn(ens_name: String, ens_to_address: &State<HashMap<String, String>>) -> Value  {
    json!({"address": ens_to_address.get(&ens_name)})
}

#[get("/ping")]
fn ping_fn() -> &'static str {
    "Hello, world!"
}

#[get("/")]
fn stats_fn(ens_to_address: &State<HashMap<String, String>>) -> Value  {
    json!({"count": ens_to_address.len()})
}

#[launch]
fn rocket() -> _ {

    let mut start = Instant::now();
    println!("Reading DB");
    let payload = read_db("./../data/ensToAddMock.json").unwrap();
    println!("Read Complete {:?}", start.elapsed());

    start = Instant::now();
    println!("Compiling HashMap");
    let mut ens_to_address: HashMap<String, String> = HashMap::new();
    for (key, value) in payload.as_object().unwrap() {
        ens_to_address.insert(key.to_string(), value.to_string());
    }
    println!("Compiled HashMap {:?}", start.elapsed());

    rocket::build().manage(ens_to_address).mount("/", routes![ens_fn, stats_fn, ping_fn])

}

#[cfg(test)]
mod test {
    use super::rocket;
    use rocket::local::blocking::Client;
    use rocket::http::Status;

    #[test]
    fn ping() {
        let client = Client::tracked(rocket()).expect("valid rocket instance");
        let mut response = client.get(uri!(super::ping_fn)).dispatch();
        assert_eq!(response.status(), Status::Ok);
        assert_eq!(response.into_string().unwrap(), "Hello, world!");
    }
}
