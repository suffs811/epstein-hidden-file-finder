import fs, { write } from "fs";

async function writeResults(string) {
    try {
        await fs.promises.appendFile("output/raw_results.txt", string);
    } catch (e) {
        // fallback to synchronous write if promises API fails for some reason
        fs.writeFileSync("output/raw_results.txt", string, { flag: "a" });
    }
    console.log(string);
}

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
        fs.writeFileSync("output/tested_urls.csv", `${newUrl}\n`, { flag: "a" });
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
            await writeResults(`[+] URL: ${newUrl} | result: exists (status 200)\n`);
        } else {
            urlFindings.unknown.push(newUrl);
            await writeResults(`[?] URL: ${newUrl} | result: unknown (status ${response.status})\n`);
        }
    }
}

const originalUrls = [];
const urlFindings = {
    exists: [],
    doesNotExist: [],
    unknown: [],
    existsByExtension: {}
};

async function main() {
    try {
        const totalMatches = await searchInit();
        const totalPages = Math.ceil(totalMatches / 10);
        const startTime = new Date();

        await writeResults(`

▄▖    ▗   ▘    ▖▖▘ ▌ ▌      ▄▖▘▜     ▄▖▘   ▌    
▙▖▛▌▛▘▜▘█▌▌▛▌  ▙▌▌▛▌▛▌█▌▛▌  ▙▖▌▐ █▌  ▙▖▌▛▌▛▌█▌▛▘
▙▖▙▌▄▌▐▖▙▖▌▌▌  ▌▌▌▙▌▙▌▙▖▌▌  ▌ ▌▐▖▙▖  ▌ ▌▌▌▙▌▙▖▌ 
  ▌                                             

`)

        await writeResults(`[#] Start time: ${startTime.toLocaleString()}\n[#] Searching results for "No Images Produced" on justice.gov/epstein:\n[+] Total matches: ${totalMatches}, Total pages: ${totalPages}\n\n[#] Replacing .pdf links with various extensions and testing their existence...\n`);

        // replace = p = ? with the page number to start at in case the script crashes or is stopped.
        for (let p = 1; p <= totalPages; p++) {
            await writeResults(`\n[#] Searching page ${p}/${totalPages} - [${((p / totalPages) * 100).toFixed(2)}%]...\n`);
            const urls = await searchPage(p);
            for (const url of urls) {
                if (!originalUrls.includes(url)) {
                    originalUrls.push(url);
                }
            }
        }

        await writeResults(`\n[#] Found ${originalUrls.length} unique URLs. Testing each URL for various extensions...\n`);
        for (const url of originalUrls) {
            fs.writeFileSync("output/original_urls.csv", `${url}\n`, { flag: "a" });
            await testURL(url);
        }

        await writeResults(`\n[#] Finished testing links.\n`);
        await writeResults(`\n[+] Found ${urlFindings.exists.length} files that exist:\n`);
        // exists_url.csv -> URL, file extension, dataset, date tested
        urlFindings.exists.forEach(async url => {
            // decode the URL (replace %20 with space, etc.) and extract the file extension and dataset from the URL and write to exists_urls.csv
            const decodedUrl = decodeURIComponent(url);
            const ext = decodedUrl.split('.').pop();
            const dataset = decodedUrl.split('/')[5];
            const dateTested = new Date().toLocaleString();
            fs.writeFileSync("output/exists_urls.csv", `${decodedUrl},${ext},${dataset},${dateTested}\n`, { flag: "a" });
            await writeResults(`    ${decodedUrl}\n`);
        });
        await writeResults(`\n[-] Found ${urlFindings.doesNotExist.length} files that do not exist.\n`);
        await writeResults(`\n[?] Found ${urlFindings.unknown.length} files with unknown existence:\n`);
        for (const url of urlFindings.unknown) {
            await writeResults(`    ${url}\n`);
        }
        await writeResults(`\n[#] Found files by extension:\n`);
        for (const ext in urlFindings.existsByExtension) {
            await writeResults(`\n[+] Found ${urlFindings.existsByExtension[ext].length} files with extension ${ext}:\n`);
        }

        // compare exists_urls (without extension) with original_urls (without extension)
        const existsUrlsWithoutExt = urlFindings.exists.map(url => url.replace(/\.[^/.]+$/, ""));
        const originalUrlsWithoutExt = originalUrls.map(url => url.replace(/\.[^/.]+$/, ""));
        const missingUrls = originalUrlsWithoutExt.filter(url => !existsUrlsWithoutExt.includes(url));
        await writeResults(`\n[-] Found ${missingUrls.length} original URLs that do not have any existing files with different extensions:\n`);
        for (const url of missingUrls) {
            await writeResults(`    ${url}\n`);
        }

        // summary of findings
        await writeResults(`\n[########################################################################]\n`);
        await writeResults(`\n[#] Summary of findings:\n`);
        await writeResults(`    Total original URLs found: ${originalUrls.length}\n`);
        await writeResults(`    Total files that exist with different extensions: ${urlFindings.exists.length}\n`);
        await writeResults(`    Total files that do not exist: ${urlFindings.doesNotExist.length}\n`);
        await writeResults(`    Total files with unknown existence: ${urlFindings.unknown.length}\n`);
        await writeResults(`    Total files tested: ${urlFindings.exists.length + urlFindings.doesNotExist.length + urlFindings.unknown.length}\n`);
        // total by extension
        await writeResults(`\n[#] Total files that exist by extension:\n`);
        for (const ext in urlFindings.existsByExtension) {
            await writeResults(`    ${ext}: ${urlFindings.existsByExtension[ext].length}\n`);
        }

        const endTime = new Date();
        await writeResults(`\n[#] End time: ${endTime.toLocaleString()}\n`);
        const duration = (endTime - startTime) / 1000;
        await writeResults(`[#] Total duration: ${duration} seconds\n`);
    } catch (err) {
        console.error(err);
        try { await writeResults(`\n[ERROR] ${err.stack || err}\n`); } catch (e) { console.error("Failed writing error to file", e); }
    }
}

main();