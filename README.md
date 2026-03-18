![Last Run](https://img.shields.io/badge/Last_Run-March_14,_2026-orange)

<script type="text/javascript" src="https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js" data-name="bmc-button" data-slug="suffs118" data-color="#FFDD00" data-emoji=""  data-font="Poppins" data-text="I love coffee!" data-outline-color="#000000" data-font-color="#000000" data-coffee-color="#ffffff" ></script>

🚧 View the data here: [Epstein Hidden Files Table](http://suffs811.github.io/epstein-hidden-file-finder)

# Epstein Hidden File Finder
There are nearly 4,000 pdf files in the DoJ Epstein library that only show a default pdf file saying "No Images Produced". 
But, some smart sleuthers found that changing the .pdf file extension to a different extension brings back a legitimate file, such as using .docx or .mp4 instead of .pdf.
This script finds every URL containing the phrase "No Images Produced" and tests each of the extensions below to see if it exists as a different file type.

### Extensions Tested
```
mp4, m4a, mp3, m3a, jpg, jpeg, png, gif, mov, avi, mkv, doc, docx, xls, xlsx, zip, rar, txt, csv, json, xml, html, htm, css, js, exe, dll, bin, iso, img, dmg, vmdk, qcow2, tar, gz, bz2, 7z, apk, ipa, deb, rpm, msi, iso, img, dmg, vmdk, qcow2
```

### Usage
```
git clone https://github.com/suffs811/epstein-hidden-file-finder.git
node epstein-hidden-file-finder.js
```

### Output Files
- Original URLs are saved to `output/original_urls.csv`
- All tested urls are saved to `output/tested_urls.csv`
- [ important! ] Files found with different extension are saved to `output/exists_urls.csv`
- Full results saved to `output/raw_results.txt`
