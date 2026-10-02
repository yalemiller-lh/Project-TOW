#!/bin/sh
# Run every Project-TOW test file; print one status line each and the first error for failures.
cd /c/Users/MillYa/Desktop/Project-TOW || exit 1
fail=0
for f in test-*.mjs; do
  out=$(node "$f" 2>&1)
  if [ $? -eq 0 ]; then
    printf '%-26s ok\n' "$f"
  else
    fail=1
    printf '%-26s FAIL\n' "$f"
    echo "$out" | grep -E "Error|expected|actual|^\+|^-" | grep -v "^\s*at " | head -6 | sed 's/^/    /'
  fi
done

# Syntax of every module and of the bundled page script (tests never load app.mjs).
for f in dist/*.mjs; do node --check "$f" >/dev/null 2>&1 || { echo "SYNTAX $f"; node --check "$f" 2>&1 | grep -m1 Error; fail=1; }; done
node package-standalone.mjs >/dev/null && node -e "const h=require('fs').readFileSync('Play.html','utf8');require('fs').writeFileSync(process.env.TEMP+'/bundle-check.js',h.slice(h.indexOf('<script>')+8,h.lastIndexOf('</script>')))" && { node --check "$TEMP/bundle-check.js" >/dev/null 2>&1 && echo "bundle syntax              ok" || { echo "bundle syntax              FAIL"; fail=1; }; }

exit $fail
