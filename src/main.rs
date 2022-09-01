#[macro_use]
extern crate rocket;
extern crate dotenv;
extern crate reqwest;

use dotenv::dotenv;
use std::{env, fmt};
use std::error::Error;
use std::fs::File;
use std::io::{Write, BufReader};
use std::path::Path;
use std::collections::HashMap;
use std::time::Instant;
use std::cmp::min;

use rocket::{Rocket, State};
use rocket::serde::{Serialize, Deserialize};
use rocket::serde::json::{Json, Value, json, from_str};
use serde_json::{Number, from_reader};
use reqwest::Client;
use indicatif::{ProgressBar, ProgressState, ProgressStyle};
use futures_util::StreamExt;

#[derive(Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct Snapshot {
    domain_count: Number,
    time: Number,
    file_name: String,
    cid: String,
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct EnsBatchBody {
    ens: Vec<String>,
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

async fn download_with_prog(url: &str, path: &str) -> Result<(), String> {
    let client = Client::new();

    let res = client
        .get(url)
        .send()
        .await
        .or(Err(format!("Failed to GET from '{}'", &url)))?;

    let total_size = res
        .content_length()
        .ok_or(format!("Failed to get content length from '{}'", &url))?;

    // Indicatif setup

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
    return Ok(());
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

#[post("/ens/resolve/batch", format = "application/json", data = "<ens_names>")]
fn ens_batch_fn(ens_names: Json<EnsBatchBody>, ens_to_address: &State<HashMapType>) -> Value  {

    let mut resp:HashMap<String, Value> = HashMap::new();
    let body = ens_names.into_inner();

    for name in body.ens.into_iter() {
        let res = ens_to_address.get(&name);

        if res.is_some() {
            let res_str = &res.unwrap()[1..43];
            resp.insert(name, json!(res_str));
        } else {
            resp.insert(name, json!(false));
        }
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
        let snap_details_path = "./data/snapshots.json";

        let snap_data = read_from_file2(snap_details_path).unwrap();
        let cid = snap_data[snap_data.len()-1].cid.to_string();
        let file_name = snap_data[snap_data.len()-1].file_name.to_string();

        println!("Getting Snapshots");
        let url = format!("https://{ipfs_hash}.ipfs.w3s.link/{file_name}", ipfs_hash=cid, file_name=file_name);
        let snap_path = format!("./data/{cid}.json", cid = cid);

        let cached = Path::new(&snap_path).exists();
        if cached == false {
            println!("Downloading latest snapshot {}", url);
            download_with_prog(&url, &snap_path).await.unwrap();
        }
        else {
            println!("Using Cached Snapshot");
        }

        let payload = read_from_file(snap_path).unwrap();
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
        .mount("/", routes![ens_fn, ens_batch_fn, stats_fn, ping_fn])

}

#[rocket::main]
async fn main() -> Result<(), rocket::Error> {

    let _rocket = setup().await.launch().await.unwrap();

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
