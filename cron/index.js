const fs = require('fs');
const path = require('path');
const fetch = require('cross-fetch');
const bfj = require('bfj');

const limit = 1000;

async function getPage(start, end){
    const log  = `Fetching page ${start}`
    console.time(log);

    let data = await fetch('https://api.thegraph.com/subgraphs/name/ensdomains/ens', {
        method: 'POST',
        body: JSON.stringify({
            query: `
            query($lastID: ID, $end: ID) {
                domains(first: ${limit}, orderBy: id, orderDirection: asc, where: { id_gt: $lastID, id_lt: $end, name_not: null, resolvedAddress_not: null}) {
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
                lastID: start,
                end: end
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

        let fullPath = path.join(process.cwd(), '/data/', fileName);
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

async function getData(workerId, start, end){
    let lastId = start;
    let domains;
    let totalCount = 0;
    let ensToAdd = {};

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
        domains = await getPage(lastId, end);
        let eta = processGraphResp(domains);
        totalCount += Object.keys(eta).length;
        ensToAdd = {...ensToAdd, ...eta};
        console.log(workerId, 'total count', totalCount);
        if (domains.length>0) lastId = domains[domains.length - 1].id;
    } while (domains.length > 0);

    console.log(workerId, '🟢 Done', totalCount);
    return {ensToAdd, totalCount};
}

async function splitAndStart(){
    let ensToAdd = {}
    let totalCount = 0

    let promiseArray = [
        getData('#1', '0x0'.padEnd(64,'0'), '0x1'.padEnd(64,'f')),
        getData('#2', '0x2'.padEnd(64,'0'), '0x3'.padEnd(64,'f')),
        getData('#3', '0x4'.padEnd(64,'0'), '0x5'.padEnd(64,'f')),
        getData('#4', '0x6'.padEnd(64,'0'), '0x7'.padEnd(64,'f')),
        getData('#5', '0x8'.padEnd(64,'0'), '0x9'.padEnd(64,'f')),
        getData('#6', '0xa'.padEnd(64,'0'), '0xb'.padEnd(64,'f')),
        getData('#7', '0xc'.padEnd(64,'0'), '0xd'.padEnd(64,'f')),
        getData('#8', '0xe'.padEnd(64,'0'), '0xf'.padEnd(64,'f'))
    ]

    // let promiseArray = [
    //     getData('#1', '0x0'.padEnd(64,'0'), '0x001'.padEnd(64,'f')),
    //     getData('#2', '0x4'.padEnd(64,'0'), '0x401'.padEnd(64,'f')),
    //     getData('#3', '0x8'.padEnd(64,'0'), '0x801'.padEnd(64,'f')),
    //     getData('#4', '0xb'.padEnd(64,'0'), '0xb01'.padEnd(64,'f'))
    // ]

    let resp = await Promise.allSettled(promiseArray);
    for (let i = 0; i < resp.length; i++) {
        const respData = resp[i];
        console.log(`#${i} Status`, respData.status, respData?.value?.totalCount);
        if (respData.status === 'fulfilled'){
            totalCount += respData.value.totalCount;
            ensToAdd = {...ensToAdd, ...respData.value.ensToAdd}
        }
    }
    resp = null; // free the memory

    console.log(`Stringifying ${totalCount.toLocaleString()} Domains`);
    ensToAdd = await bfjStringify(ensToAdd);
    await saveToFile('ensToAdd.json', ensToAdd);
    console.log('Saved to file');
}

splitAndStart();
