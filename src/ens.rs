use rocket::serde::json::Value;
use ethers::prelude::*;

pub async fn resolve_onchain(ens: String) -> Value {

    let provider = Provider::<Http>::try_from("https://eth.public-rpc.com").expect("could not instantiate HTTP Provider");
    let address = provider.resolve_name(&ens).await;
    let add: Value = match address {
        Ok(v)=> Value::String(format!("{:?}", v)),
        Err(_) => Value::Bool(false),
    };

    add
}
