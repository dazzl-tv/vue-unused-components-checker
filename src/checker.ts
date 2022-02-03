import ora from 'ora';
import * as textSearch from 'rx-text-search';
import async from 'async';
import path from 'path';
import glob from 'glob';

export function getCheckExpression(file): string {
  return `(import|require).*(?:[\'\"]\\b|\\/)${path.basename(file, path.extname(file))}(?:\\.(?:vue))?[\'\"][\\\);,]?[,;]?`;
}

export default function (src, maxOpenFiles, ignore): void {
  console.log('Checking for unused Components');

  glob(
    '**/*.vue',
    {
      cwd: src,
      ignore: ignore,
    },
    function (err, files) {
      if (err) {
        throw err;
      }
      const results = [];
      async.eachOfLimit(
        files,
        maxOpenFiles || 30,
        function (file, index, cb) {
          console.log('Checking for unused Components: ' + file);
          textSearch
            .findAsPromise(new RegExp(getCheckExpression(file), 'i'), ['**/*.{js,jsx,ts,tsx}', '**/*.vue'], {
              cwd: src,
              ignore: ignore,
            })
            .then(function (result) {
              if (result.length === 0) {
                results.push(file);
              }
              cb();
            })
            .catch(cb);
        },
        function (err) {
          if (err) {
            console.log('Error');
            console.error(err);
            process.exit(1);
          }

          if (results.length === 0) {
            console.log('No unused Components found.');
            process.exit(0);
          } else {
            results.forEach(function (result) {
              /*
              spinner.stopAndPersist({
                text: result,
                symbol: '-',
                color: 'red',
              });
              */
             console.log('-> '+result)
              console.log('Checking for unused Components');
            });
            console.error(results.length + ' unused Component' + (results.length > 1 ? 's' : '') + ' found.');
            process.exit(1);
          }
        },
      );
    },
  );
}
