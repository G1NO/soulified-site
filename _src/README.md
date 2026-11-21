# Soulified site source

Edit the `*.src.html` files, `form.src.js`, or the lists at the top of `build.py`
(genres, services, instruments), then rebuild from the repo root:

    cp _src/* . && python3 build.py hello@besoulified.com && rm *.src.html form.src.js build.py README.md

Jekyll (used by GitHub Pages) ignores folders that start with `_`, so this folder isn't published.
