const fs = require('fs');
const path = require('path');
const fetch = require('cross-fetch');
const bfj = require('bfj');

const limit = 1000;

async function getPage(lastID){
    const log  = `Fetching page ${lastID}`
    console.time(log);

    let data = await fetch('https://api.thegraph.com/subgraphs/name/ensdomains/ens', {
        method: 'POST',
        body: JSON.stringify({
            query: `
            query($lastID: ID) {
                domains(first: ${limit}, orderBy: id, orderDirection: asc, where: { id_gt: $lastID, name_not: null, resolvedAddress_not: null}) {
                    id
                  name
                  resolvedAddress {
                    id
                  }
                  subdomains {
                    name
                    resolvedAddress {
                      id
                    }
                  }
                }
            }
            `,
            variables: {
                lastID: lastID,
            },
        })
    });

    let resp = await data.json();

    console.timeEnd(log);

    if(Object.keys(resp).includes('data')){
        return resp['data']['domains'];
    }
    else {
        console.log('Error fetching page', lastID, resp);
    }
}

function processGraphResp(domains){
    let eta = {};

    for (let i = 0; i < domains.length; i++) {
        const domain = domains[i];
        eta[domain.name] = domain.resolvedAddress.id;

        const subdomains = domains[i].subdomains;
        for (let j = 0; j < subdomains.length; j++) {
            const subdomain = subdomains[j];
            if(Boolean(subdomain?.name) && Boolean(subdomain?.resolvedAddress?.id)){
                eta[subdomain.name] = subdomain.resolvedAddress.id;
            }
        }
    }

    return eta
}

async function bfjStringify(data){
    let promise = new Promise((res, rej) => {

        bfj.stringify(data)
            .then(jsonString => {
                res(jsonString)
            })
            .catch(error => {
                console.error('bfjStringify.error', error);
                rej(error)
            });

    });
    let result = await promise;
    return result;
}

async function saveToFile(fileName, data){
    let promise = new Promise((res, rej) => {

        let fullPath = path.join(process.cwd(), fileName);
        fs.writeFile(fullPath, data, err => {
            if (err) {
                console.error(err)
                rej({
                    success: false,
                    err
                })
            }
            else {
                res({
                    success: true,
                    path: fullPath
                })
            }
        })

    });
    let result = await promise;
    return result;
}

async function getData(){
    let lastId = '';
    let domains;
    let ensToAdd = {};
    let totalCount = 0;

    // for (let index = 0; index < chunked.length; index++) {
    //     const promiseArray = chunked[index].map(getPage);
    //     let res = await Promise.allSettled(promiseArray);
    //     for (let i = 0; i < res.length; i++) {
    //         const resp = res[i];
    //         if(resp.status === 'fulfilled'){
    //             let eta = processGraphResp(resp.value);
    //             totalCount += Object.keys(eta).length;
    //             ensToAdd = {...ensToAdd, ...eta};
    //             console.log('total count', totalCount);
    //         }
    //         else {
    //             console.log('failed', chunked[index][i]);
    //         }
    //     }
    // }

    do {
        domains = await getPage(lastId);
        let eta = processGraphResp(domains);
        totalCount += Object.keys(eta).length;
        ensToAdd = {...ensToAdd, ...eta};
        console.log('total count', totalCount);
        lastId = domains[domains.length - 1].id;
    } while (domains.length > 0);

    ensToAdd = await bfjStringify(ensToAdd);
    await saveToFile('ensToAdd.json', ensToAdd)
    ensToAdd = null; // free the memory

}


getData();
