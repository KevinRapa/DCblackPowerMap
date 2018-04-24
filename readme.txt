To update the data, the Github page holding the data in JSON form must be updated.
    Follow these steps:
        1. In Google Sheets, go to 'Add-ons'->'Export Sheet Data'->'Open sidebar'.
        2. Make sure the format is 'JSON' and Select Sheet(s) is set to 'Current sheet only'. 
        3. The only box that should be selected is 'Export sheet arrays' under the 'JSON' section
        4. Click export and copy all the text in the link.
        5. Go to the page that the data is being held. Right now it is:
            https://github.com/KevinRapa/KevinRapa.github.io/edit/master/all_data.json
        6. Click edit. It looks like a little pencil icon at the top-right of the data.
        7. Replace all the data by pasting the new copied data.
        8. Click 'Commit changes' at the bottom.
        9. In several minutes the website should update.

The URL reached after clicking the 'Raw' button on the Github page for the data is the
one that should be used, not the URL of the Github page itself!

If any field names or naming conventions on the spreadsheet are changed, they must be
updated in setup.js too. This goes the same for the name of the spreadsheet, and file names or
extensions, etc.

setup.js will only process and add elements to the map if they have a valid start year,
latitude, and longitude.

To change the end year (when the slider stops), change the max value in the #slider and 
mbl_slider elements in index.html.