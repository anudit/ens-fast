#[macro_use]
extern crate rocket;
extern crate dotenv;
extern crate reqwest;

use dotenv::dotenv;
use std::env;
use std::error::Error;
use std::fs::File;
use std::io::{Cursor, BufReader};
use std::path::Path;
use std::collections::HashMap;
use std::time::Instant;

use rocket::Rocket;
use rocket::serde::json::{Value, json, from_str};
use rocket::State;
use serde_json::{Number, from_reader};

use rocket::serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct Snapshot {
    domain_count: Number,
    time: Number,
    file_name: String,
    cid: String,
}

type HashMapType = HashMap<String, String>;

fn read_from_file<P: AsRef<Path>>(path: P) -> Result<Value, Box<dyn Error>> {

    let file = File::open(path)?;
    let reader = BufReader::new(file);
    let u = from_reader(reader)?;
    Ok(u)
}

fn read_from_file2<P: AsRef<Path>>(path: P) -> Result<Vec<Snapshot>, Box<dyn Error>> {

    let file = File::open(path)?;
    let reader = BufReader::new(file);
    let u: Vec<Snapshot> = from_reader(reader)?;
    Ok(u)
}

async fn fetch_and_save(url: String, file_name: String) -> Result<(), Box<dyn Error>>  {
    let response = reqwest::get(url).await?;
    let mut file = std::fs::File::create(file_name)?;
    let mut content =  Cursor::new(response.bytes().await?);
    std::io::copy(&mut content, &mut file)?;
    Ok(())
}

#[get("/ens/resolve/<ens_name>")]
fn ens_fn(ens_name: String, ens_to_address: &State<HashMapType>) -> Value  {
    let res = ens_to_address.get(&ens_name);

    if res.is_some() {
        json!({"address": res.unwrap()[1..43]})
    } else {
        json!({"address": res})
    }
}

#[get("/ping")]
fn ping_fn() -> &'static str {
    "Hello, world!"
}

#[get("/")]
fn stats_fn(ens_to_address: &State<HashMapType>) -> Value  {
    json!({"count": ens_to_address.len()})
}

async fn get_hashmap_from_file() -> HashMapType {

    let mut e_t_a: HashMapType = HashMap::new();

    let profile = match env::var("PROFILE") {
        Ok(v) => v,
        Err(_) => "dev".to_string()
    };

    let mut start = Instant::now();
    println!("Reading DB {:?}", profile);

    if profile == "dev" {

        let json_body = r#"
        {
            "nick.eth":"0xb8c2C29ee19D8307cb7255e1Cd9CbDE883A267d5",
            "vitalik.eth":"0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
        }"#;

        let payload: Value = from_str(json_body).unwrap();
        for (key, value) in payload.as_object().unwrap() {
            e_t_a.insert(key.to_string(), value.to_string());
        }
        println!("Compiled HashMap");

    }
    else {
        // download from ipfs and store in data.
        let snap_path = "./data/snapshots.json";
        let snap_data = read_from_file2(snap_path).unwrap();
        let cid = snap_data[snap_data.len()-1].cid.to_string();
        let file_name = snap_data[snap_data.len()-1].file_name.to_string();

        println!("snap_data {:?}", cid);
        let url = format!("https://{ipfs_hash}.ipfs.w3s.link/{file_name}", ipfs_hash=cid, file_name=file_name);
        let snap_path ="./data/ensToAddIpfs.json";
        println!("Downloading Snapshot");
        fetch_and_save(url, (&snap_path).to_string()).await.unwrap();


        let file_path = "./data/ensToAddIpfs.json";
        let payload = read_from_file(file_path).unwrap();
        println!("Read Complete {:?}", start.elapsed());

        start = Instant::now();
        println!("Compiling HashMap");

        for (key, value) in payload.as_object().unwrap() {
            e_t_a.insert(key.to_string(), value.to_string());
        }
        println!("Compiled HashMap {:?}", start.elapsed());

    }


    e_t_a

}

async fn setup() -> Rocket<rocket::Build> {
    dotenv().ok();
    let ens_to_address: HashMapType = get_hashmap_from_file().await;

    rocket::build()
        .manage(ens_to_address)
        .mount("/", routes![ens_fn, stats_fn, ping_fn])

}

#[rocket::main]
async fn main() -> Result<(), rocket::Error> {

    let _rocket: Rocket<rocket::Build> = setup().await;

    _rocket.launch().await.unwrap();

    Ok(())
}


#[cfg(test)]
mod test {
    use super::setup;
    use rocket::http::Status;
    use rocket::serde::json::{Value, from_str};


    #[rocket::async_test]
    async fn ping() {
        use rocket::local::asynchronous::Client;
        let rocket_instance = setup().await;
        let client = Client::tracked(rocket_instance).await.unwrap();

        let response = client.get(uri!(super::ping_fn)).dispatch().await;
        assert_eq!(response.status(), Status::Ok);
        assert_eq!(response.into_string().await.unwrap(), "Hello, world!");
    }

    #[rocket::async_test]
    async fn resolve() {
        use rocket::local::asynchronous::Client;
        let rocket_instance = setup().await;
        let client = Client::tracked(rocket_instance).await.unwrap();

        let response = client.get("/ens/resolve/vitalik.eth").dispatch().await;
        assert_eq!(response.status(), Status::Ok);
        let resp = response.into_string().await.unwrap();
        let res: Value = from_str(&resp).unwrap();
        assert_eq!(
            res["address"].to_string().to_lowercase(),
            String::from("\"0xd8da6bf26964af9d7eed9e03e53415d37aa96045\"").to_string().to_lowercase()
        );
    }
}
