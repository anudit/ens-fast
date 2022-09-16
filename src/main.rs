#[macro_use]
extern crate rocket;
extern crate dotenv;
extern crate reqwest;

use dotenv::dotenv;
use std::{env, fmt};
use std::error::Error;
use std::fs::File;
use std::io::{ Cursor, Write, BufReader};
use std::path::Path;
use std::collections::HashMap;
use std::cmp::min;

use rocket::{Rocket, State};
use rocket::serde::{Serialize, Deserialize};
use rocket::serde::json::{Json, Value, json, from_str};
use serde_json::{Number, from_reader};
use reqwest::Client;
use indicatif::{ProgressBar, ProgressState, ProgressStyle};
use futures_util::StreamExt;

pub mod ens;

#[derive(Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct Snapshot {
    domain_count: Number,
    time: Number,
    file_name: Vec<String>,
    cid: String,
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct SnapshotData {
    address: String,
    expiry: Number,
    created: Number,
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct EnsBatchBody {
    ens: Vec<String>,
}

type HashMapType = HashMap<String, SnapshotData>;

fn read_from_file<P: AsRef<Path>>(path: P) -> Result<HashMapType, Box<dyn Error>> {

    let file = File::open(path)?;
    let reader = BufReader::new(file);
    let u:HashMapType = from_reader(reader)?;
    Ok(u)
}

fn read_from_file2<P: AsRef<Path>>(path: P) -> Result<Vec<Snapshot>, Box<dyn Error>> {

    let file = File::open(path)?;
    let reader = BufReader::new(file);
    let u: Vec<Snapshot> = from_reader(reader)?;
    Ok(u)
}

fn read_from_file3<P: AsRef<Path>>(path: P) -> Result<HashMap<String, Vec<String>>, Box<dyn Error>> {

    let file = File::open(path)?;
    let reader = BufReader::new(file);
    let u: HashMap<String, Vec<String>> = from_reader(reader)?;
    Ok(u)
}

async fn download(url: String, file_name: String) -> Result<(), Box<dyn Error>>  {
    let response = reqwest::get(url).await?;
    let mut file = std::fs::File::create(file_name)?;
    let mut content =  Cursor::new(response.bytes().await?);
    std::io::copy(&mut content, &mut file)?;
    Ok(())
}

async fn download_with_prog(url: &str, path: &str) -> Result<(), String> {
    let client = Client::new();

    let res = client
        .get(url)
        .send()
        .await
        .or_else(|_| Err(format!("Failed to GET from '{}'", &url)))?;

    let total_size = res
        .content_length()
        .ok_or(format!("Failed to get content length from '{}'", &url))?;

    let pb = ProgressBar::new(total_size);
    pb.set_style(ProgressStyle::with_template("{spinner:.green} [{elapsed_precise}] [{wide_bar:.cyan/blue}] {bytes}/{total_bytes} ({eta})")
        .unwrap()
        .with_key("eta", |state: &ProgressState, w: &mut dyn fmt::Write| write!(w, "{:.1}s", state.eta().as_secs_f64()).unwrap())
        .progress_chars("#>-"));
    pb.set_message(format!("Downloading {}", url));

    // download chunks
    let mut file = File::create(path).or(Err(format!("Failed to create file '{}'", &path)))?;
    let mut downloaded: u64 = 0;
    let mut stream = res.bytes_stream();

    while let Some(item) = stream.next().await {
        let chunk = item.or(Err(format!("Error while downloading file")))?;
        file.write_all(&chunk)
            .or(Err(format!("Error while writing to file")))?;
        let new = min(downloaded + (chunk.len() as u64), total_size);
        downloaded = new;
        pb.set_position(new);
    }

    pb.finish_with_message(format!("Downloaded {} to {}", url, path));

    Ok(())
}

#[get("/ens/resolve/<name_or_string>")]
fn ens_fn(name_or_string: String, ens_to_address: &State<HashMapType>, address_to_ens: &State<HashMap<String, Vec<String>>>) -> Value  {

    if name_or_string.ends_with(".eth") == true {
        let res = ens_to_address.get(&name_or_string.to_lowercase());
        if res.is_some() {
            json!(res.unwrap())
        } else {
            json!({})
        }
    }
    else if name_or_string.starts_with("0x") == true && name_or_string.len() == 42  {
        let res = address_to_ens.get(&name_or_string.to_lowercase());
        if res.is_some() {
            json!(res.unwrap())
        } else {
            json!({})
        }
    }
    else {
        json!({})
    }

}

#[post("/ens/resolve/batch", format = "application/json", data = "<ens_names>")]
fn ens_batch_fn(ens_names: Json<EnsBatchBody>, ens_to_address: &State<HashMapType>) -> Value  {

    let mut resp:HashMap<String, Value> = HashMap::new();
    let body = ens_names.into_inner();

    for name in body.ens.into_iter() {
        let lookup = name.to_lowercase();
        let res = ens_to_address.get(&lookup);

        if res.is_some() {
            resp.insert(lookup, json!(res.unwrap()));
        } else {
            resp.insert(lookup, json!(false));
        }
    }

    json!(resp)
}

#[get("/ens/resolve-full/<ens_name>")]
async fn ens_full_fn(ens_name: String) -> Value  {
    let add = ens::resolve_onchain(ens_name.to_lowercase()).await;
    json!({"address": add})
}

#[post("/ens/resolve-full/batch", format = "application/json", data = "<ens_names>")]
async fn ens_batch_full_fn(ens_names: Json<EnsBatchBody>) -> Value  {

    let body = ens_names.into_inner();
    let mut resp:HashMap<String, Value> = HashMap::new();

    for name in body.ens.into_iter() {
        let add = ens::resolve_onchain(name.to_lowercase()).await;
        resp.insert(name, add);
    }

    json!(resp)
}

#[get("/ping")]
fn ping_fn() -> &'static str {
    "Hello, world!"
}

