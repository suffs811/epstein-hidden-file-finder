import fs from "fs";

async function searchInit() {
    const response = await fetch("https://www.justice.gov/multimedia-search?keys=No%20Images%20Produced&page=0", {
    "headers": {
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache",
        "pragma": "no-cache",
        "priority": "u=1, i",
        "sec-ch-ua": "\"Not:A-Brand\";v=\"99\", \"Google Chrome\";v=\"145\", \"Chromium\";v=\"145\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"macOS\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-queueit-ajaxpageurl": "https%3A%2F%2Fwww.justice.gov%2Fepstein",
        "cookie": "justiceGovAgeVerified=true",
    },
    "referrer": "https://www.justice.gov/epstein",
    "body": null,
    "method": "GET",
    "mode": "cors",
    "credentials": "include"
    });
    const result = await response.json();
    const totalMatches = result.aggregations.unique_count.value;
    return totalMatches;
}

async function searchPage(page) {
    const response = await fetch(`https://www.justice.gov/multimedia-search?keys=No%20Images%20Produced&page=${page}`, {
    "headers": {
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache",
        "pragma": "no-cache",
        "priority": "u=1, i",
        "sec-ch-ua": "\"Not:A-Brand\";v=\"99\", \"Google Chrome\";v=\"145\", \"Chromium\";v=\"145\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"macOS\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-queueit-ajaxpageurl": "https%3A%2F%2Fwww.justice.gov%2Fepstein",
        "cookie": "justiceGovAgeVerified=true",
    },
    "referrer": "https://www.justice.gov/epstein",
    "body": null,
    "method": "GET",
    "mode": "cors",
    "credentials": "include"
    });
    const result = await response.json();
    const hits = result.hits.hits;
    const urls = hits.map(hit => encodeURI(hit._source.ORIGIN_FILE_URI));
    return urls;
}

async function testURL(url) {
    const extensions = [".mp4", ".m4a", ".mp3", ".m3a", ".jpg", ".jpeg", ".png", ".gif", ".mov", ".avi", ".mkv", ".doc", ".docx", ".xls", ".xlsx", ".zip", ".rar", ".txt", ".csv", ".json", ".xml", ".html", ".htm", ".css", ".js", ".exe", ".dll", ".bin", ".iso", ".img", ".dmg", ".vmdk", ".qcow2", ".tar", ".gz", ".bz2", ".7z", ".apk", ".ipa", ".deb", ".rpm", ".msi", ".iso", ".img", ".dmg", ".vmdk", ".qcow2"];
    // replace the .pdf extension with each of the extensions in the list and test if the URL exists by sending a HEAD request and checking the response status code
    for (const ext of extensions) {
        const newUrl = url.replace(".pdf", ext);
        fs.writeFileSync("tested_urls.csv", `${newUrl}\n`, { flag: "a" });
        const response = await fetch(newUrl, {
        "headers": {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9",
            "cache-control": "no-cache",
            "pragma": "no-cache",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Not:A-Brand\";v=\"99\", \"Google Chrome\";v=\"145\", \"Chromium\";v=\"145\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"macOS\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-queueit-ajaxpageurl": "https%3A%2F%2Fwww.justice.gov%2Fepstein",
            "cookie": "justiceGovAgeVerified=true",
        },
        "referrer": "https://www.justice.gov/epstein",
        "body": null,
        "method": "HEAD",
        "mode": "cors",
        "credentials": "include"
        });
        if (response.status === 404) {
            urlFindings.doesNotExist.push(newUrl);
        } else if (response.status === 200) {
            urlFindings.exists.push(newUrl);
                if (!urlFindings.existsByExtension[ext]) {
                    urlFindings.existsByExtension[ext] = [];
                }
                urlFindings.existsByExtension[ext].push(newUrl);
            console.log(`[+] URL: ${newUrl} | result: exists (status 200)`);
        } else {
            urlFindings.unknown.push(newUrl);
            console.log(`[?] URL: ${newUrl} | result: unknown (status ${response.status})`);
        }
    }
}

const urlFindings = {
    exists: [],
    doesNotExist: [],
    unknown: [],
    existsByExtension: {}
};

const totalMatches = await searchInit();
const totalPages = Math.ceil(totalMatches / 10);

console.log(`

▄▖    ▗   ▘    ▖▖▘ ▌ ▌      ▄▖▘▜     ▄▖▘   ▌    
▙▖▛▌▛▘▜▘█▌▌▛▌  ▙▌▌▛▌▛▌█▌▛▌  ▙▖▌▐ █▌  ▙▖▌▛▌▛▌█▌▛▘
▙▖▙▌▄▌▐▖▙▖▌▌▌  ▌▌▌▙▌▙▌▙▖▌▌  ▌ ▌▐▖▙▖  ▌ ▌▌▌▙▌▙▖▌ 
  ▌                                             

`)
console.log(`[#] Start time: ${new Date().toLocaleString()}`);
console.log(`[#] Searching results for "No Images Produced" on justice.gov/epstein:`);
console.log(`[+] Total matches: ${totalMatches}, Total pages: ${totalPages}`);
console.log(`\n[#] Replacing .pdf links with various extensions and testing their existence...`);

// replace = p = ? with the page number to start at in case the script crashes or is stopped.
for (let p = 1; p <= totalPages; p++) {
    console.log(`\n[#] Searching page ${p}/${totalPages} - [${((p / totalPages) * 100).toFixed(2)}%]...`);
    const urls = await searchPage(p);
    for (const url of urls) {
        fs.writeFileSync("original_urls.csv", urls.join("\n") + "\n", { flag: "a" });
        await testURL(url);
    }
}

console.log(`[#] Finished testing links.`);
console.log(`\n[+] Found ${urlFindings.exists.length} files that exist:`);
// exists_url.csv -> URL, file extension, dataset, date tested
urlFindings.exists.forEach(url => {
    // decode the URL (replace %20 with space, etc.) and extract the file extension and dataset from the URL and write to exists_urls.csv
    const decodedUrl = decodeURIComponent(url);
    const ext = decodedUrl.split('.').pop();
    const dataset = decodedUrl.split('/')[5];
    const dateTested = new Date().toLocaleString();
    fs.writeFileSync("exists_urls.csv", `${decodedUrl},${ext},${dataset},${dateTested}\n`, { flag: "a" });
    console.log(`    ${decodedUrl}`);
});
console.log(`\n[-] Found ${urlFindings.doesNotExist.length} files that do not exist.`);
console.log(`\n[?] Found ${urlFindings.unknown.length} files with unknown existence:`);
urlFindings.unknown.forEach(url => console.log(`    ${url}`));

console.log(`\n[#] Found files by extension:`);
for (const ext in urlFindings.existsByExtension) {
    console.log(`\n[+] Found ${urlFindings.existsByExtension[ext].length} files with extension ${ext}:`);
}

// Add original URLs whose correct extensions were not found.
