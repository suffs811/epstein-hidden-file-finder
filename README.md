![Extensions](https://img.shields.io/badge/Last_Run-March_14,_2026-orange)

# Epstein Hidden File Finder
There are nearly 4,000 pdf files in the DoJ Epstein library that only show a default pdf file saying "No Images Produced". 
But, some smart sleuthers found that changing the .pdf file extension to a different extension brings back a legitimate file, such as using .docx or .mp4 instead of .pdf.
This script finds every URL containing the phrase "No Images Produced" and each of the extensions below to see if it exists as a different file type.

### Extensions Tested
```
mp4, m4a, mp3, m3a, jpg, jpeg, png, gif, mov, avi, mkv, doc, docx, xls, xlsx, zip, rar, txt, csv, json, xml, html, htm, css, js, exe, dll, bin, iso, img, dmg, vmdk, qcow2, tar, gz, bz2, 7z, apk, ipa, deb, rpm, msi, iso, img, dmg, vmdk, qcow2
```

### Usage
```
git clone https://github.com/suffs811/epstein-hidden-file-finder.git
node epstein-hidden-file-finder.js
```

- All tested urls saved to `tested_urls.txt`
- Full results saved to `results.txt`