#[get("/")]
fn stats_fn(ens_to_address: &State<HashMapType>) -> Value  {
    json!({"count": ens_to_address.len()})
}

async fn get_hashmap_from_file() -> (HashMapType, HashMap<String, Vec<String>>) {

    let mut e_t_a: HashMapType = HashMap::new();
    let mut a_t_d: HashMap<String, Vec<String>> = HashMap::new();

    let profile = match env::var("PROFILE") {
        Ok(v) => v,
        Err(_) => "dev".to_string()
    };

    println!("Reading DB {:?}", profile);

    if profile == "dev" {

        let json_body = r#"
        {
            "nick.eth":{
                "address": "0xb8c2C29ee19D8307cb7255e1Cd9CbDE883A267d5",
                "created": 1628670616,
                "expiry": 1628670616
            },
            "vitalik.eth":{
                "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
                "created": 1628670616,
                "expiry": 1628670616
            }
        }"#;

        e_t_a = from_str(json_body).unwrap();

        let json_body2 = r#"
        {
            "0xb8c2c29ee19d8307cb7255e1cd9cbde883a267d5": ["nick.eth"],
            "0xc0deaf6bd3f0c6574a6a625ef2f22f62a5150eab": ["daws.eth"]
        }"#;

        a_t_d = from_str(json_body2).unwrap();
    }
    else {

        let snap_details_path = "./data/snapshots.json";

        let snap_data = read_from_file2(snap_details_path).unwrap();

        let cid = snap_data[snap_data.len()-1].cid.to_string();

        println!("Getting Snapshots");

        let file_name = snap_data[snap_data.len()-1].file_name[0].to_string();
        let url = format!("https://gateway.ipfs.io/ipfs/{ipfs_hash}/{file_name}", ipfs_hash=cid, file_name=file_name);
        let snap_path = format!("./data/{cid}-{fn}.json", cid = cid, fn=file_name);

        let cached = Path::new(&snap_path).exists();
        if !cached {
            println!("Downloading latest snapshot {}", url);
            download_with_prog(url.as_str(), snap_path.as_str()).await.unwrap();
        }
        else {
            println!("ensToAdd / Using Cached Snapshot");
        }

        e_t_a = read_from_file(snap_path).unwrap();

        let file_name2 = snap_data[snap_data.len()-1].file_name[1].to_string();
        let url = format!("https://gateway.ipfs.io/ipfs/{ipfs_hash}/{file_name}", ipfs_hash=cid, file_name=file_name2);
        let snap_path = format!("./data/{cid}-{fn}.json", cid = cid, fn=file_name2);

        let cached = Path::new(&snap_path).exists();
        if !cached {
            println!("Downloading latest snapshot {}", url);
            download_with_prog(url.as_str(), snap_path.as_str()).await.unwrap();
        }
        else {
            println!("addToData / Using Cached Snapshot");
        }

        a_t_d = read_from_file3(snap_path).unwrap();

    }

    println!("Compiled Maps.");

    (e_t_a, a_t_d)

}

async fn setup() -> Rocket<rocket::Build> {
    dotenv().ok();
    let (ens_to_address, address_to_ens) = get_hashmap_from_file().await;

    rocket::build()
        .manage(ens_to_address)
        .manage(address_to_ens)
        .mount("/", routes![ens_fn, ens_batch_fn, ens_batch_full_fn, ens_full_fn, stats_fn, ping_fn])

}

#[rocket::main]
async fn main() -> Result<(), rocket::Error> {

    let _rocket = setup().await.launch().await.unwrap();
    Ok(())

}


#[cfg(test)]
mod test {
    use crate::SnapshotData;

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

        let response = client.get("/ens/resolve/nick.eth").dispatch().await;
        assert_eq!(response.status(), Status::Ok);

        let resp = response.into_string().await.unwrap();
        println!("{:?}", resp);
        let res: SnapshotData = from_str(&resp).unwrap();
        assert_eq!(
            res.address.to_lowercase(),
            String::from("0xb8c2c29ee19d8307cb7255e1cd9cbde883a267d5").to_lowercase()
        );
    }

    #[rocket::async_test]
    async fn resolve_full() {
        use rocket::local::asynchronous::Client;
        let rocket_instance = setup().await;
        let client = Client::tracked(rocket_instance).await.unwrap();

        let response = client.get("/ens/resolve-full/vitalik.eth").dispatch().await;
        assert_eq!(response.status(), Status::Ok);

        let resp = response.into_string().await.unwrap();
        let res: Value = from_str(&resp).unwrap();
        assert_eq!(
            res["address"].to_string().to_lowercase(),
            String::from("\"0xd8da6bf26964af9d7eed9e03e53415d37aa96045\"").to_string().to_lowercase()
        );
    }
}
